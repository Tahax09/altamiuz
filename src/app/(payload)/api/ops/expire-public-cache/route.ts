// L-3: expire every public data-cache entry of this server process at once. Writes made outside a
// Next request (SQL restore, scripts, imports) do not expire cache tags, so the public site could
// show the pre-write content for up to 60 s (`revalidate: 60`). After such a write an
// Administrator or Owner calls this (runbook: docs/runbooks/cache.md). Same-origin only, completed
// MFA, audited. Self-hosted this is per process; on Vercel the Data Cache is shared (ADR-009).
import config from '@payload-config'
import { getPayload } from 'payload'
import { can, isMfaVerified, roleOf } from '@/modules/access'
import { recordAudit } from '@/modules/audit'
import { sameOrigin } from '@/modules/auth'
import { siteGlobals } from '@/modules/content'
import { expireCacheTags } from '@/modules/platform'

export const dynamic = 'force-dynamic'
const noStore = { 'cache-control': 'no-store' }

/** Every tag the public read path caches under (src/app/(site)/data.ts). */
const PUBLIC_CACHE_TAGS = [
  'pages',
  'services',
  'courses',
  'redirects',
  ...siteGlobals.map((g) => `global:${g.slug}`),
]

export async function POST(request: Request): Promise<Response> {
  const forbidden = () =>
    Response.json(
      { errors: [{ message: 'You are not allowed to perform this action.' }] },
      { status: 403, headers: noStore },
    )
  if (!sameOrigin(request.headers)) return forbidden()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  const role = roleOf(user)
  // Administrators and Owners: the same people who publish site-wide settings.
  if (!user || !isMfaVerified(user) || !role || !can(role, 'site-settings', 'publish')) {
    if (user)
      await recordAudit(payload, {
        actor: `user:${user.id}`,
        action: 'access.denied',
        target: { type: 'cache', id: 'public' },
        outcome: 'denied',
        meta: { resource: 'cache', action: 'expire' },
      })
    return forbidden()
  }
  expireCacheTags(...PUBLIC_CACHE_TAGS)
  await recordAudit(payload, {
    actor: `user:${user.id}`,
    action: 'cache.expire',
    target: { type: 'cache', id: 'public' },
    outcome: 'success',
    meta: { scope: 'public' },
  })
  return Response.json({ expired: PUBLIC_CACHE_TAGS }, { headers: noStore })
}
