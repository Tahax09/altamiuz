// Health endpoints (FR-100, contracts/http-surface.md). Liveness exposes nothing; readiness
// requires a bearer token and pings the database, returning no internal details.
import { timingSafeEqual, createHash } from 'node:crypto'
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

export async function readinessResponse(
  request: Request,
  { token, databaseUrl }: { token: string; databaseUrl: string },
): Promise<Response> {
  if (!tokenMatches(request.headers.get('authorization'), token)) {
    return json({ status: 'unauthorized' }, 401)
  }
  const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 3_000 })
  try {
    await client.connect()
    await client.query('select 1')
    return json({ status: 'ready' })
  } catch {
    return json({ status: 'unavailable' }, 503)
  } finally {
    await client.end().catch(() => undefined)
  }
}
