// Job runner endpoint (contracts/http-surface.md: `POST /api/jobs/run`, D-14). Called by the host
// scheduler (cron) or a local runner; not by people. Authorised by the JOBS_SIGNING_SECRET bearer
// token, compared in constant time; without a configured secret every call is refused.
// Runs due queue jobs (enquiry notifications with their retries) and, with `?retention=1`, the
// retention purges (enquiries 12 months, audit log 24 months).
import { createHash, timingSafeEqual } from 'node:crypto'
import type { Endpoint, PayloadRequest } from 'payload'
import { purgeExpiredAuditEvents } from '../audit'
import { getConfig } from '../platform'
import { purgeExpiredEnquiries } from './retention'

const digest = (s: string) => createHash('sha256').update(s).digest()

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
  }
  return out
}

export const jobsRunEndpoint: Endpoint = {
  path: '/jobs/run',
  method: 'post',
  handler: async (req) => {
    if (!jobsAuthorised(req.headers.get('authorization'), getConfig().secrets.jobsSigning))
      return Response.json(
        { error: 'unauthorized' },
        { status: 401, headers: { 'cache-control': 'no-store' } },
      )
    const retention = new URL(req.url ?? 'http://x/').searchParams.get('retention') === '1'
    return Response.json(await runJobs(req, retention), {
      headers: { 'cache-control': 'no-store' },
    })
  },
}
