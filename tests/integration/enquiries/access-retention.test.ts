// US5 server rules (T120–T126, FR-070–FR-078, contracts/http-surface.md "Contact submission"):
// check order, bot challenge (fail closed), per-source rate limit, schema, atomic persist + enqueue,
// plain-text notification with retries and a final operator alert, access and audit for view /
// export / delete (T122), retention with a content-free audit entry, and no enquiry content in
// logs or audit entries.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { reauth, userFor, verifiedSession, type Session } from '../../support/auth'
import { rest } from '../../support/content'
import { createTestCaptcha } from '../../../src/modules/platform/adapters/captcha'
import type { EmailAdapter, SentEmail } from '../../../src/modules/platform/adapters/email'

type Mod = typeof import('../../../src/modules/enquiries')
let t: TestPayload
let m: Mod
let owner: Session
let admin: Session
let editor: Session
let publisher: Session
let outbox: SentEmail[]
let failing = false
const SITE = 'http://localhost:3000'
const PASS = '1x0000000000000000000000000000000AA'

beforeAll(async () => {
  t = await bootPayload()
  m = await import('../../../src/modules/enquiries')
  owner = await verifiedSession(t.payload, 'owner')
  admin = await verifiedSession(t.payload, 'administrator')
  editor = await verifiedSession(t.payload, 'editor')
  publisher = await verifiedSession(t.payload, 'publisher')
  outbox = []
  const mailer: EmailAdapter = {
    async send(msg) {
      if (failing) throw new Error('smtp connection refused (simulated outage)')
      const { validateMessage } = await import('../../../src/modules/platform/adapters/email')
      validateMessage(msg)
      outbox.push({ ...msg, from: 'test@example.org' })
    },
  }
  m.setEnquiryMailerForTests(mailer)
  m.setCaptchaForTests(createTestCaptcha(PASS))
  const en = (await t.payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      defaultSeo: { title: 'Site', description: 'Site description' },
      enquiryRecipients: [{ email: 'staff@example.org' }],
      enquiryTopics: [{ label: 'Penetration testing' }, { label: 'Training' }],
      _status: 'published',
    } as never,
    publishSpecificLocale: 'en',
    overrideAccess: true,
  })) as unknown as { enquiryTopics: { id: string }[] }
  await t.payload.updateGlobal({
    slug: 'site-settings',
    locale: 'ar',
    data: {
      defaultSeo: { title: 'الموقع', description: 'وصف الموقع' },
      enquiryTopics: en.enquiryTopics.map((r, i) => ({
        id: r.id,
        label: ['اختبار الاختراق', 'التدريب'][i],
      })),
      _status: 'published',
    } as never,
    publishSpecificLocale: 'ar',
    overrideAccess: true,
  })
}, 240_000)
afterAll(async () => {
  m?.setEnquiryMailerForTests(undefined)
  m?.setCaptchaForTests(undefined)
  await t?.close()
})
afterEach(() => {
  failing = false
})

let ipSeq = 10
const freshIp = () => `203.0.113.${ipSeq++}`
let tok = 0
const headersFor = (ip = freshIp(), origin: string | null = SITE) => {
  const h = new Headers({ 'x-forwarded-for': ip })
  if (origin !== null) h.set('origin', origin)
  return h
}
const valid = (over: Record<string, unknown> = {}) => ({
  name: 'Layla Ahmed',
  email: 'Layla@Example.org',
  phone: '+218 91 234 5678',
  organization: 'Example Bank',
  topic: 'Penetration testing',
  message: 'We would like a test of our web portal.',
  consent: 'true',
  locale: 'en',
  turnstileToken: `tok-${tok++}`,
  ...over,
})
const count = async () =>
  Number((await t.sql.query('select count(*)::int n from enquiries')).rows[0].n)
const jobsFor = async (id: number) =>
  (
    await t.sql.query(
      `select id, completed_at, has_error, total_tried from payload_jobs where input->>'enquiryId' = $1`,
      [String(id)],
    )
  ).rows
const enquiry = async (id: number) =>
  (await t.sql.query('select * from enquiries where id = $1', [id])).rows[0] as
    Record<string, unknown> | undefined
/** Make every queued job due now (Payload's backoff sets wait_until in the future). */
const runDueNow = async () => {
  await t.sql.query(
    `update payload_jobs set wait_until = now() - interval '1 second' where completed_at is null`,
  )
  await t.payload.jobs.run({ overrideAccess: true, silent: true })
}

