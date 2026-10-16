// Request proxy (Next 16): per-request CSP nonce (FR-090) and Setup-phase blocking of Payload's
// first-user registration (FR-030). Locale routing and redirects arrive in later phases.
import { NextResponse, type NextRequest } from 'next/server'
import { buildCsp, type CspKind } from '@/modules/security'

// Until the real users collection and one-time bootstrap exist (T056/T057), no account may be
// created through Payload's built-in "create first user" flow.
const BLOCKED = new Set(['/admin/create-first-user', '/api/users/first-register'])

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
  if (BLOCKED.has(path)) return new NextResponse(null, { status: 404 })

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
