import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { productionBuildGate } from './src/modules/i18n'
import { staticSecurityHeaders } from './src/modules/security'

// D-14: standalone output runs unchanged on a Vercel preview or in a container.
// No host-proprietary APIs; images are served from Payload-generated variants (D-12).
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  async headers() {
    return [{ source: '/:path*', headers: staticSecurityHeaders }]
  },
}

type HeaderRule = Awaited<ReturnType<NonNullable<NextConfig['headers']>>>[number]

/**
 * withPayload sends `Accept-CH`, `Critical-CH` and `Vary: Sec-CH-Prefers-Color-Scheme` on every
 * route (for the admin's light/dark theme). On the public site `Critical-CH` makes the browser
 * restart every first navigation to send the hint (an extra round trip, measured ~0.5 s of mobile
 * LCP, T139) and the `Vary` splits caches by colour scheme. Keep them on the admin only.
 */
export function adminOnlyClientHints(rules: HeaderRule[]): HeaderRule[] {
  return rules.map((rule) =>
    rule.source === '/:path*' && rule.headers.some((h) => h.key.toLowerCase() === 'critical-ch')
      ? { ...rule, source: '/admin/:path*' }
      : rule,
  )
}

// CD-13 (Gate 4): a production build fails until the Arabic route vocabulary is approved.
export default async (phase: string) => {
  if (phase === PHASE_PRODUCTION_BUILD) productionBuildGate(process.env.APP_ENV)
  const config = await withPayload(nextConfig, { devBundleServerPackages: false })
  const payloadHeaders = config.headers
  return {
    ...config,
    headers: async () => adminOnlyClientHints(payloadHeaders ? await payloadHeaders() : []),
  }
}
