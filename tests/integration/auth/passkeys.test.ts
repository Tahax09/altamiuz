// Passkeys (ADR-012) and the amended FR-033 policy, end to end against the real endpoints with a
// software authenticator (real keys, real signatures). Adversarial: replayed and cross-session
// challenges, wrong origin / RP ID / type, missing user verification, counter regression, foreign
// credentials and user handles, a passkey as its own second factor, and every gate on adding,
// removing and resetting credentials.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { isMfaVerified } from '../../../src/modules/access'
import { relyingParty } from '../../../src/modules/auth'
import { resetSecuritySettingsCache } from '../../../src/modules/auth/settings'
import {
  callEndpoint,
  createUser,
  nextStep,
  reauth,
  routeLogin,
  totp,
  userFor,
  verifiedSession,
  type Role,
} from '../../support/auth'
import { bootPayload, type TestPayload } from '../../support/payload'
import { SoftAuthenticator, type Bend } from '../../support/webauthn'

let t: TestPayload
beforeAll(async () => {
  t = await bootPayload({ optionalMfa: true })
}, 120_000)
afterAll(async () => t?.close())

const setRequired = async (requireMfa: boolean) => {
  await t.payload.updateGlobal({
    slug: 'security-settings',
    data: { requireMfa } as never,
    overrideAccess: true,
  })
  resetSecuritySettingsCache()
}
const call = (
  path: string,
  method: 'get' | 'post' | 'delete',
  token?: string,
  body?: unknown,
  params?: Record<string, string>,
) => callEndpoint(t.payload, 'users', path, method, { token, body, params })
const sql = async (q: string, p: unknown[] = []) => (await t.sql.query(q, p)).rows
const device = () => new SoftAuthenticator(relyingParty().origin, relyingParty().rpID)

/** Password sign-in (optional policy, no authenticator app): a complete session. */
async function passwordUser(role: Role = 'editor') {
  const u = await createUser(t.payload, role)
  const login = await routeLogin(u.email, u.password)
  return { ...u, token: login.token }
}
async function withReauth(u: { token: string; password: string }) {
  const r = await call('/reauth', 'post', u.token, { password: u.password })
  expect(r.status).toBe(200)
}
async function register(token: string, d: SoftAuthenticator, bend: Bend = {}, name = 'Laptop') {
  const opts = await call('/passkeys/register/options', 'post', token)
  expect(opts.status).toBe(200)
  const o = opts.body.options as { challenge: string; user: { id: string } }
  return call('/passkeys/register/verify', 'post', token, {
    challengeId: opts.body.challengeId,
    response: d.register(o, bend),
    name,
  })
}
async function loginOptions() {
  const r = await call('/passkeys/login/options', 'post')
  expect(r.status).toBe(200)
  return r.body as { challengeId: string; options: { challenge: string } }
}
async function passkeyLogin(d: SoftAuthenticator, bend: Bend = {}) {
  const o = await loginOptions()
  return call('/passkeys/login/verify', 'post', undefined, {
    challengeId: o.challengeId,
    response: d.assert(o.options, bend),
  })
}
/** A user with one registered passkey (optional policy). */
async function userWithPasskey(role: Role = 'editor') {
  const u = await passwordUser(role)
  await withReauth(u)
  const d = device()
  expect((await register(u.token, d)).status).toBe(200)
  return { ...u, d }
}

