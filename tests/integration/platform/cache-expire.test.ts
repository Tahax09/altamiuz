// L-3: POST /api/ops/expire-public-cache (route handler as Next runs it). Only completed-MFA
// Administrators and Owners, same-origin only; success and denials are audited. The effect on the
// public site's data cache is tested over HTTP in tests/security/cache-invalidation.spec.ts.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { createUser, routeLogin, verifiedSession, type Role } from '../../support/auth'

const ORIGIN = 'http://localhost:3000'
let t: TestPayload
beforeAll(async () => {
  t = await bootPayload()
}, 240_000)
afterAll(async () => t?.close())

async function call(token?: string, origin = ORIGIN) {
  const { POST } = await import('../../../src/app/(payload)/api/ops/expire-public-cache/route')
  const headers = new Headers({ origin })
  if (token) headers.set('authorization', `JWT ${token}`)
  const res = await POST(
    new Request(`${ORIGIN}/api/ops/expire-public-cache`, { method: 'POST', headers }),
  )
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}
const audits = async (action: string) =>
  Number(
    (await t.sql.query('select count(*) from audit_events where action = $1', [action])).rows[0]
      .count,
  )

describe('expire public cache (L-3)', () => {
  for (const [role, allowed] of [
    ['owner', true],
    ['administrator', true],
    ['publisher', false],
    ['editor', false],
  ] as [Role, boolean][])
    it(`${role}: ${allowed ? 'may' : 'may not'} expire the public cache`, async () => {
      const s = await verifiedSession(t.payload, role)
      const before = await audits(allowed ? 'cache.expire' : 'access.denied')
      const r = await call(s.token)
      expect(r.status).toBe(allowed ? 200 : 403)
      if (allowed)
        expect(r.body.expired).toEqual(
          expect.arrayContaining([
            'pages',
            'services',
            'courses',
            'redirects',
            'global:header-nav',
          ]),
        )
      expect(await audits(allowed ? 'cache.expire' : 'access.denied')).toBe(before + 1)
    })

  it('anonymous, password-only and cross-origin requests are refused', async () => {
    expect((await call()).status).toBe(403)
    const u = await createUser(t.payload, 'owner')
    const login = await routeLogin(u.email, u.password)
    expect((await call(login.token)).status).toBe(403) // MFA not completed
    const s = await verifiedSession(t.payload, 'owner')
    expect((await call(s.token, 'https://evil.example')).status).toBe(403)
  })
})
