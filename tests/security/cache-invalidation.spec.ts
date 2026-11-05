// WS11 finding M-1: public content must stop being served the moment an unpublish, delete or
// replacing publish succeeds. Next 16.3.8 `revalidateTag(tag, 'max')` is stale-while-revalidate
// (the old cached copy is served at least once more), so these checks read the public page
// immediately after the write returns, with a warm cache, in both locales. Document requests for
// missing paths are answered by the proxy's uncached lookup (server-side 404), so every check
// also makes a client-side navigation (RSC) request, which is rendered from the data cache.
import { expect, request as pwRequest, test, type APIRequestContext } from '@playwright/test'
import fs from 'node:fs'
import pg from 'pg'
import { generate } from 'otplib'
import { href } from '../../src/modules/i18n/routes'

type Acct = { email: string; password: string; secret: string; enrolledAt: number }
const F = () => JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8'))
const BASE = process.env.SITE_URL!
const ORIGIN = { origin: BASE }
test.describe.configure({ mode: 'serial' })

const sessions = new Map<string, Promise<APIRequestContext>>()
function signedIn(a: Acct) {
  if (!sessions.has(a.email))
    sessions.set(
      a.email,
      (async () => {
        const ctx = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: ORIGIN })
        expect(
          (
            await ctx.post('/api/users/login', { data: { email: a.email, password: a.password } })
          ).status(),
        ).toBe(200)
        const step = Math.floor(Date.now() / 30_000)
        while (
          Math.floor(Date.now() / 30_000) <= Math.max(step, Math.floor(a.enrolledAt / 30_000) + 1)
        )
          await new Promise((r) => setTimeout(r, 500))
        const v = await ctx.post('/api/users/mfa/verify', {
          data: { code: await generate({ secret: a.secret }) },
        })
        expect(v.status(), await v.text()).toBe(200)
        return ctx
      })(),
    )
  return sessions.get(a.email)!
}
const publisher = () => signedIn(F().cachePublisher)
const admin = () => signedIn(F().cacheAdministrator)

const rt = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        children: [{ type: 'text', version: 1, text, format: 0 }],
      },
    ],
  },
})
let n = 0
const uniq = () => `cache-${Date.now()}-${n++}`

/** Anonymous GET with no cookies: what any visitor (or a shared cache) would get. */
async function visit(path: string) {
  const r = await fetch(`${BASE}${path}`, { redirect: 'manual' })
  return { status: r.status, html: await r.text(), cacheControl: r.headers.get('cache-control') }
}
/** A client-side navigation (RSC payload): rendered from the data cache, never by the proxy's
 * server-side 404, so it shows what the cache holds. */
async function navigate(path: string) {
  // What the router's fetch sends. Next 307s an RSC request whose `_rsc` cache-buster does not
  // match its router headers (none here: empty value); `Sec-Fetch-Dest: empty` keeps it away from
  // the proxy's server-side 404.
  const r = await fetch(`${BASE}${path}?_rsc`, {
    redirect: 'manual',
    headers: { rsc: '1', 'sec-fetch-dest': 'empty' },
  })
  expect(r.headers.get('content-type'), `${path} is an RSC response`).toContain('text/x-component')
  return { status: r.status, body: await r.text() }
}
/** Two reads (document and client navigation) make sure the entry is in the data cache. */
async function warm(path: string, marker: string) {
  for (let i = 0; i < 2; i++) {
    const r = await visit(path)
    expect(r.status, path).toBe(200)
    expect(r.html).toContain(marker)
    expect((await navigate(path)).body).toContain(marker)
  }
}
/** An RSC redirect is a 3xx or a payload carrying Next's redirect digest. */
const redirecting = (r: { status: number; body: string }) =>
  (r.status >= 300 && r.status < 400) || r.body.includes('NEXT_REDIRECT')
/** Neither a document request nor a client-side navigation shows the marker any more. */
async function expectGone(path: string, marker: string) {
  const r = await visit(path)
  expect(r.status, path).toBe(404)
  expect(r.html, path).not.toContain(marker)
  expect((await navigate(path)).body, `${path} (navigation)`).not.toContain(marker)
}

