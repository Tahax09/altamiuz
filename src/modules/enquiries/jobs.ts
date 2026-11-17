// Job runner endpoint (contracts/http-surface.md: `/api/jobs/run`, D-14, ADR-009). Called by the
// host scheduler or a local runner; not by people. Authorised by the JOBS_SIGNING_SECRET bearer
// token, compared in constant time; without a configured secret every call is refused.
// Vercel Cron sends `GET` with `Authorization: Bearer $CRON_SECRET` (CRON_SECRET is set to the
// same value as JOBS_SIGNING_SECRET), so GET and POST behave the same; the bearer token, not a
// cookie, authorises the call, so a cross-site GET cannot trigger it.
// Runs due queue jobs (enquiry notifications with their retries) and, on `/api/jobs/retention`
// (or `?retention=1`), the retention purges: enquiries 12 months, audit log 24 months, ended
// rate-limit windows, analytics daily totals older than 25 months (ADR-007).
import { createHash, timingSafeEqual } from 'node:crypto'
import type { Endpoint, PayloadRequest } from 'payload'
import { purgeExpiredAuditEvents } from '../audit'
import { poolOf } from '../auth/db'
import { getConfig, purgeAnalytics, purgeRateLimitBuckets, utcDay } from '../platform'
import { purgeExpiredEnquiries } from './retention'

const digest = (s: string) => createHash('sha256').update(s).digest()

/** First UTC day kept by analytics retention: 25 months back (ADR-007). */
export function analyticsCutoff(now: number = Date.now()): string {
  const d = new Date(now)
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() - 25)
  return utcDay(d.getTime())
}

export function jobsAuthorised(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith('Bearer ')) return false
  return timingSafeEqual(digest(header.slice(7)), digest(secret))
}

export async function runJobs(req: PayloadRequest, retention: boolean) {
  const queue = await req.payload.jobs.run({ limit: 50, overrideAccess: true, silent: true })
  const out: Record<string, unknown> = {
    ran: true,
    jobs: Object.keys((queue as { jobStatus?: object } | undefined)?.jobStatus ?? {}).length,
  }
  if (retention) {
    out.enquiriesDeleted = await purgeExpiredEnquiries(req.payload)
    out.auditDeleted = await purgeExpiredAuditEvents(req.payload)
    out.rateLimitBucketsDeleted = await purgeRateLimitBuckets(poolOf(req.payload))
    out.analyticsDaysDeleted = await purgeAnalytics(poolOf(req.payload), analyticsCutoff())
  }
  return out
}

const noStore = { 'cache-control': 'no-store' }

const handler =
  (alwaysRetention: boolean): Endpoint['handler'] =>
  async (req) => {
    if (!jobsAuthorised(req.headers.get('authorization'), getConfig().secrets.jobsSigning))
      return Response.json({ error: 'unauthorized' }, { status: 401, headers: noStore })
    const retention =
      alwaysRetention || new URL(req.url ?? 'http://x/').searchParams.get('retention') === '1'
    return Response.json(await runJobs(req, retention), { headers: noStore })
  }

export const jobsRunEndpoints: Endpoint[] = [
  { path: '/jobs/run', method: 'post', handler: handler(false) },
  { path: '/jobs/run', method: 'get', handler: handler(false) },
  { path: '/jobs/retention', method: 'post', handler: handler(true) },
  { path: '/jobs/retention', method: 'get', handler: handler(true) },
]
