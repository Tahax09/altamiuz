// The only write path into the audit log (FR-045, FR-046).
import type { Payload } from 'payload'
import { emitSignal } from '../platform/signals'
import { AUDIT_ACTIONS, type AuditAction, type AuditOutcome } from './events'
import { AUDIT_COLLECTION } from './collection'

export class AuditMetaError extends Error {
  constructor(reason: string) {
    super(`Audit meta rejected: ${reason}`)
    this.name = 'AuditMetaError'
  }
}

const SECRET_LIKE = /pass|secret|token|otp|totp|code|cookie|session|authori|key|hash|salt/i

export type AuditEventInput = {
  actor: string
  action: AuditAction
  target?: { type: string; id: string }
  outcome: AuditOutcome
  ip?: string
  userAgent?: string
  meta?: Record<string, string | number | boolean | null>
}

function checkMeta(action: AuditAction, meta: AuditEventInput['meta']): void {
  if (meta === undefined) return
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta))
    throw new AuditMetaError('not an object')
  const allowed: readonly string[] = AUDIT_ACTIONS[action]
  for (const [k, v] of Object.entries(meta)) {
    if (SECRET_LIKE.test(k)) throw new AuditMetaError(`secret-like key "${k}"`)
    if (!allowed.includes(k)) throw new AuditMetaError(`key "${k}" not allowed for ${action}`)
    if (v !== null && !['string', 'number', 'boolean'].includes(typeof v))
      throw new AuditMetaError(`key "${k}" must be a primitive`)
    if (typeof v === 'string' && v.length > 128) throw new AuditMetaError(`key "${k}" too long`)
  }
}

export async function recordAudit(payload: Payload, e: AuditEventInput) {
  if (!Object.prototype.hasOwnProperty.call(AUDIT_ACTIONS, e.action))
    throw new AuditMetaError('unknown action')
  checkMeta(e.action, e.meta)
  // FR-100: failed sign-ins and lockouts are also monitoring signals (content-free).
  if (e.action === 'auth.login.failure')
    emitSignal('auth.login_failure', { reason: e.meta?.reason ?? null })
  else if (e.action === 'auth.lockout') emitSignal('auth.lockout')
  return payload.create({
    collection: AUDIT_COLLECTION as never,
    overrideAccess: true,
    data: {
      at: new Date().toISOString(),
      actor: e.actor.slice(0, 128),
      action: e.action,
      targetType: e.target?.type.slice(0, 64),
      targetId: e.target?.id.slice(0, 128),
      outcome: e.outcome,
      ip: e.ip?.slice(0, 64),
      userAgent: e.userAgent?.slice(0, 256),
      meta: e.meta,
    } as never,
  }) as Promise<Record<string, unknown> & { id: string | number }>
}
