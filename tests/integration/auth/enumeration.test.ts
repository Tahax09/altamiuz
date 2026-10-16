// T048 enumeration & lockout, T055 auth rate limits, fail-closed limiter. Real login route handler
// and real clock. Timing is MEASURED and recorded (test-results/auth-timing.json), not assumed.
import fs from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FAILURE_FLOOR_MS, getMailer, setLimiterForTests } from '@/modules/auth'
import { bootPayload, type TestPayload } from '../../support/payload'
import { callEndpoint, createUser, routeLogin, verifiedSession } from '../../support/auth'

let t: TestPayload
const timing: Record<string, unknown> = {}
beforeAll(async () => {
  t = await bootPayload()
}, 180_000)
afterAll(async () => {
  fs.mkdirSync('test-results', { recursive: true })
  fs.writeFileSync('test-results/auth-timing.json', JSON.stringify(timing, null, 2))
  await t?.close()
})

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!
async function timed(fn: () => Promise<{ status: number; body: unknown }>) {
  const s = performance.now()
  const r = await fn()
  return { ...r, ms: performance.now() - s }
}

describe('uniform failures (FR-034, ADR-005 gaps)', () => {
  it('unknown, wrong-password, locked and suspended accounts get the identical response, padded to the floor', async () => {
    const real = await createUser(t.payload, 'editor')
    const suspended = await createUser(t.payload, 'editor', { status: 'suspended' })
    const locked = await createUser(t.payload, 'editor')
    const ip = { 'x-forwarded-for': '192.0.2.10' }
    for (let i = 0; i < 6; i++)
      await routeLogin(locked.email, `wrong-${i}-xxxxxxxxxx`, {
        'x-forwarded-for': `192.0.2.${100 + i}`,
      })

    const cases = {
      unknownAccount: () =>
        routeLogin(`nobody-${Date.now()}@example.invalid`, 'some password value 1', ip),
      wrongPassword: () => routeLogin(real.email, 'some password value 1', ip),
      lockedAccountCorrectPassword: () => routeLogin(locked.email, locked.password, ip),
      suspendedAccountCorrectPassword: () => routeLogin(suspended.email, suspended.password, ip),
    }
    const samples: Record<string, number[]> = {}
    const bodies = new Set<string>()
    const statuses = new Set<number>()
    for (let round = 0; round < 5; round++) {
      for (const [name, fn] of Object.entries(cases)) {
        const r = await timed(fn)
        ;(samples[name] ??= []).push(r.ms)
        bodies.add(JSON.stringify(r.body))
        statuses.add(r.status)
      }
    }
    const medians = Object.fromEntries(
      Object.entries(samples).map(([k, v]) => [k, Math.round(median(v))]),
    )
    timing.loginFailureMedianMs = medians
    timing.floorMs = FAILURE_FLOOR_MS
    expect([...statuses]).toEqual([401])
    expect(bodies.size).toBe(1)
    const values = Object.values(medians)
    for (const v of values) expect(v).toBeGreaterThanOrEqual(FAILURE_FLOOR_MS - 5)
    const spread = Math.max(...values) - Math.min(...values)
    timing.loginFailureMedianSpreadMs = spread
    expect(spread).toBeLessThan(75)
  }, 120_000)

  it('recovery requests answer identically for existing and unknown e-mails', async () => {
    const real = await createUser(t.payload, 'editor')
    const a: number[] = []
    const b: number[] = []
    for (let i = 0; i < 3; i++) {
      const x = await timed(() =>
        callEndpoint(t.payload, 'users', '/recovery/request', 'post', {
          body: { email: real.email },
        }),
      )
      const y = await timed(() =>
        callEndpoint(t.payload, 'users', '/recovery/request', 'post', {
          body: { email: `ghost-${i}@example.invalid` },
        }),
      )
      expect([x.status, y.status]).toEqual([202, 202])
      expect(x.body).toEqual(y.body)
      a.push(x.ms)
      b.push(y.ms)
    }
    timing.recoveryRequestMedianMs = {
      existing: Math.round(median(a)),
      unknown: Math.round(median(b)),
    }
    expect(Math.abs(median(a) - median(b))).toBeLessThan(75)
  }, 60_000)
})

