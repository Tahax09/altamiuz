// Redirects (T118, FR-064, D-13): `from` and `to` are normalised site paths (paths.ts); external
// targets are refused (no external allow-list has been approved, so every target is internal).
// Graph rules on every write: no self-redirect, no loop, no chain: a target may not itself be
// redirected, and a source may not be the target of another redirect. Every change is audited.
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Where,
} from 'payload'
import { publicError } from '../../content/errors'
import { normaliseSitePath } from '../paths'
import { allow } from '../../access'
import { recordAudit } from '../../audit'
import { expireCacheTags } from '../../platform'

/** Normalise both paths before validation, so equivalent spellings collide on `from` uniqueness. */
const normalise: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (!data) return data
  for (const k of ['from', 'to'] as const)
    if (typeof data[k] === 'string') {
      const n = normaliseSitePath(data[k])
      if (n) data[k] = n // otherwise the field validator rejects the original value
    }
  if (operation === 'create' && req.user && !data.createdBy) data.createdBy = req.user.id
  return data
}

const graphError = (message: string) => publicError(message, 400, { reason: 'redirectGraph' })

const graphRules: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const from = (data.from ?? originalDoc?.from) as string
  const to = (data.to ?? originalDoc?.to) as string
  if (from === to) throw graphError('A redirect cannot point to itself.')
  const others = (where: Where) =>
    req.payload.find({
      collection: 'redirects',
      where: originalDoc?.id ? { and: [where, { id: { not_equals: originalDoc.id } }] } : where,
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
  // Target is itself a redirect source: visitors would follow a chain (or a loop back to `from`).
  if ((await others({ from: { equals: to } })).totalDocs)
    throw graphError('The target is itself redirected. Point to the final page instead.')
  // Some redirect already points at this source: that redirect would become a chain.
  if ((await others({ to: { equals: from } })).totalDocs)
    throw graphError('Another redirect points to this source. Update that redirect first.')
  return data
}

export const redirects: CollectionConfig = {
  slug: 'redirects',
  admin: { useAsTitle: 'from', group: 'SEO', defaultColumns: ['from', 'to', 'type', 'source'] },
  access: {
    read: allow('redirects', 'read'),
    create: allow('redirects', 'create'),
    update: allow('redirects', 'update'),
    delete: allow('redirects', 'delete'),
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 512,
      validate: (v: unknown) =>
        normaliseSitePath(v) === v || 'Use a site path starting with a single /.',
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      maxLength: 512,
      validate: (v: unknown) =>
        normaliseSitePath(v) === v || 'Use a site path starting with a single /.',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: '301',
      options: ['301', '302'].map((v) => ({ label: v, value: v })),
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: ['manual', 'slug-change', 'legacy'].map((v) => ({ label: v, value: v })),
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
  hooks: {
    beforeValidate: [normalise],
    beforeChange: [graphRules],
    afterChange: [
      async ({ doc, operation, req }) => {
        await recordAudit(req.payload, {
          actor: req.user ? `user:${req.user.id}` : 'system',
          action: 'redirect.change',
          target: { type: 'redirects', id: String(doc.id) },
          outcome: 'success',
          meta: { operation },
        })
        revalidateRedirects()
        return doc
      },
    ],
    afterDelete: [() => revalidateRedirects()],
  },
}

function revalidateRedirects() {
  expireCacheTags('redirects')
}
