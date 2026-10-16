// Mandatory TOTP MFA for every CMS user (FR-033–FR-033c, D-6). Secrets and recovery codes live in
// project tables that no Payload API can read. Replay and single-use are enforced atomically in SQL.
import { randomBytes } from 'node:crypto'
import { generateSecret, generateURI, verify } from 'otplib'
import type { Payload, PayloadRequest } from 'payload'
import { canActOnUser, roleOf, type Role } from '../access'
import { recordAudit } from '../audit'
import { getConfig, limitKey } from '../platform'
import { decryptSecret, encryptSecret, scryptHash } from './crypto'
import { poolOf } from './db'
import { sendNotice } from './emails'
import { getLimiter } from './services'
import { revokeAllSessions, rotateSession } from './sessions'

export const RECOVERY_CODE_COUNT = 10
const ENROL_TTL_MS = 15 * 60_000
const TOTP_WINDOW_SECONDS = 30 // ±1 step
const ISSUER = 'Altamiuz CMS'

export class MfaError extends Error {
  constructor(
    readonly code:
      'invalid' | 'rate_limited' | 'not_enrolled' | 'already_enrolled' | 'expired' | 'forbidden',
  ) {
    super(code)
    this.name = 'MfaError'
  }
}

type Ctx = {
  payload: Payload
  req?: PayloadRequest
  userId: number | string
  email: string
  sid: string
  ip?: string
  userAgent?: string
}
const key = () => getConfig().secrets.mfaEncryptionKey
const actor = (id: number | string) => `user:${id}`

async function throttle(c: Ctx, scope: string) {
  const l = getLimiter(c.payload)
  const opts = { limit: 5, windowMs: 15 * 60_000 }
  const [a, b] = await Promise.all([
    l.hit(limitKey(`${scope}:account`, String(c.userId)), opts),
    l.hit(limitKey(`${scope}:ip`, c.ip ?? 'unidentified'), { limit: 30, windowMs: 15 * 60_000 }),
  ])
  if (!a.allowed || !b.allowed) throw new MfaError('rate_limited')
}

export async function mfaStatus(payload: Payload, userId: number | string) {
  const res = await poolOf(payload).query(
    'select enabled_at is not null as enabled from user_mfa where user_id = $1',
    [userId],
  )
  return { enrolled: res.rows[0]?.enabled === true }
}

/** Begins enrolment. The secret is returned only here, once. */
export async function startEnrolment(c: Ctx) {
  if ((await mfaStatus(c.payload, c.userId)).enrolled) throw new MfaError('already_enrolled')
  const secret = generateSecret()
  await poolOf(c.payload).query(
    `insert into user_mfa (user_id, pending_secret_enc, pending_created_at) values ($1, $2, $3)
     on conflict (user_id) do update set pending_secret_enc = excluded.pending_secret_enc, pending_created_at = excluded.pending_created_at`,
    [c.userId, encryptSecret(secret, key()), new Date()],
  )
  return { secret, otpauthUri: generateURI({ issuer: ISSUER, label: c.email, secret }) }
}

