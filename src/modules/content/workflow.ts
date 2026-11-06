// Draft/publish workflow (T089, FR-016, FR-020–FR-025, FR-045). Publishing, unpublishing and
// restoring are separate permissions from draft editing; claims must be verified to publish; every
// write is re-checked across ALL locales inside the transaction (defence in depth for restore,
// duplicate and copy-to-locale, which carry other locales the field hooks do not see).
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  Endpoint,
  Field,
  PayloadRequest,
} from 'payload'
import { commitTransaction, initTransaction, killTransaction, NotFound } from 'payload'
import type { Resource } from '../access'
import { recordAudit } from '../audit'
import { assertPublishableImages, invalidatePublicMedia } from '../media'
import { expireCacheTags } from '../platform'
import { LOCALES, type Locale, type RoutedCollection } from '../i18n'
import { createSlugChangeRedirect } from '../seo'
import { mayDo } from './access'
import { storedClaimProblems, unverifiedClaims } from './evidence'
import { isLocaleCopy } from './locale-copy'
import { findContentIssues } from './richtext/walk'
import { publicError } from './errors'

type Ctx = {
  contentOp?: 'restore' | 'update' | 'create'
  draftArg?: boolean
  restoring?: boolean
  baseUpdatedAt?: number
  unpublishAll?: boolean
  /** This write publishes (set by the workflow gate; read by the stored-claim backstop). */
  publishing?: boolean
  publishLocale?: string
  slugChange?: { from: string; to: string; locale: string }
}
export const ctx = (req: PayloadRequest) => (req.context.content ??= {}) as Ctx

export async function deny(
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
  throw publicError('Forbidden', 403)
}

/**
 * FR-015 optimistic concurrency: the admin form sends the `updatedAt` it loaded with every save.
 * Payload resets updatedAt itself, so the client value is only used as a precondition.
 */
export function captureBaseUpdatedAt(req: PayloadRequest, data: unknown) {
  const c = ctx(req)
  c.baseUpdatedAt = undefined
  const base = (data as { updatedAt?: unknown } | undefined)?.updatedAt
  if (base === undefined || base === null) return
  const ms = typeof base === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(base) ? Date.parse(base) : NaN
  if (Number.isNaN(ms)) throw publicError('Invalid updatedAt', 400, { reason: 'policy' })
  c.baseUpdatedAt = ms
}

/** Second of two conflicting saves (FR-015): Payload deletes document locks on every save, so a
 * stale form could otherwise overwrite a newer draft. originalDoc is the latest draft. */
export function assertNotStale(
  req: PayloadRequest,
  originalDoc: { updatedAt?: unknown } | undefined,
) {
  const base = ctx(req).baseUpdatedAt
  const currentMs = originalDoc?.updatedAt ? Date.parse(String(originalDoc.updatedAt)) : NaN
  if (base !== undefined && !Number.isNaN(currentMs) && base < currentMs)
    throw publicError(
      'This document was changed by someone else after you opened it. Reload it to see their changes before saving.',
      409,
      { reason: 'stale' },
    )
}

/** FR-004 + data-model `seo` group: title and description are required to publish a locale. */
export function assertSeoComplete(seo: unknown, base = 'seo') {
  const v = (seo ?? {}) as { title?: unknown; description?: unknown }
  const missing = (['title', 'description'] as const).filter(
    (k) => typeof v[k] !== 'string' || (v[k] as string).trim() === '',
  )
  if (missing.length)
    throw publicError(`SEO ${missing.join(' and ')} required to publish`, 400, {
      paths: missing.map((k) => `${base}.${k}`),
    })
}

/** Publish/unpublish intent of a write (same rules for collections and globals). */
export function publicationIntent(req: PayloadRequest, data: { _status?: unknown }) {
  const c = ctx(req)
  // Payload 3.91.0 publishes when `_status: 'published'` is sent even with `draft: true`, and a
  // non-draft update without `_status` writes the live document. So: any non-draft update is a
  // publish, or an unpublish when it asks for `draft`; `unpublishAllLocales` is an unpublish.
  const liveWrite = c.contentOp === 'update' && !c.draftArg
  const publishing = data._status === 'published' || (liveWrite && data._status !== 'draft')
  const unpublishing = !publishing && (c.unpublishAll === true || liveWrite)
  return { publishing, unpublishing }
}

/**
 * WS11 M-2, other locales: `data._status` (above) only covers the request locale. With
 * `localizeStatus`, Payload copies every other locale's `_status` from the source, so a duplicate
 * of a page published in both languages was born published in the other one, for any role that
 * may create. Payload merges this declaration into its own `_status` field (mergeBaseFields); the
 * field-level beforeDuplicate hook runs per locale on the source copy before anything is written.
 */
