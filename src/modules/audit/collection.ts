// Append-only audit log (D-9). No create/update/delete through any API for any role; entries are
// written only by recordAudit(). The database additionally rejects UPDATE/DELETE/TRUNCATE
// (migration *_audit_append_only).
import type { CollectionConfig } from 'payload'
import { allow, denyAll } from '../access'
import { AUDIT_ACTION_VALUES, AUDIT_OUTCOMES } from './events'

export const AUDIT_COLLECTION = 'audit-events'

export const auditEvents: CollectionConfig = {
  slug: AUDIT_COLLECTION,
  timestamps: false,
  lockDocuments: false,
  disableDuplicate: true,
  admin: { useAsTitle: 'action', defaultColumns: ['at', 'actor', 'action', 'outcome'] },
  access: {
    read: allow('audit-events', 'read'),
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  indexes: [
    { fields: ['actor', 'at'] },
    { fields: ['action', 'at'] },
    { fields: ['targetType', 'targetId'] },
  ],
  fields: [
    { name: 'at', type: 'date', required: true, index: true },
    { name: 'actor', type: 'text', required: true, maxLength: 128 },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: AUDIT_ACTION_VALUES.map((v) => ({ label: v, value: v })),
    },
    { name: 'targetType', type: 'text', maxLength: 64 },
    { name: 'targetId', type: 'text', maxLength: 128 },
    {
      name: 'outcome',
      type: 'select',
      required: true,
      options: AUDIT_OUTCOMES.map((v) => ({ label: v, value: v })),
    },
    { name: 'ip', type: 'text', maxLength: 64 },
    { name: 'userAgent', type: 'text', maxLength: 256 },
    { name: 'meta', type: 'json' },
  ],
}