async function issueRecoveryCodes(payload: Payload, userId: number | string): Promise<string[]> {
  const pool = poolOf(payload)
  const salt = randomBytes(16)
  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = randomBytes(10).toString('hex') // 80 bits
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15)}`
  })
  const hashes = await Promise.all(codes.map((code) => scryptHash(normaliseCode(code), salt)))
  await pool.query('delete from mfa_recovery_codes where user_id = $1', [userId])
  await pool.query('update user_mfa set recovery_salt = $2 where user_id = $1', [userId, salt])
  for (const h of hashes)
    await pool.query('insert into mfa_recovery_codes (user_id, code_hash) values ($1, $2)', [
      userId,
      h,
    ])
  return codes
}

const normaliseCode = (code: string) => code.toLowerCase().replace(/[^0-9a-f]/g, '')

/** Verifies a TOTP code with atomic replay protection. */
async function checkTotp(
  payload: Payload,
  userId: number | string,
  code: unknown,
  secretEnc: string,
): Promise<boolean> {
  if (typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) return false
  const result = await verify({
    secret: decryptSecret(secretEnc, key()),
    token: code,
    epochTolerance: TOTP_WINDOW_SECONDS,
  })
  if (!result.valid) return false
  const step = (result as { timeStep: number }).timeStep
  const res = await poolOf(payload).query(
    'update user_mfa set last_used_step = $2 where user_id = $1 and (last_used_step is null or last_used_step < $2) returning user_id',
    [userId, step],
  )
  return (res.rowCount ?? 0) === 1
}

/** Confirms enrolment with a valid code, issues recovery codes and rotates to a verified session. */
export async function confirmEnrolment(c: Ctx, code: unknown) {
  await throttle(c, 'mfa')
  const pool = poolOf(c.payload)
  const row = (await pool.query('select * from user_mfa where user_id = $1', [c.userId])).rows[0]
  if (!row?.pending_secret_enc) throw new MfaError('invalid')
  if (row.enabled_at) throw new MfaError('already_enrolled')
  if (Date.now() - new Date(row.pending_created_at).getTime() > ENROL_TTL_MS)
    throw new MfaError('expired')
  const ok = await checkTotp(c.payload, c.userId, code, row.pending_secret_enc)
  if (!ok) {
    await recordAudit(c.payload, {
      actor: actor(c.userId),
      action: 'mfa.enrol',
      target: { type: 'users', id: String(c.userId) },
      outcome: 'failure',
      ip: c.ip,
      userAgent: c.userAgent,
    })
    throw new MfaError('invalid')
  }
  await pool.query(
    'update user_mfa set secret_enc = pending_secret_enc, enabled_at = now(), pending_secret_enc = null, pending_created_at = null where user_id = $1',
    [c.userId],
  )
  const recoveryCodes = await issueRecoveryCodes(c.payload, c.userId)
  await c.payload.update({
    collection: 'users',
    id: c.userId,
    data: { status: 'active' } as never,
    overrideAccess: true,
    context: { authSystem: true },
  })
  const rotated = await rotateSession(c.payload, c.req, c.userId, c.sid, {
    mfaVerified: true,
    reauth: true,
  })
  await revokeAllSessions(pool, c.userId, rotated.sid)
  await recordAudit(c.payload, {
    actor: actor(c.userId),
    action: 'mfa.enrol',
    target: { type: 'users', id: String(c.userId) },
    outcome: 'success',
    ip: c.ip,
    userAgent: c.userAgent,
  })
  await sendNotice(c.email, 'mfaChanged', 'enrolled')
  return { recoveryCodes, ...rotated }
}

/** Second step of sign-in. */
export async function verifySecondFactor(c: Ctx, code: unknown) {
  await throttle(c, 'mfa')
  const row = (
    await poolOf(c.payload).query(
      'select secret_enc from user_mfa where user_id = $1 and enabled_at is not null',
      [c.userId],
    )
  ).rows[0]
  if (!row) throw new MfaError('not_enrolled')
  if (!(await checkTotp(c.payload, c.userId, code, row.secret_enc))) {
    await recordAudit(c.payload, {
      actor: actor(c.userId),
      action: 'auth.login.failure',
      target: { type: 'users', id: String(c.userId) },
      outcome: 'failure',
      ip: c.ip,
      userAgent: c.userAgent,
      meta: { reason: 'mfa' },
    })
    throw new MfaError('invalid')
  }
  return rotateSession(c.payload, c.req, c.userId, c.sid, { mfaVerified: true, reauth: true })
}

/** Single-use recovery code, consumed atomically (concurrent replays: exactly one wins). */
export async function useRecoveryCode(c: Ctx, code: unknown) {
  await throttle(c, 'mfa')
  const pool = poolOf(c.payload)
  const row = (
    await pool.query(
      'select recovery_salt from user_mfa where user_id = $1 and enabled_at is not null',
      [c.userId],
    )
  ).rows[0]
  if (!row?.recovery_salt || typeof code !== 'string' || code.length > 64)
    throw new MfaError('invalid')
  const hash = await scryptHash(normaliseCode(code), row.recovery_salt)
  const used = await pool.query(
    'update mfa_recovery_codes set used_at = now() where user_id = $1 and code_hash = $2 and used_at is null returning id',
    [c.userId, hash],
  )
  if ((used.rowCount ?? 0) !== 1) {
    await recordAudit(c.payload, {
      actor: actor(c.userId),
      action: 'auth.login.failure',
      target: { type: 'users', id: String(c.userId) },
      outcome: 'failure',
      ip: c.ip,
      userAgent: c.userAgent,
      meta: { reason: 'recovery_code' },
    })
    throw new MfaError('invalid')
  }
  const remaining = Number(
    (
      await pool.query(
        'select count(*) from mfa_recovery_codes where user_id = $1 and used_at is null',
        [c.userId],
      )
    ).rows[0].count,
  )
  const rotated = await rotateSession(c.payload, c.req, c.userId, c.sid, {
    mfaVerified: true,
    reauth: true,
  })
  await revokeAllSessions(pool, c.userId, rotated.sid)
  await recordAudit(c.payload, {
    actor: actor(c.userId),
    action: 'mfa.recovery_code_used',
    target: { type: 'users', id: String(c.userId) },
    outcome: 'success',
    ip: c.ip,
    userAgent: c.userAgent,
    meta: { remaining },
  })
  await sendNotice(c.email, 'mfaChanged', 'recovery code used')
  return { ...rotated, remaining }
}

export async function regenerateRecoveryCodes(c: Ctx) {
  if (!(await mfaStatus(c.payload, c.userId)).enrolled) throw new MfaError('not_enrolled')
  const codes = await issueRecoveryCodes(c.payload, c.userId)
  await revokeAllSessions(poolOf(c.payload), c.userId, c.sid)
  await recordAudit(c.payload, {
    actor: actor(c.userId),
    action: 'mfa.recovery_codes_regenerate',
    target: { type: 'users', id: String(c.userId) },
    outcome: 'success',
    ip: c.ip,
    userAgent: c.userAgent,
  })
  await sendNotice(c.email, 'mfaChanged', 'recovery codes regenerated')
  return codes
}

/** Lost-factor reset by a higher role (FR-033c). Forces re-enrolment; never reveals the old secret. */
export async function resetMfa(
  payload: Payload,
  a: {
    actorId: number | string
    actorRole: Role | null
    targetId: number | string
    ip?: string
    userAgent?: string
  },
) {
  const target = (await payload.findByID({
    collection: 'users',
    id: a.targetId,
    overrideAccess: true,
    depth: 0,
  })) as unknown as { id: number; role: Role; email: string; status: string }
  const allowed =
    a.actorRole !== null &&
    String(a.actorId) !== String(a.targetId) &&
    canActOnUser(a.actorRole, 'resetMfa', {
      targetRole: roleOf(target) ?? 'owner',
      targetIsLastOwner: await isLastActiveOwner(payload, target),
      isSelf: false,
    })
  if (!allowed) {
    await recordAudit(payload, {
      actor: actor(a.actorId),
      action: 'mfa.reset',
      target: { type: 'users', id: String(a.targetId) },
      outcome: 'denied',
      ip: a.ip,
      userAgent: a.userAgent,
    })
    throw new MfaError('forbidden')
  }
  const pool = poolOf(payload)
  await pool.query('delete from mfa_recovery_codes where user_id = $1', [a.targetId])
  await pool.query('delete from user_mfa where user_id = $1', [a.targetId])
  await revokeAllSessions(pool, a.targetId)
  await recordAudit(payload, {
    actor: actor(a.actorId),
    action: 'mfa.reset',
    target: { type: 'users', id: String(a.targetId) },
    outcome: 'success',
    ip: a.ip,
    userAgent: a.userAgent,
  })
  await sendNotice(
    target.email,
    'mfaChanged',
    'reset by an administrator; enrol again at next sign-in',
  )
}

export async function isLastActiveOwner(
  payload: Payload,
  user: { id: number | string; role?: unknown; status?: unknown },
) {
  if (user.role !== 'owner' || user.status !== 'active') return false
  const res = await poolOf(payload).query(
    "select count(*) from users where role = 'owner' and status = 'active' and id <> $1",
    [user.id],
  )
  return Number(res.rows[0].count) === 0
}
