// T037: client identity for rate limiting. Forwarding headers are trusted only as configured;
// spoofed X-Forwarded-For entries cannot change the key.
import { describe, expect, it } from 'vitest'
import { resolveClientIp } from '@/modules/platform'

const h = (o: Record<string, string>) => new Headers(o)

describe('resolveClientIp', () => {
  it('ignores X-Forwarded-For entirely when no proxy is trusted (default)', () => {
    expect(resolveClientIp(h({ 'x-forwarded-for': '1.2.3.4' }), { trustedProxyHops: 0 })).toBe(
      'unidentified',
    )
  })

  it('takes the address appended by the trusted proxy, not attacker-supplied entries', () => {
    const headers = h({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7, 203.0.113.9' })
    expect(resolveClientIp(headers, { trustedProxyHops: 1 })).toBe('203.0.113.9')
    expect(resolveClientIp(headers, { trustedProxyHops: 2 })).toBe('7.7.7.7')
  })

  it('a spoofed leading entry does not change the resolved key', () => {
    const a = resolveClientIp(h({ 'x-forwarded-for': '203.0.113.9' }), { trustedProxyHops: 1 })
    const b = resolveClientIp(h({ 'x-forwarded-for': '1.1.1.1, 203.0.113.9' }), {
      trustedProxyHops: 1,
    })
    expect(a).toBe(b)
  })

  it('uses a configured single-value header (e.g. cf-connecting-ip) in preference', () => {
    expect(
      resolveClientIp(h({ 'cf-connecting-ip': '2001:db8::1', 'x-forwarded-for': '1.1.1.1' }), {
        trustedProxyHops: 0,
        clientIpHeader: 'cf-connecting-ip',
      }),
    ).toBe('2001:db8::1')
  })

  it.each([
    ['not an IP', 'evil'],
    ['injection attempt', "1.2.3.4'; drop table x"],
    ['too few hops present', ''],
  ])('falls back to a shared "invalid" bucket for %s (never per-request unique)', (_l, value) => {
    expect(resolveClientIp(h({ 'x-forwarded-for': value }), { trustedProxyHops: 1 })).toBe(
      'invalid',
    )
  })
})
