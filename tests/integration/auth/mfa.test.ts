// T045 MFA, T046 bypass (Local API level), T047 lost-factor reset.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import {
  callEndpoint,
  createUser,
  nextStep,
  reauth,
  routeLogin,
  totp,
  userFor,
  verifiedSession,
} from '../../support/auth'

let t: TestPayload
beforeAll(async () => {
  t = await bootPayload()
}, 180_000)
afterAll(async () => t?.close())
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: Date.now() }))
afterEach(() => vi.useRealTimers())

const passwordOnly = async (role: 'editor' | 'owner' = 'owner') => {
  const u = await createUser(t.payload, role, { status: 'invited' })
  return { ...u, token: (await routeLogin(u.email, u.password)).token }
}

describe('enrolment (FR-033a)', () => {
  it('the factor is inactive until a valid code confirms it', async () => {
    const s = await passwordOnly()
    await callEndpoint(t.payload, 'users', '/mfa/enrol/start', 'post', { token: s.token })
    const bad = await callEndpoint(t.payload, 'users', '/mfa/enrol/confirm', 'post', {
      token: s.token,
      body: { code: '000000' },
    })
    expect(bad.status).toBe(400)
    expect(
      (await callEndpoint(t.payload, 'users', '/mfa/status', 'get', { token: s.token })).body,
    ).toMatchObject({ enrolled: false, mfaVerified: false })
  })

  it('the secret is encrypted at rest and never returned by any API after enrolment', async () => {
    const s = await verifiedSession(t.payload, 'owner')
    const row = (
      await t.sql.query('select secret_enc, pending_secret_enc from user_mfa where user_id = $1', [
        s.userId,
      ])
    ).rows[0]
    expect(row.secret_enc).toMatch(/^v1\./)
    expect(row.secret_enc).not.toContain(s.secret)
    expect(row.pending_secret_enc).toBeNull()
    const u = await userFor(t.payload, s.token)
    const asOwner = await t.payload.find({
      collection: 'users',
      user: u as never,
      overrideAccess: false,
      depth: 2,
    })
    const dump =
      JSON.stringify(asOwner) +
      JSON.stringify(
        await t.payload.findByID({
          collection: 'users',
          id: s.userId,
          overrideAccess: true,
          showHiddenFields: true,
        }),
      )
    expect(dump).not.toContain(s.secret)
    for (const k of ['hash', 'salt', 'resetPasswordToken', 'secret_enc', 'recovery'])
      expect(JSON.stringify(asOwner)).not.toContain(`"${k}`)
  })

  it('start refuses to re-issue a secret once enrolled', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    expect(
      (await callEndpoint(t.payload, 'users', '/mfa/enrol/start', 'post', { token: s.token }))
        .status,
    ).toBe(400)
  })

  it('a pending enrolment expires after 15 minutes', async () => {
    const s = await passwordOnly()
    const { body } = await callEndpoint(t.payload, 'users', '/mfa/enrol/start', 'post', {
      token: s.token,
    })
    vi.setSystemTime(new Date(Date.now() + 16 * 60_000))
    await t.sql.query(
      "update auth_sessions set last_seen_at = now() + interval '16 minutes' where user_id = $1",
      [s.id],
    )
    const r = await callEndpoint(t.payload, 'users', '/mfa/enrol/confirm', 'post', {
      token: s.token,
      body: { code: await totp(body.secret as string) },
    })
    expect(r.status).toBe(400)
  })
})

