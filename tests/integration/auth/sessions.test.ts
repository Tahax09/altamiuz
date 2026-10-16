// T049 sessions (FR-035, FR-091), T050 re-authentication (FR-039).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { callEndpoint, reauth, routeLogin, userFor, verifiedSession } from '../../support/auth'

let t: TestPayload
beforeAll(async () => {
  t = await bootPayload()
}, 180_000)
afterAll(async () => t?.close())
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: Date.now() }))
afterEach(() => vi.useRealTimers())
const advance = (ms: number) => vi.setSystemTime(new Date(Date.now() + ms))

describe('expiry (A-6)', () => {
  it('idle timeout: 31 minutes without activity ends the session and deletes it', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    expect(await userFor(t.payload, s.token)).toBeTruthy()
    advance(31 * 60_000)
    expect(await userFor(t.payload, s.token)).toBeNull()
    advance(-31 * 60_000)
    expect(await userFor(t.payload, s.token)).toBeNull() // revoked, not just expired
  })

  it('activity keeps a session alive within the idle window', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    for (let i = 0; i < 5; i++) {
      advance(20 * 60_000)
      expect(await userFor(t.payload, s.token)).toBeTruthy()
    }
  })

  it('absolute lifetime: 12 hours after sign-in the session ends even with activity', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    for (let i = 0; i < 24; i++) {
      advance(29 * 60_000)
      await userFor(t.payload, s.token)
    }
    advance(29 * 60_000)
    expect(await userFor(t.payload, s.token)).toBeNull()
  })

  it('MFA rotation keeps the original creation time (rotation cannot extend the lifetime)', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    const row = (
      await t.sql.query('select created_at from auth_sessions where user_id = $1', [s.userId])
    ).rows
    expect(row).toHaveLength(1)
    const login = (
      await t.sql.query(
        "select min(at) as at from audit_events where action = 'auth.login.success' and target_id = $1",
        [String(s.userId)],
      )
    ).rows[0].at
    expect(
      Math.abs(new Date(row[0].created_at).getTime() - new Date(login).getTime()),
    ).toBeLessThan(5_000)
  })
})

describe('rotation and revocation', () => {
  it('each sign-in gets a new session id (no fixation)', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    const a = await routeLogin(s.email, s.password)
    const b = await routeLogin(s.email, s.password)
    expect(a.token).not.toBe(b.token)
    const sid = (tk: string) =>
      JSON.parse(Buffer.from(tk.split('.')[1]!, 'base64url').toString()).sid
    expect(sid(a.token)).not.toBe(sid(b.token))
  })

  it('users list and revoke their own sessions; cannot revoke someone else’s', async () => {
    const s = await verifiedSession(t.payload, 'publisher')
    const other = await verifiedSession(t.payload, 'publisher')
    const list = await callEndpoint(t.payload, 'users', '/sessions', 'get', { token: s.token })
    expect((list.body.sessions as unknown[]).length).toBe(1)
    const otherSid = (
      await t.sql.query('select session_id from auth_sessions where user_id = $1', [other.userId])
    ).rows[0].session_id
    expect(
      (
        await callEndpoint(t.payload, 'users', '/sessions/:sid', 'delete', {
          token: s.token,
          params: { sid: otherSid },
        })
      ).status,
    ).toBe(404)
    expect(await userFor(t.payload, other.token)).toBeTruthy()
  })

  it('an administrator revokes an editor’s sessions immediately (audited)', async () => {
    const admin = await verifiedSession(t.payload, 'administrator')
    await reauth(t.payload, admin)
    const ed = await verifiedSession(t.payload, 'editor')
    const r = await callEndpoint(t.payload, 'users', '/:id/revoke-sessions', 'post', {
      token: admin.token,
      params: { id: String(ed.userId) },
    })
    expect(r.status).toBe(200)
    expect(await userFor(t.payload, ed.token)).toBeNull()
  })

  it('suspension ends all sessions and blocks sign-in', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    await reauth(t.payload, owner)
    const ed = await verifiedSession(t.payload, 'editor')
    const u = await userFor(t.payload, owner.token)
    await t.payload.update({
      collection: 'users',
      id: ed.userId,
      data: { status: 'suspended' } as never,
      user: u as never,
      overrideAccess: false,
    })
    expect(await userFor(t.payload, ed.token)).toBeNull()
    expect((await routeLogin(ed.email, ed.password)).status).toBe(401)
  })

  it('a role change ends the target’s sessions (privilege change → new session)', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    await reauth(t.payload, owner)
    const ed = await verifiedSession(t.payload, 'editor')
    const u = await userFor(t.payload, owner.token)
    await t.payload.update({
      collection: 'users',
      id: ed.userId,
      data: { role: 'publisher' } as never,
      user: u as never,
      overrideAccess: false,
    })
    expect(await userFor(t.payload, ed.token)).toBeNull()
  })

  it('a session row deleted out of band cannot be revived through Payload’s built-in strategy', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    await t.sql.query('delete from auth_sessions where user_id = $1', [s.userId])
    expect(await userFor(t.payload, s.token)).toBeNull()
    expect(
      Number(
        (await t.sql.query('select count(*) from users_sessions where _parent_id = $1', [s.userId]))
          .rows[0].count,
      ),
    ).toBe(0)
  })

  it('session cookies are HttpOnly and SameSite=Lax; Secure follows the https origin', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    const { res } = await routeLogin(s.email, s.password)
    const c = res.headers.get('set-cookie')!
    expect(c).toMatch(/HttpOnly/i)
    expect(c).toMatch(/SameSite=Lax/i)
    expect(c).toMatch(/Path=\//)
    expect(c).not.toMatch(/Secure/i) // local http origin; production (https) sets Secure + __Host- prefix
  })
})

