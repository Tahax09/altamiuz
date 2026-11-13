// Public read path (US1, D-3, FR-004, FR-018, FR-021). The public site reads content only through
// these functions: anonymous Local API, `context.publicSite` (published-only access, per locale),
// `draft: false`, `fallbackLocale: false`. Results are stripped of CMS-only fields and hidden
// items before they reach a renderer. Never pass a user here.
import type { Payload, Where } from 'payload'
import { LOCALES, type Locale, type RoutedCollection } from '../i18n'
import type { SiteGlobal } from './globals'

export type PublicDoc = Record<string, unknown> & {
  id: number | string
  title?: string
  slug?: string
}

const SLUG = /^[\p{L}\p{N}-]{1,120}$/u
const PUBLIC = {
  overrideAccess: false,
  draft: false,
  fallbackLocale: false,
  context: { publicSite: true },
} as const

/** Keys that are CMS bookkeeping, internal evidence or administrator data. */
const CMS_ONLY = new Set([
  '_status',
  'createdAt',
  'updatedAt',
  'evidence',
  'accreditationEvidence',
  'companyNameEvidence',
  'addressEvidence',
  'verifiedBy',
  'verifiedAt',
  'reference',
  'targetUnpublished',
  'enquiryRecipients',
  'analyticsEnabled',
  'blockName',
  'order',
  'hidden',
])

/** Removes CMS-only keys and hidden array items (sections, items) recursively. */
export function toPublic<T>(value: T, depth = 0): T {
  if (depth > 40 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value))
    return value
      .filter((v) => !(v && typeof v === 'object' && (v as { hidden?: unknown }).hidden === true))
      .map((v) => toPublic(v, depth + 1)) as T
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>))
    if (!CMS_ONLY.has(k)) out[k] = toPublic(v, depth + 1)
  return out as T
}

const notHidden = (collection: RoutedCollection): Where[] =>
  collection === 'pages' ? [] : [{ hidden: { not_equals: true } }]

export async function getPublished(
  payload: Payload,
  collection: RoutedCollection,
  locale: Locale,
  slug: string,
): Promise<PublicDoc | null> {
  const s = slug.normalize('NFC')
  if (!SLUG.test(s)) return null
  const res = await payload.find({
    collection,
    where: { and: [{ slug: { equals: s } }, ...notHidden(collection)] },
    locale,
    depth: 1,
    limit: 1,
    ...PUBLIC,
  })
  const doc = res.docs[0]
  return doc ? toPublic(doc as unknown as PublicDoc) : null
}

/** Home page: the published page with the `home` template in this locale. */
export async function getHome(payload: Payload, locale: Locale): Promise<PublicDoc | null> {
  const res = await payload.find({
    collection: 'pages',
    where: { template: { equals: 'home' } },
    locale,
    depth: 1,
    limit: 1,
    sort: 'createdAt',
    ...PUBLIC,
  })
  const doc = res.docs[0]
  return doc ? toPublic(doc as unknown as PublicDoc) : null
}

/** Automatic listings (FR-018): published, non-hidden, editor order then title. */
export async function listPublished(
  payload: Payload,
  collection: 'services' | 'courses',
  locale: Locale,
): Promise<PublicDoc[]> {
  const res = await payload.find({
    collection,
    where: { and: notHidden(collection) },
    locale,
    depth: 1, // card image (published listings make it public, FR-056)
    limit: 200,
    sort: ['order', 'title'],
    select: {
      title: true,
      slug: true,
      summary: true,
      order: true,
      hidden: true,
      image: true,
      icon: true,
    },
    ...PUBLIC,
  })
  return toPublic(res.docs as unknown as PublicDoc[])
}

/** Slug of the same document in each locale, or null where that locale is not published. */
export async function alternateSlugs(
  payload: Payload,
  collection: RoutedCollection,
  id: number | string,
): Promise<Record<Locale, string | null>> {
  const out = {} as Record<Locale, string | null>
  for (const locale of LOCALES) {
    const res = await payload.find({
      collection,
      where: { and: [{ id: { equals: id } }, ...notHidden(collection)] },
      locale,
      depth: 0,
      limit: 1,
      select: { slug: true },
      ...PUBLIC,
    })
    const slug = (res.docs[0] as { slug?: unknown } | undefined)?.slug
    out[locale] = typeof slug === 'string' && slug ? slug : null
  }
  return out
}

/** Published global content for the locale, or null if that locale was never published. */
export async function getPublicGlobal(
  payload: Payload,
  slug: SiteGlobal,
  locale: Locale,
): Promise<Record<string, unknown> | null> {
  const doc = (await payload
    .findGlobal({ slug, locale, depth: 1, ...PUBLIC })
    .catch(() => null)) as Record<string, unknown> | null
  if (!doc || doc._status !== 'published') return null
  return toPublic(doc)
}
