// FR-025: publishing a new slug for a published document creates a redirect from the old path.
import type { PayloadRequest } from 'payload'
import { pathFor, type Locale, type RoutedCollection } from '../../i18n'
import { normaliseSitePath } from '../paths'

export async function createSlugChangeRedirect(
  req: PayloadRequest,
  collection: RoutedCollection,
  locale: Locale,
  oldSlug: string,
  newSlug: string,
) {
  if (!oldSlug || oldSlug === newSlug) return
  // Redirects store normalised paths (decoded, NFC; collection hook), while pathFor() percent-
  // encodes non-ASCII slugs. Compare in the stored form, or an Arabic path never matches.
  const encodedFrom = pathFor(collection, locale, oldSlug)
  const encodedTo = pathFor(collection, locale, newSlug)
  const from = normaliseSitePath(encodedFrom) ?? encodedFrom
  const to = normaliseSitePath(encodedTo) ?? encodedTo
  const existing = await req.payload.find({
    collection: 'redirects',
    where: { from: { equals: from } },
    limit: 1,
    overrideAccess: true,
    req,
  })
  // A redirect from the new path would now shadow the document.
  await req.payload.delete({
    collection: 'redirects',
    where: { from: { equals: to } },
    overrideAccess: true,
    req,
  })
  // Re-point redirects that targeted the old path so visitors never follow a chain.
  const chained = await req.payload.find({
    collection: 'redirects',
    where: { to: { equals: from } },
    limit: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  for (const r of chained.docs)
    await req.payload.update({
      collection: 'redirects',
      id: r.id,
      data: { to } as never,
      overrideAccess: true,
      req,
    })
  if (existing.totalDocs) {
    await req.payload.update({
      collection: 'redirects',
      id: existing.docs[0]!.id,
      data: { to } as never,
      overrideAccess: true,
      req,
    })
  } else {
    await req.payload.create({
      collection: 'redirects',
      data: { from, to, type: '301', source: 'slug-change', createdBy: req.user?.id } as never,
      overrideAccess: true,
      req,
    })
  }
}
