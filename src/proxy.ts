// Request proxy (Next 16): per-request CSP nonce (FR-090), blocking of Payload built-in auth
// routes replaced by project flows, A-3 root redirect, and the server-rendered 404 for missing
// public paths (FR-008, FR-082).
import { NextResponse, type NextRequest } from 'next/server'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  localeOfPath,
  negotiateLocale,
  RESERVED_SEGMENTS,
  type Locale,
} from '@/modules/i18n'
import { buildCsp, type CspKind } from '@/modules/security'
import { notFoundDocument } from '@/ui/site/not-found-document'

// Payload built-ins replaced by project flows (FR-030, FR-034, ADR-005): no first-user
// registration, recovery only via /account/recover, no session extension past the absolute
// lifetime (refresh-token), no unlock or e-mail verification endpoints.
const BLOCKED = new Set([
  '/admin/create-first-user',
  '/api/users/first-register',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/users/unlock',
  '/api/users/refresh-token',
])
const BLOCKED_PREFIXES = ['/admin/reset/', '/admin/verify/', '/api/users/verify/']
const REDIRECTS: Record<string, string> = { '/admin/forgot': '/account/recover' }

function normalise(pathname: string): string {
  const lower = pathname.toLowerCase()
  return lower.length > 1 && lower.endsWith('/') ? lower.slice(0, -1) : lower
}

function kindOf(pathname: string): CspKind {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin'
  if (pathname === '/api' || pathname.startsWith('/api/')) return 'api'
  return 'public'
}

function decodable(pathname: string): boolean {
  try {
    decodeURIComponent(pathname)
    return true
  } catch {
    return false
  }
}

// First segments served by the app's own routes (admin, API, previews, account, Next assets,
// future robots/sitemap), never by the public catch-all; the proxy leaves them to Next.
const NOT_PUBLIC = new Set(
  RESERVED_SEGMENTS.filter((s) => !(LOCALES as readonly string[]).includes(s)),
)

/** Document requests for the public site. Next strips the RSC/router headers and `_rsc` before
 * the proxy runs, so client-side navigations are told apart by the browser-set
 * `Sec-Fetch-Dest` (`empty` for the router's fetch; absent for non-browser clients) and keep
 * Next's handling. Routes are case-sensitive, so the raw path decides (`/ADMIN` is public). */
function publicDocumentRequest(request: NextRequest): boolean {
  const raw = request.nextUrl.pathname
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (raw === '/' || NOT_PUBLIC.has(raw.split('/')[1] ?? '')) return false
  const dest = request.headers.get('sec-fetch-dest')
  return dest === null || dest === 'document'
}

/**
 * Next 16.3.8 renders a page that throws notFound() as an empty client-recovery shell (no body
 * without JavaScript), and resets a proxy rewrite's status to 200; only a proxy body response
 * keeps its status. So a missing public path gets its complete localized 404 from here.
 */
function notFoundResponse(locale: Locale, nonce: string, csp: string): NextResponse {
  return new NextResponse(notFoundDocument(locale, nonce), {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': csp,
      'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

function newNonce(): string {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const path = normalise(request.nextUrl.pathname)
  if (BLOCKED.has(path) || BLOCKED_PREFIXES.some((p) => path.startsWith(p)))
    return new NextResponse(null, { status: 404 })
  if (REDIRECTS[path]) return NextResponse.redirect(new URL(REDIRECTS[path], request.url), 307)

  const nonce = newNonce()
  const csp = buildCsp({
    kind: kindOf(path),
    nonce,
    dev: process.env.NODE_ENV === 'development',
    upgradeInsecureRequests: (process.env.SITE_URL ?? '').startsWith('https://'),
  })
  // Unknown locales render the default locale's chrome (A-2); case-sensitive like the routes.
  const pathLocale = localeOfPath(request.nextUrl.pathname)
  // Malformed percent-encoding would make Next's parameter decoding throw (500): always a 404.
  if (!decodable(request.nextUrl.pathname))
    return notFoundResponse(pathLocale ?? DEFAULT_LOCALE, nonce, csp)
  if (publicDocumentRequest(request)) {
    // Same question as the page, asked before rendering. If the lookup fails (database down),
    // the request falls through to the page, which reports its own error.
    const { publicRouteStatus } = await import('./app/(site)/route-status')
    const status = await publicRouteStatus(request.nextUrl.pathname).catch(() => null)
    if (status?.kind === 'notFound')
      return notFoundResponse(pathLocale ?? DEFAULT_LOCALE, nonce, csp)
    if (status?.kind === 'redirect') {
      // Same origin only: stored targets are validated single-`/` site paths (findRedirect).
      // Never stored by shared caches: a stored redirect can be changed or deleted at any time.
      const redirect = NextResponse.redirect(
        new URL(status.to, request.url),
        status.permanent ? 308 : 307,
      )
      redirect.headers.set('Cache-Control', 'private, no-store')
      return redirect
    }
  }
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  if (path === '/') {
    // A-3: the redirect depends on cookie, Accept-Language and crawler detection, so it varies on
    // them and is never stored by shared caches.
    const locale = negotiateLocale({
      cookie: request.cookies.get(LOCALE_COOKIE)?.value,
      acceptLanguage: request.headers.get('accept-language'),
      userAgent: request.headers.get('user-agent'),
    })
    const redirect = NextResponse.redirect(new URL(`/${locale}`, request.url), 307)
    redirect.headers.set('Vary', 'Accept-Language, Cookie, User-Agent')
    redirect.headers.set('Cache-Control', 'private, no-store')
    redirect.headers.set('Content-Security-Policy', csp)
    return redirect
  }

  // Trusted routing context for the site layout and not-found page; always overwritten so a
  // client cannot supply its own.
  // Admin and account screens are English (D-23); other unmatched paths use the default (A-2).
  const chromeLocale =
    localeOfPath(path) ?? (/^\/(admin|account|api)(\/|$)/.test(path) ? 'en' : 'ar')
  requestHeaders.set('x-altamiuz-locale', chromeLocale)
  requestHeaders.set('x-altamiuz-path', request.nextUrl.pathname)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  const pageLocale = localeOfPath(path)
  if (pageLocale && request.cookies.get(LOCALE_COOKIE)?.value !== pageLocale)
    // Remembered language (A-3): functional preference only, set when it changes.
    response.cookies.set(LOCALE_COOKIE, pageLocale, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      secure: request.nextUrl.protocol === 'https:',
    })
  if (path === '/preview' || path.startsWith('/preview/')) {
    // FR-022: previews are never indexed or cached by shared caches.
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'private, no-store')
  }
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
  ],
}
