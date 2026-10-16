// Postgres fixed-window rate limiter (T039, FR-094). One atomic upsert per hit; keys are stored
// only as HMAC-SHA256 digests. Database failures DENY the request (fail closed).
import { createHmac } from 'node:crypto'
import type pg from 'pg'
import type { RateLimiter, RateLimitOptions, RateLimitResult } from './index'

export type PostgresRateLimiterOptions = {
  pool: pg.Pool
  /** Key-hashing secret; derived from configuration, never stored. */
  hashSecret: string
  now?: () => number
  onError?: (error: Error) => void
}

const UPSERT = `
  insert into rate_limit_buckets (key, window_start, count, expires_at)
  values ($1, to_timestamp($2 / 1000.0), 1, to_timestamp($3 / 1000.0))
  on conflict (key, window_start) do update set count = rate_limit_buckets.count + 1
  returning count`

function assertOptions(key: string, { limit, windowMs }: RateLimitOptions) {
  if (!key) throw new Error('rate limit key is required')
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer')
  if (!Number.isInteger(windowMs) || windowMs < 1)
    throw new Error('windowMs must be a positive integer')
}

export function createPostgresRateLimiter(o: PostgresRateLimiterOptions): RateLimiter {
  const now = o.now ?? Date.now
  return {
    async hit(key, options): Promise<RateLimitResult> {
      assertOptions(key, options)
      const t = now()
      const windowStart = Math.floor(t / options.windowMs) * options.windowMs
      const windowEnd = windowStart + options.windowMs
      const digest = createHmac('sha256', o.hashSecret).update(key).digest()
      try {
        const res = await o.pool.query<{ count: number }>(UPSERT, [digest, windowStart, windowEnd])
        const count = Number(res.rows[0]?.count ?? Number.POSITIVE_INFINITY)
        const allowed = count <= options.limit
        return {
          allowed,
          remaining: Math.max(0, options.limit - count),
          retryAfterMs: allowed ? 0 : windowEnd - t,
        }
      } catch (error) {
        o.onError?.(error as Error)
        return { allowed: false, remaining: 0, retryAfterMs: options.windowMs, failed: true }
      }
    },
  }
}

/** Deletes buckets whose window has ended. Returns the number removed. */
export async function purgeRateLimitBuckets(pool: pg.Pool, at: Date = new Date()): Promise<number> {
  const res = await pool.query('delete from rate_limit_buckets where expires_at < $1', [at])
  return res.rowCount ?? 0
}
