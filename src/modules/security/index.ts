// Security headers and Content-Security-Policy (FR-090, D-17, ADR-004). Dependency-free so the
// request proxy and next.config.ts can import it without pulling in server-only modules.

export type CspKind = 'public' | 'admin' | 'api'

/** Headers applied to every response, including static assets. */
export const staticSecurityHeaders: { key: string; value: string }[] = [
  // No `preload` until the production domain is fixed (D-17).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const TURNSTILE = 'https://challenges.cloudflare.com'

export type CspOptions = {
  kind: CspKind
  nonce: string
  /** Development server: adds React's required 'unsafe-eval' (never in production builds). */
  dev: boolean
  /** True when the site's public origin is https (production always is; ADR-004). */
  upgradeInsecureRequests: boolean
}

export function buildCsp({ kind, nonce, dev, upgradeInsecureRequests }: CspOptions): string {
  if (kind === 'api') {
    return "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  }
  // Development only: React needs eval for debugging (Next docs); never in production.
  const devEval = dev ? " 'unsafe-eval'" : ''
  const script = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devEval}`
  const common = [
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Keyed on the public origin, not NODE_ENV: on a plain-http local `next start`, WebKit would
    // otherwise upgrade same-origin assets to https and fail (ADR-004).
    ...(upgradeInsecureRequests ? ['upgrade-insecure-requests'] : []),
  ]
  if (kind === 'admin') {
    // ADR-004: Payload's admin applies inline style attributes, so styles need 'unsafe-inline'.
    // Scripts stay nonce-only.
    return [
      "default-src 'self'",
      script,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'self'",
      "worker-src 'self' blob:",
      ...common,
    ].join('; ')
  }
  return [
    "default-src 'self'",
    script,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'`,
    `frame-src ${TURNSTILE}`,
    ...common,
  ].join('; ')
}
