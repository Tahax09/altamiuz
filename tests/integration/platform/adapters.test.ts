// Port contracts for local substitutes (FR-105, FR-086). Every substitute must satisfy the same
// behaviour the production adapters will be held to in later phases.
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createAnalytics,
  createCaptchaVerifier,
  createEmailAdapter,
  createJobQueue,
  createRateLimiter,
  createStorage,
  EmailValidationError,
  StorageKeyError,
} from '@/modules/platform/adapters'

describe('storage: local disk', () => {
  let dir: string
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'altamiuz-storage-'))
  })
  afterAll(async () => rm(dir, { recursive: true, force: true }))

  it('round-trips, reports existence and deletes', async () => {
    const s = createStorage({ driver: 'local' }, { root: dir })
    await s.put('media/a1b2.webp', Buffer.from('data'), 'image/webp')
    expect(await s.exists('media/a1b2.webp')).toBe(true)
    expect((await s.get('media/a1b2.webp'))?.toString()).toBe('data')
    await s.delete('media/a1b2.webp')
    expect(await s.get('media/a1b2.webp')).toBeNull()
  })

  it.each(['../etc/passwd', '/abs/path', 'a/../../b', 'media\\x', 'media/%2e%2e/x', '', 'a//b'])(
    'rejects unsafe key %j',
    async (key) => {
      const s = createStorage({ driver: 'local' }, { root: dir })
      await expect(s.put(key, Buffer.from('x'), 'image/png')).rejects.toBeInstanceOf(
        StorageKeyError,
      )
    },
  )
})

describe('email: memory and smtp (Mailpit)', () => {
  const message = { to: ['staff@localhost'], subject: 'Test enquiry', text: 'Plain text body' }

  it('memory adapter records sent messages', async () => {
    const mail = createEmailAdapter({ driver: 'memory', from: 'no-reply@localhost' })
    await mail.send(message)
    expect(mail.outbox?.at(-1)).toMatchObject({
      subject: 'Test enquiry',
      from: 'no-reply@localhost',
    })
  })

  it.each([
    ['subject CRLF', { ...message, subject: 'Hi\r\nBcc: victim@example.com' }],
    ['recipient CRLF', { ...message, to: ['a@localhost\r\nBcc: v@example.com'] }],
    ['invalid recipient', { ...message, to: ['not-an-email'] }],
    ['replyTo CRLF', { ...message, replyTo: 'a@b.ly\nBcc: v@example.com' }],
    ['no recipients', { ...message, to: [] }],
  ])('rejects header injection / invalid input: %s', async (_label, bad) => {
    const mail = createEmailAdapter({ driver: 'memory', from: 'no-reply@localhost' })
    await expect(mail.send(bad)).rejects.toBeInstanceOf(EmailValidationError)
  })

  it('smtp adapter delivers to local Mailpit', async () => {
    const subject = `smtp-contract-${Date.now()}`
    const mail = createEmailAdapter({
      driver: 'smtp',
      from: 'no-reply@localhost',
      smtpUrl: process.env.SMTP_URL ?? 'smtp://127.0.0.1:1025',
    })
    await mail.send({ ...message, subject })
    const res = await fetch(
      `http://127.0.0.1:8025/api/v1/search?query=${encodeURIComponent(subject)}`,
    )
    const body = (await res.json()) as { messages: { Subject: string }[] }
    expect(body.messages.map((m) => m.Subject)).toContain(subject)
  })
})

describe('rate limit: memory', () => {
  it('allows up to the limit within a window, then blocks', async () => {
    const rl = createRateLimiter({ driver: 'memory' })
    const opts = { limit: 3, windowMs: 60_000 }
    const results = []
    for (let i = 0; i < 4; i++) results.push(await rl.hit('contact:203.0.113.7', opts))
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false])
    expect(results[3]?.retryAfterMs).toBeGreaterThan(0)
  })

  it('isolates keys', async () => {
    const rl = createRateLimiter({ driver: 'memory' })
    const opts = { limit: 1, windowMs: 60_000 }
    expect((await rl.hit('a', opts)).allowed).toBe(true)
    expect((await rl.hit('b', opts)).allowed).toBe(true)
  })

  it('resets after the window', async () => {
    let now = 1_000
    const rl = createRateLimiter({ driver: 'memory' }, { now: () => now })
    const opts = { limit: 1, windowMs: 1_000 }
    expect((await rl.hit('k', opts)).allowed).toBe(true)
    expect((await rl.hit('k', opts)).allowed).toBe(false)
    now += 1_001
    expect((await rl.hit('k', opts)).allowed).toBe(true)
  })
})

describe('jobs: memory queue', () => {
  it('enqueues with an id and runs registered handlers once', async () => {
    const q = createJobQueue({ trigger: 'memory' })
    const seen: unknown[] = []
    q.register('noop', async (input) => {
      seen.push(input)
    })
    const id = await q.enqueue('noop', { a: 1 })
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    await q.runDue()
    await q.runDue()
    expect(seen).toEqual([{ a: 1 }])
  })

  it('rejects unknown task names', async () => {
    const q = createJobQueue({ trigger: 'memory' })
    await expect(q.enqueue('unregistered', {})).rejects.toThrow(/unknown task/)
  })
})

describe('captcha: test driver emulating Cloudflare test secrets (no network)', () => {
  it.each([
    ['1x0000000000000000000000000000000AA', true, []],
    ['2x0000000000000000000000000000000AA', false, ['invalid-input-response']],
    ['3x0000000000000000000000000000000AA', false, ['timeout-or-duplicate']],
  ])('secret %s → success=%s', async (secretKey, success, errorCodes) => {
    const v = createCaptchaVerifier({ driver: 'test', secretKey })
    expect(await v.verify('any-token')).toEqual({ success, errorCodes })
  })

  it('fails closed on a missing token', async () => {
    const v = createCaptchaVerifier({
      driver: 'test',
      secretKey: '1x0000000000000000000000000000000AA',
    })
    expect((await v.verify('')).success).toBe(false)
  })
})

describe('analytics: none', () => {
  it('is a no-op that never throws', async () => {
    const a = createAnalytics({ driver: 'none' })
    await expect(a.track('page_view', { locale: 'ar' })).resolves.toBeUndefined()
  })
})
