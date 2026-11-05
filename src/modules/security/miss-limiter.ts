// L-4: per-client budget for public paths that do not exist. Each miss costs the proxy up to four
// published-content queries, a redirect lookup and a render of the styled 404, so a client probing
// random URLs is slowed down after `limit` misses per window (429, no database work).
// In memory and per server process: dependency-free and cheap, but each instance counts on its
// own; edge rate limiting is the hosting-level control (T132). Only resolved client addresses are
// counted: shared fallback keys (`unidentified`, `invalid`) are never blocked, so one client can
// never throttle everyone behind them.
export type MissLimiter = {
  /** Seconds until this client may look up missing paths again, or 0. */
  blockedFor(client: string): number
  recordMiss(client: string): void
}

const SHARED = new Set(['unidentified', 'invalid', ''])

export function createMissLimiter({
  limit = 60,
  windowMs = 60_000,
  maxClients = 10_000,
  now = () => Date.now(),
}: {
  limit?: number
  windowMs?: number
  maxClients?: number
  now?: () => number
} = {}): MissLimiter {
  const windows = new Map<string, { start: number; misses: number }>()
  const current = (client: string) => {
    const w = windows.get(client)
    if (!w || now() - w.start >= windowMs) return null
    return w
  }
  return {
    blockedFor(client) {
      if (SHARED.has(client)) return 0
      const w = current(client)
      return w && w.misses >= limit ? Math.ceil((w.start + windowMs - now()) / 1000) : 0
    },
    recordMiss(client) {
      if (SHARED.has(client)) return
      const w = current(client)
      if (w) {
        w.misses++
        return
      }
      windows.delete(client)
      windows.set(client, { start: now(), misses: 1 })
      // Bounded memory: drop the oldest clients first (Map keeps insertion order).
      while (windows.size > maxClients) windows.delete(windows.keys().next().value!)
    },
  }
}