describe('T050 recent re-authentication (FR-039)', () => {
  it('sensitive actions are refused without re-auth in the last 5 minutes', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    const ed = await verifiedSession(t.payload, 'editor')
    advance(6 * 60_000)
    expect(
      (
        await callEndpoint(t.payload, 'users', '/:id/revoke-sessions', 'post', {
          token: owner.token,
          params: { id: String(ed.userId) },
        })
      ).status,
    ).toBe(403)
    expect(
      (
        await callEndpoint(t.payload, 'users', '/password', 'post', {
          token: owner.token,
          body: { password: 'another long passphrase 77' },
        })
      ).status,
    ).toBe(403)
    const u = await userFor(t.payload, owner.token)
    await expect(
      t.payload.update({
        collection: 'users',
        id: ed.userId,
        data: { role: 'publisher' } as never,
        user: u as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/re-authentication/)
  })

  it('wrong password does not grant re-auth; the right one does, for 5 minutes', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    await t.sql.query('update auth_sessions set reauth_at = null where user_id = $1', [
      owner.userId,
    ])
    expect(
      (
        await callEndpoint(t.payload, 'users', '/reauth', 'post', {
          token: owner.token,
          body: { password: 'wrong wrong wrong' },
        })
      ).status,
    ).toBe(401)
    await reauth(t.payload, owner)
    expect(
      (
        await callEndpoint(t.payload, 'users', '/password', 'post', {
          token: owner.token,
          body: { password: 'another long passphrase 77' },
        })
      ).status,
    ).toBe(200)
  })

  it('a password change ends every session, including the current one', async () => {
    const s = await verifiedSession(t.payload, 'publisher')
    const other = (await routeLogin(s.email, s.password)).token
    await reauth(t.payload, s)
    expect(
      (
        await callEndpoint(t.payload, 'users', '/password', 'post', {
          token: s.token,
          body: { password: 'brand new long passphrase 31' },
        })
      ).status,
    ).toBe(200)
    expect(await userFor(t.payload, other)).toBeNull()
    expect(await userFor(t.payload, s.token)).toBeNull()
    expect((await routeLogin(s.email, 'brand new long passphrase 31')).status).toBe(200)
  })
})
