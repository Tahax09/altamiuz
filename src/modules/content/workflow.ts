// Draft/publish workflow (T089, FR-016, FR-020–FR-025, FR-045). Publishing, unpublishing and
// restoring are separate permissions from draft editing; claims must be verified to publish; every
// write is re-checked across ALL locales inside the transaction (defence in depth for restore,
// duplicate and copy-to-locale, which carry other locales the field hooks do not see).
import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  Endpoint,
  PayloadRequest,
} from 'payload'
import { APIError, restoreVersionOperation } from 'payload'
import type { Resource } from '../access'
import { recordAudit } from '../audit'
import { type Locale, type RoutedCollection } from '../i18n'
import { createSlugChangeRedirect } from '../seo'
import { mayDo } from './access'
import { unverifiedClaims } from './evidence'
import { findContentIssues } from './richtext/walk'

type Ctx = {
  contentOp?: 'restore' | 'update' | 'create'
  draftArg?: boolean
  unpublishAll?: boolean
  publishLocale?: string
  slugChange?: { from: string; to: string; locale: string }
}
const ctx = (req: PayloadRequest) => (req.context.content ??= {}) as Ctx

async function deny(
  req: PayloadRequest,
  collection: string,
  action: string,
  id?: unknown,
): Promise<never> {
  if (req.user)
    await recordAudit(req.payload, {
      actor: `user:${req.user.id}`,
      action: 'access.denied',
      target: { type: collection, id: String(id ?? '-') },
      outcome: 'denied',
      meta: { resource: collection, action },
    })
  throw new APIError('Forbidden', 403)
}

export const captureOperation: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  const c = ctx(req)
  if (operation === 'restoreVersion') {
    c.contentOp = 'restore'
    c.draftArg = (args as { draft?: boolean }).draft === true
  }
  if (operation === 'update' || operation === 'create') {
    c.contentOp = operation
    c.draftArg = (args as { draft?: boolean }).draft === true
    c.publishLocale = (args as { publishSpecificLocale?: string }).publishSpecificLocale
    const all = (args as { unpublishAllLocales?: unknown }).unpublishAllLocales
    c.unpublishAll = all === true || all === 'true'
    // Reject unsafe or malformed rich text before Payload's own lexical hooks walk it (a
    // non-array `children` otherwise surfaces as a 500 from inside the editor adapter).
    const issues = findContentIssues((args as { data?: unknown }).data)
    if (issues.length) throw new APIError('Content rejected by policy', 400, { issues }, true)
  }
  return args
}

export const enforceWorkflow =
  (collection: RoutedCollection): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    const c = ctx(req)
    const resource = collection as Resource
    // Payload 3.91.0 publishes when `_status: 'published'` is sent even with `draft: true`, and a
    // non-draft update without `_status` writes the live document (non-localized fields are shared
    // by every locale). So: any non-draft update is a publish, or an unpublish when it asks for
    // `draft`; `unpublishAllLocales` is an unpublish even on a draft save.
    const liveWrite = c.contentOp === 'update' && !c.draftArg
    const publishing = data._status === 'published' || (liveWrite && data._status !== 'draft')
    const unpublishing = !publishing && (c.unpublishAll === true || liveWrite)
    if (req.user) {
      if (c.contentOp === 'restore' && !mayDo(req, resource, 'restore'))
        await deny(req, collection, 'restore', originalDoc?.id)
      if (publishing && !mayDo(req, resource, 'publish'))
        await deny(req, collection, 'publish', originalDoc?.id)
      if (unpublishing && !mayDo(req, resource, 'unpublish'))
        await deny(req, collection, 'unpublish', originalDoc?.id)
    }
    // Payload's non-draft restore overwrites the live document (3.91.0). Restores must produce a
    // new draft instead (data-model §states); HTTP restores are forced to drafts by
    // restoreAsDraftEndpoint/restoreAsDraft, so this rejects payload.restoreVersion (Local API).
    if (c.contentOp === 'restore' && !c.draftArg)
      throw new APIError('Versions can only be restored as drafts', 400, undefined, true)
    if (publishing) {
      const unverified = unverifiedClaims({ ...(originalDoc ?? {}), ...data })
      if (unverified.length)
        throw new APIError(
          'Unverified claims cannot be published',
          400,
          { paths: unverified },
          true,
        )
      // Compare with the live (published) document, not originalDoc: with drafts, originalDoc is
      // the latest draft, which already carries a slug edited before this publish.
      const live = originalDoc?.id
        ? ((await req.payload
            .findByID({
              collection,
              id: originalDoc.id,
              locale: req.locale ?? 'ar',
              fallbackLocale: false,
              draft: false,
              depth: 0,
              overrideAccess: true,
              req,
            })
            .catch(() => null)) as { _status?: string; slug?: string } | null)
        : null
      if (live?._status === 'published' && live.slug && data.slug && live.slug !== data.slug)
        c.slugChange = { from: live.slug, to: data.slug, locale: req.locale ?? 'ar' }
    }
    // Restores always come back as drafts (history is never rewritten; publishing stays explicit).
    if (c.contentOp === 'restore') data._status = 'draft'
    return data
  }

