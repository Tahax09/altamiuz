// FR-045: every denied attempt on a protected operation is audited (root afterError hook).
import type { AfterErrorHook } from 'payload'
import { recordAudit } from './record'

export const auditDeniedOperations: AfterErrorHook = async ({ error, req, collection }) => {
  const status = (error as { status?: number }).status
  if (status !== 403 || !req?.payload) return
  const resource = collection?.slug ?? 'unknown'
  if (resource === 'audit-events' && req.method === 'POST') return // never recurse on audit writes
  await recordAudit(req.payload, {
    actor: req.user ? `user:${req.user.id}` : 'anonymous',
    action: 'access.denied',
    target: { type: resource, id: String(req.routeParams?.id ?? '-') },
    outcome: 'denied',
    userAgent: req.headers?.get('user-agent') ?? undefined,
    meta: { resource, action: (req.method ?? 'unknown').toLowerCase() },
  }).catch(() => undefined)
}
