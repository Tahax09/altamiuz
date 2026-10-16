// Minimal redirects collection: US2 prerequisite for slug-change redirects (T090) and collision
// checks (T080). Graph validation (loops/chains/external targets) and proxy lookup are T118.
import type { CollectionConfig } from 'payload'
import { allow } from '../../access'
import { recordAudit } from '../../audit'

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
        (typeof v === 'string' && /^\/[^\s\\]*$/.test(v) && !v.startsWith('//')) ||
        'Use a site path starting with a single /.',
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      maxLength: 512,
      validate: (v: unknown) =>
        (typeof v === 'string' && /^\/[^\s\\]*$/.test(v) && !v.startsWith('//')) ||
        'Use a site path starting with a single /.',
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
    afterChange: [
      async ({ doc, operation, req }) => {
        await recordAudit(req.payload, {
          actor: req.user ? `user:${req.user.id}` : 'system',
          action: 'redirect.change',
          target: { type: 'redirects', id: String(doc.id) },
          outcome: 'success',
          meta: { operation },
        })
        return doc
      },
    ],
  },
}
