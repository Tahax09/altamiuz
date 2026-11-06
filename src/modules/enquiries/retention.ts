// FR-077, D-15: enquiries are hard-deleted 12 months after submission (`deleteAfter`). One
// content-free audit entry per run (`enquiry.retention_delete` with the count), never one per
// enquiry and never with enquiry data.
import type { Payload } from 'payload'
import { recordAudit } from '../audit'
import { ENQUIRIES, SYSTEM_CONTEXT } from './collection'

export async function purgeExpiredEnquiries(payload: Payload, now = new Date()): Promise<number> {
  const res = await payload.delete({
    collection: ENQUIRIES as never,
    where: { deleteAfter: { less_than: now.toISOString() } },
    overrideAccess: true,
    context: SYSTEM_CONTEXT,
    depth: 0,
  })
  const count = res.docs.length
  await recordAudit(payload, {
    actor: 'system',
    action: 'enquiry.retention_delete',
    target: { type: ENQUIRIES, id: 'retention' },
    outcome: res.errors.length ? 'failure' : 'success',
    meta: { count },
  })
  return count
}
