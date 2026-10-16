// Rate-limit port (D-14). Memory for unit tests; Postgres (Phase 2, T039); Upstash (proposed).
export type RateLimitOptions = { limit: number; windowMs: number }
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterMs: number }

export interface RateLimiter {
  hit(key: string, options: RateLimitOptions): Promise<RateLimitResult>
}

export function createMemoryRateLimiter(now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>()
  return {
    async hit(key, { limit, windowMs }) {
      const t = now()
      let w = windows.get(key)
      if (!w || t - w.start >= windowMs) {
        w = { start: t, count: 0 }
        windows.set(key, w)
      }
      w.count += 1
      const allowed = w.count <= limit
      return {
        allowed,
        remaining: Math.max(0, limit - w.count),
        retryAfterMs: allowed ? 0 : w.start + windowMs - t,
      }
    },
  }
}