describe('second factor (FR-033, FR-033b)', () => {
  const freshLogin = async (s: { email: string; password: string }) =>
    (await routeLogin(s.email, s.password)).token

  it('a password-only session is not MFA-verified and cannot read protected data', async () => {
    const s = await verifiedSession(t.payload, 'owner')
    const token = await freshLogin(s)
    const u = await userFor(t.payload, token)
    expect(u?.mfaVerified).toBe(false)
    await expect(
      t.payload.find({ collection: 'users', user: u as never, overrideAccess: false }),
    ).rejects.toThrow()
    await expect(
      t.payload.find({ collection: 'audit-events', user: u as never, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('a valid code rotates to a new verified session; the pre-MFA token stops working', async () => {
    const s = await verifiedSession(t.payload, 'owner')
    const pre = await freshLogin(s)
    nextStep()
    const r = await callEndpoint(t.payload, 'users', '/mfa/verify', 'post', {
      token: pre,
      body: { code: await totp(s.secret!) },
    })
    expect(r.status).toBe(200)
    expect(r.token).not.toBe(pre)
    expect((await userFor(t.payload, r.token))?.mfaVerified).toBe(true)
    expect(await userFor(t.payload, pre)).toBeNull()
  })

  it('a code cannot be replayed (same step, second session)', async () => {
    const s = await verifiedSession(t.payload, 'publisher')
    nextStep()
    const code = await totp(s.secret!)
    const a = await callEndpoint(t.payload, 'users', '/mfa/verify', 'post', {
      token: await freshLogin(s),
      body: { code },
    })
    const b = await callEndpoint(t.payload, 'users', '/mfa/verify', 'post', {
      token: await freshLogin(s),
      body: { code },
    })
    expect([a.status, b.status]).toEqual([200, 400])
  })

  it('concurrent use of one code: exactly one succeeds', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    nextStep()
    const code = await totp(s.secret!)
    const tokens = await Promise.all(Array.from({ length: 4 }, () => freshLogin(s)))
    const results = await Promise.all(
      tokens.map((tk) =>
        callEndpoint(t.payload, 'users', '/mfa/verify', 'post', { token: tk, body: { code } }),
      ),
    )
    expect(results.filter((r) => r.status === 200)).toHaveLength(1)
  })

  it.each(['', '12345', '1234567', 'abcdef', ' 123456', null, 123456])(
    'rejects malformed code %j',
    async (code) => {
      const s = await verifiedSession(t.payload, 'editor')
      const r = await callEndpoint(t.payload, 'users', '/mfa/verify', 'post', {
        token: await freshLogin(s),
        body: { code },
      })
      expect(r.status).toBe(400)
    },
  )

  it('codes from outside the ±1 step window are rejected', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    const old = await totp(s.secret!)
    vi.setSystemTime(new Date(Date.now() + 5 * 60_000))
    const r = await callEndpoint(t.payload, 'users', '/mfa/verify', 'post', {
      token: await freshLogin(s),
      body: { code: old },
    })
    expect(r.status).toBe(400)
  })

  it('brute force is throttled per account (5 / 15 min), then even a correct code is refused', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    const token = await freshLogin(s)
    for (let i = 0; i < 5; i++)
      await callEndpoint(t.payload, 'users', '/mfa/verify', 'post', {
        token,
        body: { code: '000000' },
      })
    nextStep()
    const r = await callEndpoint(t.payload, 'users', '/mfa/verify', 'post', {
      token,
      body: { code: await totp(s.secret!) },
    })
    expect(r.status).toBe(429)
  })
})

describe('recovery codes (FR-033a/b)', () => {
  it('ten codes, stored hashed, each single-use; concurrent replay of one code wins once', async () => {
    const s = await verifiedSession(t.payload, 'owner')
    expect(s.recoveryCodes).toHaveLength(10)
    const stored = JSON.stringify(
      (await t.sql.query('select code_hash from mfa_recovery_codes where user_id = $1', [s.userId]))
        .rows,
    )
    for (const c of s.recoveryCodes!) expect(stored).not.toContain(c.replace(/-/g, ''))
    const tokens = await Promise.all(
      Array.from({ length: 3 }, () => routeLogin(s.email, s.password).then((r) => r.token)),
    )
    const results = await Promise.all(
      tokens.map((tk) =>
        callEndpoint(t.payload, 'users', '/mfa/recovery', 'post', {
          token: tk,
          body: { code: s.recoveryCodes![0] },
        }),
      ),
    )
    expect(results.filter((r) => r.status === 200)).toHaveLength(1)
    expect(results.find((r) => r.status === 200)!.body.remaining).toBe(9)
  })

  it('using a recovery code ends the user’s other sessions and is audited', async () => {
    const s = await verifiedSession(t.payload, 'publisher')
    const other = (await routeLogin(s.email, s.password)).token
    const tk = (await routeLogin(s.email, s.password)).token
    const r = await callEndpoint(t.payload, 'users', '/mfa/recovery', 'post', {
      token: tk,
      body: { code: s.recoveryCodes![1] },
    })
    expect(r.status).toBe(200)
    expect(await userFor(t.payload, other)).toBeNull()
    expect(await userFor(t.payload, s.token)).toBeNull()
    expect(
      (
        await t.sql.query(
          "select count(*) from audit_events where action = 'mfa.recovery_code_used' and target_id = $1",
          [String(s.userId)],
        )
      ).rows[0].count,
    ).toBe('1')
  })

  it('regenerating codes requires MFA and recent re-auth, and invalidates the old codes', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    await t.sql.query('update auth_sessions set reauth_at = null where user_id = $1', [s.userId])
    expect(
      (await callEndpoint(t.payload, 'users', '/mfa/recovery-codes', 'post', { token: s.token }))
        .status,
    ).toBe(403)
    await reauth(t.payload, s)
    const r = await callEndpoint(t.payload, 'users', '/mfa/recovery-codes', 'post', {
      token: s.token,
    })
    expect(r.status).toBe(200)
    const tk = (await routeLogin(s.email, s.password)).token
    expect(
      (
        await callEndpoint(t.payload, 'users', '/mfa/recovery', 'post', {
          token: tk,
          body: { code: s.recoveryCodes![2] },
        })
      ).status,
    ).toBe(400)
  })
})

describe('T047 lost-factor reset (FR-033c)', () => {
  it('administrator resets an editor’s MFA: sessions end, re-enrolment required, audited', async () => {
    const admin = await verifiedSession(t.payload, 'administrator')
    await reauth(t.payload, admin)
    const ed = await verifiedSession(t.payload, 'editor')
    const r = await callEndpoint(t.payload, 'users', '/:id/reset-mfa', 'post', {
      token: admin.token,
      params: { id: String(ed.userId) },
    })
    expect(r.status).toBe(200)
    expect(await userFor(t.payload, ed.token)).toBeNull()
    const tk = (await routeLogin(ed.email, ed.password)).token
    expect(
      (await callEndpoint(t.payload, 'users', '/mfa/status', 'get', { token: tk })).body,
    ).toMatchObject({ enrolled: false })
    expect(JSON.stringify(r.body)).not.toContain(ed.secret)
  })

  it.each([
    ['administrator', 'administrator'],
    ['administrator', 'owner'],
    ['publisher', 'editor'],
    ['editor', 'editor'],
  ] as const)('%s cannot reset a %s', async (actorRole, targetRole) => {
    const actor = await verifiedSession(t.payload, actorRole)
    await reauth(t.payload, actor)
    const target = await verifiedSession(t.payload, targetRole)
    const r = await callEndpoint(t.payload, 'users', '/:id/reset-mfa', 'post', {
      token: actor.token,
      params: { id: String(target.userId) },
    })
    expect(r.status).toBe(403)
    expect(
      (await t.sql.query('select enabled_at from user_mfa where user_id = $1', [target.userId]))
        .rows[0].enabled_at,
    ).toBeTruthy()
  })

  it('no one can reset their own MFA through the reset endpoint, and reset requires recent re-auth', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    await reauth(t.payload, owner)
    expect(
      (
        await callEndpoint(t.payload, 'users', '/:id/reset-mfa', 'post', {
          token: owner.token,
          params: { id: String(owner.userId) },
        })
      ).status,
    ).toBe(403)
    await t.sql.query('update auth_sessions set reauth_at = null where user_id = $1', [
      owner.userId,
    ])
    const ed = await verifiedSession(t.payload, 'editor')
    expect(
      (
        await callEndpoint(t.payload, 'users', '/:id/reset-mfa', 'post', {
          token: owner.token,
          params: { id: String(ed.userId) },
        })
      ).status,
    ).toBe(403)
  })
})
