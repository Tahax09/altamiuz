// WS10 (FR-033, FR-091): session metadata stays server-side. `_sid`, `mfaVerified`, `reauthAt`
// remain readable by access checks but are non-enumerable, so they are not serialised into admin
// payloads, form state or lock responses; `sessions` is not on req.user at all. Admin server
// functions refuse sessions that have not completed MFA.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { createUser, routeLogin, userFor, verifiedSession } from '../../support/auth'

let t: TestPayload
beforeAll(async () => {
  t = await bootPayload()
}, 240_000)
afterAll(async () => t?.close())

const headersFor = (token: string) => new Headers({ Authorization: `JWT ${token}` })

describe('session metadata on req.user', () => {
  it('is available to server code but never serialised', async () => {
    const s = await verifiedSession(t.payload, 'owner')
    const user = (await userFor(t.payload, s.token)) as unknown as Record<string, unknown>
    expect(user._sid).toEqual(expect.any(String))
    expect(user.mfaVerified).toBe(true)
    const wire = JSON.stringify(user)
    expect(wire).not.toContain(user._sid as string)
    for (const key of ['_sid', 'mfaVerified', 'reauthAt', 'sessions'])
      expect(wire).not.toContain(`"${key}"`)
    const sids = await t.sql.query('select id from users_sessions where _parent_id = $1', [
      s.userId,
    ])
    for (const r of sids.rows) expect(wire).not.toContain(r.id)
    expect(structuredClone(user)._sid).toBeUndefined()
  })
})

describe('admin server-function gate', () => {
  it('allows MFA-verified CMS sessions and refuses password-only and anonymous ones', async () => {
    const { assertAdminServerFunctionAllowed, AdminServerFunctionDenied } =
      await import('@/modules/auth')
    const ok = await verifiedSession(t.payload, 'editor')
    await expect(
      assertAdminServerFunctionAllowed(t.payload, headersFor(ok.token)),
    ).resolves.toBeUndefined()
    const po = await createUser(t.payload, 'owner', { status: 'active' })
    const pwOnly = (await routeLogin(po.email, po.password)).token
    await expect(
      assertAdminServerFunctionAllowed(t.payload, headersFor(pwOnly)),
    ).rejects.toBeInstanceOf(AdminServerFunctionDenied)
    await expect(assertAdminServerFunctionAllowed(t.payload, new Headers())).rejects.toBeInstanceOf(
      AdminServerFunctionDenied,
    )
  })
})
