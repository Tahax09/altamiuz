// T117 (FR-062): sitemap of published, indexable pages per locale with alternates.
import config from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import { getConfig } from '@/modules/platform'
import { sitemapEntries } from '@/modules/seo'

// Rendered per request (never at build time: the build has no database). Small and cheap: a few
// indexed queries over published rows.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(await getPayload({ config }), getConfig().siteUrl)
}
