// Gate 1 smoke tests against a production build (`pnpm build`), run by `pnpm test:smoke`.
import { expect, test } from '@playwright/test'

const STATIC = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
}

test.describe('security headers on a real server (FR-090)', () => {
  for (const path of ['/api/health', '/admin/login', '/does-not-exist']) {
    test(`static headers on ${path}`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 })
      const h = res.headers()
      for (const [k, v] of Object.entries(STATIC)) expect(h[k], k).toBe(v)
      expect(h['permissions-policy']).toContain('camera=()')
      expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
      expect(h['x-powered-by']).toBeUndefined()
    })
  }

  test('admin CSP is nonce-based with no unsafe-eval in production', async ({ request }) => {
    const csp = (await request.get('/admin/login')).headers()['content-security-policy']!
    expect(csp).toMatch(/script-src 'self' 'nonce-[^';]+'(;|$)/) // no 'strict-dynamic' (F-1)
    expect(csp).not.toContain('unsafe-eval')
  })
})

test.describe('no account can be created during Setup (FR-030 placeholder)', () => {
  test('first-user screens and endpoint are blocked', async ({ request }) => {
    expect((await request.get('/admin/create-first-user', { maxRedirects: 0 })).status()).toBe(404)
    const res = await request.post('/api/users/first-register', {
      data: { email: 'attacker@example.com', password: 'Str0ng-passphrase-123' }, // gitleaks:allow (synthetic test fixture)
    })
    expect(res.status()).toBe(404)
  })

  test('users REST operations are denied for anonymous callers', async ({ request }) => {
    expect((await request.get('/api/users')).status()).toBe(403)
    const create = await request.post('/api/users', {
      data: { email: 'attacker@example.com', password: 'Str0ng-passphrase-123' }, // gitleaks:allow (synthetic test fixture)
    })
    expect([401, 403]).toContain(create.status())
  })

  test('GraphQL is not exposed (D-3)', async ({ request }) => {
    expect((await request.post('/api/graphql', { data: { query: '{__typename}' } })).status()).toBe(
      404,
    )
  })
})

test.describe('errors do not leak internals (FR-095)', () => {
  test('malformed JSON and unknown routes return no stack trace', async ({ request }) => {
    const bad = await request.post('/api/users/login', {
      headers: { 'content-type': 'application/json' },
      data: '{"email": ',
    })
    const unknown = await request.get('/api/definitely-not-a-route')
    for (const body of [await bad.text(), await unknown.text()]) {
      expect(body).not.toMatch(/\bat .+\(.+:\d+:\d+\)|node_modules|\/Users\/|stack/i)
    }
  })
})

test.describe('health (FR-100)', () => {
  test('liveness and readiness', async ({ request }) => {
    expect(await (await request.get('/api/health')).json()).toEqual({ status: 'ok' })
    expect((await request.get('/api/health/ready')).status()).toBe(401)
    const ready = await request.get('/api/health/ready', {
      headers: { authorization: `Bearer ${process.env.HEALTH_READY_TOKEN}` },
    })
    expect(await ready.json()).toEqual({
      status: 'ready',
      checks: { database: 'ok', storage: 'ok', email: 'ok', enquiryDelivery: 'ok' },
    })
  })
})
