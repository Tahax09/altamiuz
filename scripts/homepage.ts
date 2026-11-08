// Loads the approved-structure homepage copy (content/homepage/copy.ts) and illustrations into the
// CMS as a DRAFT `home`-template page, in English and Arabic, through the Payload Local API, so
// every CMS rule applies (rich-text policy, media validation and variants, evidence gate,
// versions). It never publishes: publishing stays a Publisher's decision after copy approval
// (CD-11). Sections that need missing facts are created hidden, labelled with the dependency.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import type { Payload } from 'payload'
import { illustrations, page, sections as S, type Locale } from '../content/homepage/copy'

type Obj = Record<string, unknown>
type Lx = { en: string; ar: string }
const DIR = path.join(process.cwd(), 'content/homepage/illustrations')

export class HomepageSeedError extends Error {}

const paragraph = (text: string) => ({
  type: 'paragraph',
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  children: [{ type: 'text', version: 1, text, format: 0 }],
})
const richText = (paras: readonly string[]) => ({
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: paras.map(paragraph),
  },
})

/** One illustration: rendered from its SVG source to PNG, uploaded once, alt text in both locales. */
async function illustration(payload: Payload, key: keyof typeof illustrations): Promise<number> {
  const { file, alt } = illustrations[key]
  const found = await payload.find({
    collection: 'media',
    where: { alt: { equals: alt.en } },
    locale: 'en',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const id =
    (found.docs[0] as { id?: number } | undefined)?.id ??
    (
      (await payload.create({
        collection: 'media',
        locale: 'en',
        data: { alt: alt.en } as never,
        file: await (async () => {
          const data = await sharp(path.join(DIR, file), { density: 144 })
            .resize({ width: 2400 })
            .png({ compressionLevel: 9 })
            .toBuffer()
          return {
            data,
            mimetype: 'image/png',
            name: file.replace(/\.svg$/, '.png'),
            size: data.length,
          }
        })(),
        overrideAccess: true,
      })) as unknown as { id: number }
    ).id
  await payload.update({
    collection: 'media',
    id,
    locale: 'ar',
    data: { alt: alt.ar } as never,
    overrideAccess: true,
  })
  return id
}

/** Section data for one language. Ids (sections and rows) are carried over for the second one. */
function build(l: Locale, media: Record<keyof typeof illustrations, number>, contactId?: number) {
  const t = (v: Lx) => v[l]
  const contact = (label: Lx) =>
    contactId
      ? { linkType: 'internal', doc: { relationTo: 'pages', value: contactId }, label: t(label) }
      : undefined
  const pending = (reason: string) => ({ hidden: true, blockName: `Pending: ${reason}` })
  return [
    {
      blockType: 'hero',
      blockName: 'Hero',
      eyebrow: t(S.hero.eyebrow),
      heading: t(S.hero.heading),
      subheading: t(S.hero.subheading),
      media: media.hero,
      primaryCta: contact(S.hero.cta),
    },
    {
      blockType: 'textMedia',
      blockName: 'Company introduction',
      eyebrow: t(S.introduction.eyebrow),
      heading: t(S.introduction.heading),
      body: richText(S.introduction.body[l]),
      media: media.introduction,
      mediaPosition: 'end',
    },
    {
      blockType: 'serviceList',
      ...pending(S.services.pending),
      eyebrow: t(S.services.eyebrow),
      heading: t(S.services.heading),
      intro: t(S.services.intro),
      mode: 'all',
    },
    {
      blockType: 'featureGrid',
      blockName: 'Why Altamiuz',
      eyebrow: t(S.why.eyebrow),
      heading: t(S.why.heading),
      items: S.why.items.map((it) => ({ icon: it.icon, title: t(it.title), text: t(it.text) })),
    },
    {
      blockType: 'process',
      blockName: 'Methodology',
      anchorId: 'approach',
      eyebrow: t(S.methodology.eyebrow),
      heading: t(S.methodology.heading),
      intro: t(S.methodology.intro),
      media: media.methodology,
      steps: S.methodology.steps.map((s) => ({ title: t(s.title), text: t(s.text) })),
    },
    {
      blockType: 'standards',
      ...pending(S.standards.pending),
      eyebrow: t(S.standards.eyebrow),
      heading: t(S.standards.heading),
      intro: t(S.standards.intro),
      items: S.standards.items.map((it) => ({ name: t(it.name), text: t(it.text) })),
    },
    {
      blockType: 'textMedia',
      ...pending(S.expertise.pending),
      eyebrow: t(S.expertise.eyebrow),
      heading: t(S.expertise.heading),
    },
    {
      blockType: 'resourceList',
      ...pending(S.insights.pending),
      eyebrow: t(S.insights.eyebrow),
      heading: t(S.insights.heading),
      intro: t(S.insights.intro),
    },
    {
      blockType: 'cta',
      blockName: 'Contact',
      heading: t(S.contact.heading),
      text: t(S.contact.text),
      link: contact(S.contact.cta),
    },
  ]
}

/** Keeps the stored section and row ids, so the second language is a translation, not new rows. */
function withIds(stored: Obj[], next: Obj[]): Obj[] {
  return next.map((b, i) => {
    const s = stored[i] ?? {}
    const out: Obj = { ...b, id: s.id }
    for (const list of ['items', 'steps'] as const)
      if (Array.isArray(b[list]) && Array.isArray(s[list]))
        out[list] = (b[list] as Obj[]).map((row, j) => ({ ...row, id: (s[list] as Obj[])[j]?.id }))
    return out
  })
}

export type SeedResult = {
  id: number
  replaced: boolean
  contactLinked: boolean
  hidden: string[]
  media: Record<keyof typeof illustrations, number>
}

export async function seedHomepage(
  payload: Payload,
  opts: { replaceDraft?: boolean } = {},
): Promise<SeedResult> {
  const existing = await payload.find({
    collection: 'pages',
    where: { template: { equals: 'home' } },
    draft: true,
    locale: 'en',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const current = existing.docs[0] as { id: number } | undefined
  if (current && !opts.replaceDraft)
    throw new HomepageSeedError(
      `A home page already exists (id ${current.id}). Re-run with --replace-draft to replace its draft; the published version is not changed.`,
    )
  const contact = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    draft: true,
    locale: 'en',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const contactId = (contact.docs[0] as { id?: number } | undefined)?.id
  const media = {
    hero: await illustration(payload, 'hero'),
    introduction: await illustration(payload, 'introduction'),
    methodology: await illustration(payload, 'methodology'),
  }
  const base = (l: Locale) => ({
    title: page.title[l],
    slug: page.slug[l],
    template: 'home',
    seo: { title: page.seo.title[l], description: page.seo.description[l] },
  })
  const en = { ...base('en'), sections: build('en', media, contactId) }
  const id = current
    ? (
        (await payload.update({
          collection: 'pages',
          id: current.id,
          locale: 'en',
          draft: true,
          data: {
            ...en,
            sections: withIds(await sectionsOf(payload, current.id), en.sections),
          } as never,
          overrideAccess: true,
        })) as unknown as { id: number }
      ).id
    : (
        (await payload.create({
          collection: 'pages',
          locale: 'en',
          draft: true,
          data: en as never,
          overrideAccess: true,
        })) as unknown as { id: number }
      ).id
  await payload.update({
    collection: 'pages',
    id,
    locale: 'ar',
    draft: true,
    data: {
      ...base('ar'),
      sections: withIds(await sectionsOf(payload, id), build('ar', media, contactId)),
    } as never,
    overrideAccess: true,
  })
  return {
    id,
    replaced: !!current,
    contactLinked: !!contactId,
    hidden: build('en', media).flatMap((b) =>
      'hidden' in b && b.hidden ? [String(b.blockName)] : [],
    ),
    media,
  }
}

async function sectionsOf(payload: Payload, id: number): Promise<Obj[]> {
  const doc = (await payload.findByID({
    collection: 'pages',
    id,
    draft: true,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })) as unknown as { sections?: Obj[] }
  return doc.sections ?? []
}

/** The SVG sources, for checks that they stay text-free and gradient-free. */
export const illustrationSources = () =>
  Object.values(illustrations).map((i) => ({
    file: i.file,
    svg: fs.readFileSync(path.join(DIR, i.file), 'utf8'),
  }))
