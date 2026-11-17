// Analytics runtime (ADR-007). One instance per server, on the Postgres pool Payload already
// manages. Disabled (`ANALYTICS_DRIVER=none`, the default) it is the no-op adapter and callers
// return before reading any request data. Nothing here runs in the browser.
import type pg from 'pg'
import type { Payload } from 'payload'
import { createAnalytics, type Analytics } from './adapters'
import { noAnalytics } from './adapters/analytics'
import { getConfig } from './config'

let instance: Analytics | undefined

export const analyticsEnabled = () => getConfig().analytics.driver !== 'none'

export function getAnalytics(payload: Payload): Analytics {
  if (!analyticsEnabled()) return noAnalytics
  if (!instance) {
    const pool = (payload.db as unknown as { pool?: pg.Pool }).pool
    instance = createAnalytics(getConfig().analytics, {
      pool,
      // Error class only: no query text, no values.
      onError: (e) => payload.logger.warn({ err: e.name }, 'analytics write failed (ignored)'),
    })
  }
  return instance
}

/** Test hook: replace the instance (e.g. to simulate a failing database). */
export function setAnalyticsForTests(a: Analytics | undefined) {
  instance = a
}

// Prefetches and speculative loads are not views; automated agents are not visitors. The
// User-Agent is only tested against this pattern and never stored or combined with anything.
const PREFETCH = ['next-router-prefetch', 'next-router-segment-prefetch']
const AUTOMATED = /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|monitor|preview|curl|wget/i

/** Whether a page request counts as a page view. Reads three headers; keeps none. */
export function countsAsPageView(h: Headers): boolean {
  if (PREFETCH.some((n) => h.has(n))) return false
  if (/prefetch|prerender/i.test(`${h.get('sec-purpose') ?? ''} ${h.get('purpose') ?? ''}`))
    return false
  return !AUTOMATED.test(h.get('user-agent') ?? '')
}
