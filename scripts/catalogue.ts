// C-1: loads the service catalogue, the training programmes and the first insight article
// (content/catalogue/copy.ts) as DRAFTS in English and Arabic through the Payload Local API, and
// fills the contact e-mail and phone numbers into the site-settings draft where they are empty.
// It never publishes, never replaces a non-empty setting, and refuses to touch an existing item
// unless asked to replace its draft (the published version is never changed).
import type { Payload } from 'payload'
import { OWNER_ATTESTATION } from '../content/attestation'
import {
  article,
  contactDetails,
  courses,
  services,
  type CatalogueItem,
  type CourseItem,
  type Locale,
} from '../content/catalogue/copy'

type Obj = Record<string, unknown>
type Coll = 'services' | 'courses' | 'pages'

export class CatalogueSeedError extends Error {}

const el = (type: string, children: Obj[], extra: Obj = {}): Obj => ({
  type,
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  children,
  ...extra,
})
const txt = (text: string): Obj => ({ type: 'text', version: 1, text, format: 0 })
const richText = (blocks: readonly { h?: string; p: readonly string[] }[]) => ({
  root: el(
    'root',
    blocks.flatMap((b) => [
      ...(b.h ? [el('heading', [txt(b.h)], { tag: 'h2' })] : []),
      ...b.p.map((x) => el('paragraph', [txt(x)])),
    ]),
  ),
})

async function findBySlug(payload: Payload, collection: Coll, slug: string) {
  const r = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    draft: true,
    locale: 'en',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return r.docs[0] as { id: number; sections?: Obj[] } | undefined
}

/** Creates the English draft (or replaces it), then adds Arabic on the same section rows. */
async function upsert(
  payload: Payload,
  collection: Coll,
  slugEn: string,
  data: (l: Locale) => Obj,
  replaceDraft: boolean,
): Promise<number> {
  const existing = await findBySlug(payload, collection, slugEn)
  if (existing && !replaceDraft)
    throw new CatalogueSeedError(
      `${collection}: "${slugEn}" already exists (id ${existing.id}). Re-run as "pnpm seed:catalogue replace-draft" to replace its draft; the published version is not changed.`,
    )
  const en = data('en')
  const keepIds = (stored: Obj[] | undefined, next: Obj) => ({
    ...next,
    sections: ((next.sections as Obj[]) ?? []).map((b, i) => ({ ...b, id: stored?.[i]?.id })),
  })
  const id = existing
    ? ((
        await payload.update({
          collection,
          id: existing.id,
          locale: 'en',
          draft: true,
          data: keepIds(existing.sections, en) as never,
          overrideAccess: true,
        })
      ).id as number)
    : ((
        await payload.create({
          collection,
          locale: 'en',
          draft: true,
          data: en as never,
          overrideAccess: true,
        })
      ).id as number)
  const stored = (await payload.findByID({
    collection,
    id,
    draft: true,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })) as unknown as { sections?: Obj[] }
  await payload.update({
    collection,
    id,
    locale: 'ar',
    draft: true,
    data: keepIds(stored.sections, data('ar')) as never,
    overrideAccess: true,
  })
  return id
}

const body = (item: CatalogueItem, l: Locale) => [
  {
    blockType: 'richText',
    blockName: 'Description',
    content: richText([{ p: item.body[l] }]),
  },
]

/** Cuts at a word boundary so search titles and descriptions stay within their limits. */
const fit = (s: string, max: number) =>
  s.length <= max ? s : `${s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,:;(]+$/, '')}…`

const itemData = (item: CatalogueItem, order: number) => (l: Locale) => ({
  title: item.title[l],
  slug: item.slug[l],
  summary: item.summary[l],
  icon: item.icon,
  order,
  sections: body(item, l),
  seo: { title: fit(item.title[l], 60), description: fit(item.summary[l], 160) },
})

const courseData = (item: CourseItem, order: number) => (l: Locale) => {
  const base = itemData(item, order)(l)
  const f = item.facts
  return {
    ...base,
    ...(item.audience ? { audience: item.audience[l] } : {}),
    ...(f
      ? {
          duration: f.duration,
          deliveryFormat: f.format,
          provider: f.provider[l],
          ...(f.accreditation ? { accreditationStatement: f.accreditation[l] } : {}),
          sections: [
            ...base.sections,
            {
              blockType: 'richText',
              blockName: 'Course details',
              content: richText([
                { h: l === 'ar' ? 'تفاصيل الدورة' : 'Course details', p: f.details[l] },
              ]),
            },
          ],
        }
      : {}),
  }
}

