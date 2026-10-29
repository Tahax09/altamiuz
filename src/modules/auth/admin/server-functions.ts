// Gate for Payload admin server functions (form state, document/list rendering, copy-to-locale,
// …). Payload admits password-only (MFA-pending) sessions to the admin so the MFA screens can
// load, and its form-state function writes document locks directly to the database. Every
// server function therefore requires a completed-MFA CMS session (FR-033, WS10 finding).
import type { Payload } from 'payload'
import { isMfaVerified, roleOf } from '../../access'

export class AdminServerFunctionDenied extends Error {
  constructor() {
    super('Forbidden')
    this.name = 'AdminServerFunctionDenied'
  }
}

export async function assertAdminServerFunctionAllowed(payload: Payload, headers: Headers) {
  const { user } = await payload.auth({ headers })
  if (!user || !isMfaVerified(user) || !roleOf(user)) throw new AdminServerFunctionDenied()
}
