// Rate-limit port (D-14). Memory for unit tests; Postgres (T039); Upstash (proposed).
import { isIP } from 'node:net'
import { emitSignal } from '../../signals'

export type RateLimitOptions = { limit: number; windowMs: number }
export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterMs: number
  /** True when the backing store failed and the request was denied (fail closed). */
  failed?: boolean
}

export interface RateLimiter {
  hit(key: string, options: RateLimitOptions): Promise<RateLimitResult>
}

/**
 * FR-100: every denied hit is a `ratelimit.hit` signal carrying only the key's scope (never the
 * identity part, which may be an IP address or account id). Store failures are logged by the
 * limiter's own error handler instead.
 */
export function withRateLimitSignals(limiter: RateLimiter): RateLimiter {
  return {
    async hit(key, options) {
      const r = await limiter.hit(key, options)
      if (!r.allowed && !r.failed) emitSignal('ratelimit.hit', { scope: key.split('\u0000')[0]! })
      return r
    },
  }
}

export function createMemoryRateLimiter(now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>()
  return withRateLimitSignals({
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
  })
}

/** Builds a limiter key from a scope and an identity, normalising trivial evasions. */
export function limitKey(scope: string, identity: string): string {
  return `${scope}\u0000${identity.trim().toLowerCase()}`
}

export type ClientIpOptions = {
  /** Number of trusted reverse proxies that append to X-Forwarded-For (0 = trust none). */
  trustedProxyHops: number
  /** Optional single-value header set by the edge (e.g. cf-connecting-ip). */
  clientIpHeader?: string
}

/**
 * Client address for rate limiting. Forwarding headers are trusted only as configured; anything
 * unparseable maps to the shared "invalid" bucket so it can never mint per-request keys.
 */
export function resolveClientIp(headers: Headers, o: ClientIpOptions): string {
  if (o.clientIpHeader) {
    const v = headers.get(o.clientIpHeader)?.trim()
    if (v) return isIP(v) ? v : 'invalid'
  }
  if (o.trustedProxyHops <= 0) return 'unidentified'
  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const candidate = chain[chain.length - o.trustedProxyHops]
  return candidate && isIP(candidate) ? candidate : 'invalid'
}
