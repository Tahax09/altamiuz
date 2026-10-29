// Server-side 404 decision for the proxy (FR-008, FR-082). Next 16.3.8 renders a page that
// throws notFound() as an empty client-recovery shell, and it resets the status of a proxy
// rewrite to 200, so the proxy answers missing public paths itself. It asks the same question as
// the page (resolvePublicPath in @/modules/content, published-only anonymous reads, stored
// redirects), uncached, so a write is visible to the next request without waiting for the data
// cache.
import config from '@payload-config'
import { getPayload } from 'payload'
import { alternateSlugs, decodeSegments, getPublished, resolvePublicPath } from '@/modules/content'
import { findRedirect } from '@/modules/seo'

export type RouteStatus =
  { kind: 'ok' } | { kind: 'redirect'; to: string; permanent: boolean } | { kind: 'notFound' }

/** `pathname` is the raw (percent-encoded) request path, as redirects store it. */
export async function publicRouteStatus(pathname: string): Promise<RouteStatus> {
  const segments = decodeSegments(pathname)
  if (!segments) return { kind: 'notFound' }
  const payload = await getPayload({ config })
  const found = await resolvePublicPath(
    {
      published: (collection, locale, slug) => getPublished(payload, collection, locale, slug),
      alternates: (collection, id) => alternateSlugs(payload, collection, id),
    },
    segments,
  )
  if (found) return { kind: 'ok' }
  const hit = await findRedirect(payload, pathname)
  return hit ? { kind: 'redirect', ...hit } : { kind: 'notFound' }
}
