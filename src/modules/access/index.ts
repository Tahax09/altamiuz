// Authorization (D-8, FR-036–FR-038): the single decision point for every collection, global and
// field access function. Deny by default; requires an authenticated, MFA-verified session.
import type { Access, FieldAccess } from 'payload'
import { MATRIX, ROLES, type Action, type Resource, type Role, type UserAction } from './matrix'

export { MATRIX, ROLES, type Action, type Resource, type Role, type UserAction } from './matrix'

const rank = (r: Role) => ROLES.indexOf(r)
const own = Object.prototype.hasOwnProperty

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/** Matrix lookup. Unknown roles, resources or actions are denied. */
export function can(role: Role, resource: Resource, action: Action): boolean {
  if (!isRole(role) || !own.call(MATRIX, resource)) return false
  const grants = MATRIX[resource]
  if (!own.call(grants, action)) return false
  return (grants[action] ?? []).includes(role)
}

export type UserTarget = {
  targetRole: Role
  targetIsLastOwner: boolean
  isSelf: boolean
  /** Required for `changeRole`. */
  newRole?: Role
}

/** Account-management decisions with the contract's target qualifiers and invariants. */
export function canActOnUser(actor: Role, action: UserAction, t: UserTarget): boolean {
  if (!isRole(actor) || !isRole(t.targetRole)) return false
  if (actor === 'editor' || actor === 'publisher') return false

  if (action === 'changeRole') {
    if (!isRole(t.newRole)) return false
    if (rank(t.newRole) > rank(actor)) return false // never grant above own role (incl. self)
    if (t.targetIsLastOwner && t.newRole !== 'owner') return false // last owner stays owner
    if (actor === 'owner') return true
    // administrator: editor/publisher targets, to ≤ publisher
    return rank(t.targetRole) <= rank('publisher') && rank(t.newRole) <= rank('publisher')
  }

  if (action === 'invite') {
    // Owners may invite any role (incl. owner); everyone else only strictly below their own.
    return actor === 'owner' || rank(t.targetRole) < rank(actor)
  }

  // suspend, revokeSessions, resetMfa
  if (t.targetIsLastOwner) return false
  if (actor === 'owner') return true
  return rank(t.targetRole) <= rank('publisher')
}

type SessionUser = { role?: unknown; mfaVerified?: unknown }

/** Role of an authenticated user, or null. */
export function roleOf(user: unknown): Role | null {
  if (!user || typeof user !== 'object') return null
  const role = (user as SessionUser).role
  return isRole(role) ? role : null
}

/**
 * True only when the session completed the second factor. The flag is set server-side by the
 * session strategy (Phase 3, T061/T062); until then no session is MFA-verified.
 */
export function isMfaVerified(user: unknown): boolean {
  return !!user && typeof user === 'object' && (user as SessionUser).mfaVerified === true
}

/** Collection/global access function for one matrix cell. */
export function allow(resource: Resource, action: Action): Access {
  return ({ req }) => {
    const user = req?.user
    if (!user || !isMfaVerified(user)) return false
    const role = roleOf(user)
    return role !== null && can(role, resource, action)
  }
}

export const denyAll: Access = () => false
export const denyField: FieldAccess = () => false
