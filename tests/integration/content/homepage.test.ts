// Homepage (Direction A): every section is a CMS block on a `home`-template page. Editors edit
// Arabic and English independently, reorder and hide sections; the publishing workflow and the
// evidence gate apply unchanged. Credentials/statistics headings are part of the verified claim.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPublished } from '@/modules/content'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { pageData, rt } from '../../support/content'

let t: TestPayload
const S = {} as Record<Role, Session>
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ['editor', 'publisher', 'administrator'] as Role[])
    S[r] = await verifiedSession(t.payload, r)
}, 240_000)
afterAll(async () => t?.close())

let n = 0
const slug = () => `home-${Date.now()}-${n++}`
type Block = Record<string, unknown> & { id?: string; blockType: string }

/** Fixture sections in the approved order (text is test data, not business content). */
const sections = (lang: string): Block[] => [
  { blockType: 'hero', eyebrow: `${lang} eyebrow`, heading: `${lang} hero` },
  {
    blockType: 'credentials',
    heading: `${lang} credentials`,
    items: [{ name: `${lang} certificate` }],
    evidence: { status: 'verified', reference: 'Fixture certificate file' },
  },
  { blockType: 'textMedia', heading: `${lang} introduction`, body: rt(`${lang} body`) },
  { blockType: 'serviceList', heading: `${lang} services`, mode: 'all' },
  { blockType: 'featureGrid', heading: `${lang} why`, items: [{ icon: 'risk', title: lang }] },
  {
    blockType: 'process',
    heading: `${lang} approach`,
    steps: ['1', '2', '3', '4'].map((s) => ({ title: `${lang} step ${s}` })),
  },
  { blockType: 'standards', heading: `${lang} standards`, items: [{ name: `${lang} framework` }] },
  { blockType: 'resourceList', heading: `${lang} insights`, items: [{ title: `${lang} note` }] },
  { blockType: 'cta', heading: `${lang} contact` },
]

/** Arabic text for the stored sections (same blocks and rows, so ids are kept). */
const inArabic = (stored: Block[]): Block[] => {
  const ar = sections('ar')
  return stored.map((b, i) => {
    const src = ar[i]!
    const out: Block = { ...b }
    for (const k of ['eyebrow', 'heading', 'body']) if (k in src) out[k] = src[k]
    for (const list of ['items', 'steps'])
      if (Array.isArray(b[list]))
        out[list] = (b[list] as Block[]).map((row, j) => ({
          ...row,
          ...((src[list] as Block[])[j] ?? {}),
          ...(row.icon ? { icon: row.icon } : {}),
        }))
    return out
  })
}

async function create() {
  const s = slug()
  const page = (await t.payload.create({
    collection: 'pages',
    draft: true,
    locale: 'en',
    data: pageData(s, 'Home', { template: 'home', sections: sections('en') }) as never,
    user: await u('administrator'),
    overrideAccess: false,
  })) as unknown as { id: number }
  return { id: page.id, slug: s }
}
const stored = async (id: number, locale: 'en' | 'ar' = 'en') =>
  (
    (await t.payload.findByID({
      collection: 'pages',
      id,
      draft: true,
      locale,
      depth: 0,
      overrideAccess: true,
    })) as unknown as { sections: Block[] }
  ).sections
const save = async (role: Role, id: number, locale: 'en' | 'ar', data: object, draft = true) =>
  t.payload.update({
    collection: 'pages',
    id,
    locale,
    draft,
    data: data as never,
    user: await u(role),
    overrideAccess: false,
  })
/** Publish one language (status is per language: an English publish leaves Arabic as it was). */
const publish = async (role: Role, id: number, locale: 'en' | 'ar' = 'en') =>
  t.payload.update({
    collection: 'pages',
    id,
    locale,
    data: { _status: 'published' } as never,
    ...(locale === 'ar' ? { publishSpecificLocale: 'ar' } : {}),
    user: await u(role),
    overrideAccess: false,
  })
const reverify = async (id: number) =>
  save('administrator', id, 'en', {
    sections: (await stored(id)).map((b) =>
      b.blockType === 'credentials'
        ? { ...b, evidence: { status: 'verified', reference: 'Fixture certificate file' } }
        : b,
    ),
  })
const live = async (locale: 'en' | 'ar', s: string) =>
  (await getPublished(t.payload, 'pages', locale, s)) as unknown as {
    sections: Block[]
  } | null