/** Records the owner's attestation (content/attestation.ts) on a course's accreditation claim,
 *  after both languages are written (any later edit of the claim removes it again). */
async function attestAccreditation(payload: Payload, id: number) {
  await payload.update({
    collection: 'courses',
    id,
    locale: 'ar',
    draft: true,
    data: { accreditationEvidence: { status: 'verified', reference: OWNER_ATTESTATION } } as never,
    overrideAccess: true,
  })
}

const articleData = (l: Locale) => ({
  title: article.title[l],
  slug: article.slug[l],
  summary: article.summary[l],
  template: 'default',
  sections: [{ blockType: 'richText', blockName: 'Article', content: richText(article.body[l]) }],
  seo: { title: article.seo.title[l], description: article.seo.description[l] },
})

/** E-mail and phone numbers into the site-settings draft, each only where it is empty. */
async function fillContact(payload: Payload) {
  const s = (await payload.findGlobal({
    slug: 'site-settings',
    draft: true,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })) as unknown as Obj
  const data: Obj = {}
  const [main, ...more] = contactDetails.phones
  if (!s.email) data.email = contactDetails.email
  if (!s.phone) data.phone = main
  if (!(Array.isArray(s.additionalPhones) && s.additionalPhones.length))
    data.additionalPhones = more.map((number) => ({ number }))
  const named = !s.companyName
  const addressed = !s.address
  if (named) data.companyName = contactDetails.companyName.en
  if (addressed) data.address = contactDetails.address.en
  if (Object.keys(data).length)
    await payload.updateGlobal({
      slug: 'site-settings',
      draft: true,
      locale: 'en',
      data: data as never,
      overrideAccess: true,
    })
  if (named || addressed) {
    const ar: Obj = {}
    if (named) ar.companyName = contactDetails.companyName.ar
    if (addressed) ar.address = contactDetails.address.ar
    await payload.updateGlobal({
      slug: 'site-settings',
      draft: true,
      locale: 'ar',
      data: ar as never,
      overrideAccess: true,
    })
    // Both languages written: record the owner's attestation on the claims just filled.
    const attested = { status: 'verified', reference: OWNER_ATTESTATION }
    await payload.updateGlobal({
      slug: 'site-settings',
      draft: true,
      locale: 'ar',
      data: {
        ...(named ? { companyNameEvidence: attested } : {}),
        ...(addressed ? { addressEvidence: attested } : {}),
      } as never,
      overrideAccess: true,
    })
  }
  return {
    email: 'email' in data,
    phone: 'phone' in data,
    additionalPhones: 'additionalPhones' in data,
    companyName: named,
    address: addressed,
  }
}

export type CatalogueSeedResult = {
  services: number[]
  courses: number[]
  article: number
  contact: Awaited<ReturnType<typeof fillContact>>
}

export async function seedCatalogue(
  payload: Payload,
  opts: { replaceDraft?: boolean } = {},
): Promise<CatalogueSeedResult> {
  const replace = !!opts.replaceDraft
  // Refuse before writing anything, so a partial run never leaves half a catalogue.
  if (!replace)
    for (const [c, slug] of [
      ...services.map((s) => ['services', s.slug.en] as const),
      ...courses.map((s) => ['courses', s.slug.en] as const),
      ['pages', article.slug.en] as const,
    ])
      if (await findBySlug(payload, c, slug))
        throw new CatalogueSeedError(
          `${c}: "${slug}" already exists. Re-run as "pnpm seed:catalogue replace-draft" to replace the drafts; published versions are not changed.`,
        )
  const out: CatalogueSeedResult = { services: [], courses: [], article: 0, contact: {} as never }
  for (const [i, s] of services.entries())
    out.services.push(
      await upsert(payload, 'services', s.slug.en, itemData(s, (i + 1) * 10), replace),
    )
  for (const [i, c] of courses.entries()) {
    const id = await upsert(payload, 'courses', c.slug.en, courseData(c, (i + 1) * 10), replace)
    if (c.facts?.accreditation) await attestAccreditation(payload, id)
    out.courses.push(id)
  }
  out.article = await upsert(payload, 'pages', article.slug.en, articleData, replace)
  out.contact = await fillContact(payload)
  return out
}
