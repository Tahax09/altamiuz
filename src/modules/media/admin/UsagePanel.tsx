// Usage panel on an image's edit view (FR-057, T112): where the image is used, published or in a
// draft, and a warning before deletion when it is in use. Server component: usage is computed
// from the content at render time (usage.ts), only for users who may read media.
import type { UIFieldServerProps } from 'payload'
import { can, isMfaVerified, roleOf } from '../../access'
import { findMediaUsage } from '../usage'

const LABEL = { pages: 'Page', services: 'Service', courses: 'Course' } as const

export async function UsagePanel({ id, payload, req }: UIFieldServerProps) {
  // `req.user` carries the server-set MFA flag; the `user` prop is a client-safe copy without it.
  const user = req.user
  const role = roleOf(user)
  if (!user || !isMfaVerified(user) || !role || !can(role, 'media', 'read')) return null
  const mediaId = typeof id === 'number' ? id : Number(id)
  if (!Number.isInteger(mediaId) || mediaId <= 0) return null
  const uses = await findMediaUsage(payload, mediaId)
  const published = uses.filter((u) => u.published).length
  return (
    <section
      className="altamiuz-usage"
      aria-labelledby="altamiuz-usage-h"
      data-testid="media-usage"
    >
      <h3 id="altamiuz-usage-h">Where this image is used</h3>
      {uses.length === 0 ? (
        <p>Not used on any page, service or course.</p>
      ) : (
        <>
          <p className="altamiuz-usage__warn" role="note" data-testid="media-delete-warning">
            In use in {uses.length} {uses.length === 1 ? 'document' : 'documents'}
            {published ? ` (${published} published)` : ''}. Deleting it removes the image from all
            of them. To change the picture everywhere, upload a replacement file here instead.
          </p>
          <ul>
            {uses.map((u) => (
              <li key={`${u.collection}:${u.id}`}>
                <a href={`/admin/collections/${u.collection}/${u.id}`}>
                  {LABEL[u.collection]}: {u.title || `#${u.id}`}
                </a>{' '}
                ({[u.published && 'published', u.draft && 'draft'].filter(Boolean).join(', ')})
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
