// T124 (FR-072): Turnstile siteverify, fail closed, without any network (fetch is injected).
import { describe, expect, it } from 'vitest'
import {
  createTurnstile,
  SITEVERIFY_URL,
} from '../../../src/modules/platform/adapters/captcha/turnstile'
import { createTestCaptcha } from '../../../src/modules/platform/adapters/captcha'

const ctx = {
  expectedAction: 'enquiry',
  expectedHostname: 'www.example.org',
  remoteIp: '203.0.113.5',
}
const answer = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
const ok = { success: true, hostname: 'www.example.org', action: 'enquiry', 'error-codes': [] }

describe('createTurnstile', () => {
  it('posts secret, token and IP to siteverify and accepts a matching result', async () => {
    let seen: { url: string; body: string } | undefined
    const f = (async (url: string, init: RequestInit) => {
      seen = { url, body: String(init.body) }
      return new Response(JSON.stringify(ok))
    }) as unknown as typeof fetch
    expect(await createTurnstile('secret-x', { fetch: f }).verify('tok', ctx)).toEqual({
      success: true,
      errorCodes: [],
    })
    expect(seen!.url).toBe(SITEVERIFY_URL)
    const p = new URLSearchParams(seen!.body)
    expect([p.get('secret'), p.get('response'), p.get('remoteip')]).toEqual([
      'secret-x',
      'tok',
      '203.0.113.5',
    ])
  })

  it('rejects missing, failed, expired/duplicate, wrong-hostname and wrong-action results', async () => {
    const v = (body: unknown) => createTurnstile('s', { fetch: answer(body) }).verify('tok', ctx)
    expect(await createTurnstile('s', { fetch: answer(ok) }).verify('', ctx)).toMatchObject({
      success: false,
    })
    expect(await v({ success: false, 'error-codes': ['invalid-input-response'] })).toEqual({
      success: false,
      errorCodes: ['invalid-input-response'],
    })
    expect(await v({ success: false, 'error-codes': ['timeout-or-duplicate'] })).toMatchObject({
      success: false,
    })
    expect(await v({ ...ok, hostname: 'evil.example' })).toEqual({
      success: false,
      errorCodes: ['hostname-mismatch'],
    })
    expect(await v({ ...ok, action: 'login' })).toEqual({
      success: false,
      errorCodes: ['action-mismatch'],
    })
  })

  it('treats network errors, timeouts, HTTP errors, malformed answers and internal errors as unavailable', async () => {
    const throwing = (async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch
    const hanging = ((_u: string, init: RequestInit) =>
      new Promise((_r, rej) =>
        init.signal!.addEventListener('abort', () => rej(new Error('aborted'))),
      )) as unknown as typeof fetch
    for (const f of [
      throwing,
      answer(ok, 502),
      answer('not json'),
      answer({ 'error-codes': [] }),
      answer({ success: false, 'error-codes': ['internal-error'] }),
    ])
      expect(await createTurnstile('s', { fetch: f }).verify('tok', ctx)).toMatchObject({
        success: false,
        unavailable: true,
      })
    expect(
      await createTurnstile('s', { fetch: hanging, timeoutMs: 50 }).verify('tok', ctx),
    ).toMatchObject({
      unavailable: true,
    })
  })
})

describe('test captcha driver', () => {
  it('follows the documented test secrets and enforces single use', async () => {
    const pass = createTestCaptcha('1x0000000000000000000000000000000AA')
    expect((await pass.verify('a')).success).toBe(true)
    expect((await pass.verify('a')).errorCodes).toEqual(['timeout-or-duplicate'])
    expect((await pass.verify('test-fail-1')).success).toBe(false)
    expect((await pass.verify('test-unavailable-1')).unavailable).toBe(true)
    expect(
      (await createTestCaptcha('2x0000000000000000000000000000000AA').verify('b')).success,
    ).toBe(false)
    expect(
      (await createTestCaptcha('3x0000000000000000000000000000000AA').verify('b')).errorCodes,
    ).toEqual(['timeout-or-duplicate'])
    expect((await createTestCaptcha(undefined).verify('b')).success).toBe(false)
  })
})