export const statusDraftOnDuplicate: Field = {
  name: '_status',
  type: 'select',
  options: [], // the base field's options are kept (arrays are concatenated on merge)
  hooks: { beforeDuplicate: [() => 'draft'] },
}

/** Makes an update a plain draft save of the request locale. */
export function forceDraft(args: unknown) {
  const a = args as {
    draft?: boolean
    publishSpecificLocale?: string
    publishAllLocales?: boolean
    unpublishAllLocales?: unknown
    data?: Record<string, unknown>
  }
  a.draft = true
  a.publishSpecificLocale = undefined
  a.publishAllLocales = false
  a.unpublishAllLocales = false
  a.data = { ...(a.data ?? {}), _status: 'draft' }
}

export const captureOperation: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  const c = ctx(req)
  // Payload's restoreVersion is never used: it overwrites the live document unless `draft` is set
  // (and the Local API drops `draft`), and it validates only the default locale. restoreAsDraft()
  // is the only restore path; the HTTP route is replaced by restoreAsDraftEndpoint.
  if (operation === 'restoreVersion')
    throw publicError('Use the restore endpoint; versions are restored as drafts', 400, undefined)
  // Duplicates are always drafts (WS11 M-2). Payload's duplicate is createOperation with
  // `duplicateFromID`; non-draft, it copies the source's per-locale `_status`, which would publish
  // the copy implicitly. Publishing stays an explicit, permission-checked and audited action.
  if (operation === 'create' && (args as { duplicateFromID?: unknown }).duplicateFromID != null) {
    const a = args as {
      draft?: boolean
      publishAllLocales?: boolean
      data?: Record<string, unknown>
    }
    a.draft = true
    a.publishAllLocales = false
    a.data = { ...(a.data ?? {}), _status: 'draft' }
  }
  // L-2: the admin "copy to locale" action writes the source language's content, including its
  // publication status, into the target language. A copy is always a draft; publishing it is a
  // separate, permission-checked and audited action.
  if (operation === 'update' && isLocaleCopy()) forceDraft(args)
  if (operation === 'update' || operation === 'create') {
    c.contentOp = c.restoring && operation === 'update' ? 'restore' : operation
    c.draftArg = (args as { draft?: boolean }).draft === true
    c.publishLocale = (args as { publishSpecificLocale?: string }).publishSpecificLocale
    const all = (args as { unpublishAllLocales?: unknown }).unpublishAllLocales
    c.unpublishAll = all === true || all === 'true'
    if (operation === 'update') captureBaseUpdatedAt(req, (args as { data?: unknown }).data)
    // Reject unsafe or malformed rich text before Payload's own lexical hooks walk it (a
    // non-array `children` otherwise surfaces as a 500 from inside the editor adapter).
    const issues = findContentIssues((args as { data?: unknown }).data)
    if (issues.length) throw publicError('Content rejected by policy', 400, { issues })
  }
  return args
}

export const enforceWorkflow =
  (collection: RoutedCollection): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    const c = ctx(req)
    const resource = collection as Resource
    const { publishing, unpublishing } = publicationIntent(req, data)
    c.publishing = publishing
    assertNotStale(req, originalDoc)
    if (req.user) {
      if (c.contentOp === 'restore' && !mayDo(req, resource, 'restore'))
        await deny(req, collection, 'restore', originalDoc?.id)
      if (publishing && !mayDo(req, resource, 'publish'))
        await deny(req, collection, 'publish', originalDoc?.id)
      if (unpublishing && !mayDo(req, resource, 'unpublish'))
        await deny(req, collection, 'unpublish', originalDoc?.id)
    }
    // Restores must produce a new draft and never write the live document (data-model §states).
    if (c.contentOp === 'restore' && !c.draftArg)
      throw publicError('Versions can only be restored as drafts', 400, { reason: 'policy' })
    if (publishing) {
      const unverified = unverifiedClaims({ ...(originalDoc ?? {}), ...data })
      if (unverified.length)
        throw publicError('Unverified claims cannot be published', 400, { paths: unverified })
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
    if (issues.length) throw publicError('Content rejected by policy', 400, { issues }) // rolls back
    // L-1 backstop: a publish needs every claim verified for exactly what is stored (rolls back).
    if (ctx(req).publishing) {
      const unverified = storedClaimProblems(full as unknown as Record<string, unknown>)
      if (unverified.length)
        throw publicError('Unverified claims cannot be published', 400, { paths: unverified })
    }
    // FR-004 backstop: every published locale has its SEO title and description (rolls back).
    const status = (full as { _status?: unknown })._status
    const seo = ((full as { seo?: unknown }).seo ?? {}) as Record<string, unknown>
    if (status && typeof status === 'object')
      for (const [locale, st] of Object.entries(status as Record<string, unknown>))
        if (st === 'published')
          assertSeoComplete(
            Object.fromEntries(
              ['title', 'description'].map((k) => [
                k,
                (seo[k] as Record<string, unknown> | undefined)?.[locale],
              ]),
            ),
            `seo(${locale})`,
          )
    // FR-054 backstop: images shown in a published locale have alt text there or are decorative.
    if (status && typeof status === 'object')
      await assertPublishableImages(
        req,
        req.payload.collections[collection]!.config.fields,
        full as unknown as Record<string, unknown>,
        Object.entries(status as Record<string, unknown>)
          .filter(([, st]) => st === 'published')
          .map(([locale]) => locale),
      )
    return doc
  }