describe('lockout (A-8) and rate limits (FR-094)', () => {
  it('after 5 attempts the account is blocked even with the correct password; one notice, one audit event', async () => {
    const u = await createUser(t.payload, 'publisher')
    const before = (getMailer().outbox ?? []).length
    for (let i = 0; i < 5; i++)
      await routeLogin(u.email, `bad-attempt-${i}-xxxxxxxx`, {
        'x-forwarded-for': `203.0.113.${10 + i}`,
      })
    for (let i = 0; i < 3; i++)
      expect(
        (await routeLogin(u.email, u.password, { 'x-forwarded-for': `203.0.113.${40 + i}` }))
          .status,
      ).toBe(401)
    const notices = (getMailer().outbox ?? [])
      .slice(before)
      .filter((m) => m.to.includes(u.email) && /blocked/i.test(m.subject))
    expect(notices).toHaveLength(1)
    expect(
      (
        await t.sql.query(
          "select count(*) from audit_events where action = 'auth.lockout' and target_id = $1",
          [String(u.id)],
        )
      ).rows[0].count,
    ).toBe('1')
  }, 60_000)

  it('per-source limit: 30 attempts per 15 min from one client, regardless of target account', async () => {
    const ip = { 'x-forwarded-for': '198.18.0.77' }
    for (let i = 0; i < 30; i++)
      await routeLogin(`spray-${i}@example.invalid`, 'whatever value 123', ip)
    const victim = await createUser(t.payload, 'editor')
    expect((await routeLogin(victim.email, victim.password, ip)).status).toBe(401)
    expect(
      (await routeLogin(victim.email, victim.password, { 'x-forwarded-for': '198.18.0.78' }))
        .status,
    ).toBe(200)
  }, 120_000)

  it('rotating spoofed X-Forwarded-For entries does not escape the per-source limit (1 trusted hop)', async () => {
    for (let i = 0; i < 30; i++)
      await routeLogin(`rot-${i}@example.invalid`, 'whatever value 123', {
        'x-forwarded-for': `10.0.0.${i}, 198.18.1.1`,
      })
    const victim = await createUser(t.payload, 'editor')
    expect(
      (
        await routeLogin(victim.email, victim.password, {
          'x-forwarded-for': '6.6.6.6, 198.18.1.1',
        })
      ).status,
    ).toBe(401)
  }, 120_000)

  it('case and whitespace variants of the e-mail share one account budget', async () => {
    const u = await createUser(t.payload, 'editor')
    const variants = [
      u.email.toUpperCase(),
      ` ${u.email} `,
      u.email,
      u.email.toUpperCase(),
      u.email,
    ]
    for (const [i, e] of variants.entries())
      await routeLogin(e, `nope-${i}-xxxxxxxxxx`, { 'x-forwarded-for': `203.0.114.${i + 1}` })
    expect(
      (await routeLogin(u.email, u.password, { 'x-forwarded-for': '203.0.114.99' })).status,
    ).toBe(401)
  }, 60_000)
})

describe('fail closed when the rate limiter is unavailable', () => {
  const broken = {
    hit: async () => ({ allowed: false, remaining: 0, retryAfterMs: 60_000, failed: true }),
  }

  it('sign-in with the correct password is refused (no fail-open)', async () => {
    const u = await createUser(t.payload, 'owner')
    setLimiterForTests(broken)
    try {
      expect((await routeLogin(u.email, u.password)).status).toBe(401)
    } finally {
      setLimiterForTests(undefined)
    }
    expect(
      (
        await t.sql.query(
          "select meta from audit_events where action = 'auth.login.failure' and target_id = $1 order by at desc limit 1",
          [String(u.id)],
        )
      ).rows[0].meta,
    ).toEqual({ reason: 'limiter_unavailable' })
  })

  it('MFA verification is refused while the limiter is down', async () => {
    const s = await verifiedSession(t.payload, 'editor')
    const tk = (await routeLogin(s.email, s.password)).token
    setLimiterForTests(broken)
    try {
      expect(
        (
          await callEndpoint(t.payload, 'users', '/mfa/verify', 'post', {
            token: tk,
            body: { code: '123456' },
          })
        ).status,
      ).toBe(429)
    } finally {
      setLimiterForTests(undefined)
    }
  })
})
