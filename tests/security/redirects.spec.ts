// T115 (FR-064, FR-065, SC-012) over real HTTP on the production build. Redirect writes go through
// the admin's REST API as an MFA-verified Administrator; lookups through the public proxy. The
// legacy inventory itself is CD-12 (owner-approved map pending): synthetic legacy-style paths prove
// the matching rules (with/without trailing slash, percent-encoded Arabic slugs, one hop).
import { expect, test, type BrowserContext } from '@playwright/test'
import { contextFor, ORIGIN, sql } from '../support/e2e-session'

test.describe.configure({ mode: 'serial' })
let admin: BrowserContext
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000)
  await sql('delete from rate_limit_buckets')
  admin = await contextFor(browser, 'seoAdmin')
})
test.afterAll(async () => admin?.close())

const create = (from: string, to: string, type = '301') =>
  admin.request.post('/api/redirects', { headers: ORIGIN(), data: { from, to, type } })

test('loops, chains, self and external / open-redirect targets are rejected', async () => {
  expect((await create('/t115-a', '/en/about')).status()).toBe(201)
  expect((await create('/t115-b', '/t115-a')).status()).toBe(400) // chain
  expect((await create('/t115-c', '/t115-c/')).status()).toBe(400) // self
  for (const to of [
    'https://evil.example/',
    '//evil.example',
    '/\\evil.example',
    '/%5Cevil.example',
    '/%2F%2Fevil.example',
    'javascript:alert(1)',
  ])
    expect(
      (await create(`/t115-x-${Math.random().toString(36).slice(2, 7)}`, to)).status(),
      to,
    ).toBe(400)
  expect(
    Number(
      (
        await sql<{ n: number }>(`select count(*)::int n from redirects where "to" like '%evil%'`)
      )[0]!.n,
    ),
  ).toBe(0)
})

test('legacy-style URLs redirect in one hop with and without trailing slash and percent-encoded Arabic', async ({
  request,
}) => {
  expect((await create('/t115-legacy/%D8%AF%D9%88%D8%B1%D8%A9/', '/en/about')).status()).toBe(201)
  for (const p of [
    '/t115-legacy/%D8%AF%D9%88%D8%B1%D8%A9',
    '/t115-legacy/%D8%AF%D9%88%D8%B1%D8%A9/',
  ]) {
    const r = await request.get(p, { maxRedirects: 0 })
    expect(r.status(), p).toBe(308)
    expect(r.headers().location, p).toMatch(/\/en\/about$/)
    const final = await request.get(r.headers().location!, { maxRedirects: 0 })
    expect(final.status(), `${p} one hop`).toBe(200)
  }
  expect((await create('/t115-temp', '/en/about', '302')).status()).toBe(201)
  expect((await request.get('/t115-temp/', { maxRedirects: 0 })).status()).toBe(307)
})

test('open-redirect payloads in request paths never leave the site', async ({ request }) => {
  for (const p of [
    '//evil.example',
    '/%2F%2Fevil.example',
    '/%5Cevil.example',
    '/\\evil.example',
  ]) {
    // Origin + raw path: Playwright would treat a bare `//host` as protocol-relative.
    const r = await request.get(`${process.env.SITE_URL}${p}`, { maxRedirects: 0 })
    expect(r.status(), p).toBeLessThan(500)
    const loc = r.headers().location ?? ''
    // Any Location must resolve to this site's own origin (a same-site path like `/evil.example`
    // is harmless; another host is an open redirect).
    if (loc)
      expect(new URL(loc, process.env.SITE_URL).origin, `${p} → ${loc}`).toBe(
        new URL(process.env.SITE_URL!).origin,
      )
  }
})
