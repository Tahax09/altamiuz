// Typed route segments (D-5). Minimal US2 prerequisite for slug-collision checks (T080); href()
// and the full route map arrive with US1 (T098). Arabic segments stay placeholders until CD-13.
export const LOCALES = ['ar', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const STATIC_SEGMENTS: Record<Locale, { services: string; training: string }> = {
  en: { services: 'services', training: 'training' },
  ar: { services: 'TODO(AR_ROUTE_VOCAB)-services', training: 'TODO(AR_ROUTE_VOCAB)-training' },
}

/** First path segments that can never be content slugs. */
export const RESERVED_SEGMENTS = [
  'admin',
  'api',
  'preview',
  'account',
  '_next',
  'sitemap.xml',
  'robots.txt',
]

export type RoutedCollection = 'pages' | 'services' | 'courses'

export function pathFor(collection: RoutedCollection, locale: Locale, slug: string): string {
  if (collection === 'pages') return `/${locale}/${slug}`
  const seg = STATIC_SEGMENTS[locale][collection === 'services' ? 'services' : 'training']
  return `/${locale}/${seg}/${slug}`
}