describe('registration', () => {
  it('needs a completed sign-in and recent re-authentication', async () => {
    const u = await passwordUser()
    const r = await call('/passkeys/register/options', 'post', u.token)
    expect(r).toMatchObject({ status: 403, body: { error: 'reauth_required' } })
    expect((await call('/passkeys/register/options', 'post')).status).toBe(401)
  })

  it('stores a verified credential, lists it without key material, and audits it', async () => {
    const u = await userWithPasskey()
    const list = await call('/passkeys', 'get', u.token)
    expect(list.body.passkeys).toHaveLength(1)
    expect(JSON.stringify(list.body)).not.toContain(u.d.id)
    expect(JSON.stringify(list.body)).not.toMatch(/publicKey|public_key/)
    const [audit] = await sql(
      "select outcome from audit_events where action = 'passkey.register' and actor = $1",
      [`user:${u.id}`],
    )
    expect(audit).toMatchObject({ outcome: 'success' })
    // The user handle is random, never the id or e-mail.
    const [h] = await sql('select handle from user_passkey_handles where user_id = $1', [u.id])
    expect(Buffer.from(h.handle, 'base64url')).toHaveLength(32)
    expect(h.handle).not.toBe(String(u.id))
    expect(Buffer.from(h.handle, 'base64url').toString('latin1')).not.toContain(u.email)
  })

  it.each([
    ['another origin', { origin: 'https://evil.example' }],
    ['another RP ID', { rpId: 'evil.example' }],
    ['no user verification', { userVerified: false }],
    ['the wrong ceremony type', { type: 'webauthn.get' }],
  ] as [string, Bend][])('refuses %s', async (_, bend) => {
    const u = await passwordUser()
    await withReauth(u)
    const r = await register(u.token, device(), bend)
    expect(r).toMatchObject({ status: 400, body: { error: 'invalid' } })
    expect(await sql('select 1 from user_passkeys where user_id = $1', [u.id])).toHaveLength(0)
  })

  it('uses each challenge once, only in the session that asked for it', async () => {
    const u = await passwordUser()
    await withReauth(u)
    const opts = await call('/passkeys/register/options', 'post', u.token)
    const o = opts.body.options as { challenge: string; user: { id: string } }
    // Another session of the same user cannot use it.
    const other = await routeLogin(u.email, u.password)
    await withReauth({ token: other.token, password: u.password })
    const d = device()
    const stolen = await call('/passkeys/register/verify', 'post', other.token, {
      challengeId: opts.body.challengeId,
      response: d.register(o),
    })
    expect(stolen.status).toBe(400)
    // A fresh challenge works once; replaying the same verify body fails.
    const opts2 = await call('/passkeys/register/options', 'post', u.token)
    const body = {
      challengeId: opts2.body.challengeId,
      response: device().register(opts2.body.options as never),
    }
    expect((await call('/passkeys/register/verify', 'post', u.token, body)).status).toBe(200)
    expect((await call('/passkeys/register/verify', 'post', u.token, body)).status).toBe(400)
  })

  it('refuses a credential already registered to any account', async () => {
    const a = await userWithPasskey()
    const b = await passwordUser()
    await withReauth(b)
    const r = await register(b.token, a.d)
    expect(r.body.error).toBe('already_registered')
  })

  it('refuses malformed input without reaching the library', async () => {
    const u = await passwordUser()
    await withReauth(u)
    const opts = await call('/passkeys/register/options', 'post', u.token)
    for (const response of [null, 'x', [], { id: 'short', rawId: 'short', type: 'public-key' }])
      expect(
        (
          await call('/passkeys/register/verify', 'post', u.token, {
            challengeId: opts.body.challengeId,
            response,
          })
        ).status,
      ).toBe(400)
  })
})

describe('passwordless sign-in', () => {
  it('signs in an account without an authenticator app; the session is complete under the optional policy', async () => {
    const u = await userWithPasskey('publisher')
    const r = await passkeyLogin(u.d)
    expect(r).toMatchObject({ status: 200, body: { ok: true, secondStepRequired: false } })
    const user = await userFor(t.payload, r.token)
    expect(user?.id).toBe(u.id)
    expect(isMfaVerified(user)).toBe(true)
    const status = await call('/mfa/status', 'get', r.token)
    expect(status.body).toMatchObject({ signInMethod: 'passkey', passkeys: 1 })
    const [a] = await sql(
      "select meta from audit_events where action = 'auth.login.success' and actor = $1 order by id desc limit 1",
      [`user:${u.id}`],
    )
    expect(a.meta).toEqual({ method: 'passkey' })
  })

  it('consumes each challenge once and never accepts a replayed assertion', async () => {
    const u = await userWithPasskey()
    const o = await loginOptions()
    const response = u.d.assert(o.options)
    const body = { challengeId: o.challengeId, response }
    expect((await call('/passkeys/login/verify', 'post', undefined, body)).status).toBe(200)
    expect((await call('/passkeys/login/verify', 'post', undefined, body)).status).toBe(401)
    // The same signed assertion against a new challenge: challenge mismatch.
    const o2 = await loginOptions()
    const again = await call('/passkeys/login/verify', 'post', undefined, {
      challengeId: o2.challengeId,
      response,
    })
    expect(again.status).toBe(401)
  })

  it('refuses a signature counter that does not move forward (cloned authenticator)', async () => {
    const u = await userWithPasskey()
    expect((await passkeyLogin(u.d, { counter: 5 })).status).toBe(200)
    expect((await passkeyLogin(u.d, { counter: 5 })).status).toBe(401)
    expect((await passkeyLogin(u.d, { counter: 3 })).status).toBe(401)
    expect((await passkeyLogin(u.d, { counter: 6 })).status).toBe(200)
  })

  it.each([
    ['another origin', { origin: 'https://evil.example' }],
    ['another RP ID', { rpId: 'evil.example' }],
    ['no user verification', { userVerified: false }],
    ['the wrong ceremony type', { type: 'webauthn.create' }],
    ['no user handle', { userHandle: null }],
    [
      'another account’s user handle',
      { userHandle: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
    ],
  ] as [string, Bend][])('refuses %s with the same generic failure', async (_, bend) => {
    const u = await userWithPasskey()
    const r = await passkeyLogin(u.d, bend)
    expect(r).toMatchObject({ status: 401, body: { error: 'invalid' } })
    expect(r.token).toBe('')
  })

  it('refuses unknown credentials, suspended accounts and cross-site requests', async () => {
    expect((await passkeyLogin(device())).status).toBe(401)
    const u = await userWithPasskey()
    await t.payload.update({
      collection: 'users',
      id: u.id,
      data: { status: 'suspended' } as never,
      overrideAccess: true,
      context: { authSystem: true },
    })
    expect((await passkeyLogin(u.d)).status).toBe(401)
    const o = await loginOptions()
    const evil = await callEndpoint(t.payload, 'users', '/passkeys/login/verify', 'post', {
      body: { challengeId: o.challengeId, response: device().assert(o.options) },
      headers: { origin: 'https://evil.example' },
    })
    expect(evil.status).toBe(403)
  })

  it('is one step, not two: an account with an authenticator app still needs its code', async () => {
    const s = await verifiedSession(t.payload, 'administrator')
    await reauth(t.payload, s)
    const d = device()
    expect((await register(s.token, d)).body).toEqual({ ok: true })
    const r = await passkeyLogin(d)
    expect(r.body.secondStepRequired).toBe(true)
    expect(isMfaVerified(await userFor(t.payload, r.token))).toBe(false)
    // Same factor twice is not two factors.
    const pk = await call('/passkeys/second-factor/options', 'post', r.token)
    expect(pk).toMatchObject({ status: 403, body: { error: 'not_allowed' } })
    // Role access stays closed until the code.
    expect((await call('/sessions', 'get', r.token)).status).toBe(403)
    // A fresh time step: the enrolment code of this step is spent (replay protection).
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() })
    nextStep()
    const v = await call('/mfa/verify', 'post', r.token, { code: await totp(s.secret!) }).finally(
      () => vi.useRealTimers(),
    )
    expect(v.status).toBe(200)
    const after = await userFor(t.payload, v.token)
    expect(isMfaVerified(after)).toBe(true)
    expect(after?.authMethod).toBe('passkey') // rotation keeps how the session was opened
  })
})

