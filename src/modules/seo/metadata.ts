// Page metadata (T116, FR-060, FR-061, D-16): title, description, self-canonical, reciprocal
// hreflang alternates for published locales plus `x-default` → `/` (the A-3 language redirect),
// Open Graph and Twitter cards, and indexing controls. Pure: callers pass resolved values.
import type { Metadata } from 'next'
import type { Locale } from '../i18n'

export type SeoInput = {
  siteUrl: string
  locale: Locale
  /** This document's path in this locale (already route-mapped). */
  path: string
  /** Same document in each locale, null where not published. */
  alternates: Partial<Record<Locale, string | null>>
  title?: string | null
  description?: string | null
  siteName?: string | null
  noindex?: boolean
  /** Internal path that should be treated as canonical instead of `path`. */
  canonicalOverride?: string | null
  image?: { url: string; width?: number; height?: number; alt?: string } | null
  /** Non-production environments are never indexed (FR-066). */
  indexable: boolean
}

const OG_LOCALE: Record<Locale, string> = { ar: 'ar_LY', en: 'en_GB' }
const INTERNAL = /^\/(?!\/)[^\s\\?#]*$/

export const absolute = (siteUrl: string, path: string) => new URL(path, siteUrl).toString()

export function buildMetadata(i: SeoInput): Metadata {
  const canonicalPath =
    i.canonicalOverride && INTERNAL.test(i.canonicalOverride) ? i.canonicalOverride : i.path
  const canonical = absolute(i.siteUrl, canonicalPath)
  const languages: Record<string, string> = {}
  for (const [l, p] of Object.entries(i.alternates)) if (p) languages[l] = absolute(i.siteUrl, p)
  if (Object.keys(languages).length) languages['x-default'] = absolute(i.siteUrl, '/')
  const others = Object.keys(i.alternates).filter(
    (l) => l !== i.locale && i.alternates[l as Locale],
  )
  const title = i.title?.trim() || undefined
  const description = i.description?.trim() || undefined
  const images = i.image
    ? [
        {
          url: i.image.url,
          width: i.image.width,
          height: i.image.height,
          alt: i.image.alt || undefined,
        },
      ]
    : undefined
  return {
    title,
    description,
    alternates: { canonical, languages: Object.keys(languages).length ? languages : undefined },
    robots: !i.indexable || i.noindex ? { index: false, follow: i.indexable } : undefined,
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: i.siteName?.trim() || undefined,
      locale: OG_LOCALE[i.locale],
      alternateLocale: others.map((l) => OG_LOCALE[l as Locale]),
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images?.map((x) => x.url),
    },
  }
}