export const auditAndRevalidate =
  (collection: RoutedCollection): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    const c = ctx(req)
    const actor = req.user ? `user:${req.user.id}` : 'system'
    const target = { type: collection, id: String(doc.id) }
    const locale = c.publishLocale ?? req.locale ?? 'ar'
    if (c.contentOp === 'restore') {
      // audited once by restoreAsDraft, after every locale has been written
    } else if (doc._status === 'published')
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
    expireCacheTags(`${collection}:${doc.id}`, collection)
    invalidatePublicMedia() // published media set (FR-056) may have changed
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
    expireCacheTags(`${collection}:${id}`, collection)
    invalidatePublicMedia()
  }

const SYSTEM_KEYS = new Set(['id', '_status', 'createdAt', 'updatedAt', 'deletedAt'])

/**
 * Restores a version as a new draft (FR-024, ADR-006). Each locale the version contains is written
 * with a normal draft `update`, so every locale is validated (D-22) and checked by the rich-text
 * policy. All of it runs in one transaction: any failure leaves the document untouched. Locales
 * the version has no content for keep their current draft. Payload's own restoreVersion is not
 * used (see captureOperation).
 */
export async function restoreAsDraft(
  req: PayloadRequest,
  collection: RoutedCollection,
  versionId: string | number,
  depth = 0,
) {
  if (!mayDo(req, collection as Resource, 'restore'))
    await deny(req, collection, 'restore', versionId)
  const version = await req.payload
    .findVersionByID({
      collection,
      id: String(versionId),
      locale: 'all',
      depth: 0,
      overrideAccess: false,
      req,
    })
    .catch(() => null)
  if (!version) throw new NotFound(req.t)
  const parent = version.parent as unknown
  const parentId =
    typeof parent === 'object' && parent
      ? (parent as { id: number | string }).id
      : (parent as number)

  const c = ctx(req)
  const shouldCommit = await initTransaction(req)
  const restored: Locale[] = []
  try {
    c.restoring = true
    for (const locale of LOCALES) {
      const v = await req.payload.findVersionByID({
        collection,
        id: String(versionId),
        locale,
        fallbackLocale: false,
        depth: 0,
        overrideAccess: true,
        req,
      })
      const data = Object.fromEntries(
        Object.entries(v.version as unknown as Record<string, unknown>).filter(
          ([k]) => !SYSTEM_KEYS.has(k),
        ),
      )
      if (typeof data.title !== 'string' || data.title.trim() === '') continue // locale not in version
      await req.payload.update({
        collection,
        id: parentId,
        locale,
        draft: true,
        data: data as never,
        overrideAccess: false,
        req,
      })
      restored.push(locale)
    }
    if (!restored.length)
      throw publicError('This version has no content to restore', 400, { reason: 'policy' })
    await recordAudit(req.payload, {
      actor: req.user ? `user:${req.user.id}` : 'system',
      action: 'content.restore',
      target: { type: collection, id: String(parentId) },
      outcome: 'success',
      meta: { collection, version: String(versionId), locales: restored.join(',') },
    })
    if (shouldCommit) await commitTransaction(req)
  } catch (e) {
    if (shouldCommit) await killTransaction(req)
    throw e
  } finally {
    c.restoring = false
  }
  return req.payload.findByID({
    collection,
    id: parentId,
    draft: true,
    depth,
    locale: req.locale ?? 'ar',
    overrideAccess: false,
    req,
  })
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
