// Health endpoints (FR-100, contracts/http-surface.md, docs/runbooks/monitoring.md). Liveness
// exposes nothing; readiness requires a bearer token, pings the database and runs the operational
// checks, returning only check names with ok/fail (no hosts, errors or counts).
//   200 {status:'ready'}        every check ok
//   503 {status:'unavailable'}  database or another critical check failed (site cannot serve)
//   503 {status:'degraded'}     only non-critical checks failed (e.g. enquiry email backlog)
// The external monitor alerts on any non-200, so degraded states page a person even when the
// failing component is the email provider itself.
import { timingSafeEqual, createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'
import pg from 'pg'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export function livenessResponse(): Response {
  return json({ status: 'ok' })
}

function tokenMatches(header: string | null, token: string): boolean {
  if (!header?.startsWith('Bearer ')) return false
  // Hash both sides so the comparison is constant-time regardless of length.
  const a = createHash('sha256').update(header.slice(7)).digest()
  const b = createHash('sha256').update(token).digest()
  return timingSafeEqual(a, b)
}

export type ReadinessCheck = {
  /** Critical checks make the status `unavailable`; others make it `degraded`. */
  critical: boolean
  /** Resolves true when healthy. A throw, false or timeout counts as a failure. */
  run: (db: pg.ClientBase) => Promise<boolean>
}

const CHECK_TIMEOUT_MS = 3_000

async function within(p: Promise<boolean>): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), CHECK_TIMEOUT_MS)
  })
  try {
    return await Promise.race([p.catch(() => false), timeout])
  } finally {
    clearTimeout(timer)
  }
}

export async function readinessResponse(
  request: Request,
  {
    token,
    databaseUrl,
    checks = {},
  }: { token: string; databaseUrl: string; checks?: Record<string, ReadinessCheck> },
): Promise<Response> {
  if (!tokenMatches(request.headers.get('authorization'), token)) {
    return json({ status: 'unauthorized' }, 401)
  }
  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: CHECK_TIMEOUT_MS,
  })
  const results: Record<string, 'ok' | 'fail'> = {}
  try {
    const dbOk = await within(
      client
        .connect()
        .then(() => client.query('select 1'))
        .then(() => true),
    )
    results.database = dbOk ? 'ok' : 'fail'
    let critical = !dbOk
    let degraded = false
    for (const [name, check] of Object.entries(checks)) {
      // Database-backed checks cannot run without the database; they report fail, not ok.
      const ok = dbOk ? await within(check.run(client)) : false
      results[name] = ok ? 'ok' : 'fail'
      if (!ok && check.critical) critical = true
      else if (!ok) degraded = true
    }
    if (critical) return json({ status: 'unavailable', checks: results }, 503)
    if (degraded) return json({ status: 'degraded', checks: results }, 503)
    return json({ status: 'ready', checks: results })
  } finally {
    await client.end().catch(() => undefined)
  }
}

/** Media storage is reachable and writable. The S3/R2 driver fails until its adapter exists. */
export function storageCheck(storage: { driver: string; dir?: string }): ReadinessCheck {
  return {
    critical: true,
    run: async () => {
      if (storage.driver !== 'local' || !storage.dir) return false
      // Payload creates the directory on the first upload; a fresh install is not a failure.
      await mkdir(storage.dir, { recursive: true })
      await access(storage.dir, constants.R_OK | constants.W_OK)
      return true
    },
  }
}

/** The configured email driver can be built (never sends). Delivery itself is checked by the
 * enquiry backlog check, which is what reveals a provider outage. */
export function emailAdapterCheck(build: () => unknown): ReadinessCheck {
  return {
    critical: false,
    run: async () => {
      build()
      return true
    },
  }
}
