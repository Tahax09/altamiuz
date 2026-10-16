// Invitation-only accounts (FR-030, FR-031) and the one-time first-owner bootstrap.
import type { CollectionConfig, Payload } from 'payload'
import { APIError } from 'payload'
import { allow, canActOnUser, denyAll, isRole, roleOf, ROLES } from '../access'
import { recordAudit } from '../audit'
import { limitKey } from '../platform'
import { randomToken, sha256 } from './crypto'
import { poolOf } from './db'
import { accountLink, sendNotice } from './emails'
import { checkPassword, type PasswordProblem } from './password'
import { hasRecentReauth } from './reauth'
import { getLimiter } from './services'

export const INVITE_TTL_HOURS = 72

export const invitations: CollectionConfig = {
  slug: 'invitations',
  admin: {
    useAsTitle: 'email',
    group: 'Security',
    defaultColumns: ['email', 'role', 'expiresAt', 'usedAt'],
  },
  timestamps: true,
  disableDuplicate: true,
  access: {
    read: allow('users', 'read'),
    create: allow('users', 'read'), // narrowed per target role in beforeChange
    update: denyAll,
    delete: allow('users', 'read'),
  },
  endpoints: [
    {
      path: '/accept',
      method: 'post',
      handler: async (req) => {
        const { clientIp, json, sameOrigin } = await import('./endpoints')
        if (!sameOrigin(req.headers)) return json({ error: 'forbidden' }, 403)
        let body: Record<string, unknown> = {}
        try {
          body = ((await req.json?.()) ?? {}) as Record<string, unknown>
        } catch {
          body = {}
        }
        const r = await acceptInvitation(req.payload, {
          token: body.token,
          password: body.password,
          name: body.name,
          ip: clientIp(req.headers),
        })
        return r.ok
          ? json({ ok: true })
          : json({ error: r.problem }, r.problem === 'rate_limited' ? 429 : 400)
      },
    },
  ],
  fields: [
    { name: 'email', type: 'email', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: ROLES.map((r) => ({ label: r, value: r })),
    },
    { name: 'tokenHash', type: 'text', hidden: true, index: true, unique: true },
    { name: 'expiresAt', type: 'date', admin: { readOnly: true } },
    { name: 'usedAt', type: 'date', admin: { readOnly: true } },
    { name: 'invitedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const email = String(data.email ?? '')
          .trim()
          .toLowerCase()
        if (!isRole(data.role)) throw new APIError('Invalid role', 400)
        if (!req.context?.bootstrap) {
          const actorRole = roleOf(req.user)
          if (!hasRecentReauth(req.user))
            throw new APIError('Recent re-authentication required', 403)
          if (
            !actorRole ||
            !canActOnUser(actorRole, 'invite', {
              targetRole: data.role,
              targetIsLastOwner: false,
              isSelf: false,
            })
          )
            throw new APIError('Forbidden', 403)
        }
        const existing = await req.payload.find({
          collection: 'users',
          where: { email: { equals: email } },
          overrideAccess: true,
          limit: 1,
          req,
        })
        if (existing.totalDocs) throw new APIError('Cannot invite this address', 400)
        const token = randomToken()
        req.context.inviteToken = token
        return {
          ...data,
          email,
          tokenHash: sha256(token).toString('hex'),
          expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 3_600_000).toISOString(),
          usedAt: null,
          invitedBy: req.context?.bootstrap ? null : req.user?.id,
        }
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        const token = req.context.inviteToken as string
        await sendNotice(doc.email, 'invitation', accountLink('/account/accept-invite', token))
        await recordAudit(req.payload, {
          actor: req.user ? `user:${req.user.id}` : 'system',
          action: 'user.invite',
          target: { type: 'invitations', id: String(doc.id) },
          outcome: 'success',
          meta: { role: doc.role },
        })
        return doc
      },
    ],
  },
}

export type AcceptResult =
  | { ok: true; userId: number }
  | { ok: false; problem: 'invalid_or_expired' | 'rate_limited' | PasswordProblem }

export async function acceptInvitation(
  payload: Payload,
  input: { token: unknown; password: unknown; name: unknown; ip: string },
): Promise<AcceptResult> {
  const hit = await getLimiter(payload).hit(limitKey('invite-accept:ip', input.ip), {
    limit: 10,
    windowMs: 15 * 60_000,
  })
  if (!hit.allowed) return { ok: false, problem: 'rate_limited' }
  if (typeof input.token !== 'string' || input.token.length > 128)
    return { ok: false, problem: 'invalid_or_expired' }
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 100) : ''
  if (!name) return { ok: false, problem: 'invalid_or_expired' }
  const tokenHash = sha256(input.token).toString('hex')
  const pool = poolOf(payload)
  const peek = (
    await pool.query(
      'select email from invitations where token_hash = $1 and used_at is null and expires_at > now()',
      [tokenHash],
    )
  ).rows[0]
  if (!peek) return { ok: false, problem: 'invalid_or_expired' }
  const problem = checkPassword(input.password, { email: peek.email })
  if (problem) return { ok: false, problem }
  const claimed = await pool.query(
    'update invitations set used_at = now() where token_hash = $1 and used_at is null and expires_at > now() returning id, email, role',
    [tokenHash],
  )
  if ((claimed.rowCount ?? 0) !== 1) return { ok: false, problem: 'invalid_or_expired' }
  const inv = claimed.rows[0] as { id: number; email: string; role: string }
  const user = (await payload.create({
    collection: 'users',
    data: {
      email: inv.email,
      password: input.password,
      name,
      role: inv.role,
      status: 'invited',
    } as never,
    overrideAccess: true,
    context: { authSystem: true },
  })) as unknown as { id: number }
  await recordAudit(payload, {
    actor: `user:${user.id}`,
    action: 'user.create',
    target: { type: 'users', id: String(user.id) },
    outcome: 'success',
    ip: input.ip,
    meta: { role: inv.role },
  })
  return { ok: true, userId: user.id }
}

export class BootstrapError extends Error {}

/** One-time first-owner procedure: refuses once any owner exists. Sends the link by email only. */
export async function bootstrapOwner(payload: Payload, email: string | undefined) {
  if (!email) throw new BootstrapError('BOOTSTRAP_OWNER_EMAIL is not set')
  const owners = await payload.count({
    collection: 'users',
    where: { role: { equals: 'owner' } },
    overrideAccess: true,
  })
  if (owners.totalDocs > 0) throw new BootstrapError('An owner already exists; bootstrap refused')
  const pending = await payload.count({
    collection: 'invitations',
    where: { and: [{ role: { equals: 'owner' } }, { usedAt: { exists: false } }] },
    overrideAccess: true,
  })
  if (pending.totalDocs > 0) throw new BootstrapError('An owner invitation is already pending')
  await payload.create({
    collection: 'invitations',
    data: { email, role: 'owner' } as never,
    overrideAccess: true,
    context: { bootstrap: true },
  })
}