describe('submission (check order, contract responses)', () => {
  it('stores a valid enquiry with its 12-month deletion date and queues one notification', async () => {
    const before = Date.now()
    const r = await m.submitEnquiry(t.payload, valid(), headersFor())
    expect(r.status).toBe(200)
    const id = (r as { id: number }).id
    const row = (await enquiry(id))!
    expect(row.email).toBe('layla@example.org')
    expect(row.topic).toBe('Penetration testing')
    expect(row.delivery_status).toBe('pending')
    const del = new Date(row.delete_after as string).getTime()
    const expected = new Date(before)
    expected.setUTCMonth(expected.getUTCMonth() + 12)
    expect(Math.abs(del - expected.getTime())).toBeLessThan(60_000)
    expect(await jobsFor(id)).toHaveLength(1)
  })

  it('refuses a foreign or missing Origin before anything else (403, nothing stored)', async () => {
    const before = await count()
    for (const origin of ['https://evil.example', null]) {
      const r = await m.submitEnquiry(t.payload, valid(), headersFor(freshIp(), origin))
      expect(r).toEqual({ status: 403, reason: 'origin' })
    }
    expect(await count()).toBe(before)
  })

  it('bot challenge: missing, failed, expired and reused tokens → 403; service down → 503; nothing stored', async () => {
    const before = await count()
    const ok = valid()
    expect((await m.submitEnquiry(t.payload, ok, headersFor())).status).toBe(200)
    for (const turnstileToken of ['', 'test-fail-1', 'test-expired-1', ok.turnstileToken]) {
      const r = await m.submitEnquiry(t.payload, valid({ turnstileToken }), headersFor())
      expect(r, turnstileToken || '(missing)').toEqual({ status: 403, reason: 'captcha' })
    }
    expect(
      await m.submitEnquiry(
        t.payload,
        valid({ turnstileToken: 'test-unavailable-1' }),
        headersFor(),
      ),
    ).toEqual({
      status: 503,
    })
    // The always-fail and always-duplicate test secrets reject every token.
    for (const secret of [
      '2x0000000000000000000000000000000AA',
      '3x0000000000000000000000000000000AA',
    ]) {
      m.setCaptchaForTests(createTestCaptcha(secret))
      expect((await m.submitEnquiry(t.payload, valid(), headersFor())).status).toBe(403)
    }
    m.setCaptchaForTests(createTestCaptcha(PASS))
    expect(await count()).toBe(before + 1)
  })

  it('the 6th attempt from one source in 10 minutes is refused (429 with Retry-After), others are not', async () => {
    const ip = freshIp()
    const statuses: number[] = []
    // Every attempt counts, including invalid ones (rate limit runs before the other checks).
    for (let i = 0; i < 6; i++)
      statuses.push(
        (await m.submitEnquiry(t.payload, valid(i % 2 ? { name: '' } : {}), headersFor(ip))).status,
      )
    expect(statuses).toEqual([200, 400, 200, 400, 200, 429])
    const r = await m.submitEnquiry(t.payload, valid(), headersFor(ip))
    expect(r.status).toBe(429)
    // Fixed windows: Retry-After is the time left in the current 10-minute window.
    const retry = (r as { retryAfterSeconds: number }).retryAfterSeconds
    expect(retry).toBeGreaterThan(0)
    expect(retry).toBeLessThanOrEqual(600)
    expect((await m.submitEnquiry(t.payload, valid(), headersFor())).status).toBe(200)
  })

  it('validates every field on the server and stores nothing on error', async () => {
    const before = await count()
    const cases: [Record<string, unknown>, Record<string, string>][] = [
      [
        { name: '', email: '', topic: '', message: '', consent: '' },
        {
          name: 'required',
          email: 'required',
          topic: 'required',
          message: 'required',
          consent: 'consent',
        },
      ],
      [{ name: 'x'.repeat(101) }, { name: 'tooLong' }],
      [{ email: 'not-an-email' }, { email: 'invalid' }],
      [{ email: 'a@example.org\r\nBcc: victim@example.org' }, { email: 'invalid' }],
      [{ name: 'Eve\r\nBcc: victim@example.org' }, { name: 'invalid' }],
      [{ name: 'Mallory‮gnp.exe' }, { name: 'invalid' }],
      [{ phone: 'call me' }, { phone: 'invalid' }],
      [{ organization: 'o'.repeat(151) }, { organization: 'tooLong' }],
      [{ topic: 'Something else' }, { topic: 'invalid' }],
      [{ topic: 'اختبار الاختراق' }, { topic: 'invalid' }], // an Arabic label is not valid in English
      [{ message: 'm'.repeat(5001) }, { message: 'tooLong' }],
      [{ message: 'bell\u0007' }, { message: 'invalid' }],
      [{ consent: 'false' }, { consent: 'consent' }],
    ]
    for (const [over, errors] of cases) {
      const r = await m.submitEnquiry(t.payload, valid(over), headersFor())
      expect(r, JSON.stringify(over).slice(0, 80)).toEqual({ status: 400, errors })
    }
    expect(await count()).toBe(before)
  })

  it('accepts Arabic input with Arabic topics; extra fields are ignored, markup is stored as text', async () => {
    const marker = `<img src=x onerror=alert(1)><script>alert(2)</script>`
    const r = await m.submitEnquiry(
      t.payload,
      valid({
        locale: 'ar',
        topic: 'التدريب',
        name: 'ليلى أحمد',
        message: `مرحبا ${marker}\nسطر ثانٍ`,
        role: 'owner',
        delivery: { status: 'sent' },
        deleteAfter: '2999-01-01',
        id: 1,
      }),
      headersFor(),
    )
    expect(r.status).toBe(200)
    const row = (await enquiry((r as { id: number }).id))!
    expect(row.message).toBe(`مرحبا ${marker}\nسطر ثانٍ`)
    expect(row.locale).toBe('ar')
    expect(row.delivery_status).toBe('pending')
    expect(new Date(row.delete_after as string).getUTCFullYear()).toBeLessThan(2100)
  })

  it('persist and enqueue are atomic: if queuing fails, no enquiry is stored', async () => {
    const before = await count()
    const original = t.payload.jobs.queue
    t.payload.jobs.queue = (async () => {
      throw new Error('queue down')
    }) as never
    try {
      await expect(m.submitEnquiry(t.payload, valid(), headersFor())).rejects.toThrow('queue down')
    } finally {
      t.payload.jobs.queue = original
    }
    expect(await count()).toBe(before)
  })
})

