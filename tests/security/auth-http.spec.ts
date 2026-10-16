// US3 over real HTTP against a production build (T046, T054, plus built-in route blocking, cookie
// flags, REST denial auditing and token secrecy). Accounts come from tests/support/e2e-seed.ts.
import { expect, request as pwRequest, test, type APIRequestContext } from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'
import pg from 'pg'

type Acct = { id: number; email: string; password: string; secret?: string; enrolledAt?: number }
const F = () =>
  JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as Record<string, Acct>
const BASE = process.env.SITE_URL!
const ORIGIN = { origin: BASE }
test.describe.configure({ mode: 'serial' })

async function waitForFreshStep(a: Acct) {
  const step = (ms: number) => Math.floor(ms / 30_000)
  while (step(Date.now()) <= step(a.enrolledAt ?? 0)) await new Promise((r) => setTimeout(r, 500))
}
const used = new Map<string, number>()
async function freshCode(a: Acct) {
  const step = () => Math.floor(Date.now() / 30_000)
  while ((used.get(a.email) ?? -1) >= step()) await new Promise((r) => setTimeout(r, 500))
  used.set(a.email, step())
  return generate({ secret: a.secret! })
}

async function signedIn(a: Acct, verify: boolean): Promise<APIRequestContext> {
  const ctx = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: ORIGIN })
  const r = await ctx.post('/api/users/login', { data: { email: a.email, password: a.password } })
  expect(r.status()).toBe(200)
  if (verify) {
    await waitForFreshStep(a)
    const v = await ctx.post('/api/users/mfa/verify', { data: { code: await freshCode(a) } })
    expect(v.status(), await v.text()).toBe(200)
  }
  return ctx
}

test('built-in Payload auth routes replaced by project flows are blocked', async ({ request }) => {
  for (const p of [
    'forgot-password',
    'reset-password',
    'unlock',
    'refresh-token',
    'first-register',
  ])
    expect((await request.post(`/api/users/${p}`, { data: {}, headers: ORIGIN })).status(), p).toBe(
      404,
    )
  const forgot = await request.get('/admin/forgot', { maxRedirects: 0 })
  expect(forgot.status()).toBe(307)
  expect(forgot.headers()['location']).toContain('/account/recover')
})

test('login sets an HttpOnly SameSite=Lax cookie and returns no token in the body', async ({
  request,
}) => {
  const a = F().editor!
  const r = await request.post('/api/users/login', {
    data: { email: a.email, password: a.password },
    headers: ORIGIN,
  })
  expect(r.status()).toBe(200)
  const cookie = r.headers()['set-cookie']!
  expect(cookie).toMatch(/HttpOnly/i)
  expect(cookie).toMatch(/SameSite=Lax/i)
  const body = await r.text()
  expect(body).not.toMatch(/"token"|eyJ/)
})

test('unknown account and wrong password are indistinguishable over HTTP', async ({ request }) => {
  const a = F().administrator!
  const x = await request.post('/api/users/login', {
    data: { email: a.email, password: 'definitely wrong 123' },
    headers: ORIGIN,
  })
  const y = await request.post('/api/users/login', {
    data: { email: 'nobody-at-all@example.invalid', password: 'definitely wrong 123' },
    headers: ORIGIN,
  })
  expect([x.status(), y.status()]).toEqual([401, 401])
  expect(await x.text()).toBe(await y.text())
})

test('T046: a password-only session reaches no protected data or action', async () => {
  const ctx = await signedIn(F().passwordOnly!, false)
  const f = F()
  const probes: [string, string, unknown?][] = [
    ['GET', '/api/users'],
    ['GET', `/api/users/${f.owner!.id}`],
    ['GET', '/api/audit-events'],
    ['GET', '/api/invitations'],
    ['GET', '/api/globals/security-settings'],
    ['GET', '/api/users/sessions'],
    ['POST', '/api/users/mfa/recovery-codes', {}],
    ['POST', `/api/users/${f.editor!.id}/reset-mfa`, {}],
    ['POST', `/api/users/${f.editor!.id}/revoke-sessions`, {}],
    ['PATCH', `/api/users/${f.passwordOnly!.id}`, { role: 'owner' }],
    ['POST', '/api/invitations', { email: 'x@example.invalid', role: 'owner' }],
  ]
  for (const [method, url, data] of probes) {
    const r = await ctx.fetch(url, { method, data })
    expect([401, 403], `${method} ${url} → ${r.status()}`).toContain(r.status())
  }
  const me = await (await ctx.get('/api/users/me')).json()
  expect(me.user.mfaVerified).toBe(false)
  await ctx.dispose()
})

test('a verified owner reads the directory without any authentication secrets', async () => {
  const ctx = await signedIn(F().owner!, true)
  const r = await ctx.get('/api/users?depth=2&limit=100')
  expect(r.status()).toBe(200)
  const text = await r.text()
  for (const k of [
    '"hash"',
    '"salt"',
    '"sessions"',
    '"resetPasswordToken"',
    'secret_enc',
    'otpauth',
  ])
    expect(text).not.toContain(k)
  for (const a of Object.values(F())) if (a.secret) expect(text).not.toContain(a.secret)
  expect(await (await ctx.get('/api/users/me')).text()).not.toMatch(/"token"|eyJ/)
  await ctx.dispose()
})

test('T054: cross-origin state changes are refused even with a valid session cookie', async () => {
  const ctx = await signedIn(F().owner!, true)
  const evil = { origin: 'https://evil.example' }
  const f = F()
  expect(
    (
      await ctx.post(`/api/users/${f.editor!.id}/revoke-sessions`, { headers: evil, data: {} })
    ).status(),
  ).toBe(401)
  expect([401, 403]).toContain(
    (
      await ctx.patch(`/api/users/${f.editor!.id}`, { headers: evil, data: { name: 'csrf' } })
    ).status(),
  )
  expect(
    (
      await ctx.post('/api/users/login', {
        headers: evil,
        data: { email: f.editor!.email, password: f.editor!.password },
      })
    ).status(),
  ).toBe(403)
  expect(
    (await ctx.post('/api/invitations/accept', { headers: evil, data: { token: 'x' } })).status(),
  ).toBe(403)
  expect(
    (
      await ctx.post('/api/users/recovery/complete', { headers: evil, data: { token: 'x' } })
    ).status(),
  ).toBe(403)
  await ctx.dispose()
})

test('REST denials by a verified editor are refused and audited as access.denied', async () => {
  const ctx = await signedIn(F().editor!, true)
  const r = await ctx.patch(`/api/users/${F().owner!.id}`, { data: { role: 'editor' } })
  expect([401, 403]).toContain(r.status())
  await ctx.dispose()
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()
  const n = Number(
    (
      await db.query(
        "select count(*) from audit_events where action = 'access.denied' and actor = $1",
        [`user:${F().editor!.id}`],
      )
    ).rows[0].count,
  )
  await db.end()
  expect(n).toBeGreaterThan(0)
})

test('account pages render for unauthenticated visitors (recover, accept-invite) and do not leak', async ({
  request,
}) => {
  for (const p of [
    '/account/recover',
    '/account/accept-invite',
    '/account/mfa',
    '/account/security',
  ]) {
    const r = await request.get(p)
    expect(r.status(), p).toBe(200)
    expect(r.headers()['content-security-policy']).toContain("'nonce-")
  }
})