async function current(ctx: APIRequestContext, collection: string, id: number, locale: string) {
  return (await (await ctx.get(`/api/${collection}/${id}?draft=true&locale=${locale}`)).json()) as {
    updatedAt: string
  }
}
async function save(
  ctx: APIRequestContext,
  collection: string,
  id: number,
  locale: 'ar' | 'en',
  data: Record<string, unknown>,
  draft = false,
) {
  const base = await current(ctx, collection, id, locale)
  const r = await ctx.patch(
    `/api/${collection}/${id}?locale=${locale}${draft ? '&draft=true' : ''}`,
    {
      data: { ...data, updatedAt: base.updatedAt },
    },
  )
  expect(r.status(), await r.text()).toBe(200)
}

async function publishedPage(marker: string, arMarker?: string) {
  const ctx = await publisher()
  const slug = uniq()
  const c = await ctx.post('/api/pages?draft=true&locale=en', {
    data: {
      title: 'Cache test page',
      slug,
      template: 'default',
      seo: { title: 'Cache test', description: 'Cache test page' },
      sections: [{ blockType: 'richText', content: rt(marker) }],
    },
  })
  expect(c.status(), await c.text()).toBe(201)
  const doc = (await c.json()).doc as { id: number; sections: { id: string }[] }
  await save(ctx, 'pages', doc.id, 'en', { _status: 'published' })
  let arSlug: string | undefined
  if (arMarker) {
    arSlug = `ع-${slug}`
    await save(
      ctx,
      'pages',
      doc.id,
      'ar',
      {
        title: 'صفحة اختبار',
        slug: arSlug,
        seo: { title: 'اختبار', description: 'صفحة اختبار' },
        sections: [{ id: doc.sections[0]!.id, blockType: 'richText', content: rt(arMarker) }],
      },
      true,
    )
    await save(ctx, 'pages', doc.id, 'ar', { _status: 'published' })
  }
  return { id: doc.id, slug, arSlug, sectionId: doc.sections[0]!.id }
}

test('unpublishing a locale removes it from the public site immediately', async () => {
  test.setTimeout(120_000)
  const p = await publishedPage('EN-UNPUBLISH-MARKER', 'AR-UNPUBLISH-MARKER')
  const en = `/en/${p.slug}`
  const ar = `/ar/${encodeURIComponent(p.arSlug!)}`
  await warm(en, 'EN-UNPUBLISH-MARKER')
  await warm(ar, 'AR-UNPUBLISH-MARKER')
  await save(await publisher(), 'pages', p.id, 'ar', { _status: 'draft' })
  await expectGone(ar, 'AR-UNPUBLISH-MARKER')
  await warm(en, 'EN-UNPUBLISH-MARKER') // the other locale stays published
  await save(await publisher(), 'pages', p.id, 'en', { _status: 'draft' })
  await expectGone(en, 'EN-UNPUBLISH-MARKER')
})

test('a replacing publish never serves the compromised version from cache', async () => {
  test.setTimeout(120_000)
  const p = await publishedPage('COMPROMISED-CONTENT-MARKER')
  const path = `/en/${p.slug}`
  await warm(path, 'COMPROMISED-CONTENT-MARKER')
  await save(await publisher(), 'pages', p.id, 'en', {
    _status: 'published',
    sections: [{ id: p.sectionId, blockType: 'richText', content: rt('CLEAN-REPLACEMENT-MARKER') }],
  })
  const after = await visit(path)
  expect(after.status).toBe(200)
  expect(after.html).not.toContain('COMPROMISED-CONTENT-MARKER')
  expect(after.html).toContain('CLEAN-REPLACEMENT-MARKER')
  expect((await navigate(path)).body).not.toContain('COMPROMISED-CONTENT-MARKER')
})

test('deleting a published page removes it immediately', async () => {
  test.setTimeout(120_000)
  const p = await publishedPage('DELETE-ME-MARKER')
  const path = `/en/${p.slug}`
  await warm(path, 'DELETE-ME-MARKER')
  const d = await (await admin()).delete(`/api/pages/${p.id}`)
  expect(d.status(), await d.text()).toBe(200)
  await expectGone(path, 'DELETE-ME-MARKER')
})

