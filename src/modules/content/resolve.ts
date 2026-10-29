// Public path resolution (T103, FR-002, FR-004, FR-008): the one decision of what a public URL
// shows, shared by the catch-all page (cached reads) and the proxy's server-side 404 (direct reads,
// see src/app/(site)/route-status.ts) so the two can never disagree about which paths exist.
import { href, LOCALES, matchRoute, type Locale, type RoutedCollection } from '../i18n'
import type { PublicDoc } from './public'

export type PublicReaders = {
  published: (
    collection: RoutedCollection,
    locale: Locale,
    slug: string,
  ) => Promise<PublicDoc | null>
  alternates: (
    collection: RoutedCollection,
    id: number | string,
  ) => Promise<Partial<Record<Locale, string | null>>>
}

export type Resolution =
  | { kind: 'home'; locale: Locale }
  | { kind: 'listing'; locale: Locale; collection: 'services' | 'courses' }
  | { kind: 'doc'; locale: Locale; collection: RoutedCollection; doc: PublicDoc }
  | { kind: 'missing'; locale: Locale; other: Locale; otherPath: string }
  | null

/** Decoded path segments, or null when the percent-encoding is malformed. */
export function decodeSegments(pathname: string): string[] | null {
  try {
    return pathname.split('/').filter(Boolean).map(decodeURIComponent)
  } catch {
    return null
  }
}

export async function resolvePublicPath(
  readers: PublicReaders,
  segments: string[],
): Promise<Resolution> {
  const m = matchRoute(segments)
  if (m.key === 'notFound') return null
  if (m.key === 'home') return { kind: 'home', locale: m.locale }
  if (m.key === 'services' || m.key === 'training')
    return {
      kind: 'listing',
      locale: m.locale,
      collection: m.key === 'services' ? 'services' : 'courses',
    }
  if (!('slug' in m)) return null
  const collection = m.key === 'page' ? 'pages' : m.key === 'service' ? 'services' : 'courses'
  const doc = await readers.published(collection, m.locale, m.slug)
  if (doc) return { kind: 'doc', locale: m.locale, collection, doc }
  // FR-004: never fall back; if this slug is published in the other language, say so —
  // Only when the document truly has no version in this language; a cross-language slug of a
  // document that does exist here is simply not found.
  for (const other of LOCALES.filter((l) => l !== m.locale)) {
    const there = await readers.published(collection, other, m.slug)
    if (there && !(await readers.alternates(collection, there.id))[m.locale])
      return {
        kind: 'missing',
        locale: m.locale,
        other,
        otherPath: href(m.key, other, { slug: m.slug }),
      }
  }
  return null
}
