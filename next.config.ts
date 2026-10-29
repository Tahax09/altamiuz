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

// CD-13 (Gate 4): a production build fails until the Arabic route vocabulary is approved.
export default (phase: string) => {
  if (phase === PHASE_PRODUCTION_BUILD) productionBuildGate(process.env.APP_ENV)
  return withPayload(nextConfig, { devBundleServerPackages: false })
}
