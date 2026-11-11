// Public-site SEO wiring (T116): metadata per route, verified organization facts and the JSON-LD
// data block. Route paths come from the typed route map; values from published content only.
import config from '@payload-config'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { href, LOCALES, pathFor, t, type Locale, type RoutedCollection } from '@/modules/i18n'
import { getConfig } from '@/modules/platform'
import {
  breadcrumbs,
  buildMetadata,
  faqPage,
  offering,
  organization,
  serialiseGraph,
  website,
  type VerifiedOrg,
} from '@/modules/seo'
import { cachedAlternates, cachedGlobal } from './data'

type Doc = Record<string, unknown> & { id: number | string; title?: unknown; slug?: unknown }
type Seo = {
  title?: string
  description?: string
  noindex?: boolean
  canonicalOverride?: string
  ogImage?: unknown
}

const indexable = () => getConfig().appEnv === 'production'
const siteUrl = () => getConfig().siteUrl

/** Organization name and address, only while their evidence is verified (FR-016, FR-063). */
export const verifiedOrg = (locale: Locale) =>
  unstable_cache(
    async (): Promise<VerifiedOrg> => {
      const s = (await (
        await getPayload({ config })
      ).findGlobal({
        slug: 'site-settings',
        locale,
        fallbackLocale: false as never,
        draft: false,
        depth: 0,
        overrideAccess: true, // evidence status is CMS-only; only verified values leave this function
      })) as unknown as Record<string, unknown>
      const ok = (k: string) => (s[k] as { status?: unknown } | undefined)?.status === 'verified'
      const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
      return {
        name: ok('companyNameEvidence') ? str(s.companyName) : undefined,
        address: ok('addressEvidence') ? str(s.address) : undefined,
      }
    },
    ['verified-org', locale],
    { tags: ['global:site-settings'], revalidate: 60 },
  )()

function ogImage(media: unknown, base: string) {
  if (!media || typeof media !== 'object') return null
  const m = media as {
    alt?: unknown
    sizes?: Record<
      string,
      { filename?: string | null; width?: number | null; height?: number | null }
    >
  }
  const s = m.sizes?.w1440_jpeg ?? m.sizes?.w1024_jpeg
  if (!s?.filename || !/^[0-9a-f]{32}(-\d+x\d+)?\.jpg$/.test(s.filename)) return null
  return {
    url: new URL(`/api/media/file/${s.filename}`, base).toString(),
    width: s.width ?? undefined,
    height: s.height ?? undefined,
    alt: typeof m.alt === 'string' ? m.alt : undefined,
  }
}

async function defaults(locale: Locale) {
  const settings = await cachedGlobal('site-settings', locale)
  const seo = (settings?.defaultSeo ?? {}) as Seo
  return { seo, siteName: (await verifiedOrg(locale)).name }
}

export async function docMetadata(
  locale: Locale,
  collection: RoutedCollection,
  doc: Doc,
): Promise<Metadata> {
  const { seo: fallback, siteName } = await defaults(locale)
  const seo = (doc.seo ?? {}) as Seo
  const slugs = await cachedAlternates(collection, doc.id)
  const alternates = Object.fromEntries(
    LOCALES.map((l) => [l, slugs[l] ? pathFor(collection, l, slugs[l]!) : null]),
  )
  const home = collection === 'pages' && doc.template === 'home'
  return buildMetadata({
    siteUrl: siteUrl(),
    locale,
    path: home ? href('home', locale) : pathFor(collection, locale, String(doc.slug)),
    alternates: home
      ? Object.fromEntries(LOCALES.map((l) => [l, slugs[l] ? href('home', l) : null]))
      : alternates,
    title: seo.title || (typeof doc.title === 'string' ? doc.title : null) || fallback.title,
    description: seo.description || fallback.description,
    siteName,
    noindex: seo.noindex === true,
    canonicalOverride: seo.canonicalOverride,
    image: ogImage(seo.ogImage, siteUrl()),
    indexable: indexable(),
  })
}

/** Shortens text to `max` characters at a word boundary. */
export function clip(text: string, max: number): string {
  const s = text.replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}

export async function staticMetadata(
  locale: Locale,
  key: 'home' | 'services' | 'training',
  title?: string,
  description?: string,
): Promise<Metadata> {
  const { seo, siteName } = await defaults(locale)
  return buildMetadata({
    siteUrl: siteUrl(),
    locale,
    path: href(key, locale),
    alternates: Object.fromEntries(LOCALES.map((l) => [l, href(key, l)])),
    title: title ?? seo.title,
    // A listing introduction (site settings) describes the listing better than the site default.
    description: description ? clip(description, 160) : seo.description,
    siteName,
    indexable: indexable(),
  })
}

/** JSON-LD for a page: WebSite (+ Organization when verified) everywhere, breadcrumbs, FAQ and
 * Service/Course where present. Rendered as a non-executable data block with the CSP nonce. */
export async function JsonLd({
  locale,
  collection,
  doc,
  listing,
}: {
  locale: Locale
  collection?: RoutedCollection
  doc?: Doc
  listing?: 'services' | 'training'
}) {
  const base = siteUrl()
  const org = await verifiedOrg(locale)
  const crumbs: { name: string; path: string }[] = [
    { name: t(locale, 'home'), path: href('home', locale) },
  ]
  if (listing) crumbs.push({ name: t(locale, listing), path: href(listing, locale) })
  const isHome = collection === 'pages' && doc?.template === 'home'
  if (doc && collection && !isHome) {
    if (collection !== 'pages')
      crumbs.push({
        name: t(locale, collection === 'services' ? 'services' : 'training'),
        path: href(collection === 'services' ? 'services' : 'training', locale),
      })
    crumbs.push({
      name: String(doc.title ?? ''),
      path: pathFor(collection, locale, String(doc.slug)),
    })
  }
  const path = doc && collection ? pathFor(collection, locale, String(doc.slug)) : ''
  const json = serialiseGraph([
    organization(base, org),
    website(base, locale, org.name),
    breadcrumbs(base, crumbs),
    doc ? faqPage(doc.sections) : null,
    doc && collection === 'services' ? offering('Service', base, doc, path, !!org.name) : null,
    doc && collection === 'courses' ? offering('Course', base, doc, path, !!org.name) : null,
  ])
  if (!json) return null
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: json }} />
  )
}
