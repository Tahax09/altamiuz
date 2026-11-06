// Enquiry inbox (US5, T123, T126; FR-070, FR-074, FR-076, FR-077, FR-078; data-model `enquiries`).
// Written only by the server (public submission and delivery job, both with overrideAccess);
// nobody edits an enquiry. Read, export and delete are separate permissions (Administrator and
// Owner). Every document a user is shown is audited as `enquiry.view`, every deletion as
// `enquiry.delete`; audit entries carry no enquiry content (FR-046, FR-078).
import type { CollectionAfterDeleteHook, CollectionAfterReadHook, CollectionConfig } from 'payload'
import { allow, can, denyAll, isMfaVerified, roleOf } from '../access'
import { recordAudit } from '../audit'
import { exportEnquiriesCsv } from './export'
import { LIMITS } from './schema'

export const ENQUIRIES = 'enquiries'
export const DELIVERY_STATUSES = ['pending', 'sent', 'retrying', 'failed'] as const
export const RETENTION_MONTHS = 12

/** createdAt + 12 months (FR-077), in UTC. */
export function deleteAfterFor(created: Date): string {
  const d = new Date(created)
  d.setUTCMonth(d.getUTCMonth() + RETENTION_MONTHS)
  return d.toISOString()
}

/** Context flag for system reads/deletes that are not a person viewing enquiries. */
export const SYSTEM_CONTEXT = { enquirySystem: true } as const

const auditView: CollectionAfterReadHook = async ({ doc, req, context }) => {
  if (!req.user || context?.enquirySystem) return doc
  await recordAudit(req.payload, {
    actor: `user:${req.user.id}`,
    action: 'enquiry.view',
    target: { type: ENQUIRIES, id: String(doc.id) },
    outcome: 'success',
  })
  return doc
}

const auditDelete: CollectionAfterDeleteHook = async ({ id, req, context }) => {
  if (context?.enquirySystem) return // retention: one content-free summary entry instead
  await recordAudit(req.payload, {
    actor: req.user ? `user:${req.user.id}` : 'system',
    action: 'enquiry.delete',
    target: { type: ENQUIRIES, id: String(id) },
    outcome: 'success',
  })
}

const readOnly = { readOnly: true } as const

export const enquiries: CollectionConfig = {
  slug: ENQUIRIES,
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['createdAt', 'name', 'topic', 'locale', 'delivery.status'],
    description:
      'Contact form submissions. Opening or exporting enquiries is recorded in the audit log. Enquiries are deleted automatically 12 months after submission.',
    // Nothing to create or duplicate by hand.
    disableCopyToLocale: true,
  },
  disableDuplicate: true,
  access: {
    read: allow('enquiries', 'read'),
    create: denyAll,
    update: denyAll,
    delete: allow('enquiries', 'delete'),
  },
  endpoints: [
    {
      path: '/export',
      method: 'get',
      handler: async (req) => {
        const role = roleOf(req.user)
        const reauthAt = (req.user as { reauthAt?: string } | null)?.reauthAt
        const recent =
          typeof reauthAt === 'string' && Date.now() - new Date(reauthAt).getTime() <= 5 * 60_000
        if (!req.user || !isMfaVerified(req.user) || !role || !can(role, 'enquiries', 'export'))
          return Response.json({ error: 'forbidden' }, { status: 403 })
        if (!recent) return Response.json({ error: 'reauth_required' }, { status: 403 })
        return exportEnquiriesCsv(req)
      },
    },
  ],
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: LIMITS.name, admin: readOnly },
    { name: 'email', type: 'email', required: true, admin: readOnly }, // ≤254 enforced by the schema
    { name: 'phone', type: 'text', maxLength: LIMITS.phone, admin: readOnly },
    { name: 'organization', type: 'text', maxLength: LIMITS.organization, admin: readOnly },
    { name: 'topic', type: 'text', required: true, maxLength: LIMITS.topic, admin: readOnly },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: LIMITS.message,
      admin: { ...readOnly, rows: 12 },
    },
    { name: 'consent', type: 'checkbox', required: true, admin: readOnly },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: ['ar', 'en'].map((v) => ({ label: v, value: v })),
      admin: readOnly,
    },
    {
      name: 'delivery',
      type: 'group',
      admin: { ...readOnly, description: 'Staff email notification (FR-074).' },
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: DELIVERY_STATUSES.map((v) => ({ label: v, value: v })),
          index: true,
        },
        { name: 'attempts', type: 'number', defaultValue: 0, min: 0 },
        // An error code only (e.g. smtp, no_recipients), never a transport message.
        { name: 'lastError', type: 'text', maxLength: 40 },
        { name: 'sentAt', type: 'date' },
      ],
    },
    {
      name: 'deleteAfter',
      type: 'date',
      required: true,
      index: true,
      admin: { ...readOnly, description: 'Automatic deletion date (12 months after submission).' },
    },
  ],
  hooks: { afterRead: [auditView], afterDelete: [auditDelete] },
}
