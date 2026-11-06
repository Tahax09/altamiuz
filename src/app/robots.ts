// T117 (FR-062, FR-066): robots policy; everything disallowed outside production.
import type { MetadataRoute } from 'next'
import { getConfig } from '@/modules/platform'
import { robotsFor } from '@/modules/seo'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const c = getConfig()
  return robotsFor(c.siteUrl, c.appEnv === 'production')
}
