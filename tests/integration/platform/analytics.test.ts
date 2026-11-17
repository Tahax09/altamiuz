// T127 (ADR-007, FR-084–FR-087): first-party aggregate analytics. Enabled, it keeps only daily
// totals per language and event, atomically; it never throws, even when the database fails;
// disabled, it writes nothing. Retention keeps 25 months.
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createAnalytics,
  purgeAnalytics,
  readAnalytics,
  type AnalyticsEvent,
} from '@/modules/platform'
import { analyticsCutoff } from '@/modules/enquiries'
import { createMigratedDatabase } from '../../support/payload'

let db: Awaited<ReturnType<typeof createMigratedDatabase>>
let pool: pg.Pool

beforeAll(async () => {
  db = await createMigratedDatabase()
  pool = new pg.Pool({ connectionString: db.url, max: 20 })
}, 180_000)
afterAll(async () => {
  await pool?.end()
  await db?.drop()
})

const day = (d: string) => () => Date.parse(`${d}T12:00:00Z`)
const rows = async () => (await pool.query('select * from analytics_daily')).rows

describe('counter analytics (enabled)', () => {
  it('stores only day, language, event and a total; concurrent hits are all counted', async () => {
    const a = createAnalytics({ driver: 'counter' }, { pool, now: day('2026-11-01') })
    expect(a.enabled).toBe(true)
    await Promise.all(Array.from({ length: 40 }, () => a.track('page_view', { locale: 'ar' })))
    await a.track('page_view', { locale: 'en' })
    await a.track('enquiry_conversion', { locale: 'en' })
    expect(await readAnalytics(pool, '2026-11-01', '2026-11-01')).toEqual([
      { day: '2026-11-01', locale: 'ar', event: 'page_view', count: 40 },
      { day: '2026-11-01', locale: 'en', event: 'enquiry_conversion', count: 1 },
      { day: '2026-11-01', locale: 'en', event: 'page_view', count: 1 },
    ])
    // Data minimisation: the table has no column that could hold a visitor, path or message.
    const cols = await pool.query(
      "select column_name from information_schema.columns where table_name = 'analytics_daily' order by column_name",
    )
    expect(cols.rows.map((r) => r.column_name)).toEqual(['count', 'day', 'event', 'locale'])
  })

  it('ignores anything outside the closed vocabularies', async () => {
    const a = createAnalytics({ driver: 'counter' }, { pool, now: day('2026-11-02') })
    await a.track('session_start' as AnalyticsEvent, { locale: 'en' })
    await a.track('page_view', { locale: 'fr' as 'en' })
    await a.track('page_view', undefined as never)
    expect(await readAnalytics(pool, '2026-11-02', '2026-11-02')).toEqual([])
  })

  it('a database failure is reported by error class only and never reaches the caller', async () => {
    const broken = new pg.Pool({ connectionString: db.url })
    await broken.end() // every query now fails
    const errors: Error[] = []
    const a = createAnalytics(
      { driver: 'counter' },
      { pool: broken, onError: (e) => errors.push(e) },
    )
    await expect(a.track('page_view', { locale: 'ar' })).resolves.toBeUndefined()
    expect(errors).toHaveLength(1)
  })

  it('needs a pool; an unknown driver is refused', () => {
    expect(() => createAnalytics({ driver: 'counter' })).toThrow(/pool/)
    expect(() => createAnalytics({ driver: 'umami' }, { pool })).toThrow()
  })
})

describe('analytics disabled', () => {
  it('writes nothing', async () => {
    const before = await rows()
    const a = createAnalytics({ driver: 'none' }, { pool })
    expect(a.enabled).toBe(false)
    await a.track('page_view', { locale: 'ar' })
    await a.track('enquiry_conversion', { locale: 'en' })
    expect(await rows()).toEqual(before)
  })
})

describe('retention (25 months)', () => {
  it('cut-off is the first of the month 25 months back, and purge removes only older days', async () => {
    expect(analyticsCutoff(Date.parse('2026-11-17T08:00:00Z'))).toBe('2024-10-01')
    const old = createAnalytics({ driver: 'counter' }, { pool, now: day('2024-09-30') })
    const kept = createAnalytics({ driver: 'counter' }, { pool, now: day('2024-10-01') })
    await old.track('page_view', { locale: 'ar' })
    await kept.track('page_view', { locale: 'ar' })
    expect(await purgeAnalytics(pool, '2024-10-01')).toBe(1)
    expect((await readAnalytics(pool, '2024-01-01', '2024-12-31')).map((r) => r.day)).toEqual([
      '2024-10-01',
    ])
  })
})
