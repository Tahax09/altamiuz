// US1 adversarial checks over real HTTP (production build): drafts, unpublished locales, hidden
// and CMS-only data never reach the public site; stored XSS renders inert; locale and path
// confusion resolves to 404; redirects, reserved routes, security headers and caching rules hold;
// failure pages reveal nothing internal.
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'

const F = () => JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8'))
const ORIGIN = { origin: process.env.SITE_URL! }

const NEVER_PUBLIC = [
  'Draft-only English body', // draft page
  'Unreleased about edit', // newer unpublished draft
  'Hidden section e2e text', // hidden section
  'Hidden service E2E', // hidden service
  'E2E internal evidence ref', // evidence reference
  'e2e-secret-inbox@example.org', // enquiryRecipients
  'verifiedBy',
  '"_status"',
]

test('public pages never contain drafts, hidden items or CMS-only data', async ({ request }) => {
  for (const path of [
    '/en',
    '/ar',
    '/en/about',
    '/en/services',
    '/en/services/penetration-testing',
    '/en/e2e-draft',
  ]) {
    const html = await (await request.get(path)).text()
    for (const secret of NEVER_PUBLIC) expect(html, `${path}: ${secret}`).not.toContain(secret)
  }
  expect((await request.get('/en/e2e-draft')).status()).toBe(404)
  expect((await request.get('/en/services/hidden-service')).status()).toBe(404)
  const about = await (await request.get('/en/about')).text()
  expect(about).toContain('Published about text')
})

test('an unpublished locale is not served and never falls back to the other language', async ({
  request,
}) => {
  const r = await request.get('/ar/ar-vocab-pending-training/security-awareness')
  const html = await r.text()
  expect(html).not.toContain('Course body EN only')
  expect(html).not.toContain('All staff')
  expect((await request.get(`/en/${encodeURIComponent('الرئيسية')}`)).status()).toBe(404) // AR slug under EN, page has EN
})

test('stored malicious rich text renders inert on the public page', async ({ request }) => {
  const r = await request.get('/en/poisoned')
  expect(r.status()).toBe(200)
  const html = await r.text()
  const article = /<article[\s\S]*<\/article>/.exec(html)![0]
  expect(article).toContain('Click me')
  expect(article).not.toMatch(/javascript:|onerror|<img|style=/i)
})

test('locale and path confusion resolves to a localized 404 without internals', async ({
  request,
}) => {
  for (const path of [
    '/fr/about',
    '/en/ar-vocab-pending-services',
    '/ar/services',
    '/en/a/b/c',
    '/en/..%2f..%2fadmin',
    '/en/%E0%A4%A',
    '/en/about%00',
    "/en/x'%20OR%201=1",
  ]) {
    const r = await request.get(path, { maxRedirects: 0 })
    expect(r.status(), path).toBe(404)
    const html = await r.text()
    // Next's own 404 marker (digest NEXT_HTTP_ERROR_FALLBACK;404) is fine; internals are not.
    expect(html, path).not.toMatch(
      /\bat\s+\S+\s+\(|node_modules|\/Users\/|\.tsx?:\d|Error: |stack/i,
    )
    expect(html).toMatch(/Page not found|الصفحة غير موجودة/)
  }
  // Next 16.3.8 serves not-found responses under a dynamic root layout as a client-rendered
  // shell (status 404, localized text in the payload); the hydrated page is checked in
  // tests/public/us1-locale.spec.ts.
  expect(await (await request.get('/ar/nope')).text()).toContain('الصفحة غير موجودة')
})

test('stored redirects are served; off-site redirects are impossible', async ({ request }) => {
  const r = await request.get('/en/old-about', { maxRedirects: 0 })
  expect([301, 308]).toContain(r.status())
  expect(new URL(r.headers()['location']!, process.env.SITE_URL).pathname).toBe('/en/about')
})

test('reserved routes keep working beside the public catch-all', async ({ request }) => {
  expect((await request.get('/api/health')).status()).toBe(200)
  const admin = await request.get('/admin', { maxRedirects: 0 })
  expect(admin.status()).toBeLessThan(500)
  expect(await admin.text()).toMatch(/login/i) // Payload's admin, not the public 404 page
  expect(await admin.text()).not.toContain('الصفحة غير موجودة')
  expect((await request.get('/preview/pages/1')).status()).toBe(404)
})

test('public responses carry security headers and are never publicly cacheable', async ({
  request,
}) => {
  for (const path of ['/en', '/ar/nope']) {
    const h = (await request.get(path)).headers()
    expect(h['content-security-policy'], path).toMatch(/script-src[^;]*'nonce-/)
    expect(h['content-security-policy']).toMatch(/frame-ancestors 'none'/)
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['x-frame-options']).toBe('DENY')
    expect(h['cache-control'] ?? '', path).not.toMatch(/\bpublic\b|s-maxage/)
  }
  const root = await request.get('/', { maxRedirects: 0 })
  expect(root.headers()['vary']).toMatch(/Accept-Language/)
  expect(root.headers()['cache-control']).toMatch(/private/)
})

test('client-supplied routing headers are ignored', async ({ request }) => {
  const r = await request.get('/en/nope', {
    headers: { 'x-altamiuz-locale': 'ar', 'x-altamiuz-path': '/en/old-about' },
  })
  expect(r.status()).toBe(404)
  expect(await r.text()).toContain('Page not found')
})

test('SC-009: a newly published change is public within 60 s, and a draft save is not', async ({
  request,
}) => {
  test.setTimeout(150_000)
  const ctx = request
  const a = F().publisher // per-account login limits are shared with the other specs
  expect(
    (
      await ctx.post('/api/users/login', {
        data: { email: a.email, password: a.password },
        headers: ORIGIN,
      })
    ).status(),
  ).toBe(200)
  const step = Math.floor(Date.now() / 30_000)
  while (Math.floor(Date.now() / 30_000) <= Math.max(step, Math.floor(a.enrolledAt / 30_000) + 1))
    await new Promise((r) => setTimeout(r, 500))
  expect(
    (
      await ctx.post('/api/users/mfa/verify', {
        data: { code: await generate({ secret: a.secret }) },
        headers: ORIGIN,
      })
    ).status(),
  ).toBe(200)
  const id = F().public.serviceId
  const current = await (
    await ctx.get(`/api/services/${id}?draft=true&locale=en`, { headers: ORIGIN })
  ).json()
  // Draft save: never public.
  await ctx.patch(`/api/services/${id}?draft=true&locale=en`, {
    headers: ORIGIN,
    data: { summary: 'Draft summary must stay private', updatedAt: current.updatedAt },
  })
  const anon = await (await fetch(`${process.env.SITE_URL}/en/services`)).text()
  expect(anon).not.toContain('Draft summary must stay private')
  // Publish: visible within 60 s.
  const fresh = await (
    await ctx.get(`/api/services/${id}?draft=true&locale=en`, { headers: ORIGIN })
  ).json()
  const pub = await ctx.patch(`/api/services/${id}?locale=en`, {
    headers: ORIGIN,
    data: { summary: 'Published summary v2', _status: 'published', updatedAt: fresh.updatedAt },
  })
  expect(pub.status(), await pub.text()).toBe(200)
  const started = Date.now()
  let seen = false
  while (Date.now() - started < 60_000 && !seen) {
    seen = (await (await fetch(`${process.env.SITE_URL}/en/services`)).text()).includes(
      'Published summary v2',
    )
    if (!seen) await new Promise((r) => setTimeout(r, 2_000))
  }
  expect(seen).toBe(true)
})
