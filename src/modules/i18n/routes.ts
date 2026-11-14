// Typed route map (T098, FR-002, D-5). Every public URL is built with href() and resolved with
// matchRoute(); nothing concatenates paths by hand. Arabic static segments are placeholders until
// the owner approves the vocabulary (CD-13): `pnpm check:route-vocab` and production startup fail
// while any placeholder remains. Do not invent final Arabic vocabulary here.
export const LOCALES = ['ar', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ar' // A-2

/** Marker for unapproved vocabulary; check:route-vocab searches for it. */
export const AR_VOCAB_MARKER = 'TODO(AR_ROUTE_VOCAB)'

export const STATIC_SEGMENTS: Record<Locale, { services: string; training: string }> = {
  en: { services: 'services', training: 'training' },
  // TODO(AR_ROUTE_VOCAB): URL-safe placeholders pending CD-13 approval.
  ar: { services: 'ar-vocab-pending-services', training: 'ar-vocab-pending-training' },
}
const PENDING_SEGMENTS = new Set(['ar-vocab-pending-services', 'ar-vocab-pending-training'])

type StaticSegments = Record<Locale, { services: string; training: string }>

/** True while any static segment is still a placeholder (CD-13 publication gate). */
export function routeVocabularyPending(segments: StaticSegments = STATIC_SEGMENTS): boolean {
  return Object.values(segments).some((segs) =>
    Object.values(segs).some((s) => PENDING_SEGMENTS.has(s)),
  )
}

/** The single CD-13 check, shared by the runtime config gate, `pnpm check:route-vocab` and the
 * production build (next.config.ts). */
export function assertRouteVocabularyApproved(segments: StaticSegments = STATIC_SEGMENTS): void {
  if (routeVocabularyPending(segments))
    throw new Error(
      'CD-13: the Arabic route vocabulary is not approved (placeholder segments remain in src/modules/i18n/routes.ts); production publication is blocked.',
    )
}

const NON_PRODUCTION_BUILDS = new Set(['development', 'test', 'preview'])

/** Production builds must fail until CD-13 is approved. Fails closed: only an explicit
 * non-production APP_ENV skips the gate, so a host that builds without APP_ENV (or misspells it)
 * cannot ship placeholder routes. */
export function productionBuildGate(
  appEnv: string | undefined,
  segments: StaticSegments = STATIC_SEGMENTS,
): void {
  if (!NON_PRODUCTION_BUILDS.has(appEnv ?? '')) assertRouteVocabularyApproved(segments)
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
  // App icons (src/app/favicon.ico, icon.svg, apple-icon.png; CD-09)
  'favicon.ico',
  'icon.svg',
  'apple-icon.png',
  ...LOCALES,
]

export type RoutedCollection = 'pages' | 'services' | 'courses'
export const ROUTE_KEYS = ['home', 'page', 'services', 'service', 'training', 'course'] as const
export type RouteKey = (typeof ROUTE_KEYS)[number]

const SLUG = /^[\p{L}\p{N}-]{1,120}$/u
const seg = (locale: Locale, key: 'services' | 'training') => STATIC_SEGMENTS[locale][key]

function slugPart(slug: string | undefined): string {
  if (!slug || !SLUG.test(slug.normalize('NFC'))) throw new Error('href(): invalid slug')
  return encodeURIComponent(slug.normalize('NFC'))
}

export function href(key: RouteKey, locale: Locale, params: { slug?: string } = {}): string {
  switch (key) {
    case 'home':
      return `/${locale}`
    case 'page':
      return `/${locale}/${slugPart(params.slug)}`
    case 'services':
      return `/${locale}/${seg(locale, 'services')}`
    case 'service':
      return `/${locale}/${seg(locale, 'services')}/${slugPart(params.slug)}`
    case 'training':
      return `/${locale}/${seg(locale, 'training')}`
    case 'course':
      return `/${locale}/${seg(locale, 'training')}/${slugPart(params.slug)}`
  }
}

export function pathFor(collection: RoutedCollection, locale: Locale, slug: string): string {
  return href(
    collection === 'pages' ? 'page' : collection === 'services' ? 'service' : 'course',
    locale,
    {
      slug,
    },
  )
}

export type RouteMatch =
  | { key: 'home' | 'services' | 'training'; locale: Locale }
  | { key: 'page' | 'service' | 'course'; locale: Locale; slug: string }
  | { key: 'notFound'; locale?: Locale }

const isLocale = (v: string | undefined): v is Locale =>
  (LOCALES as readonly string[]).includes(v ?? '')

/** Resolves decoded path segments. Other locales' static segments never resolve. */
export function matchRoute(segments: string[]): RouteMatch {
  const [l, a, b, ...rest] = segments
  if (!isLocale(l) || rest.length) return { key: 'notFound' }
  const locale = l
  const other = LOCALES.filter((x) => x !== locale).flatMap((x) =>
    Object.values(STATIC_SEGMENTS[x]),
  )
  if (a === undefined) return { key: 'home', locale }
  const valid = (s: string) => SLUG.test(s.normalize('NFC'))
  const kind =
    a === seg(locale, 'services') ? 'service' : a === seg(locale, 'training') ? 'course' : null
  if (kind) {
    if (b === undefined) return { key: kind === 'service' ? 'services' : 'training', locale }
    return valid(b) ? { key: kind, locale, slug: b.normalize('NFC') } : { key: 'notFound', locale }
  }
  if (b !== undefined || other.includes(a) || !valid(a)) return { key: 'notFound', locale }
  return { key: 'page', locale, slug: a.normalize('NFC') }
}

/** Every static segment of every locale (page slugs may not equal any of them). */
export const ALL_STATIC_SEGMENTS = LOCALES.flatMap((l) => Object.values(STATIC_SEGMENTS[l]))
