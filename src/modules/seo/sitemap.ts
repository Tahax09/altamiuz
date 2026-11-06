// Sitemap and robots (T117, FR-062, FR-066, D-16). The sitemap lists, per locale, the home page,
// the listings and every published, visible, indexable document whose canonical is itself, with
// reciprocal alternates. Robots excludes admin, API, preview and account paths in production and
// everything elsewhere. Reads go through the public Local API context (published only).
import type { MetadataRoute } from 'next'
import type { Payload } from 'payload'
import { href, LOCALES, pathFor, type Locale, type RoutedCollection } from '../i18n'
import { absolute } from './metadata'

const PUBLIC = {
  overrideAccess: false,
  draft: false,
  fallbackLocale: false,
  context: { publicSite: true },
} as const
type Row = {
  id: number
  slug?: unknown
  template?: unknown
  updatedAt?: unknown
  hidden?: unknown
  seo?: { noindex?: unknown; canonicalOverride?: unknown }
}

export const ROBOTS_DISALLOW = ['/admin', '/api', '/preview', '/account'] as const

export function robotsFor(siteUrl: string, production: boolean): MetadataRoute.Robots {
  if (!production) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: [...ROBOTS_DISALLOW] }],
    sitemap: absolute(siteUrl, '/sitemap.xml'),
  }
}

async function published(payload: Payload, collection: RoutedCollection, locale: Locale) {
  const res = await payload.find({
    collection,
    locale,
    depth: 0,
    limit: 5000,
    pagination: false,
    select: {
      slug: true,
      updatedAt: true,
      seo: true,
      ...(collection === 'pages' ? { template: true } : { hidden: true }),
    } as never,
    ...PUBLIC,
  })
  return res.docs as unknown as Row[]
}

export async function sitemapEntries(
  payload: Payload,
  siteUrl: string,
): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = []
  const both = (key: 'home' | 'services' | 'training') =>
    Object.fromEntries(LOCALES.map((l) => [l, absolute(siteUrl, href(key, l))]))
  for (const key of ['home', 'services', 'training'] as const)
    for (const l of LOCALES)
      out.push({ url: absolute(siteUrl, href(key, l)), alternates: { languages: both(key) } })
  for (const collection of ['pages', 'services', 'courses'] as const) {
    const byLocale = Object.fromEntries(
      await Promise.all(
        LOCALES.map(async (l) => [l, await published(payload, collection, l)] as const),
      ),
    ) as Record<Locale, Row[]>
    const indexable = (r: Row) =>
      typeof r.slug === 'string' &&
      r.slug &&
      r.hidden !== true &&
      r.seo?.noindex !== true &&
      !r.seo?.canonicalOverride
    for (const l of LOCALES)
      for (const r of byLocale[l].filter(indexable)) {
        // The home page (template `home`) is listed as `/{locale}` above, not under its slug.
        if (r.template === 'home') continue
        const languages: Record<string, string> = {}
        for (const other of LOCALES) {
          const twin = byLocale[other].find((x) => x.id === r.id)
          if (twin && indexable(twin))
            languages[other] = absolute(siteUrl, pathFor(collection, other, String(twin.slug)))
        }
        out.push({
          url: absolute(siteUrl, pathFor(collection, l, String(r.slug))),
          lastModified: typeof r.updatedAt === 'string' ? r.updatedAt : undefined,
          alternates: { languages },
        })
      }
  }
  return out
}
