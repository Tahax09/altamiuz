// Runtime redirect lookup for public paths (FR-025, FR-065). Server-side only: exact `from` match
// on the normalised path; targets were validated as single-`/` site paths on save and are
// re-checked here, so a redirect can never send visitors off-site.
import type { Payload } from 'payload'
import { normaliseSitePath } from '../paths'

export type RedirectHit = { to: string; permanent: boolean }

const SITE_PATH = /^\/(?!\/)[^\s\\]*$/

export async function findRedirect(payload: Payload, raw: string): Promise<RedirectHit | null> {
  // Same normalisation as stored `from` values: trailing slash, percent-encoding, NFC (FR-065).
  const path = normaliseSitePath(raw)
  if (!path || !SITE_PATH.test(path)) return null
  const res = await payload.find({
    collection: 'redirects',
    where: { from: { equals: path } },
    limit: 1,
    depth: 0,
    overrideAccess: true, // server-side routing lookup; no user context, path equality only
  })
  const r = res.docs[0] as unknown as { to?: string; type?: string } | undefined
  if (!r?.to || !SITE_PATH.test(r.to) || r.to === path) return null
  return { to: r.to, permanent: r.type !== '302' }
}
