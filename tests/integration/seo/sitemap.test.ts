// T117 (FR-062): the sitemap lists published, visible, indexable, self-canonical documents per
// locale with reciprocal alternates, plus home and listings; drafts, unpublished locales, hidden
// services, noindex pages and canonical overrides are excluded.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { pageData } from '../../support/content'

let t: TestPayload
const SITE = 'https://www.example.org'

beforeAll(async () => {
  t = await bootPayload()
}, 240_000)
afterAll(async () => t?.close())

async function publish(
  collection: 'pages' | 'services',
  en: Record<string, unknown>,
  ar?: Record<string, unknown>,
) {
  const doc = (await t.payload.create({
    collection,
    locale: 'en',
    draft: true,
    data: en as never,
    overrideAccess: true,
  })) as unknown as { id: number }
  if (ar)
    await t.payload.update({
      collection,
      id: doc.id,
      locale: 'ar',
      draft: true,
      data: ar as never,
      overrideAccess: true,
    })
  for (const locale of ar ? (['en', 'ar'] as const) : (['en'] as const))
    await t.payload.update({
      collection,
      id: doc.id,
      locale,
      data: { _status: 'published' } as never,
      publishSpecificLocale: locale,
      overrideAccess: true,
    })
  return doc
}

describe('sitemapEntries', () => {
  it('includes exactly the indexable published documents, with alternates', async () => {
    const { sitemapEntries } = await import('../../../src/modules/seo')
    await publish('pages', pageData('both-langs', 'Both'), pageData('كلاهما', 'كلاهما'))
    await publish('pages', pageData('english-only', 'English only'))
    await publish(
      'pages',
      pageData('no-index', 'No index', { seo: { title: 'N', description: 'N', noindex: true } }),
    )
    await publish(
      'pages',
      pageData('canonical-elsewhere', 'Copy', {
        seo: { title: 'C', description: 'C', canonicalOverride: '/en/both-langs' },
      }),
    )
    await publish('pages', pageData('home-page', 'Home', { template: 'home' }))
    await t.payload.create({
      collection: 'pages',
      locale: 'en',
      draft: true,
      data: pageData('draft-only', 'Draft') as never,
      overrideAccess: true,
    })
    await publish('services', {
      title: 'Visible service',
      slug: 'visible-service',
      seo: { title: 'S', description: 'S' },
    })
    await publish('services', {
      title: 'Hidden service',
      slug: 'hidden-service',
      hidden: true,
      seo: { title: 'H', description: 'H' },
    })

    const entries = await sitemapEntries(t.payload, SITE)
    const urls = entries.map((e) => decodeURIComponent(e.url))
    expect(urls).toEqual(
      expect.arrayContaining([
        `${SITE}/en`,
        `${SITE}/ar`,
        `${SITE}/en/services`,
        `${SITE}/en/training`,
        `${SITE}/en/both-langs`,
        `${SITE}/ar/كلاهما`,
        `${SITE}/en/english-only`,
        `${SITE}/en/services/visible-service`,
      ]),
    )
    for (const excluded of [
      'no-index',
      'canonical-elsewhere',
      'draft-only',
      'hidden-service',
      'home-page',
    ])
      expect(
        urls.some((u) => u.endsWith(`/${excluded}`)),
        excluded,
      ).toBe(false)
    expect(urls.filter((u) => u.includes('english-only'))).toHaveLength(1) // no Arabic twin
    const both = entries.find((e) => e.url === `${SITE}/en/both-langs`)!
    expect(Object.keys(both.alternates!.languages!).sort()).toEqual(['ar', 'en'])
    expect(decodeURIComponent(both.alternates!.languages!.ar!)).toBe(`${SITE}/ar/كلاهما`)
    expect(both.lastModified).toBeTruthy()
    const only = entries.find((e) => e.url === `${SITE}/en/english-only`)!
    expect(Object.keys(only.alternates!.languages!)).toEqual(['en'])
    // Every listed URL is absolute on the configured origin.
    for (const e of entries) expect(e.url.startsWith(`${SITE}/`)).toBe(true)
  })
})