describe('notification (FR-073, FR-074)', () => {
  it('sends one plain-text email with a fixed subject and the visitor as escaped reply-to', async () => {
    outbox.length = 0
    const marker = 'Body <b>bold</b>\r\nX-Injected: yes'
    const r = await m.submitEnquiry(t.payload, valid({ message: marker }), headersFor())
    const id = (r as { id: number }).id
    await runDueNow() // earlier tests' jobs may run too; only this enquiry's email is checked
    const mine = outbox.filter((x) => x.text.includes(`/admin/collections/enquiries/${id}\n`))
    expect(mine).toHaveLength(1)
    const mail = mine[0]!
    expect(mail.to).toEqual(['staff@example.org'])
    expect(mail.subject).toBe(m.SUBJECT)
    expect(mail.replyTo).toBe('layla@example.org')
    expect(mail.html).toBeUndefined()
    expect(mail.text).toContain('Body <b>bold</b>\nX-Injected: yes') // CRLF normalised, body only
    expect(mail.text).toContain(`/admin/collections/enquiries/${id}`)
    const row = (await enquiry(id))!
    expect([row.delivery_status, Number(row.delivery_attempts)]).toEqual(['sent', 1])
    expect(row.delivery_sent_at).toBeTruthy()
  })

  it('retries a transient failure with backoff, then delivers; the attempts stay visible', async () => {
    outbox.length = 0
    const id = ((await m.submitEnquiry(t.payload, valid(), headersFor())) as { id: number }).id
    failing = true
    await t.payload.jobs.run({ overrideAccess: true, silent: true })
    let row = (await enquiry(id))!
    expect([row.delivery_status, Number(row.delivery_attempts), row.delivery_last_error]).toEqual([
      'retrying',
      1,
      'transport',
    ])
    const [job] = await jobsFor(id)
    expect(job!.completed_at).toBeNull()
    const wait = (await t.sql.query('select wait_until from payload_jobs where id = $1', [job!.id]))
      .rows[0].wait_until
    expect(new Date(wait).getTime()).toBeGreaterThan(Date.now()) // backoff, not an immediate retry
    failing = false
    await runDueNow()
    row = (await enquiry(id))!
    expect([row.delivery_status, Number(row.delivery_attempts), row.delivery_last_error]).toEqual([
      'sent',
      2,
      null,
    ])
    expect(
      outbox.filter((x) => x.text.includes(`/admin/collections/enquiries/${id}\n`)),
    ).toHaveLength(1)
  })

  it('after the last attempt the enquiry is marked failed and an operator alert is logged without content', async () => {
    const id = (
      (await m.submitEnquiry(
        t.payload,
        valid({ message: 'SECRET-MESSAGE-MARKER' }),
        headersFor(),
      )) as { id: number }
    ).id
    failing = true
    const logged: unknown[] = []
    const logger = t.payload.logger
    const orig = { error: logger.error, warn: logger.warn, info: logger.info }
    for (const k of ['error', 'warn', 'info'] as const)
      (logger as unknown as Record<string, unknown>)[k] = (...args: unknown[]) => {
        logged.push(args)
        return (orig[k] as (...a: unknown[]) => void).apply(logger, args)
      }
    try {
      await t.payload.jobs.run({ overrideAccess: true, silent: true })
      for (let i = 0; i < m.MAX_ATTEMPTS + 1; i++) await runDueNow()
    } finally {
      Object.assign(logger, orig)
    }
    const row = (await enquiry(id))!
    expect([row.delivery_status, Number(row.delivery_attempts), row.delivery_last_error]).toEqual([
      'failed',
      m.MAX_ATTEMPTS,
      'transport',
    ])
    const text = JSON.stringify(logged)
    expect(text).toContain('enquiry.delivery_failed')
    expect(text).not.toMatch(/SECRET-MESSAGE-MARKER|Layla|layla@example\.org|Example Bank/)
  })

  it('no configured recipients is a delivery failure, never a silent drop', async () => {
    const saved = (await t.payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      depth: 0,
    })) as unknown as {
      enquiryRecipients: { email: string }[]
    }
    await t.payload.updateGlobal({
      slug: 'site-settings',
      data: { enquiryRecipients: [], _status: 'published' } as never,
      overrideAccess: true,
    })
    const id = ((await m.submitEnquiry(t.payload, valid(), headersFor())) as { id: number }).id
    await t.payload.jobs.run({ overrideAccess: true, silent: true })
    expect((await enquiry(id))!.delivery_last_error).toBe('no_recipients')
    await t.payload.updateGlobal({
      slug: 'site-settings',
      data: {
        enquiryRecipients: saved.enquiryRecipients.map(({ email }) => ({ email })),
        _status: 'published',
      } as never,
      overrideAccess: true,
    })
  })
})

