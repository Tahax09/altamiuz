import { describe, expect, it } from 'vitest'
import { createLogger, REDACTED } from '@/modules/platform/logger'

function capture() {
  const lines: string[] = []
  const logger = createLogger({
    level: 'debug',
    destination: { write: (s: string) => lines.push(s) },
  })
  return { logger, lines, last: () => JSON.parse(lines.at(-1) ?? '{}') as Record<string, unknown> }
}

describe('logger redaction (FR-101)', () => {
  it.each([
    ['password', { password: 'hunter2-secret' }],
    ['token', { token: 'tok_live_123' }],
    ['authorization header', { headers: { authorization: 'JWT abc.def.ghi' } }],
    ['cookie header', { headers: { cookie: 'payload-token=abc' } }],
    ['set-cookie header', { headers: { 'set-cookie': 'payload-token=abc' } }],
    ['totp code', { totp: '123456' }],
    ['mfa secret', { mfa: { secret: 'JBSWY3DPEHPK3PXP' } }],
    ['recovery code', { recoveryCode: 'abcd-efgh' }],
    ['session id', { sessionId: 'sess_123' }],
    ['enquiry message', { enquiry: { message: 'confidential incident details' } }],
    ['enquiry email', { enquiry: { email: 'person@example.ly' } }],
    ['enquiry phone', { enquiry: { phone: '+218910000000' } }],
  ])('redacts %s', (_label, payload) => {
    const { logger, lines } = capture()
    logger.info(payload, 'event')
    const out = lines.join('')
    for (const secret of JSON.stringify(payload).match(/"[^"]+":"([^"]+)"/g) ?? []) {
      const value = secret.split('":"')[1]!.replace(/"$/, '')
      expect(out).not.toContain(value)
    }
    expect(out).toContain(REDACTED)
  })

  it('keeps non-sensitive fields', () => {
    const { logger, last } = capture()
    logger.info({ route: '/api/health', status: 200 }, 'ok')
    expect(last()).toMatchObject({ route: '/api/health', status: 200, msg: 'ok' })
  })

  it('emits structured JSON with level and time', () => {
    const { logger, last } = capture()
    logger.warn('careful')
    const line = last()
    expect(line.level).toBe('warn')
    expect(typeof line.time).toBe('string')
  })
})
