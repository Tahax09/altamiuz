// Localized slugs (FR-002, D-5, T080): NFC, letters/digits/hyphens, unique per locale and
// collection, never a reserved or static route segment, never an active redirect source.
import type { TextField } from 'payload'
import {
  pathFor,
  RESERVED_SEGMENTS,
  ALL_STATIC_SEGMENTS,
  type Locale,
  type RoutedCollection,
} from '../i18n'

const SLUG = /^[\p{L}\p{N}-]{1,120}$/u

export function normaliseSlug(v: unknown): string {
  return typeof v === 'string' ? v.normalize('NFC').trim().toLowerCase() : ''
}

export function slugField(collection: RoutedCollection): TextField {
  return {
    name: 'slug',
    type: 'text',
    localized: true,
    required: true,
    index: true,
    maxLength: 120,
    hooks: {
      beforeValidate: [({ value }) => (value === undefined ? value : normaliseSlug(value))],
    },
    validate: async (
      value: unknown,
      { req, id }: { req: import('payload').PayloadRequest; id?: string | number },
    ) => {
      const slug = normaliseSlug(value)
      if (!SLUG.test(slug)) return 'Use letters, digits and hyphens only.'
      const locale = (req.locale ?? 'ar') as Locale
      // All locales' static segments: another locale's segment never resolves (matchRoute).
      const statics = [...RESERVED_SEGMENTS, ...ALL_STATIC_SEGMENTS]
      // A slug is one path segment, so a path-prefix collision with a static segment is equality.
      if (collection === 'pages' && statics.includes(slug))
        return 'This address is reserved by the site structure.'
      const dupe = await req.payload.find({
        collection,
        where: { and: [{ slug: { equals: slug } }, ...(id ? [{ id: { not_equals: id } }] : [])] },
        locale,
        draft: true,
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      })
      if (dupe.totalDocs > 0) return 'Another item already uses this address in this language.'
      const redirect = await req.payload.find({
        collection: 'redirects',
        where: { from: { equals: pathFor(collection, locale, slug) } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      })
      if (redirect.totalDocs > 0) return 'This address is an active redirect.'
      return true
    },
  }
}
