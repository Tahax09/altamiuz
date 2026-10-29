// Draft preview (T091, FR-022): authenticated, MFA-verified users with read permission only.
// No shareable links. Uses the same renderer as the public site; never cached, never indexed.
import config from '@payload-config'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { listPublished, mayDo } from '@/modules/content'
import { DocumentView } from '@/ui'

export const dynamic = 'force-dynamic'
const COLLECTIONS = new Set(['pages', 'services', 'courses'])

export default async function Preview({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string; id: string }>
  searchParams: Promise<{ locale?: string }>
}) {
  const { collection, id } = await params
  const { locale: l } = await searchParams
  const locale = l === 'en' ? 'en' : 'ar'
  if (!COLLECTIONS.has(collection) || !/^[0-9]{1,12}$/.test(id)) notFound()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const req = { user, payload } as never
  if (!user || !mayDo(req, collection as 'pages', 'read')) notFound()
  const doc = await payload
    .findByID({
      collection: collection as 'pages',
      id,
      locale,
      fallbackLocale: false,
      draft: true,
      depth: 1,
      overrideAccess: false,
      user,
    })
    .catch(() => null)
  if (!doc) notFound()
  return (
    <main data-preview="true">
      <p role="note">Preview — draft content, not public.</p>
      <DocumentView
        doc={doc as unknown as Record<string, unknown>}
        locale={locale}
        ctx={{
          // Same listing data as the public page (published items only), so output matches.
          listings: {
            services: await listPublished(payload, 'services', locale),
            courses: await listPublished(payload, 'courses', locale),
          },
        }}
      />
    </main>
  )
}
