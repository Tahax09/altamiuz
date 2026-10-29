// T099 (FR-002, FR-003, A-3): root address chooses a language — remembered choice, else the
// browser's Arabic/English preference, else Arabic; crawlers get the default. Locale pages
// remember the language. The redirect varies on the inputs and is never shared-cached.
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteStatus } from '../../../src/app/(site)/route-status'
import { proxy } from '../../../src/proxy'

// The proxy asks the database whether a public path exists (src/app/(site)/route-status.ts, covered over HTTP
// by tests/public/no-js.spec.ts); here the answer is scripted.
const routeStatus = vi.hoisted(() => ({
  fn: vi.fn<(path: string) => Promise<RouteStatus>>(async () => ({ kind: 'ok' })),
}))
vi.mock('../../../src/app/(site)/route-status', () => ({
  publicRouteStatus: (path: string) => routeStatus.fn(path),
}))
beforeEach(() => {
  routeStatus.fn.mockReset()
  routeStatus.fn.mockImplementation(async () => ({ kind: 'ok' }))
})

const call = (path: string, headers: Record<string, string> = {}, method = 'GET') =>
  proxy(new NextRequest(new URL(path, 'http://localhost:3000'), { headers, method }))
const target = (r: Response) => new URL(r.headers.get('location')!).pathname

describe('A-3 root redirect', () => {
  it('defaults to Arabic', async () => {
    const r = await call('/')
    expect(r.status).toBe(307)
    expect(target(r)).toBe('/ar')
  })
  it('uses the browser preference when it is Arabic or English', async () => {
    expect(target(await call('/', { 'accept-language': 'en-GB,en;q=0.9' }))).toBe('/en')
    expect(target(await call('/', { 'accept-language': 'fr-FR, en;q=0.5, ar;q=0.8' }))).toBe('/ar')
    expect(target(await call('/', { 'accept-language': 'fr-FR, de;q=0.5' }))).toBe('/ar')
    expect(target(await call('/', { 'accept-language': 'en;q=0, ar;q=0.1' }))).toBe('/ar')
  })
  it('a remembered choice wins over the browser preference', async () => {
    expect(target(await call('/', { 'accept-language': 'en', cookie: 'altamiuz-locale=ar' }))).toBe(
      '/ar',
    )
    expect(target(await call('/', { 'accept-language': 'ar', cookie: 'altamiuz-locale=en' }))).toBe(
      '/en',
    )
  })
  it('ignores a tampered cookie value', async () => {
    expect(target(await call('/', { cookie: 'altamiuz-locale=../admin' }))).toBe('/ar')
    expect(target(await call('/', { cookie: 'altamiuz-locale=https://evil.example' }))).toBe('/ar')
  })
  it('crawlers receive the default alternate', async () => {
    expect(
      target(
        await call('/', {
          'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
          'accept-language': 'en',
        }),
      ),
    ).toBe('/ar')
  })
  it('varies on the inputs and is not cacheable by shared caches', async () => {
    const r = await call('/', { 'accept-language': 'en' })
    expect(r.headers.get('vary')).toMatch(/Accept-Language/)
    expect(r.headers.get('vary')).toMatch(/Cookie/)
    expect(r.headers.get('cache-control')).toMatch(/private/)
    expect(r.headers.get('content-security-policy')).toBeTruthy()
  })
})

