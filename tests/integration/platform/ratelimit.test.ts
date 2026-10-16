// T037 (FR-094, D-14): Postgres fixed-window limiter. Atomic under concurrency, hashed keys only,
// TTL cleanup, fail-closed on database errors, parity with the memory limiter.
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createMemoryRateLimiter,
  createPostgresRateLimiter,
  limitKey,
  purgeRateLimitBuckets,
  type RateLimiter,
} from '@/modules/platform'
import { createMigratedDatabase } from '../../support/payload'

const SECRET = 'rate-limit-hmac-test-secret-0123456789' // gitleaks:allow (synthetic test fixture)
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

let clock = Date.UTC(2026, 9, 16, 12, 0, 0)
const now = () => clock

const suites: [string, () => RateLimiter][] = [
  ['postgres', () => createPostgresRateLimiter({ pool, hashSecret: SECRET, now })],
  ['memory', () => createMemoryRateLimiter(now)],
]

for (const [name, make] of suites) {
  describe(`${name} limiter`, () => {
    it('allows up to the limit, then denies with Retry-After', async () => {
      const rl = make()
      const key = limitKey('contact:ip', `198.51.100.${name.length}`)
      const r = []
      for (let i = 0; i < 6; i++) r.push(await rl.hit(key, { limit: 5, windowMs: 600_000 }))
      expect(r.map((x) => x.allowed)).toEqual([true, true, true, true, true, false])
      expect(r[5]!.retryAfterMs).toBeGreaterThan(0)
      expect(r[5]!.retryAfterMs).toBeLessThanOrEqual(600_000)
      expect(r[4]!.remaining).toBe(0)
    })

    it('resets in the next window', async () => {
      const rl = make()
      const key = limitKey('login:account', `${name}-window@example.ly`)
      const opts = { limit: 1, windowMs: 60_000 }
      expect((await rl.hit(key, opts)).allowed).toBe(true)
      expect((await rl.hit(key, opts)).allowed).toBe(false)
      clock += 60_000
      expect((await rl.hit(key, opts)).allowed).toBe(true)
    })

    it('isolates identities and scopes', async () => {
      const rl = make()
      const opts = { limit: 1, windowMs: 60_000 }
      expect((await rl.hit(limitKey('login:account', `a-${name}@example.ly`), opts)).allowed).toBe(
        true,
      )
      expect((await rl.hit(limitKey('login:account', `b-${name}@example.ly`), opts)).allowed).toBe(
        true,
      )
      // same identity, different scope: separate budget
      expect((await rl.hit(limitKey('mfa:account', `a-${name}@example.ly`), opts)).allowed).toBe(
        true,
      )
    })

    it('normalises identity case and surrounding whitespace (no trivial evasion)', async () => {
      const rl = make()
      const opts = { limit: 1, windowMs: 60_000 }
      expect(
        (await rl.hit(limitKey('login:account', `Evade-${name}@Example.ly`), opts)).allowed,
      ).toBe(true)
      expect(
        (await rl.hit(limitKey('login:account', `  evade-${name}@example.ly `), opts)).allowed,
      ).toBe(false)
    })
  })
}

describe('postgres limiter specifics', () => {
  it('is atomic: 50 concurrent hits with limit 10 allow exactly 10', async () => {
    const rl = createPostgresRateLimiter({ pool, hashSecret: SECRET, now })
    const key = limitKey('contact:ip', '203.0.113.50')
    const results = await Promise.all(
      Array.from({ length: 50 }, () => rl.hit(key, { limit: 10, windowMs: 600_000 })),
    )
    expect(results.filter((r) => r.allowed)).toHaveLength(10)
  })

  it('stores only a keyed hash, never the identity', async () => {
    const rl = createPostgresRateLimiter({ pool, hashSecret: SECRET, now })
    await rl.hit(limitKey('login:account', 'privacy-check@example.ly'), {
      limit: 5,
      windowMs: 60_000,
    })
    const rows = await pool.query("select encode(key, 'escape') as k from rate_limit_buckets")
    for (const row of rows.rows) expect(String(row.k)).not.toContain('privacy-check')
    const cols = await pool.query(
      "select column_name from information_schema.columns where table_name = 'rate_limit_buckets'",
    )
    expect(cols.rows.map((r) => r.column_name).sort()).toEqual([
      'count',
      'expires_at',
      'key',
      'window_start',
    ])
  })

  it('different HMAC secrets produce different buckets', async () => {
    const a = createPostgresRateLimiter({ pool, hashSecret: SECRET, now })
    const b = createPostgresRateLimiter({ pool, hashSecret: `${SECRET}-other`, now })
    const key = limitKey('contact:ip', '203.0.113.99')
    expect((await a.hit(key, { limit: 1, windowMs: 60_000 })).allowed).toBe(true)
    expect((await b.hit(key, { limit: 1, windowMs: 60_000 })).allowed).toBe(true)
  })

  it('purges expired buckets only', async () => {
    const rl = createPostgresRateLimiter({ pool, hashSecret: SECRET, now })
    await rl.hit(limitKey('contact:ip', '203.0.113.200'), { limit: 5, windowMs: 1_000 })
    clock += 10_000
    const live = createPostgresRateLimiter({ pool, hashSecret: SECRET, now })
    await live.hit(limitKey('contact:ip', '203.0.113.201'), { limit: 5, windowMs: 600_000 })
    const purged = await purgeRateLimitBuckets(pool, new Date(clock))
    expect(purged).toBeGreaterThan(0)
    const left = await pool.query(
      'select count(*) from rate_limit_buckets where expires_at < to_timestamp($1 / 1000.0)',
      [clock],
    )
    expect(Number(left.rows[0].count)).toBe(0)
    expect(
      Number((await pool.query('select count(*) from rate_limit_buckets')).rows[0].count),
    ).toBeGreaterThan(0)
  })

  it('fails closed when the database is unavailable (no fail-open)', async () => {
    const broken = new pg.Pool({
      connectionString: 'postgres://nobody:x@127.0.0.1:1/none',
      connectionTimeoutMillis: 500,
    }) // gitleaks:allow (synthetic)
    const errors: string[] = []
    const rl = createPostgresRateLimiter({
      pool: broken,
      hashSecret: SECRET,
      now,
      onError: (e) => errors.push(e.name),
    })
    const r = await rl.hit(limitKey('login:account', 'x@example.ly'), {
      limit: 100,
      windowMs: 60_000,
    })
    expect(r).toMatchObject({ allowed: false, remaining: 0, failed: true })
    expect(r.retryAfterMs).toBeGreaterThan(0)
    expect(errors).toHaveLength(1)
    await broken.end()
  })

  it('rejects invalid options rather than silently allowing', async () => {
    const rl = createPostgresRateLimiter({ pool, hashSecret: SECRET, now })
    await expect(rl.hit('k', { limit: 0, windowMs: 1000 })).rejects.toThrow()
    await expect(rl.hit('k', { limit: 1, windowMs: 0 })).rejects.toThrow()
    await expect(rl.hit('', { limit: 1, windowMs: 1000 })).rejects.toThrow()
  })
})
