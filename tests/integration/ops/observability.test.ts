// T133 (FR-100, FR-101): abuse and failure events are emitted as structured, content-free signal
// lines; readiness reports database, storage, email and enquiry-delivery failures; the scheduler
// endpoints refuse bad signatures; a broken log sink never breaks the operation it observes.
import { Writable } from 'node:stream'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createTestCaptcha } from '../../../src/modules/platform/adapters/captcha'
import type { EmailAdapter } from '../../../src/modules/platform/adapters/email'
import { createUser, routeLogin } from '../../support/auth'
import { rest } from '../../support/content'
import { bootPayload, type TestPayload } from '../../support/payload'

type Line = Record<string, unknown>
let t: TestPayload
let lines: Line[] = []
let raw = ''
const PASS = '1x0000000000000000000000000000000AA'
const SITE = 'http://localhost:3000'
const READY_TOKEN = 'c8f1a3e9b7d2c4f6a0e5b1d9' // gitleaks:allow (synthetic test fixture)

type Platform = typeof import('../../../src/modules/platform')
type Enq = typeof import('../../../src/modules/enquiries')
let p: Platform
let e: Enq
let failing = false

const capture = new Writable({
  write(chunk, _enc, cb) {
    raw += String(chunk)
    for (const l of String(chunk).split('\n').filter(Boolean)) lines.push(JSON.parse(l) as Line)
    cb()
  },
})
const signals = (name: string) => lines.filter((l) => l.signal === name)

beforeAll(async () => {
  t = await bootPayload()
  p = await import('../../../src/modules/platform')
  e = await import('../../../src/modules/enquiries')
  p.setSignalDestinationForTests(capture)
  e.setCaptchaForTests(createTestCaptcha(PASS))
  const mailer: EmailAdapter = {
    async send() {
      if (failing) throw new Error('connect ECONNREFUSED smtp.provider (simulated outage)')
    },
  }
  e.setEnquiryMailerForTests(mailer)
  await t.payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      defaultSeo: { title: 'Site', description: 'Site description' },
      enquiryRecipients: [{ email: 'staff@example.org' }],
      enquiryTopics: [{ label: 'Training' }],
      _status: 'published',
    } as never,
    publishSpecificLocale: 'en',
    overrideAccess: true,
  })
}, 240_000)
afterAll(async () => {
  p?.setSignalDestinationForTests(undefined)
  e?.setEnquiryMailerForTests(undefined)
  e?.setCaptchaForTests(undefined)
  await t?.close()
})
afterEach(() => {
  lines = []
  raw = ''
  failing = false
})

let ipSeq = 20
const headersFor = () => new Headers({ 'x-forwarded-for': `198.51.100.${ipSeq++}`, origin: SITE })
const enquiry = (over: Record<string, unknown> = {}) => ({
  name: 'Sara Ali',
  email: 'sara.private@example.org',
  phone: '+218 91 000 1111',
  topic: 'Training',
  message: 'Confidential-marker-7731 please call back',
  consent: 'true',
  locale: 'en',
  turnstileToken: `tok-${Math.random()}`,
  ...over,
})

/** No submitted value, address, password or IP may appear anywhere in signal output. */
function expectContentFree(...secrets: string[]) {
  for (const s of secrets) expect(raw).not.toContain(s)
}