describe('remembered language', () => {
  it('locale pages set the preference cookie only when it changes', async () => {
    const set = (await call('/en/services')).headers.get('set-cookie') ?? ''
    expect(set).toMatch(/altamiuz-locale=en/)
    expect(set).toMatch(/HttpOnly/i)
    expect(set).toMatch(/SameSite=Lax/i)
    expect(set).toMatch(/Path=\//i)
    expect(
      (await call('/en/services', { cookie: 'altamiuz-locale=en' })).headers.get('set-cookie'),
    ).toBeNull()
    expect((await call('/ar', { cookie: 'altamiuz-locale=en' })).headers.get('set-cookie')).toMatch(
      /altamiuz-locale=ar/,
    )
  })
  it('non-locale paths never set it', async () => {
    for (const p of ['/admin', '/api/health', '/preview/pages/1', '/account/mfa', '/fr/x'])
      expect((await call(p)).headers.get('set-cookie') ?? '', p).not.toMatch(/altamiuz-locale/)
  })
})

describe('server-rendered 404 for missing public paths (FR-008, FR-082)', () => {
  const notFound = () =>
    routeStatus.fn.mockImplementation(async (): Promise<RouteStatus> => ({ kind: 'notFound' }))

  it('answers a missing path with a complete localized document and status 404', async () => {
    notFound()
    for (const [path, lang, dir, title] of [
      ['/en/no-such-page', 'en', 'ltr', 'Page not found'],
      ['/ar/no-such-page', 'ar', 'rtl', 'الصفحة غير موجودة'],
      ['/fr/about', 'ar', 'rtl', 'الصفحة غير موجودة'], // unknown locale: default chrome (A-2)
      ['/EN/zz-missing', 'ar', 'rtl', 'الصفحة غير موجودة'], // routes are case-sensitive
    ] as const) {
      const r = await call(path)
      expect(r.status, path).toBe(404)
      expect(r.headers.get('content-type')).toMatch(/^text\/html/)
      expect(r.headers.get('cache-control')).toMatch(/no-store/)
      const csp = r.headers.get('content-security-policy')!
      const nonce = /'nonce-([^']+)'/.exec(csp)?.[1]
      const html = await r.text()
      expect(html).toContain(`<html lang="${lang}" dir="${dir}">`)
      expect(html).toContain(`<h1>${title}</h1>`)
      expect(html).toContain(`<a href="/${lang}">`)
      expect(html).toContain('<meta name="robots" content="noindex, nofollow">')
      expect(html).toContain(`<style nonce="${nonce}">`)
      expect(html).not.toMatch(/<script/i)
      expect(html, 'no request data is echoed').not.toContain(path.split('/').pop())
    }
    expect(routeStatus.fn).toHaveBeenCalledWith('/en/no-such-page')
  })

  it('malformed percent-encoding is a 404 without a lookup', async () => {
    notFound()
    const r = await call('/en/%E0%A4%A')
    expect(r.status).toBe(404)
    expect(await r.text()).toContain('<html lang="en" dir="ltr">')
    expect(routeStatus.fn).not.toHaveBeenCalled()
  })

  it('existing paths and stored redirects pass through or redirect', async () => {
    expect((await call('/en/about')).status).toBe(200)
    routeStatus.fn.mockImplementation(async () => ({
      kind: 'redirect',
      to: '/en/new',
      permanent: true,
    }))
    const r = await call('/en/old')
    expect(r.status).toBe(308)
    expect(r.headers.get('location')).toBe('http://localhost:3000/en/new')
    expect(r.headers.get('cache-control')).toBe('private, no-store')
    routeStatus.fn.mockImplementation(async () => ({
      kind: 'redirect',
      to: '/en/new',
      permanent: false,
    }))
    expect((await call('/en/old')).status).toBe(307)
  })

  it('a failed lookup falls through to the page instead of failing the request', async () => {
    routeStatus.fn.mockImplementation(async () => {
      throw new Error('database down')
    })
    expect((await call('/en/about')).status).toBe(200)
  })

  it('never resolves the admin, API, previews, account, reserved files or client navigations', async () => {
    notFound()
    for (const p of [
      '/admin/login',
      '/api/no-such-collection',
      '/preview/pages/1',
      '/account/mfa',
      '/robots.txt',
      '/sitemap.xml',
    ])
      expect((await call(p)).status, p).toBe(200)
    // Client-side navigations (the router's fetch) are rendered by Next's not-found boundary.
    expect((await call('/en/x', { 'sec-fetch-dest': 'empty' })).status).toBe(200)
    expect((await call('/en/x', {}, 'POST')).status).toBe(200)
    expect(routeStatus.fn).not.toHaveBeenCalled()
    // Browser navigations and non-browser clients get the server-rendered 404.
    expect((await call('/en/x', { 'sec-fetch-dest': 'document' })).status).toBe(404)
    expect((await call('/en/x')).status).toBe(404)
  })

  it('a client cannot supply the trusted routing headers', async () => {
    const r = await call('/en/about', { 'x-altamiuz-path': '/evil', 'x-altamiuz-locale': 'xx' })
    expect(r.headers.get('x-middleware-request-x-altamiuz-path')).toBe('/en/about')
    expect(r.headers.get('x-middleware-request-x-altamiuz-locale')).toBe('en')
  })
})
