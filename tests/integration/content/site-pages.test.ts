// W-1 site pages: the seed creates drafts only (both languages), keeps every missing fact in a
// hidden "Pending" section, never publishes or replaces menus/settings that already have content;
// `route` links validate and resolve; page summaries and listing introductions are per language;
// the terms of use cannot be published while sections are pending (CD-10).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { seedSitePages, SitePagesSeedError, pageSections } from '../../../scripts/site-pages'
import { seedContactAndPrivacy } from '../../../scripts/contact-privacy'
import { pages } from '../../../content/pages/copy'

let t: TestPayload
const S = {} as Record<Role, Session>
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never
type Block = Record<string, unknown> & { blockType: string; blockName?: string; hidden?: boolean }
let seeded: Awaited<ReturnType<typeof seedSitePages>>
let contactId: number

const SLUGS = ['about', 'standards-and-frameworks', 'expertise', 'insights', 'terms-of-use']

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ['editor', 'publisher', 'administrator'] as Role[])
    S[r] = await verifiedSession(t.payload, r)
  // This suite owns these slugs, the menus and the settings fields it fills.
  for (const slug of [...SLUGS, 'contact', 'privacy']) {
    const r = await t.payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      draft: true,
      locale: 'en',
      depth: 0,
      overrideAccess: true,
    })
    for (const d of r.docs)
      await t.payload.delete({
        collection: 'pages',
        id: (d as { id: number }).id,
        overrideAccess: true,
      })
  }
  for (const slug of ['header-nav', 'footer-nav'] as const)
    await t.payload.updateGlobal({
      slug,
      locale: 'en',
      draft: true,
      data: { items: [] } as never,
      overrideAccess: true,
    })
  await t.payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    draft: true,
    data: { contactPage: null, legalLinks: [], listings: { servicesIntro: null } } as never,
    overrideAccess: true,
  })
  contactId = (await seedContactAndPrivacy(t.payload, { replaceDraft: true })).contactId
  seeded = await seedSitePages(t.payload)
}, 240_000)
afterAll(async () => t?.close())

const draft = async (id: number, locale: 'en' | 'ar') =>
  (await t.payload.findByID({
    collection: 'pages',
    id,
    draft: true,
    locale,
    depth: 0,
    overrideAccess: true,
  })) as unknown as {
    _status: string
    template: string
    slug: string
    title: string
    summary?: string | null
    sections: Block[]
  }

const publish = async (id: number, role: Role, locale: 'en' | 'ar' = 'en') =>
  t.payload.update({
    collection: 'pages',
    id,
    locale,
    data: { _status: 'published' } as never,
    publishSpecificLocale: locale,
    user: await u(role),
    overrideAccess: false,
  })