describe('abuse signals are structured log lines (FR-100)', () => {
  it('failed sign-in emits auth.login_failure without email, password or IP', async () => {
    const u = await createUser(t.payload, 'editor')
    const wrong = 'wrong-password-value-991!'
    const r = await routeLogin(u.email, wrong, { 'x-forwarded-for': '192.0.2.77' })
    expect(r.status).not.toBe(200)
    const [line] = signals('auth.login_failure')
    expect(line).toMatchObject({ level: 'warn', signal: 'auth.login_failure' })
    expect(typeof line!.time).toBe('string')
    expectContentFree(u.email, wrong, '192.0.2.77')
  })

  it('a rate-limit hit emits ratelimit.hit with the scope only', async () => {
    const h = () => new Headers({ 'x-forwarded-for': '192.0.2.99', origin: SITE })
    for (let i = 0; i < 6; i++) await e.submitEnquiry(t.payload, enquiry(), h())
    const hits = signals('ratelimit.hit')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]).toEqual(
      expect.objectContaining({ signal: 'ratelimit.hit', scope: expect.any(String) }),
    )
    expectContentFree('192.0.2.99', 'sara.private@example.org', 'Confidential-marker-7731')
  })

  it('a bot-check failure emits captcha.failure', async () => {
    const r = await e.submitEnquiry(
      t.payload,
      enquiry({ turnstileToken: 'test-fail-1' }),
      headersFor(),
    )
    expect(r.status).toBe(403)
    expect(signals('captcha.failure')).toEqual([
      expect.objectContaining({ signal: 'captcha.failure', scope: 'enquiry' }),
    ])
    expectContentFree('sara.private@example.org', 'Confidential-marker-7731')
  })

  it('an unavailable bot-check service emits captcha.unavailable', async () => {
    const r = await e.submitEnquiry(
      t.payload,
      enquiry({ turnstileToken: 'test-unavailable-1' }),
      headersFor(),
    )
    expect(r.status).toBe(503)
    expect(signals('captcha.unavailable')).toHaveLength(1)
  })

  it('a rejected upload emits upload.rejected with the reason', async () => {
    const { prepareImage } = await import('../../../src/modules/media')
    await expect(prepareImage(Buffer.from('<svg onload=alert(1)>'))).rejects.toThrow()
    expect(signals('upload.rejected')[0]).toMatchObject({ signal: 'upload.rejected' })
    expect(typeof signals('upload.rejected')[0]!.reason).toBe('string')
  })

  it('drops fields that are not allow-listed for the signal', () => {
    p.emitSignal('captcha.failure', {
      scope: 'enquiry',
      email: 'leak@example.org',
      password: 'pw-leak',
    } as never)
    expect(signals('captcha.failure')[0]).toEqual({
      level: 'warn',
      time: expect.any(String),
      signal: 'captcha.failure',
      scope: 'enquiry',
      msg: 'captcha.failure',
    })
    expectContentFree('leak@example.org', 'pw-leak')
  })

  it('a broken log sink does not break the request that raised the signal', async () => {
    p.setSignalDestinationForTests(
      new Writable({
        write() {
          throw new Error('log drain unavailable')
        },
      }),
    )
    try {
      const r = await e.submitEnquiry(
        t.payload,
        enquiry({ turnstileToken: 'test-fail-2' }),
        headersFor(),
      )
      expect(r.status).toBe(403)
    } finally {
      p.setSignalDestinationForTests(capture)
    }
  })
})

describe('enquiry delivery failure alert (FR-074, SC-010)', () => {
  it('raises an alert signal and a degraded readiness state that survives a lost log line', async () => {
    failing = true
    const r = await e.submitEnquiry(t.payload, enquiry(), headersFor())
    expect(r.status).toBe(200)
    const id = (r as { id: number }).id
    // Drive the attempts directly (the queue's backoff is wall-clock based).
    for (let i = 0; i < e.MAX_ATTEMPTS; i++) await e.deliverEnquiry(t.payload, id).catch(() => null)
    const row = (await t.sql.query('select delivery_status from enquiries where id = $1', [id]))
      .rows[0] as { delivery_status: string }
    expect(row.delivery_status).toBe('failed')
    const [alert] = signals('enquiry.delivery_failed')
    expect(alert).toMatchObject({ level: 'error', alert: true, enquiry: id, reason: 'transport' })
    expectContentFree('sara.private@example.org', 'Confidential-marker-7731', 'ECONNREFUSED')

    // Even if that alert line never reached anyone, readiness reports it from the database.
    const res = await ready()
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({
      status: 'degraded',
      checks: { database: 'ok', storage: 'ok', email: 'ok', enquiryDelivery: 'fail' },
    })
    await t.sql.query(`update enquiries set delivery_status = 'sent' where id = $1`, [id])
  })
})

const ready = async (over: { databaseUrl?: string; storage?: object; emailFails?: boolean } = {}) =>
  p.readinessResponse(
    new Request('http://localhost/api/health/ready', {
      headers: { authorization: `Bearer ${READY_TOKEN}` },
    }),
    {
      token: READY_TOKEN,
      databaseUrl: over.databaseUrl ?? t.databaseUrl,
      checks: {
        storage: p.storageCheck(
          (over.storage as { driver: string; dir?: string }) ?? {
            driver: 'local',
            dir: t.mediaDir,
          },
        ),
        email: p.emailAdapterCheck(() =>
          p.createEmailAdapter({
            driver: over.emailFails ? 'resend' : 'memory',
            from: 'no-reply@example.org',
          }),
        ),
        enquiryDelivery: e.enquiryDeliveryCheck,
      },
    },
  )

