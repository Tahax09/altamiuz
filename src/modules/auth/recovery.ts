// Password recovery (FR-034, US3-4): identical response for any email; single-use 30-minute link;
// completion revokes every session and still requires MFA at next sign-in.
import type { Payload } from 'payload'
import { recordAudit } from '../audit'
import { limitKey } from '../platform'
import { randomToken, sha256 } from './crypto'
import { poolOf } from './db'
import { accountLink, sendNotice } from './emails'
import { checkPassword, type PasswordProblem } from './password'
import { getLimiter } from './services'
import { revokeAllSessions } from './sessions'

export const RECOVERY_TTL_MINUTES = 30

/** Always resolves the same way; the caller returns one uniform response. */
export async function requestRecovery(
  payload: Payload,
  input: { email: unknown; ip: string; userAgent?: string },
) {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const l = getLimiter(payload)
  const [ip, acct] = await Promise.all([
    l.hit(limitKey('recovery:ip', input.ip), { limit: 5, windowMs: 15 * 60_000 }),
    l.hit(limitKey('recovery:account', email || 'invalid'), { limit: 3, windowMs: 3_600_000 }),
  ])
  if (!ip.allowed || !acct.allowed || !email) return
  const user = (
    await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      overrideAccess: true,
      limit: 1,
      depth: 0,
    })
  ).docs[0] as { id: number; email: string; status?: string } | undefined
  if (!user || user.status === 'suspended') return
  const token = randomToken()
  await poolOf(payload).query(
    `insert into auth_recovery_tokens (token_hash, user_id, expires_at) values ($1, $2, now() + make_interval(mins => $3))`,
    [sha256(token), user.id, RECOVERY_TTL_MINUTES],
  )
  await recordAudit(payload, {
    actor: `user:${user.id}`,
    action: 'auth.recovery.request',
    target: { type: 'users', id: String(user.id) },
    outcome: 'success',
    ip: input.ip,
    userAgent: input.userAgent,
  })
  await sendNotice(user.email, 'recovery', accountLink('/account/recover', token))
}

export type RecoveryResult =
  { ok: true } | { ok: false; problem: 'invalid_or_expired' | 'rate_limited' | PasswordProblem }

export async function completeRecovery(
  payload: Payload,
  input: { token: unknown; password: unknown; ip: string; userAgent?: string },
): Promise<RecoveryResult> {
  const hit = await getLimiter(payload).hit(limitKey('recovery-complete:ip', input.ip), {
    limit: 10,
    windowMs: 15 * 60_000,
  })
  if (!hit.allowed) return { ok: false, problem: 'rate_limited' }
  if (typeof input.token !== 'string' || input.token.length > 128)
    return { ok: false, problem: 'invalid_or_expired' }
  const pool = poolOf(payload)
  const peek = (
    await pool.query(
      'select user_id from auth_recovery_tokens where token_hash = $1 and used_at is null and expires_at > now()',
      [sha256(input.token)],
    )
  ).rows[0]
  if (!peek) return { ok: false, problem: 'invalid_or_expired' }
  const user = (await payload.findByID({
    collection: 'users',
    id: peek.user_id,
    overrideAccess: true,
    depth: 0,
  })) as unknown as { id: number; email: string }
  const problem = checkPassword(input.password, { email: user.email })
  if (problem) return { ok: false, problem }
  // Atomic single use: only one concurrent completion can consume the token.
  const consumed = await pool.query(
    'update auth_recovery_tokens set used_at = now() where token_hash = $1 and used_at is null and expires_at > now() returning user_id',
    [sha256(input.token)],
  )
  if ((consumed.rowCount ?? 0) !== 1) return { ok: false, problem: 'invalid_or_expired' }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { password: input.password } as never,
    overrideAccess: true,
    context: { authSystem: true },
  })
  await revokeAllSessions(pool, user.id)
  await pool.query('delete from auth_recovery_tokens where user_id = $1 and used_at is null', [
    user.id,
  ])
  await recordAudit(payload, {
    actor: `user:${user.id}`,
    action: 'auth.recovery.complete',
    target: { type: 'users', id: String(user.id) },
    outcome: 'success',
    ip: input.ip,
    userAgent: input.userAgent,
  })
  await sendNotice(user.email, 'passwordChanged')
  return { ok: true }
}
