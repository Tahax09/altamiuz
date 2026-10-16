import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
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

export default withPayload(nextConfig, { devBundleServerPackages: false })
