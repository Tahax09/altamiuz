// Cached public reads (T103, SC-009). Every function goes through the approved public read path
// in @/modules/content (anonymous, published-only, per locale). Cache entries are tagged so a
// publish/unpublish/restore (auditAndRevalidate, auditGlobal) refreshes them; `revalidate: 60` is
// the safety net for SC-009 (published change visible within 60 s).
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import {
  alternateSlugs,
  getHome,
  getPublicGlobal,
  getPublished,
  listPublished,
  type SiteGlobal,
} from '@/modules/content'
import type { Locale, RoutedCollection } from '@/modules/i18n'
import { findRedirect } from '@/modules/seo'

const payload = () => getPayload({ config })
const CONTENT_TAGS = ['pages', 'services', 'courses']

export const cachedPublished = (collection: RoutedCollection, locale: Locale, slug: string) =>
  unstable_cache(
    async () => getPublished(await payload(), collection, locale, slug),
    ['published', collection, locale, slug],
    { tags: CONTENT_TAGS, revalidate: 60 },
  )()

export const cachedHome = (locale: Locale) =>
  unstable_cache(async () => getHome(await payload(), locale), ['home', locale], {
    tags: CONTENT_TAGS,
    revalidate: 60,
  })()

export const cachedListing = (collection: 'services' | 'courses', locale: Locale) =>
  unstable_cache(
    async () => listPublished(await payload(), collection, locale),
    ['listing', collection, locale],
    { tags: [collection], revalidate: 60 },
  )()

export const cachedAlternates = (collection: RoutedCollection, id: number | string) =>
  unstable_cache(
    async () => alternateSlugs(await payload(), collection, id),
    ['alternates', collection, String(id)],
    { tags: [collection], revalidate: 60 },
  )()

export const cachedGlobal = (slug: SiteGlobal, locale: Locale) =>
  unstable_cache(
    async () => getPublicGlobal(await payload(), slug, locale),
    ['global', slug, locale],
    {
      tags: [`global:${slug}`],
      revalidate: 60,
    },
  )()

/** Listings needed by `mode: all` blocks on a document. */
export async function listingsFor(doc: Record<string, unknown> | null, locale: Locale) {
  const blocks = Array.isArray(doc?.sections)
    ? (doc!.sections as { blockType?: string; mode?: string }[])
    : []
  const need = (t: string) => blocks.some((b) => b?.blockType === t && b.mode === 'all')
  return {
    services: need('serviceList') ? await cachedListing('services', locale) : undefined,
    courses: need('courseList') ? await cachedListing('courses', locale) : undefined,
  }
}

export const cachedRedirect = (path: string) =>
  unstable_cache(async () => findRedirect(await payload(), path), ['redirect', path], {
    tags: ['redirects'],
    revalidate: 60,
  })()
