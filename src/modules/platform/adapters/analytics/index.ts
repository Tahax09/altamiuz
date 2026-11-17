// Analytics port (FR-084–FR-087, ADR-007). Disabled by default (`ANALYTICS_DRIVER=none`).
// The only driver, `counter`, is first-party and aggregate-only: it adds 1 to a daily counter per
// language and event. It receives no request, visitor, path or form data, so it cannot store any.
import type pg from 'pg'

export const ANALYTICS_EVENTS = ['page_view', 'enquiry_conversion'] as const
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]
const LOCALES = ['ar', 'en'] as const

export interface Analytics {
  readonly enabled: boolean
  /** Never throws and never rejects: analytics must not affect the page or the enquiry. */
  track(event: AnalyticsEvent, props: { locale: 'ar' | 'en' }): Promise<void>
}

export const noAnalytics: Analytics = { enabled: false, track: async () => undefined }

const UPSERT = `
  insert into analytics_daily (day, locale, event, count)
  values ($1::date, $2, $3, 1)
  on conflict (day, locale, event) do update set count = analytics_daily.count + 1`

export type CounterAnalyticsOptions = {
  pool: pg.Pool
  now?: () => number
  onError?: (error: Error) => void
}

/** UTC calendar day of a timestamp, `YYYY-MM-DD`. */
export const utcDay = (t: number) => new Date(t).toISOString().slice(0, 10)

export function createCounterAnalytics(o: CounterAnalyticsOptions): Analytics {
  const now = o.now ?? Date.now
  return {
    enabled: true,
    async track(event, props) {
      // Only the closed vocabularies reach the database (the table also checks them).
      if (!ANALYTICS_EVENTS.includes(event) || !LOCALES.includes(props?.locale)) return
      try {
        await o.pool.query(UPSERT, [utcDay(now()), props.locale, event])
      } catch (error) {
        o.onError?.(error as Error)
      }
    },
  }
}

export type AnalyticsRow = {
  day: string
  locale: 'ar' | 'en'
  event: AnalyticsEvent
  count: number
}

/** Daily totals between two UTC days, inclusive (for reports; no per-visitor data exists). */
export async function readAnalytics(pool: pg.Pool, from: string, to: string) {
  const res = await pool.query<AnalyticsRow>(
    `select to_char(day, 'YYYY-MM-DD') as day, locale, event, count
       from analytics_daily where day between $1::date and $2::date
       order by day, locale, event`,
    [from, to],
  )
  return res.rows.map((r) => ({ ...r, count: Number(r.count) }))
}

/** Deletes daily totals older than the retention window (ADR-007: 25 months). */
export async function purgeAnalytics(pool: pg.Pool, before: string): Promise<number> {
  const res = await pool.query('delete from analytics_daily where day < $1::date', [before])
  return res.rowCount ?? 0
}