describe('readiness checks (FR-100)', () => {
  it('is ready when every check passes', async () => {
    const res = await ready()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      status: 'ready',
      checks: { database: 'ok', storage: 'ok', email: 'ok', enquiryDelivery: 'ok' },
    })
  })

  it('unavailable database: 503, every database-backed check fails, no connection details', async () => {
    const res = await ready({ databaseUrl: 'postgres://nobody:pw-7319@127.0.0.1:1/none' })
    expect(res.status).toBe(503)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({
      status: 'unavailable',
      checks: { database: 'fail', storage: 'fail', email: 'fail', enquiryDelivery: 'fail' },
    })
    expect(text).not.toContain('pw-7319')
    expect(text).not.toContain('127.0.0.1')
  })

  it('unavailable storage (missing directory) is critical', async () => {
    const res = await ready({ storage: { driver: 'local', dir: '/nonexistent/altamiuz-media' } })
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ status: 'unavailable', checks: { storage: 'fail' } })
  })

  it('the S3/R2 driver fails readiness until its adapter exists', async () => {
    const res = await ready({ storage: { driver: 's3' } })
    expect(await res.json()).toMatchObject({ status: 'unavailable', checks: { storage: 'fail' } })
  })

  it('an email driver that cannot be built (missing provider adapter) degrades readiness', async () => {
    const res = await ready({ emailFails: true })
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ status: 'degraded', checks: { email: 'fail' } })
  })

  it('a hanging check times out as a failure instead of hanging the probe', async () => {
    const started = Date.now()
    const res = await p.readinessResponse(
      new Request('http://x/', { headers: { authorization: `Bearer ${READY_TOKEN}` } }),
      {
        token: READY_TOKEN,
        databaseUrl: t.databaseUrl,
        checks: { slow: { critical: false, run: () => new Promise<boolean>(() => undefined) } },
      },
    )
    expect(await res.json()).toEqual({
      status: 'degraded',
      checks: { database: 'ok', slow: 'fail' },
    })
    expect(Date.now() - started).toBeLessThan(10_000)
  })
})

describe('scheduler endpoints (Vercel Cron GET and POST)', () => {
  const secret = () => {
    const s = p.getConfig().secrets.jobsSigning
    if (!s) throw new Error('JOBS_SIGNING_SECRET must be set for integration tests')
    return s
  }
  it.each([
    ['GET', '/api/jobs/run'],
    ['POST', '/api/jobs/run'],
    ['GET', '/api/jobs/retention'],
    ['POST', '/api/jobs/retention'],
  ] as const)('%s %s refuses missing, wrong and non-bearer signatures', async (method, path) => {
    for (const authorization of [
      undefined,
      'Bearer wrong-signature-value-000',
      `Basic ${secret()}`,
      `Bearer ${secret()}x`,
      `bearer ${secret()}`,
    ]) {
      const r = await rest(t.payload, method, path, {
        headers: authorization ? { authorization } : {},
      })
      expect(r.status, `${method} ${path} ${authorization}`).toBe(401)
      expect(r.body).toEqual({ error: 'unauthorized' })
    }
  })

  it('GET with the cron secret runs jobs; the retention path also purges', async () => {
    const auth = { authorization: `Bearer ${secret()}` }
    const run = await rest(t.payload, 'GET', '/api/jobs/run', { headers: auth })
    expect(run.status).toBe(200)
    expect(run.body).toMatchObject({ ran: true })
    expect(run.body).not.toHaveProperty('enquiriesDeleted')
    const ret = await rest(t.payload, 'GET', '/api/jobs/retention', { headers: auth })
    expect(ret.status).toBe(200)
    expect(ret.body).toMatchObject({
      ran: true,
      enquiriesDeleted: expect.any(Number),
      auditDeleted: expect.any(Number),
      rateLimitBucketsDeleted: expect.any(Number),
    })
  })
})