describe('homepage sections in the CMS', () => {
  it('editors build the full sequence; Arabic and English text are independent; publishing works', async () => {
    const { id, slug: s } = await create()
    await publish('publisher', id)
    expect(await live('ar', `ar-${s}`)).toBeNull()
    await save('editor', id, 'ar', {
      title: 'الرئيسية',
      slug: `ar-${s}`,
      seo: { title: 'الرئيسية', description: 'وصف الصفحة' },
      sections: inArabic(await stored(id)),
    })
    // The Arabic text is a claim change for the credentials block: it needs re-verification.
    await expect(publish('publisher', id, 'ar')).rejects.toMatchObject({ status: 400 })
    await reverify(id)
    await publish('publisher', id, 'ar')

    const en = await live('en', s)
    const ar = await live('ar', `ar-${s}`)
    expect(en!.sections.map((b) => b.blockType)).toEqual(sections('en').map((b) => b.blockType))
    expect(en!.sections.map((b) => b.heading)).toEqual(sections('en').map((b) => b.heading))
    expect(ar!.sections.map((b) => b.heading)).toEqual(sections('ar').map((b) => b.heading))
    const steps = (l: { sections: Block[] }) =>
      (l.sections.find((b) => b.blockType === 'process')!.steps as Block[]).map((x) => x.title)
    expect(steps(en!)).toEqual(['en step 1', 'en step 2', 'en step 3', 'en step 4'])
    expect(steps(ar!)).toEqual(['ar step 1', 'ar step 2', 'ar step 3', 'ar step 4'])
    // Evidence bookkeeping never reaches the public read.
    expect(JSON.stringify(en)).not.toContain('Fixture certificate file')
  })

  it('reordering and hiding sections take effect on publish; drafts never show', async () => {
    const { id, slug: s } = await create()
    await publish('publisher', id)
    const before = (await live('en', s))!.sections.map((b) => b.blockType)

    const reordered = [...(await stored(id))]
      .reverse()
      .map((b) =>
        b.blockType === 'process' || b.blockType === 'standards' ? { ...b, hidden: true } : b,
      )
    await save('editor', id, 'en', { sections: reordered })
    expect((await live('en', s))!.sections.map((b) => b.blockType)).toEqual(before)

    await publish('publisher', id)
    const after = (await live('en', s))!.sections.map((b) => b.blockType)
    expect(after).toEqual([...before].reverse().filter((b) => b !== 'process' && b !== 'standards'))
    // Hidden sections stay editable in the draft.
    expect((await stored(id)).filter((b) => b.hidden).map((b) => b.blockType)).toEqual([
      'standards',
      'process',
    ])
  })

  it('editors cannot publish; claim framing (heading, display) is part of the verified claim', async () => {
    const { id } = await create()
    await expect(publish('editor', id)).rejects.toBeTruthy()
    for (const change of [
      { heading: 'Our partners' },
      { intro: 'Accredited partner of every body' },
      { display: 'logos' },
    ]) {
      const s = await stored(id)
      if ((s[1]!.evidence as { status: string }).status !== 'verified')
        await save('administrator', id, 'en', {
          sections: s.map((b, i) =>
            i === 1 ? { ...b, evidence: { status: 'verified', reference: 'Again' } } : b,
          ),
        })
      const fresh = await stored(id)
      expect((fresh[1]!.evidence as { status: string }).status).toBe('verified')
      await save('editor', id, 'en', {
        sections: fresh.map((b, i) => (i === 1 ? { ...b, ...change } : b)),
      })
      expect((await stored(id))[1]!.evidence).toMatchObject({
        status: 'unverified',
        claimDigest: null,
      })
      await expect(publish('publisher', id)).rejects.toMatchObject({ status: 400 })
    }
    // A non-claim section edit keeps the verification.
    const s = await stored(id)
    await save('administrator', id, 'en', {
      sections: s.map((b, i) =>
        i === 1 ? { ...b, evidence: { status: 'verified', reference: 'Again' } } : b,
      ),
    })
    const v = await stored(id)
    await save('editor', id, 'en', {
      sections: v.map((b) => (b.blockType === 'hero' ? { ...b, heading: 'New hero' } : b)),
    })
    expect(((await stored(id))[1]!.evidence as { status: string }).status).toBe('verified')
    await publish('publisher', id)
  })
})
