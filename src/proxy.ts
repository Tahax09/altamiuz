// Request proxy (Next 16): per-request CSP nonce (FR-090) and blocking of Payload built-in auth
// routes replaced by project flows. Locale routing and redirects arrive in later phases.
import { NextResponse, type NextRequest } from 'next/server'
import { buildCsp, type CspKind } from '@/modules/security'

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

function newNonce(): string {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

export function proxy(request: NextRequest): NextResponse {
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
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
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