describe('site pages seed (W-1)', () => {
  it('creates every page as a draft in both languages with its own slug and summary', async () => {
    for (const def of Object.values(pages)) {
      const id = seeded.pages[def.key]
      for (const l of ['en', 'ar'] as const) {
        const d = await draft(id, l)
        expect(d._status, `${def.key} ${l}`).toBe('draft')
        expect(d.slug).toBe(def.slug[l].normalize('NFC'))
        expect(d.title).toBe(def.title[l])
        expect(d.template).toBe(def.template)
        expect(d.summary ?? null).toBe(def.summary?.[l] ?? null)
      }
      const live = await t.payload.find({
        collection: 'pages',
        where: { id: { equals: id } },
        locale: 'en',
        draft: false,
        overrideAccess: false,
        context: { publicSite: true },
      })
      expect(live.totalDocs, `${def.key} is not public`).toBe(0)
    }
  })

  it('missing facts are hidden "Pending" sections; no claim block exists', async () => {
    for (const def of Object.values(pages)) {
      const d = await draft(seeded.pages[def.key], 'en')
      for (const b of d.sections) {
        if (b.blockName?.startsWith('Pending:'))
          expect(b.hidden, `${def.key} ${b.blockName}`).toBe(true)
        expect(['stats', 'credentials']).not.toContain(b.blockType)
      }
    }
    const terms = await draft(seeded.pages.terms, 'en')
    expect(terms.sections.length).toBeGreaterThan(0)
    expect(terms.sections.every((b) => b.hidden && b.blockName?.startsWith('Pending: CD-10'))).toBe(
      true,
    )
    // Arabic rows are the same sections (shared ids), so hiding applies in both languages.
    const ar = await draft(seeded.pages.about, 'ar')
    const en = await draft(seeded.pages.about, 'en')
    expect(ar.sections.map((s) => s.id)).toEqual(en.sections.map((s) => s.id))
    // Rows inside sections are translated, not replaced: English text survives the Arabic save.
    const rows = (d: typeof en, list: 'items' | 'steps') =>
      d.sections.flatMap((s) =>
        ((s[list] as { title?: string }[] | undefined) ?? []).map((r) => r.title),
      )
    expect(rows(en, 'items')).toEqual([
      'Evidence before opinion',
      'Priorities set by risk',
      'Standards applied in context',
      'Plans you can carry out',
    ])
    expect(rows(en, 'steps')).toEqual(['Understand', 'Assess', 'Plan', 'Support'])
    expect(rows(ar, 'steps')).toEqual(['الفهم', 'التقييم', 'التخطيط', 'الدعم'])
  })

  it('calls to action link to the contact page', () => {
    const cta = pageSections('about', 'en', { contact: contactId }).find(
      (b) => b.blockType === 'cta',
    )
    expect(cta?.link).toMatchObject({
      linkType: 'internal',
      doc: { relationTo: 'pages', value: contactId },
    })
    expect(pageSections('about', 'en', {}).find((b) => b.blockType === 'cta')?.link).toBeUndefined()
  })

  it('refuses to overwrite an existing page unless replace-draft is given', async () => {
    await expect(seedSitePages(t.payload)).rejects.toBeInstanceOf(SitePagesSeedError)
    const again = await seedSitePages(t.payload, { replaceDraft: true })
    expect(again.pages.about).toBe(seeded.pages.about)
  })

  it('fills empty menus and settings in drafts only, and never replaces existing ones', async () => {
    expect(seeded.menus).toEqual({ header: true, footer: true })
    expect(seeded.settings).toEqual({ contactPage: true, legalLinks: true, servicesIntro: true })
    const header = (await t.payload.findGlobal({
      slug: 'header-nav',
      draft: true,
      locale: 'ar',
      depth: 0,
      overrideAccess: true,
    })) as unknown as { items: { link: Record<string, unknown>; children?: unknown[] }[] }
    expect(header.items.length).toBe(4)
    expect(header.items[0]!.children).toHaveLength(2)
    expect(header.items[1]!.link).toMatchObject({
      linkType: 'route',
      route: 'services',
      label: 'الخدمات',
    })
    const settings = (await t.payload.findGlobal({
      slug: 'site-settings',
      draft: true,
      locale: 'ar',
      depth: 0,
      overrideAccess: true,
    })) as unknown as {
      contactPage: number
      listings: { servicesIntro: string }
      legalLinks: unknown[]
    }
    expect(settings.contactPage).toBe(contactId)
    expect(settings.legalLinks).toHaveLength(2)
    expect(settings.listings.servicesIntro).toMatch(/[؀-ۿ]/)
    // The second run (replace-draft above) left the filled menus and settings alone.
    const rerun = await seedSitePages(t.payload, { replaceDraft: true })
    expect(rerun.menus).toEqual({ header: false, footer: false })
    expect(rerun.settings).toEqual({ contactPage: false, legalLinks: false, servicesIntro: false })
  })

  it('an Editor cannot publish; a Publisher publishes only the visible sections', async () => {
    await expect(publish(seeded.pages.about, 'editor')).rejects.toBeTruthy()
    await publish(seeded.pages.about, 'publisher')
    const live = await t.payload.find({
      collection: 'pages',
      where: { slug: { equals: 'about' } },
      locale: 'en',
      draft: false,
      depth: 0,
      overrideAccess: false,
      context: { publicSite: true },
    })
    const sections = (live.docs[0] as unknown as { sections: Block[] }).sections
    const { toPublic } = await import('@/modules/content')
    const visible = toPublic(sections)
    expect(visible.map((s) => s.blockType)).toEqual(['textMedia', 'featureGrid', 'process', 'cta'])
    expect(JSON.stringify(visible)).not.toContain('Pending')
  })

  it('the terms of use cannot be published while sections are pending (CD-10)', async () => {
    for (const role of ['publisher', 'administrator'] as const)
      await expect(publish(seeded.pages.terms, role)).rejects.toMatchObject({ status: 400 })
  })
})

describe('route links (W-1)', () => {
  const save = (route: unknown) =>
    t.payload.updateGlobal({
      slug: 'header-nav',
      locale: 'en',
      draft: true,
      data: { items: [{ link: { linkType: 'route', route, label: 'X' } }] } as never,
      overrideAccess: true,
    })

  it('accepts the fixed routes and rejects anything else', async () => {
    for (const r of ['home', 'services', 'training']) await expect(save(r)).resolves.toBeTruthy()
    for (const r of ['admin', '../x', 'javascript:alert(1)', '/en/services'])
      await expect(save(r)).rejects.toBeTruthy()
  })
})
