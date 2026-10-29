// US1 public read path (T103, FR-004, FR-018, FR-021, D-3): the only way the public site reads
// content. Published only, per locale, no cross-language fallback, CMS-only fields stripped,
// hidden items and sections excluded, listings in editor order, relationships never leak drafts.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { pageData, rt } from '../../support/content'

let t: TestPayload
let pub: typeof import('@/modules/content')
beforeAll(async () => {
  t = await bootPayload()
  pub = await import('@/modules/content')
}, 240_000)
afterAll(async () => t?.close())

let n = 0
const uniq = () => `pr-${Date.now()}-${n++}`
const seo = { title: 'SEO', description: 'Description' }

async function make(
  collection: 'pages' | 'services' | 'courses',
  data: Record<string, unknown>,
  publish: ('ar' | 'en')[] = ['en'],
) {
  const doc = (await t.payload.create({
    collection,
    data: { seo, ...data } as never,
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })) as unknown as { id: number }
  for (const locale of publish) {
    if (locale === 'ar')
      await t.payload.update({
        collection,
        id: doc.id,
        locale: 'ar',
        draft: true,
        data: {
          title: `عربي ${data.title}`,
          slug: `ar-${data.slug}`,
          seo: { title: 'ع', description: 'و' },
        } as never,
        overrideAccess: true,
      })
    await t.payload.update({
      collection,
      id: doc.id,
      locale,
      data: { _status: 'published' } as never,
      publishSpecificLocale: locale,
      overrideAccess: true,
    })
  }
  return doc.id
}
const service = (title: string, extra: Record<string, unknown> = {}) => ({
  title,
  slug: uniq(),
  summary: 'Summary',
  sections: [],
  ...extra,
})

describe('getPublished', () => {
  it('returns a published page by slug in its locale only (no fallback)', async () => {
    const slug = uniq()
    await make('pages', pageData(slug, 'English only'))
    const en = await pub.getPublished(t.payload, 'pages', 'en', slug)
    expect(en?.title).toBe('English only')
    expect(await pub.getPublished(t.payload, 'pages', 'ar', slug)).toBeNull()
  })

  it('never returns drafts, unpublished locales or newer unpublished edits', async () => {
    const slug = uniq()
    const id = await make('pages', pageData(slug, 'Live title'))
    await t.payload.update({
      collection: 'pages',
      id,
      locale: 'en',
      draft: true,
      data: { title: 'Unreleased' } as never,
      overrideAccess: true,
    })
    expect((await pub.getPublished(t.payload, 'pages', 'en', slug))?.title).toBe('Live title')
    const draftSlug = uniq()
    await t.payload.create({
      collection: 'pages',
      data: pageData(draftSlug) as never,
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })
    expect(await pub.getPublished(t.payload, 'pages', 'en', draftSlug)).toBeNull()
  })

  it('strips CMS-only fields and hidden sections', async () => {
    const slug = uniq()
    await make(
      'pages',
      pageData(slug, 'Stripped', {
        sections: [
          { blockType: 'richText', content: rt('Visible section') },
          { blockType: 'richText', hidden: true, content: rt('Hidden section text') },
          {
            blockType: 'stats',
            items: [{ value: '1', label: 'x' }],
            evidence: { status: 'verified', reference: 'Internal evidence ref 42' },
          },
        ],
      }),
    )
    const doc = await pub.getPublished(t.payload, 'pages', 'en', slug)
    const wire = JSON.stringify(doc)
    expect(wire).toContain('Visible section')
    expect(wire).not.toContain('Hidden section text')
    for (const secret of [
      'Internal evidence ref 42',
      '"_status"',
      'verifiedBy',
      '"evidence"',
      'updatedAt',
    ])
      expect(wire, secret).not.toContain(secret)
  })

  it('hidden services and courses are not public, even when published', async () => {
    const s = service('Hidden service', { hidden: true })
    await make('services', s)
    expect(await pub.getPublished(t.payload, 'services', 'en', s.slug)).toBeNull()
  })

  it('a page linking to an unpublished service does not expose that service', async () => {
    const draft = (await t.payload.create({
      collection: 'services',
      data: { ...service('Secret draft service'), seo } as never,
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })) as unknown as { id: number }
    const slug = uniq()
    await make(
      'pages',
      pageData(slug, 'Links', {
        sections: [{ blockType: 'serviceList', mode: 'selected', services: [draft.id] }],
      }),
    )
    const wire = JSON.stringify(await pub.getPublished(t.payload, 'pages', 'en', slug))
    expect(wire).not.toContain('Secret draft service')
  })

  it('rejects slugs that are not single valid segments without querying', async () => {
    for (const s of ['', '../x', 'a/b', "x' OR 1=1"])
      expect(await pub.getPublished(t.payload, 'pages', 'en', s), s).toBeNull()
  })
})

describe('listPublished', () => {
  it('lists published, non-hidden items of the locale in editor order', async () => {
    const tag = uniq()
    await make('services', service(`${tag} B`, { order: 2 }))
    await make('services', service(`${tag} A`, { order: 1 }))
    await make('services', service(`${tag} hidden`, { order: 0, hidden: true }))
    await t.payload.create({
      collection: 'services',
      data: { ...service(`${tag} draft`, { order: 0 }), seo } as never,
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })
    const titles = (await pub.listPublished(t.payload, 'services', 'en'))
      .map((d) => d.title as string)
      .filter((x) => x.startsWith(tag))
    expect(titles).toEqual([`${tag} A`, `${tag} B`])
    const ar = (await pub.listPublished(t.payload, 'services', 'ar')).map((d) => String(d.title))
    expect(ar.some((x) => x.startsWith(tag))).toBe(false)
  })
})

describe('alternates (language switcher)', () => {
  it('gives the other locale slug only when that locale is published', async () => {
    const s = uniq()
    const both = await make('pages', pageData(s, 'Both'), ['en', 'ar'])
    expect(await pub.alternateSlugs(t.payload, 'pages', both)).toEqual({ en: s, ar: `ar-${s}` })
    const s2 = uniq()
    const one = await make('pages', pageData(s2, 'One'), ['en'])
    expect(await pub.alternateSlugs(t.payload, 'pages', one)).toEqual({ en: s2, ar: null })
  })
})

describe('public globals', () => {
  it('returns published global content only, without CMS-only fields', async () => {
    await t.payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      data: {
        email: 'info@example.org',
        enquiryRecipients: [{ email: 'inbox-secret@example.org' }],
        defaultSeo: { title: 'Site', description: 'Site description' },
        _status: 'published',
      } as never,
      overrideAccess: true,
    })
    const s = await pub.getPublicGlobal(t.payload, 'site-settings', 'en')
    expect(s?.email).toBe('info@example.org')
    expect(JSON.stringify(s)).not.toMatch(/inbox-secret|_status|analyticsEnabled|Evidence/)
    expect(await pub.getPublicGlobal(t.payload, 'banner', 'en')).toBeNull() // never published
  })
})
