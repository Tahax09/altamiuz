// CMS accounts (T056, FR-030–FR-039). No public create: accounts come only from invitations.
// Every change is checked server-side against the role rules; secrets never leave the server.
import type { CollectionConfig, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import {
  allow,
  canActOnUser,
  denyAll,
  isMfaVerified,
  isRole,
  roleOf,
  ROLES,
  type Role,
} from '../access'
import { recordAudit } from '../audit'
import { poolOf } from './db'
import { userEndpoints } from './endpoints'
import { isLastActiveOwner } from './mfa'
import { hasRecentReauth } from './reauth'
import { checkPassword } from './password'
import { revokeAllSessionsInTx, sessionStrategy, SESSION_STRATEGY } from './sessions'

type U = { id: number; role?: Role; status?: string; email?: string }

const isSystem = (req: PayloadRequest) => req.context?.authSystem === true

/** Generic "manage this account" rule: same target scope as suspend (contract rows 25–27). */
async function canManage(
  req: PayloadRequest,
  target: U,
  action: 'suspend' | 'changeRole',
  newRole?: Role,
) {
  const allowed = await canManageInner(req, target, action, newRole)
  if (!allowed && req.user)
    await recordAudit(req.payload, {
      actor: `user:${req.user.id}`,
      action: 'access.denied',
      target: { type: 'users', id: String(target.id) },
      outcome: 'denied',
      meta: { resource: 'users', action: action === 'changeRole' ? 'change_role' : 'manage' },
    })
  return allowed
}

async function canManageInner(
  req: PayloadRequest,
  target: U,
  action: 'suspend' | 'changeRole',
  newRole?: Role,
) {
  const actor = roleOf(req.user)
  if (!actor || !isMfaVerified(req.user) || !isRole(target.role)) return false
  if (!hasRecentReauth(req.user)) throw new APIError('Recent re-authentication required', 403)
  return canActOnUser(actor, action, {
    targetRole: target.role,
    newRole,
    isSelf: String(req.user?.id) === String(target.id),
    targetIsLastOwner: await isLastActiveOwner(req.payload, target),
  })
}

export const users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Security',
    defaultColumns: ['email', 'name', 'role', 'status'],
  },
  auth: {
    tokenExpiration: 12 * 3600, // A-6 absolute lifetime (also enforced per session state)
    maxLoginAttempts: 0, // lockout is the per-account limiter in login.ts (ADR-005)
    useSessions: true,
    verify: false,
    // `secure` is set from SITE_URL in payload.config.ts (no config reads at import time).
    cookies: { secure: true, sameSite: 'Lax' },
    strategies: [sessionStrategy],
  },
  access: {
    // Admin panel reachable after the password step (so MFA can be completed); data needs MFA.
    admin: ({ req }) =>
      !!req.user &&
      (req.user as { _strategy?: string })._strategy === SESSION_STRATEGY &&
      (req.user as U).status !== 'suspended',
    read: allow('users', 'read'),
    create: denyAll,
    update: allow('users', 'read'),
    delete: allow('users', 'read'),
    unlock: denyAll,
  },
  endpoints: userEndpoints,
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 100 },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: ROLES.map((r) => ({ label: r, value: r })),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'invited',
      options: ['invited', 'active', 'suspended'].map((s) => ({ label: s, value: s })),
    },
    {
      name: 'securityActions',
      type: 'ui',
      admin: {
        components: { Field: '/modules/auth/admin/UserSecurityActions#UserSecurityActions' },
      },
    },
  ],
  hooks: {
    // Session identifiers never leave the server in user-context reads. Payload's own auth reads
    // run without req.user and still see them.
    afterRead: [
      ({ doc, req }) => {
        if (req.user && doc && typeof doc === 'object')
          delete (doc as Record<string, unknown>).sessions
        return doc
      },
    ],
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (data && typeof data.password === 'string') {
          const problem = checkPassword(data.password, {
            email: (data.email ?? originalDoc?.email) as string,
          })
          if (problem) throw new APIError(`Password rejected: ${problem}`, 400)
        }
        if (data?.email) data.email = String(data.email).trim().toLowerCase()
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (isSystem(req) || operation !== 'update') return data
        const target = originalDoc as U
        if ('password' in data) throw new APIError('Use the password change or recovery flow', 403)
        const roleChange = data.role !== undefined && data.role !== target.role
        if (roleChange && !(await canManage(req, target, 'changeRole', data.role)))
          throw new APIError('Forbidden', 403)
        if (!roleChange && !(await canManage(req, target, 'suspend')))
          throw new APIError('Forbidden', 403)
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== 'update') return doc
        const actor = req.user ? `user:${req.user.id}` : 'system'
        if (previousDoc?.role && doc.role !== previousDoc.role) {
          await recordAudit(req.payload, {
            actor,
            action: 'user.role_change',
            target: { type: 'users', id: String(doc.id) },
            outcome: 'success',
            meta: { from: previousDoc.role, to: doc.role },
          })
          await revokeAllSessionsInTx(req, doc.id) // privilege change → new sessions
        }
        if (doc.status === 'suspended' && previousDoc?.status !== 'suspended') {
          await recordAudit(req.payload, {
            actor,
            action: 'user.suspend',
            target: { type: 'users', id: String(doc.id) },
            outcome: 'success',
          })
          await revokeAllSessionsInTx(req, doc.id)
        }
        return doc
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const target = (await req.payload.findByID({
          collection: 'users',
          id,
          overrideAccess: true,
          depth: 0,
          req,
        })) as unknown as U
        if (!(await canManage(req, target, 'suspend'))) throw new APIError('Forbidden', 403)
      },
    ],
    afterDelete: [
      async ({ id, req }) => {
        await recordAudit(req.payload, {
          actor: req.user ? `user:${req.user.id}` : 'system',
          action: 'user.delete',
          target: { type: 'users', id: String(id) },
          outcome: 'success',
        })
      },
    ],
    afterLogout: [
      async ({ req }) => {
        const sid = (req.user as { _sid?: string } | null)?._sid
        if (sid)
          await poolOf(req.payload).query('delete from auth_sessions where session_id = $1', [sid])
        if (req.user)
          await recordAudit(req.payload, {
            actor: `user:${req.user.id}`,
            action: 'auth.logout',
            target: { type: 'users', id: String(req.user.id) },
            outcome: 'success',
          })
      },
    ],
  },
}
