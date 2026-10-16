// FR-045 audit actions and the metadata each may carry (FR-046: no secrets, no content).
export const AUDIT_ACTIONS = {
  'auth.login.success': [],
  'auth.login.failure': ['reason'],
  'auth.logout': [],
  'auth.lockout': [],
  'auth.recovery.request': [],
  'auth.recovery.complete': [],
  'mfa.enrol': [],
  'mfa.reset': [],
  'mfa.remove': [],
  'mfa.recovery_code_used': ['remaining'],
  'session.revoke': ['scope'],
  'user.invite': ['role'],
  'user.create': ['role'],
  'user.suspend': [],
  'user.delete': [],
  'user.role_change': ['from', 'to'],
  'content.publish': ['collection', 'locale'],
  'content.unpublish': ['collection', 'locale'],
  'content.restore': ['collection', 'version'],
  'content.delete': ['collection'],
  'media.delete': [],
  'redirect.change': ['operation'],
  'navigation.change': ['global', 'operation'],
  'settings.change': ['global'],
  'enquiry.view': [],
  'enquiry.export': ['count'],
  'enquiry.delete': [],
  'enquiry.retention_delete': ['count'],
  'access.denied': ['resource', 'action'],
  'audit.retention_purge': ['count'],
} as const satisfies Record<string, readonly string[]>

export type AuditAction = keyof typeof AUDIT_ACTIONS
export const AUDIT_ACTION_VALUES = Object.keys(AUDIT_ACTIONS) as AuditAction[]
export const AUDIT_OUTCOMES = ['success', 'denied', 'failure'] as const
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number]