export const verifyStoredContent =
  (collection: RoutedCollection): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    const full = await req.payload.findByID({
      collection,
      id: doc.id,
      locale: 'all',
      draft: true,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const issues = findContentIssues(full)
    if (issues.length) throw new APIError('Content rejected by policy', 400, { issues }, true) // rolls back
    return doc
  }

export const auditAndRevalidate =
  (collection: RoutedCollection): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    const c = ctx(req)
    const actor = req.user ? `user:${req.user.id}` : 'system'
    const target = { type: collection, id: String(doc.id) }
    const locale = c.publishLocale ?? req.locale ?? 'ar'
    if (c.contentOp === 'restore')
      await recordAudit(req.payload, {
        actor,
        action: 'content.restore',
        target,
        outcome: 'success',
        meta: { collection },
      })
    else if (doc._status === 'published')
      await recordAudit(req.payload, {
        actor,
        action: 'content.publish',
        target,
        outcome: 'success',
        meta: { collection, locale },
      })
    else if (!c.draftArg && previousDoc?._status === 'published')
      await recordAudit(req.payload, {
        actor,
        action: 'content.unpublish',
        target,
        outcome: 'success',
        meta: { collection, locale },
      })
    if (c.slugChange)
      await createSlugChangeRedirect(
        req,
        collection,
        c.slugChange.locale as Locale,
        c.slugChange.from,
        c.slugChange.to,
      )
    try {
      revalidateTag(`${collection}:${doc.id}`, 'max')
      revalidateTag(collection, 'max')
    } catch {
      // outside a Next request (scripts/tests): nothing cached to revalidate
    }
    return doc
  }

export const auditDelete =
  (collection: RoutedCollection): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    await recordAudit(req.payload, {
      actor: req.user ? `user:${req.user.id}` : 'system',
      action: 'content.delete',
      target: { type: collection, id: String(id) },
      outcome: 'success',
      meta: { collection },
    })
  }

/**
 * Restores a version as a new draft. Payload 3.91.0's Local API `restoreVersion` drops the `draft`
 * option (it always overwrites the live document), so this calls the exported operation directly.
 */
export async function restoreAsDraft(
  req: PayloadRequest,
  collection: RoutedCollection,
  id: string | number,
  depth = 0,
) {
  return restoreVersionOperation({
    id,
    collection: req.payload.collections[collection],
    depth,
    draft: true,
    overrideAccess: false,
    req,
  } as Parameters<typeof restoreVersionOperation>[0])
}

/**
 * Replaces Payload's `POST /:collection/versions/:id` (user endpoints take precedence) so every
 * HTTP restore, including the admin "Restore" button, creates a draft and never touches the live
 * document. Access and workflow checks still run inside the operation.
 */
export const restoreAsDraftEndpoint = (collection: RoutedCollection): Endpoint => ({
  path: '/versions/:id',
  method: 'post',
  handler: async (req) => {
    const id = String(req.routeParams?.id ?? '')
    if (!/^[0-9]{1,12}$/.test(id)) return Response.json({ message: 'Not Found' }, { status: 404 })
    const depth = Number(req.query?.depth ?? 0)
    const doc = await restoreAsDraft(
      req,
      collection,
      id,
      Number.isInteger(depth) && depth >= 0 && depth <= 2 ? depth : 0,
    )
    return Response.json({ doc, message: 'Restored as a draft.' }, { status: 200 })
  },
})
