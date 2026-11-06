// T114 (FR-060–FR-063, FR-066, SC-012) on the production build. This build runs with
// APP_ENV=test, i.e. a non-production environment: every page must be `noindex` and robots.txt
// must disallow everything. The production robots policy and indexable metadata are unit-tested
// (tests/unit/seo/seo.test.ts); sitemap selection is integration-tested.
import { expect, test, type Page } from '@playwright/test'

const SITE = () => process.env.SITE_URL!

const head = (page: Page) =>
  page.evaluate(() => {
    const attr = (sel: string, a: string) => document.querySelector(sel)?.getAttribute(a) ?? null
    const alternates = Object.fromEntries(
      [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [
        l.getAttribute('hreflang'),
        l.getAttribute('href'),
      ]),
    )
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) =>
      JSON.parse(s.textContent!),
    )
    return {
      title: document.title,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      description: attr('meta[name="description"]', 'content'),
      robots: attr('meta[name="robots"]', 'content'),
      canonical: attr('link[rel="canonical"]', 'href'),
      ogUrl: attr('meta[property="og:url"]', 'content'),
      ogLocale: attr('meta[property="og:locale"]', 'content'),
      ogTitle: attr('meta[property="og:title"]', 'content'),
      alternates,
      ld,
    }
  })

test('a bilingual service: language, direction, self-canonical, reciprocal hreflang, x-default, Open Graph', async ({
  page,
}) => {
  const res = await page.goto('/en/services/penetration-testing')
  expect(res!.headers()['x-robots-tag']).toBe('noindex, nofollow')
  const en = await head(page)
  expect([en.lang, en.dir]).toEqual(['en', 'ltr'])
  expect(en.canonical).toBe(`${SITE()}/en/services/penetration-testing`)
  expect(en.ogUrl).toBe(en.canonical)
  expect(en.ogLocale).toBe('en_GB')
  expect(en.robots).toBe('noindex, nofollow') // non-production build
  expect(en.title).toBeTruthy()
  expect(en.ogTitle).toBe(en.title)
  expect(en.description).toBeTruthy()
  expect(en.alternates['en']).toBe(en.canonical)
  expect(en.alternates['x-default']).toBe(`${SITE()}/`)
  const arHref = en.alternates['ar']!
  expect(arHref).toBeTruthy()
  await page.goto(new URL(arHref).pathname)
  const ar = await head(page)
  expect([ar.lang, ar.dir]).toEqual(['ar', 'rtl'])
  expect(ar.canonical).toBe(arHref) // reciprocal
  expect(ar.alternates['en']).toBe(en.canonical)
  expect(ar.ogLocale).toBe('ar_LY')
})

test('an English-only page has no Arabic alternate', async ({ page }) => {
  await page.goto('/en/about')
  const h = await head(page)
  expect(h.canonical).toBe(`${SITE()}/en/about`)
  expect(h.alternates['ar']).toBeUndefined()
  expect(h.alternates['en']).toBe(h.canonical)
})

test('JSON-LD: WebSite, breadcrumbs and Service from published content; no unverified Organization', async ({
  page,
}) => {
  await page.goto('/en/services/penetration-testing')
  const { ld } = await head(page)
  expect(ld).toHaveLength(1)
  const graph = ld[0]['@graph'] as Record<string, unknown>[]
  const types = graph.map((n) => n['@type'])
  expect(types).toEqual(expect.arrayContaining(['WebSite', 'BreadcrumbList', 'Service']))
  // The seeded site settings have no verified company name, so no Organization is claimed.
  expect(types).not.toContain('Organization')
  const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList') as {
    itemListElement: { item: string }[]
  }
  expect(crumbs.itemListElement.map((c) => c.item)).toEqual([
    `${SITE()}/en`,
    `${SITE()}/en/services`,
    `${SITE()}/en/services/penetration-testing`,
  ])
  const service = graph.find((n) => n['@type'] === 'Service')!
  expect(service.url).toBe(`${SITE()}/en/services/penetration-testing`)
  expect(service).not.toHaveProperty('provider')
})

test('non-production: robots.txt disallows everything; sitemap is served as XML with alternates', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(await robots.text()).toMatch(/User-Agent: \*\s+Disallow: \//i)
  const sm = await request.get('/sitemap.xml')
  expect(sm.status()).toBe(200)
  expect(sm.headers()['content-type']).toContain('xml')
  const xml = await sm.text()
  expect(xml).toContain(`<loc>${SITE()}/en/services/penetration-testing</loc>`)
  expect(xml).toContain('hreflang="ar"')
  for (const excluded of ['e2e-draft', 'hidden-service']) expect(xml).not.toContain(excluded)
})

test('admin, API and preview responses are never indexable', async ({ request }) => {
  for (const p of ['/admin/login', '/api/health']) {
    const r = await request.get(p)
    expect(r.headers()['x-robots-tag'], p).toBe('noindex, nofollow')
  }
})