describe('inbox access and audit (T122, FR-076)', () => {
  let id: number
  beforeAll(async () => {
    id = (
      (await m.submitEnquiry(
        t.payload,
        valid({ message: 'AUDIT-CONTENT-MARKER' }),
        headersFor(),
      )) as { id: number }
    ).id
  })
  const audits = async (action: string, target: string) =>
    (
      await t.sql.query(
        'select actor, meta from audit_events where action = $1 and target_id = $2',
        [action, target],
      )
    ).rows

  it('Editors and Publishers cannot read, export, create, update or delete enquiries', async () => {
    for (const s of [editor, publisher]) {
      expect((await rest(t.payload, 'GET', '/api/enquiries', { token: s.token })).status).toBe(403)
      expect(
        (await rest(t.payload, 'GET', `/api/enquiries/${id}`, { token: s.token })).status,
      ).toBe(403)
      expect(
        (await rest(t.payload, 'GET', '/api/enquiries/export', { token: s.token })).status,
      ).toBe(403)
      expect(
        (await rest(t.payload, 'DELETE', `/api/enquiries/${id}`, { token: s.token })).status,
      ).toBe(403)
    }
    await expect(
      t.payload.find({
        collection: 'enquiries',
        user: (await userFor(t.payload, editor.token)) as never,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    for (const s of [owner, admin]) {
      expect(
        (await rest(t.payload, 'POST', '/api/enquiries', { token: s.token, body: valid() })).status,
      ).toBe(403)
      expect(
        (
          await rest(t.payload, 'PATCH', `/api/enquiries/${id}`, {
            token: s.token,
            body: { message: 'edited' },
          })
        ).status,
      ).toBe(403)
    }
    expect((await enquiry(id))!.message).toBe('AUDIT-CONTENT-MARKER')
    expect((await rest(t.payload, 'GET', `/api/enquiries/${id}`)).status).toBe(403) // anonymous
  })

  it('every view by an Administrator or Owner is audited without content', async () => {
    const before = (await audits('enquiry.view', String(id))).length
    const r = await rest(t.payload, 'GET', `/api/enquiries/${id}`, { token: admin.token })
    expect(r.status).toBe(200)
    expect((r.body as { message: string }).message).toBe('AUDIT-CONTENT-MARKER')
    const list = await rest(t.payload, 'GET', '/api/enquiries?limit=100', { token: owner.token })
    expect(list.status).toBe(200)
    const rows = await audits('enquiry.view', String(id))
    expect(rows.length).toBe(before + 2)
    expect(rows.map((x) => x.actor)).toEqual(
      expect.arrayContaining([`user:${admin.userId}`, `user:${owner.userId}`]),
    )
    expect(JSON.stringify(rows)).not.toContain('AUDIT-CONTENT-MARKER')
  })

  it('export needs recent re-authentication, is CSV-safe and audited once with a count', async () => {
    // A fresh MFA enrolment counts as recent re-authentication; age it past the 5-minute window.
    await t.sql.query(
      `update auth_sessions set reauth_at = now() - interval '10 minutes' where user_id = $1`,
      [owner.userId],
    )
    expect(
      (await rest(t.payload, 'GET', '/api/enquiries/export', { token: owner.token })).body,
    ).toEqual({ error: 'reauth_required' })
    await m
      .submitEnquiry(t.payload, valid({ name: '=HYPERLINK("http://evil")' }), headersFor())
      .then((r) => expect(r.status).toBe(200)) // valid input; neutralised in the CSV below
    const formula = (
      (await m.submitEnquiry(t.payload, valid({ organization: '=1+1' }), headersFor())) as {
        id: number
      }
    ).id
    await reauth(t.payload, owner)
    const before = (await audits('enquiry.export', 'export')).length
    const r = await rest(t.payload, 'GET', '/api/enquiries/export', { token: owner.token })
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toContain('text/csv')
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(r.raw).toContain('AUDIT-CONTENT-MARKER')
    expect(r.raw).toContain(`"'=1+1"`) // formulas neutralised
    expect(r.raw).toContain(`"'=HYPERLINK(""http://evil"")"`)
    const rows = await audits('enquiry.export', 'export')
    expect(rows.length).toBe(before + 1)
    expect(Number(rows.at(-1)!.meta.count)).toBe(await count())
    expect(formula).toBeGreaterThan(0)
  })

  it('deletion by an Administrator is audited', async () => {
    const del = ((await m.submitEnquiry(t.payload, valid(), headersFor())) as { id: number }).id
    expect(
      (await rest(t.payload, 'DELETE', `/api/enquiries/${del}`, { token: admin.token })).status,
    ).toBe(200)
    expect(await enquiry(del)).toBeUndefined()
    expect(await audits('enquiry.delete', String(del))).toEqual([
      { actor: `user:${admin.userId}`, meta: null },
    ])
  })
})

describe('retention (FR-077) and the job runner', () => {
  it('deletes enquiries past their date, keeps the rest, and records one content-free entry', async () => {
    const old = (
      (await m.submitEnquiry(t.payload, valid({ message: 'OLD-ENQUIRY' }), headersFor())) as {
        id: number
      }
    ).id
    const fresh = ((await m.submitEnquiry(t.payload, valid(), headersFor())) as { id: number }).id
    await t.sql.query(
      `update enquiries set delete_after = now() - interval '1 day' where id = $1`,
      [old],
    )
    const n = await m.purgeExpiredEnquiries(t.payload)
    expect(n).toBe(1)
    expect(await enquiry(old)).toBeUndefined()
    expect(await enquiry(fresh)).toBeDefined()
    const rows = (
      await t.sql.query(
        `select actor, meta from audit_events where action = 'enquiry.retention_delete' order by id desc limit 1`,
      )
    ).rows
    expect(rows).toEqual([{ actor: 'system', meta: { count: 1 } }])
    expect(
      (await t.sql.query(`select 1 from audit_events where meta::text like '%OLD-ENQUIRY%'`))
        .rowCount,
    ).toBe(0)
  })

  it('the runner endpoint refuses calls without the signing secret and runs jobs with it', async () => {
    const { getConfig } = await import('../../../src/modules/platform')
    const secret = getConfig().secrets.jobsSigning
    expect(secret, 'JOBS_SIGNING_SECRET must be set for this test').toBeTruthy()
    expect((await rest(t.payload, 'POST', '/api/jobs/run')).status).toBe(401)
    expect(
      (
        await rest(t.payload, 'POST', '/api/jobs/run', {
          headers: { authorization: 'Bearer wrong' },
        })
      ).status,
    ).toBe(401)
    expect((await rest(t.payload, 'POST', '/api/jobs/run', { token: owner.token })).status).toBe(
      401,
    ) // a CMS session is not enough
    const id = ((await m.submitEnquiry(t.payload, valid(), headersFor())) as { id: number }).id
    const r = await rest(t.payload, 'POST', '/api/jobs/run?retention=1', {
      headers: { authorization: `Bearer ${secret}` },
    })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ ran: true, enquiriesDeleted: 0 })
    expect((await enquiry(id))!.delivery_status).toBe('sent')
    // Payload's own job endpoints are closed.
    expect(
      (await rest(t.payload, 'GET', '/api/payload-jobs/run', { token: owner.token })).status,
    ).not.toBe(200)
  })
})