test('an unpublished service leaves the listing and its detail page immediately', async () => {
  test.setTimeout(120_000)
  const ctx = await publisher()
  const slug = uniq()
  const c = await ctx.post('/api/services?draft=true&locale=en', {
    data: {
      title: 'LISTED-SERVICE-MARKER',
      slug,
      summary: 'Cache test service',
      order: 99,
      sections: [],
      seo: { title: 'Service', description: 'Service description' },
    },
  })
  expect(c.status(), await c.text()).toBe(201)
  const id = ((await c.json()).doc as { id: number }).id
  await save(ctx, 'services', id, 'en', { _status: 'published' })
  await warm('/en/services', 'LISTED-SERVICE-MARKER')
  await warm(`/en/services/${slug}`, 'LISTED-SERVICE-MARKER')
  await save(ctx, 'services', id, 'en', { _status: 'draft' })
  expect((await visit('/en/services')).html).not.toContain('LISTED-SERVICE-MARKER')
  expect((await navigate('/en/services')).body).not.toContain('LISTED-SERVICE-MARKER')
  await expectGone(`/en/services/${slug}`, 'LISTED-SERVICE-MARKER')
})

test('removing a published navigation link takes effect immediately', async () => {
  test.setTimeout(120_000)
  const ctx = await admin()
  const items = (label: string) => [
    { link: { linkType: 'external', url: 'https://example.org/', label } },
  ]
  const put = async (navItems: unknown[]) => {
    const base = await (await ctx.get('/api/globals/header-nav?draft=true&locale=en')).json()
    const r = await ctx.post('/api/globals/header-nav?locale=en', {
      data: { items: navItems, _status: 'published', updatedAt: base.updatedAt },
    })
    expect(r.status(), await r.text()).toBe(200)
  }
  // The seeded menu is shared with the `public` projects, which run later: put it back.
  const seeded = (await (await ctx.get('/api/globals/header-nav?locale=en&depth=0')).json()) as {
    items: unknown[]
  }
  try {
    await put(items('NAV-COMPROMISED-MARKER'))
    await warm('/en', 'NAV-COMPROMISED-MARKER')
    await put(items('NAV-CLEAN-MARKER'))
    const after = await visit('/en')
    expect(after.html).not.toContain('NAV-COMPROMISED-MARKER')
    expect(after.html).toContain('NAV-CLEAN-MARKER')
    expect((await navigate('/en')).body).not.toContain('NAV-COMPROMISED-MARKER')
  } finally {
    await put(seeded.items)
  }
})

test('a deleted redirect stops redirecting immediately', async () => {
  test.setTimeout(120_000)
  const ctx = await admin()
  const from = `/en/${uniq()}`
  const c = await ctx.post('/api/redirects', {
    data: { from, to: '/en/about', type: '301', source: 'manual' },
  })
  expect(c.status(), await c.text()).toBe(201)
  const id = ((await c.json()).doc as { id: number }).id
  for (let i = 0; i < 2; i++) {
    expect([301, 308]).toContain((await visit(from)).status)
    expect(redirecting(await navigate(from)), 'navigation redirects').toBe(true)
  }
  expect((await ctx.delete(`/api/redirects/${id}`)).status()).toBe(200)
  expect((await visit(from)).status).toBe(404)
  expect(redirecting(await navigate(from)), 'navigation no longer redirects').toBe(false)
})

test('public HTML is never storable by a shared cache (no stale copy outlives a write)', async () => {
  test.setTimeout(120_000)
  const p = await publishedPage('HEADERS-MARKER')
  for (const path of [`/en/${p.slug}`, '/en', '/en/services', '/en/no-such-page']) {
    const r = await visit(path)
    const cc = (r.cacheControl ?? '').toLowerCase()
    expect(cc, path).not.toMatch(/\bpublic\b|s-maxage|stale-while-revalidate/)
    expect(cc, path).toMatch(/no-store|private/)
  }
})

test('a replacing publish in Arabic never serves the compromised Arabic version', async () => {
  test.setTimeout(120_000)
  const p = await publishedPage('EN-STABLE-MARKER', 'AR-COMPROMISED-MARKER')
  const en = `/en/${p.slug}`
  const ar = `/ar/${encodeURIComponent(p.arSlug!)}`
  await warm(en, 'EN-STABLE-MARKER')
  await warm(ar, 'AR-COMPROMISED-MARKER')
  await save(await publisher(), 'pages', p.id, 'ar', {
    _status: 'published',
    sections: [{ id: p.sectionId, blockType: 'richText', content: rt('AR-CLEAN-MARKER') }],
  })
  const after = await visit(ar)
  expect(after.status).toBe(200)
  expect(after.html).not.toContain('AR-COMPROMISED-MARKER')
  expect(after.html).toContain('AR-CLEAN-MARKER')
  expect((await navigate(ar)).body).not.toContain('AR-COMPROMISED-MARKER')
  await warm(en, 'EN-STABLE-MARKER') // the English locale is unaffected
})