describe('owner requires two-factor authentication', () => {
  it('a passkey after the password completes sign-in; a password alone cannot add a factor', async () => {
    const u = await userWithPasskey('publisher')
    await setRequired(true)
    try {
      const login = await routeLogin(u.email, u.password)
      expect(login.body.mfaRequired).toBe(true)
      expect(isMfaVerified(await userFor(t.payload, login.token))).toBe(false)
      // A stolen password cannot attach an authenticator app or a passkey to this account.
      const enrol = await call('/mfa/enrol/start', 'post', login.token)
      expect(enrol).toMatchObject({ status: 403, body: { error: 'passkey_required' } })
      expect((await call('/passkeys/register/options', 'post', login.token)).status).toBe(403)
      // A challenge issued to another session is refused.
      const other = await routeLogin(u.email, u.password)
      const foreign = await call('/passkeys/second-factor/options', 'post', other.token)
      const wrong = await call('/passkeys/second-factor/verify', 'post', login.token, {
        challengeId: foreign.body.challengeId,
        response: u.d.assert(foreign.body.options as never),
      })
      expect(wrong.status).toBe(400)
      // The passkey as second step.
      const o = await call('/passkeys/second-factor/options', 'post', login.token)
      expect(o.status).toBe(200)
      const v = await call('/passkeys/second-factor/verify', 'post', login.token, {
        challengeId: o.body.challengeId,
        response: u.d.assert(o.body.options as never),
      })
      expect(v.status).toBe(200)
      expect(isMfaVerified(await userFor(t.payload, v.token))).toBe(true)
      expect(await userFor(t.payload, login.token)).toBeNull() // rotated: old session ended
      // A passwordless sign-in alone is not enough while two-factor authentication is required.
      const pl = await passkeyLogin(u.d)
      expect(pl.body.secondStepRequired).toBe(true)
      expect(isMfaVerified(await userFor(t.payload, pl.token))).toBe(false)
    } finally {
      await setRequired(false)
    }
  })

  it('a passkey of another account is never accepted as the second step', async () => {
    const a = await userWithPasskey()
    const b = await userWithPasskey()
    await setRequired(true)
    try {
      const login = await routeLogin(b.email, b.password)
      const o = await call('/passkeys/second-factor/options', 'post', login.token)
      const v = await call('/passkeys/second-factor/verify', 'post', login.token, {
        challengeId: o.body.challengeId,
        response: a.d.assert(o.body.options as never),
      })
      expect(v.status).toBe(400)
      expect(isMfaVerified(await userFor(t.payload, login.token))).toBe(false)
    } finally {
      await setRequired(false)
    }
  })
})

