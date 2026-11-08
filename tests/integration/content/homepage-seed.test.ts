// Homepage content stage: the seed loads the copy and illustrations through the CMS as a draft in
// both languages, never publishes, keeps fact-dependent sections hidden, carries bilingual alt
// text, and leaves publishing (and the evidence gate) to the normal workflow.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getHome, getPublished } from '@/modules/content'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { HomepageSeedError, illustrationSources, seedHomepage } from '../../../scripts/homepage'
import { illustrations, sections as copy } from '../../../content/homepage/copy'

let t: TestPayload
const S = {} as Record<Role, Session>
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never
type Block = Record<string, unknown> & { blockType: string; hidden?: boolean }

let seeded: Awaited<ReturnType<typeof seedHomepage>>
beforeAll(async () => {
  t = await bootPayload()
  for (const r of ['editor', 'publisher'] as Role[]) S[r] = await verifiedSession(t.payload, r)
  // Other suites may have created home pages in this database; this one owns its own.
  const homes = await t.payload.find({
    collection: 'pages',
    where: { template: { equals: 'home' } },
    draft: true,
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  for (const d of homes.docs)
    await t.payload.delete({
      collection: 'pages',
      id: (d as { id: number }).id,
      overrideAccess: true,
    })
  seeded = await seedHomepage(t.payload)
}, 240_000)
afterAll(async () => t?.close())

const draft = async (locale: 'en' | 'ar') =>
  (await t.payload.findByID({
    collection: 'pages',
    id: seeded.id,
    draft: true,
    locale,
    depth: 1,
    overrideAccess: true,
  })) as unknown as { _status: string; title: string; sections: Block[] }

describe('homepage content seed', () => {
  it('creates a draft in both languages and publishes nothing', async () => {
    for (const l of ['en', 'ar'] as const) {
      const d = await draft(l)
      expect(d.title).toBe(l === 'en' ? 'Home' : 'الرئيسية')
      expect(await getHome(t.payload, l)).toBeNull()
    }
    const en = await draft('en')
    const ar = await draft('ar')
    expect(en.sections.map((b) => b.blockType)).toEqual([
      'hero',
      'textMedia',
      'serviceList',
      'featureGrid',
      'process',
      'standards',
      'textMedia',
      'resourceList',
      'cta',
    ])
    expect(ar.sections.map((b) => b.id)).toEqual(en.sections.map((b) => b.id))
    expect(en.sections[0]!.heading).toBe(copy.hero.heading.en)
    expect(ar.sections[0]!.heading).toBe(copy.hero.heading.ar)
    const steps = (d: typeof en) =>
      (d.sections[4]!.steps as { title: string }[]).map((s) => s.title)
    expect(steps(en)).toEqual(['Understand', 'Assess', 'Plan', 'Support'])
    expect(steps(ar)).toEqual(['الفهم', 'التقييم', 'التخطيط', 'الدعم'])
  })

  it('keeps fact-dependent sections hidden and adds no claim blocks', async () => {
    const en = await draft('en')
    const hidden = en.sections.filter((b) => b.hidden)
    expect(hidden.map((b) => b.blockType)).toEqual([
      'serviceList',
      'standards',
      'textMedia',
      'resourceList',
    ])
    for (const b of hidden) expect(String(b.blockName)).toMatch(/^Pending: /)
    expect(en.sections.some((b) => b.blockType === 'stats' || b.blockType === 'credentials')).toBe(
      false,
    )
  })

  it('illustrations go through the media pipeline with alt text in both languages', async () => {
    for (const [key, id] of Object.entries(seeded.media)) {
      for (const l of ['en', 'ar'] as const) {
        const m = (await t.payload.findByID({
          collection: 'media',
          id,
          locale: l,
          depth: 0,
          overrideAccess: true,
        })) as unknown as {
          alt: string
          mimeType: string
          sizes: Record<string, { filename?: string | null }>
        }
        expect(m.alt).toBe(illustrations[key as keyof typeof illustrations].alt[l])
        expect(m.mimeType).toBe('image/png')
        expect(Object.values(m.sizes).filter((s) => s.filename).length).toBeGreaterThan(0)
      }
    }
    // Sources stay plain geometry: no text, gradients, filters, scripts or external references.
    for (const { file, svg } of illustrationSources())
      expect(svg, file).not.toMatch(/<text|Gradient|<filter|<script|<image|href=|url\(/)
  })

  it('a re-run never overwrites an existing home page without --replace-draft', async () => {
    await expect(seedHomepage(t.payload)).rejects.toBeInstanceOf(HomepageSeedError)
    const again = await seedHomepage(t.payload, { replaceDraft: true })
    expect(again.id).toBe(seeded.id)
    // Media are reused, not duplicated.
    expect(again.media).toEqual(seeded.media)
  })

  it('an Editor cannot publish it; a Publisher can, and only visible sections go public', async () => {
    // Publishing is per language: English, then Arabic.
    const publish = async (role: Role, locale: 'en' | 'ar') =>
      t.payload.update({
        collection: 'pages',
        id: seeded.id,
        locale,
        data: { _status: 'published' } as never,
        ...(locale === 'ar' ? { publishSpecificLocale: 'ar' } : {}),
        user: await u(role),
        overrideAccess: false,
      })
    await expect(publish('editor', 'en')).rejects.toBeTruthy()
    await publish('publisher', 'en')
    expect(await getHome(t.payload, 'ar')).toBeNull()
    await publish('publisher', 'ar')
    for (const l of ['en', 'ar'] as const) {
      const home = (await getHome(t.payload, l)) as unknown as { sections: Block[] } | null
      expect(home!.sections.map((b) => b.blockType)).toEqual([
        'hero',
        'textMedia',
        'featureGrid',
        'process',
        'cta',
      ])
    }
    expect(await getPublished(t.payload, 'pages', 'ar', 'الرئيسية')).not.toBeNull()
  })

  it('adding an unverified statistics block blocks publishing (evidence gate unchanged)', async () => {
    const en = await draft('en')
    await t.payload.update({
      collection: 'pages',
      id: seeded.id,
      locale: 'en',
      draft: true,
      data: {
        sections: [
          ...en.sections.map((b) => ({ ...b, media: (b.media as { id?: number })?.id ?? b.media })),
          { blockType: 'stats', items: [{ value: '10', label: 'Engagements' }] },
        ],
      } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    await expect(
      t.payload.update({
        collection: 'pages',
        id: seeded.id,
        locale: 'en',
        data: { _status: 'published' } as never,
        user: await u('publisher'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })
})