test('the admin "unpublish all locales" action removes every locale immediately', async () => {
  test.setTimeout(120_000)
  const p = await publishedPage('EN-ALL-MARKER', 'AR-ALL-MARKER')
  const en = `/en/${p.slug}`
  const ar = `/ar/${encodeURIComponent(p.arSlug!)}`
  await warm(en, 'EN-ALL-MARKER')
  await warm(ar, 'AR-ALL-MARKER')
  // Exactly what the admin Unpublish button sends with "all locales" ticked (@payloadcms/ui
  // UnpublishButton): no locale, unpublishAllLocales=true, body `{ _status: 'draft' }`.
  const r = await (
    await publisher()
  ).patch(`/api/pages/${p.id}?depth=0&fallback-locale=null&unpublishAllLocales=true`, {
    data: { _status: 'draft' },
  })
  expect(r.status(), await r.text()).toBe(200)
  await expectGone(en, 'EN-ALL-MARKER')
  await expectGone(ar, 'AR-ALL-MARKER')
})

test('unpublishing Arabic removes it from the English page language switcher immediately', async () => {
  test.setTimeout(120_000)
  const p = await publishedPage('EN-SWITCH-MARKER', 'AR-SWITCH-MARKER')
  const en = `/en/${p.slug}`
  const arHref = href('page', 'ar', { slug: p.arSlug! })
  await warm(en, arHref)
  await save(await publisher(), 'pages', p.id, 'ar', { _status: 'draft' })
  const after = await visit(en)
  expect(after.status).toBe(200)
  expect(after.html).toContain('EN-SWITCH-MARKER')
  expect(after.html).not.toContain(arHref)
  expect((await navigate(en)).body).not.toContain(arHref)
})

test('an unpublished Arabic service leaves the Arabic listing and detail page immediately', async () => {
  test.setTimeout(120_000)
  const ctx = await publisher()
  const slug = `ع-${uniq()}`
  const c = await ctx.post('/api/services?draft=true&locale=ar', {
    data: {
      title: 'AR-LISTED-SERVICE-MARKER',
      slug,
      summary: 'خدمة اختبار',
      order: 99,
      sections: [],
      seo: { title: 'خدمة', description: 'وصف الخدمة' },
    },
  })
  expect(c.status(), await c.text()).toBe(201)
  const id = ((await c.json()).doc as { id: number }).id
  await save(ctx, 'services', id, 'ar', { _status: 'published' })
  const listing = href('services', 'ar')
  const detail = href('service', 'ar', { slug })
  await warm(listing, 'AR-LISTED-SERVICE-MARKER')
  await warm(detail, 'AR-LISTED-SERVICE-MARKER')
  await save(ctx, 'services', id, 'ar', { _status: 'draft' })
  expect((await visit(listing)).html).not.toContain('AR-LISTED-SERVICE-MARKER')
  expect((await navigate(listing)).body).not.toContain('AR-LISTED-SERVICE-MARKER')
  await expectGone(detail, 'AR-LISTED-SERVICE-MARKER')
})

test('after an out-of-band database write, an Administrator can expire the public cache at once (L-3)', async () => {
  test.setTimeout(120_000)
  const p = await publishedPage('OOB-BEFORE-MARKER')
  const path = `/en/${p.slug}`
  await warm(path, 'OOB-BEFORE-MARKER')
  // A write that bypasses the application (SQL restore, script): no cache tag is expired.
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  await c.query(
    "update pages_locales set title = 'OOB-AFTER-MARKER' where _parent_id = $1 and _locale = 'en'",
    [p.id],
  )
  await c.end()
  expect((await visit(path)).html).not.toContain('OOB-AFTER-MARKER') // still the cached copy
  // Publishers cannot do it; an Administrator can, and the next read is fresh.
  const denied = await (await publisher()).post('/api/ops/expire-public-cache')
  expect(denied.status()).toBe(403)
  const ok = await (await admin()).post('/api/ops/expire-public-cache')
  expect(ok.status(), await ok.text()).toBe(200)
  const after = await visit(path)
  expect(after.html).toContain('OOB-AFTER-MARKER')
  expect((await navigate(path)).body).toContain('OOB-AFTER-MARKER')
})