describe('removal, reset and disabling', () => {
  it('removes only the caller’s own passkey, after re-authentication, and ends other sessions', async () => {
    const a = await userWithPasskey()
    const b = await userWithPasskey()
    const [{ id: aKey }] = await sql('select id from user_passkeys where user_id = $1', [a.id])
    const fresh = await routeLogin(b.email, b.password)
    expect(
      (await call('/passkeys/:id', 'delete', fresh.token, undefined, { id: String(aKey) })).status,
    ).toBe(403)
    await withReauth({ token: fresh.token, password: b.password })
    const foreign = await call('/passkeys/:id', 'delete', fresh.token, undefined, {
      id: String(aKey),
    })
    expect(foreign.status).toBe(404)
    expect(await sql('select 1 from user_passkeys where id = $1', [aKey])).toHaveLength(1)

    const own = await routeLogin(a.email, a.password)
    await withReauth({ token: own.token, password: a.password })
    const r = await call('/passkeys/:id', 'delete', own.token, undefined, { id: String(aKey) })
    expect(r.status).toBe(200)
    expect(await userFor(t.payload, a.token)).toBeNull() // other session ended
    expect((await passkeyLogin(a.d)).status).toBe(401)
  })

  it('an administrator’s lost-device reset removes the authenticator app and all passkeys', async () => {
    const admin = await verifiedSession(t.payload, 'administrator')
    await reauth(t.payload, admin)
    const u = await userWithPasskey('editor')
    const r = await call('/:id/reset-mfa', 'post', admin.token, undefined, { id: String(u.id) })
    expect(r.status).toBe(200)
    expect(await sql('select 1 from user_passkeys where user_id = $1', [u.id])).toHaveLength(0)
    expect((await passkeyLogin(u.d)).status).toBe(401)
  })

  it('the account holder turns the authenticator app off only after re-authentication', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    // Completing the second step counts as a recent re-authentication; let it lapse.
    await sql('update auth_sessions set reauth_at = null where user_id = $1', [s.userId])
    const fresh = await call('/mfa/disable', 'post', s.token)
    expect(fresh).toMatchObject({ status: 403, body: { error: 'reauth_required' } })
    await reauth(t.payload, s)
    expect((await call('/mfa/disable', 'post', s.token)).status).toBe(200)
    expect(await sql('select 1 from user_mfa where user_id = $1', [s.userId])).toHaveLength(0)
    expect(
      await sql('select 1 from mfa_recovery_codes where user_id = $1', [s.userId]),
    ).toHaveLength(0)
    const [a] = await sql(
      "select outcome from audit_events where action = 'mfa.remove' and actor = $1",
      [`user:${s.userId}`],
    )
    expect(a).toMatchObject({ outcome: 'success' })
    // Optional policy: the next password sign-in is complete without a code.
    const next = await routeLogin(s.email, s.password)
    expect(next.body.mfaRequired).toBe(false)
    expect(isMfaVerified(await userFor(t.payload, next.token))).toBe(true)
  })
})

describe('security settings', () => {
  it('only an owner with a completed sign-in and recent re-authentication changes the policy, audited', async () => {
    const owner = await verifiedSession(t.payload, 'owner', { status: 'active' })
    await sql('update auth_sessions set reauth_at = null where user_id = $1', [owner.userId])
    const user = async () => (await userFor(t.payload, owner.token)) as never
    const change = (u: never) =>
      t.payload
        .updateGlobal({
          slug: 'security-settings',
          data: { requireMfa: false } as never,
          user: u,
          overrideAccess: false,
        })
        .then(
          () => true,
          () => false,
        )
    expect(await change(await user())).toBe(false) // no re-authentication yet
    await reauth(t.payload, owner)
    expect(await change(await user())).toBe(true)
    const [a] = await sql(
      "select meta from audit_events where action = 'settings.change' and actor = $1",
      [`user:${owner.userId}`],
    )
    expect(a.meta).toEqual({ global: 'security-settings' })
    const admin = await verifiedSession(t.payload, 'administrator')
    await reauth(t.payload, admin)
    expect(await change((await userFor(t.payload, admin.token)) as never)).toBe(false)
  })

  it('no passkey data leaks through the users API', async () => {
    const u = await userWithPasskey()
    const me = await t.payload.findByID({
      collection: 'users',
      id: u.id,
      overrideAccess: true,
      showHiddenFields: true,
    })
    expect(JSON.stringify(me)).not.toContain(u.d.id)
    expect(JSON.stringify(me)).not.toMatch(/passkey|webauthn/i)
  })
})
