// T042 bootstrap, T043 invitations, T053 audit coverage of account events.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { acceptInvitation, bootstrapOwner, BootstrapError, getMailer } from '@/modules/auth'
import { bootPayload, type TestPayload } from '../../support/payload'
import {
  callEndpoint,
  createUser,
  reauth,
  routeLogin,
  strongPassword,
  verifiedSession,
} from '../../support/auth'

let t: TestPayload
beforeAll(async () => {
  t = await bootPayload()
}, 180_000)
afterAll(async () => t?.close())

const outboxToken = (to: string, path: string) => {
  const mail = [...(getMailer().outbox ?? [])]
    .reverse()
    .find((m) => m.to.includes(to) && m.text.includes(path))
  return mail ? new URL(/https?:\/\/\S+/.exec(mail.text)![0]).searchParams.get('token') : null
}
const audits = async (action: string) =>
  (await t.sql.query('select * from audit_events where action = $1', [action])).rows

describe('T042 first-owner bootstrap (FR-030)', () => {
  it('starts with no accounts and no default credentials', async () => {
    expect(Number((await t.sql.query('select count(*) from users')).rows[0].count)).toBe(0)
  })

  it('anonymous account creation is denied', async () => {
    await expect(
      t.payload.create({
        collection: 'users',
        data: {
          email: 'x@example.invalid',
          password: strongPassword(),
          name: 'x',
          role: 'owner',
        } as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('emails a one-time owner invitation, and refuses a second bootstrap while pending', async () => {
    await bootstrapOwner(t.payload, 'first-owner@example.invalid')
    expect(outboxToken('first-owner@example.invalid', '/account/accept-invite')).toBeTruthy()
    await expect(bootstrapOwner(t.payload, 'other@example.invalid')).rejects.toBeInstanceOf(
      BootstrapError,
    )
  })

  it('the invitation creates an invited owner who must still enrol MFA', async () => {
    const token = outboxToken('first-owner@example.invalid', '/account/accept-invite')!
    const r = await acceptInvitation(t.payload, {
      token,
      password: strongPassword(),
      name: 'First Owner',
      ip: '203.0.113.1',
    })
    expect(r.ok).toBe(true)
    const u = (
      await t.payload.find({
        collection: 'users',
        where: { email: { equals: 'first-owner@example.invalid' } },
        overrideAccess: true,
      })
    ).docs[0] as { role: string; status: string }
    expect(u).toMatchObject({ role: 'owner', status: 'invited' })
  })

  it('refuses bootstrap once any owner exists', async () => {
    await expect(bootstrapOwner(t.payload, 'late@example.invalid')).rejects.toThrow(
      /owner already exists/,
    )
  })
})

describe('T043 invitations (FR-031, FR-038)', () => {
  it('administrators invite editors/publishers only; owners may invite any role', async () => {
    const admin = await verifiedSession(t.payload, 'administrator')
    await reauth(t.payload, admin)
    const user = (
      await callEndpoint(t.payload, 'users', '/mfa/status', 'get', { token: admin.token })
    ).status
    expect(user).toBe(200)
    const adminUser = (
      await t.payload.auth({ headers: new Headers({ Authorization: `JWT ${admin.token}` }) })
    ).user
    for (const role of ['editor', 'publisher'])
      await expect(
        t.payload.create({
          collection: 'invitations',
          data: { email: `inv-${role}-${Date.now()}@example.invalid`, role } as never,
          user: adminUser as never,
          overrideAccess: false,
        }),
      ).resolves.toBeTruthy()
    for (const role of ['administrator', 'owner'])
      await expect(
        t.payload.create({
          collection: 'invitations',
          data: { email: `inv-${role}-${Date.now()}@example.invalid`, role } as never,
          user: adminUser as never,
          overrideAccess: false,
        }),
      ).rejects.toThrow()

    const owner = await verifiedSession(t.payload, 'owner')
    await reauth(t.payload, owner)
    const ownerUser = (
      await t.payload.auth({ headers: new Headers({ Authorization: `JWT ${owner.token}` }) })
    ).user
    for (const role of ['editor', 'publisher', 'administrator', 'owner'])
      await expect(
        t.payload.create({
          collection: 'invitations',
          data: { email: `own-${role}-${Date.now()}@example.invalid`, role } as never,
          user: ownerUser as never,
          overrideAccess: false,
        }),
      ).resolves.toBeTruthy()
  })

  it('editors and publishers cannot invite anyone', async () => {
    for (const role of ['editor', 'publisher'] as const) {
      const s = await verifiedSession(t.payload, role)
      await reauth(t.payload, s)
      const u = (
        await t.payload.auth({ headers: new Headers({ Authorization: `JWT ${s.token}` }) })
      ).user
      await expect(
        t.payload.create({
          collection: 'invitations',
          data: { email: `x-${Date.now()}@example.invalid`, role: 'editor' } as never,
          user: u as never,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
  })

  it('inviting requires recent re-authentication', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    await t.sql.query('update auth_sessions set reauth_at = null where user_id = $1', [
      owner.userId,
    ])
    const u = (
      await t.payload.auth({ headers: new Headers({ Authorization: `JWT ${owner.token}` }) })
    ).user
    await expect(
      t.payload.create({
        collection: 'invitations',
        data: { email: `r-${Date.now()}@example.invalid`, role: 'editor' } as never,
        user: u as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/re-authentication/)
  })

  it('tokens are single-use (concurrent accepts: exactly one wins), stored only as hashes', async () => {
    const email = `single-${Date.now()}@example.invalid`
    await t.payload.create({
      collection: 'invitations',
      data: { email, role: 'editor' } as never,
      overrideAccess: true,
      context: { bootstrap: true },
    })
    const token = outboxToken(email, '/account/accept-invite')!
    const stored = (
      await t.sql.query('select token_hash from invitations where email = $1', [email])
    ).rows[0].token_hash
    expect(stored).not.toContain(token)
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        acceptInvitation(t.payload, {
          token,
          password: strongPassword(),
          name: 'N',
          ip: '203.0.113.2',
        }),
      ),
    )
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(
      (
        await acceptInvitation(t.payload, {
          token,
          password: strongPassword(),
          name: 'N',
          ip: '203.0.113.2',
        })
      ).ok,
    ).toBe(false)
  })

  it.each([
    ['forged token', 'not-a-real-token'],
    ['empty token', ''],
    ['oversized token', 'x'.repeat(500)],
  ])('rejects %s', async (_l, token) => {
    expect(
      await acceptInvitation(t.payload, {
        token,
        password: strongPassword(),
        name: 'N',
        ip: '203.0.113.3',
      }),
    ).toEqual({ ok: false, problem: 'invalid_or_expired' })
  })

  it('rejects an expired invitation (72 h)', async () => {
    const email = `expired-${Date.now()}@example.invalid`
    await t.payload.create({
      collection: 'invitations',
      data: { email, role: 'editor' } as never,
      overrideAccess: true,
      context: { bootstrap: true },
    })
    const token = outboxToken(email, '/account/accept-invite')!
    await t.sql.query(
      "update invitations set expires_at = now() - interval '1 minute' where email = $1",
      [email],
    )
    expect(
      (
        await acceptInvitation(t.payload, {
          token,
          password: strongPassword(),
          name: 'N',
          ip: '203.0.113.4',
        })
      ).ok,
    ).toBe(false)
  })

  it('rejects a weak password on acceptance without consuming the invitation', async () => {
    const email = `weak-${Date.now()}@example.invalid`
    await t.payload.create({
      collection: 'invitations',
      data: { email, role: 'editor' } as never,
      overrideAccess: true,
      context: { bootstrap: true },
    })
    const token = outboxToken(email, '/account/accept-invite')!
    expect(
      await acceptInvitation(t.payload, { token, password: 'short', name: 'N', ip: '203.0.113.5' }),
    ).toEqual({ ok: false, problem: 'too_short' })
    expect(
      (
        await acceptInvitation(t.payload, {
          token,
          password: strongPassword(),
          name: 'N',
          ip: '203.0.113.5',
        })
      ).ok,
    ).toBe(true)
  })

  it('the accept endpoint refuses cross-origin requests', async () => {
    const r = await callEndpoint(t.payload, 'invitations', '/accept', 'post', {
      body: { token: 'x', password: strongPassword(), name: 'n' },
      headers: { origin: 'https://evil.example' },
    })
    expect(r.status).toBe(403)
  })
})

describe('T053 audit coverage of account events (FR-045, FR-046)', () => {
  it('records invite, create, login success/failure, MFA enrol, with complete fields and no secrets', async () => {
    const u = await createUser(t.payload, 'editor', { status: 'invited' })
    await routeLogin(u.email, 'definitely wrong password')
    await verifiedSession(t.payload, 'publisher')
    for (const action of [
      'user.invite',
      'user.create',
      'auth.login.success',
      'auth.login.failure',
      'mfa.enrol',
    ]) {
      const rows = await audits(action)
      expect(rows.length, action).toBeGreaterThan(0)
      for (const r of rows) {
        expect(r.actor).toBeTruthy()
        expect(r.outcome).toMatch(/success|failure|denied/)
        expect(r.at).toBeTruthy()
      }
    }
    const all = JSON.stringify((await t.sql.query('select * from audit_events')).rows)
    expect(all).not.toMatch(/definitely wrong password|pbkdf2|otpauth|secret/i)
  })
})
