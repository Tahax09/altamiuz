// FR-090, FR-095 and the Setup placeholder protection (no first-user registration).
import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { buildCsp, staticSecurityHeaders } from '@/modules/security'
import { proxy } from '../../../src/proxy'

// Public paths are resolved against the database by the proxy; these tests only need headers.
vi.mock('../../../src/app/(site)/route-status', () => ({
  publicRouteStatus: async () => ({ kind: 'ok' }),
}))

const call = (path: string, method = 'GET') =>
  proxy(new NextRequest(new URL(path, 'http://localhost:3000'), { method }))

const directives = (csp: string) =>
  Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...values] = d.split(/\s+/)
        return [name!, values]
      }),
  ) as Record<string, string[]>

describe('static security headers (all responses)', () => {
  const h = Object.fromEntries(staticSecurityHeaders.map((x) => [x.key.toLowerCase(), x.value]))
  it('sets HSTS for two years including subdomains, without preload until the domain is fixed', () => {
    expect(h['strict-transport-security']).toBe('max-age=63072000; includeSubDomains')
  })
  it('sets nosniff, referrer policy, framing and permissions policy', () => {
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(h['x-frame-options']).toBe('DENY')
    expect(h['permissions-policy']).toMatch(/camera=\(\)/)
    expect(h['permissions-policy']).toMatch(/geolocation=\(\)/)
    expect(h['permissions-policy']).toMatch(/microphone=\(\)/)
  })
})

describe('Content-Security-Policy', () => {
  it('public pages: nonce + strict-dynamic, no unsafe-inline/eval scripts, no framing', () => {
    const d = directives(
      buildCsp({ kind: 'public', nonce: 'abc123', dev: false, upgradeInsecureRequests: true }),
    )
    expect(d['script-src']).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"])
    expect(d['object-src']).toEqual(["'none'"])
    expect(d['base-uri']).toEqual(["'self'"])
    expect(d['form-action']).toEqual(["'self'"])
    expect(d['frame-ancestors']).toEqual(["'none'"])
    expect(d['style-src']).not.toContain("'unsafe-inline'")
  })

  it('public pages allow the Turnstile challenge origin only where needed', () => {
    const d = directives(
      buildCsp({ kind: 'public', nonce: 'n', dev: false, upgradeInsecureRequests: true }),
    )
    expect(d['frame-src']).toEqual(['https://challenges.cloudflare.com'])
  })

  it('admin: no unsafe-eval or unsafe-inline scripts in production', () => {
    const d = directives(
      buildCsp({ kind: 'admin', nonce: 'n', dev: false, upgradeInsecureRequests: true }),
    )
    expect(d['script-src']).not.toContain("'unsafe-eval'")
    expect(d['script-src']).not.toContain("'unsafe-inline'")
    expect(d['frame-ancestors']).toEqual(["'none'"])
    expect(d['object-src']).toEqual(["'none'"])
  })

  it('API responses get a deny-all policy', () => {
    const d = directives(
      buildCsp({ kind: 'api', nonce: 'n', dev: false, upgradeInsecureRequests: true }),
    )
    expect(d['default-src']).toEqual(["'none'"])
    expect(d['frame-ancestors']).toEqual(["'none'"])
  })

  it("adds 'unsafe-eval' only in development (documented dev exception)", () => {
    expect(
      buildCsp({ kind: 'public', nonce: 'n', dev: true, upgradeInsecureRequests: false }),
    ).toContain("'unsafe-eval'")
    expect(
      buildCsp({ kind: 'public', nonce: 'n', dev: false, upgradeInsecureRequests: true }),
    ).not.toContain("'unsafe-eval'")
    expect(
      buildCsp({ kind: 'admin', nonce: 'n', dev: false, upgradeInsecureRequests: true }),
    ).not.toContain("'unsafe-eval'")
  })
})

describe('upgrade-insecure-requests', () => {
  it('is emitted when the public origin is https and omitted for plain-http local runs', () => {
    expect(
      buildCsp({ kind: 'public', nonce: 'n', dev: false, upgradeInsecureRequests: true }),
    ).toContain('upgrade-insecure-requests')
    expect(
      buildCsp({ kind: 'admin', nonce: 'n', dev: false, upgradeInsecureRequests: false }),
    ).not.toContain('upgrade-insecure-requests')
  })
})

describe('proxy', () => {
  it('issues a fresh nonce per request and forwards it to rendering', async () => {
    const a = (await call('/en')).headers.get('content-security-policy')!
    const b = (await call('/en')).headers.get('content-security-policy')!
    const nonce = (s: string) => /'nonce-([^']+)'/.exec(s)?.[1]
    expect(nonce(a)).toBeTruthy()
    expect(nonce(a)).not.toBe(nonce(b))
    expect(nonce(a)!.length).toBeGreaterThanOrEqual(22)
  })

  it('selects the admin and api policies by path', async () => {
    expect((await call('/admin/login')).headers.get('content-security-policy')).toContain("'nonce-")
    expect((await call('/api/health')).headers.get('content-security-policy')).toContain(
      "default-src 'none'",
    )
  })

  it.each([
    ['/admin/create-first-user', 'GET'],
    ['/admin/create-first-user/', 'GET'],
    ['/ADMIN/Create-First-User', 'GET'],
    ['/api/users/first-register', 'POST'],
    ['/api/users/first-register/', 'POST'],
  ])(
    'blocks first-user registration %s %s with 404 (FR-030, Setup placeholder)',
    async (path, method) => {
      expect((await call(path, method)).status).toBe(404)
    },
  )
})
