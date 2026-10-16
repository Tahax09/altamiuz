// Enumeration-resistant sign-in (FR-034, ADR-005, T063). Unknown, wrong-password, suspended and
// rate-limited/locked accounts all produce the same result, after the same password-hash cost,
// padded to a common floor. Lockout is the per-account limiter (A-8); Payload's own lockout is
// disabled because its LockedAuth error revealed account existence (R-C).
import type { Payload } from 'payload'
import { recordAudit } from '../audit'
import { limitKey } from '../platform'
import { dummyPasswordWork } from './crypto'
import { poolOf } from './db'
import { sendNotice } from './emails'
import { getLimiter } from './services'
import { createSessionState } from './sessions'
import { getSecuritySettings } from './settings'

export const FAILURE_FLOOR_MS = 400
export type SignInResult =
  { ok: true; token: string; exp: number; userId: number; sid: string } | { ok: false }

const EMAIL = /^[^\s@<>]{1,64}@[^\s@<>]{1,190}$/

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** Pads a failure to at least FAILURE_FLOOR_MS since `started`. */
export async function padToFloor(started: number) {
  const wait = FAILURE_FLOOR_MS - (performance.now() - started)
  if (wait > 0) await sleep(wait)
}

export async function signIn(
  payload: Payload,
  input: { email: unknown; password: unknown; ip: string; userAgent?: string },
): Promise<SignInResult> {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const password =
    typeof input.password === 'string' && input.password.length <= 1024 ? input.password : ''
  const fail = async (reason: string, userId?: number) => {
    await recordAudit(payload, {
      actor: userId ? `user:${userId}` : 'anonymous',
      action: 'auth.login.failure',
      target: { type: 'users', id: userId ? String(userId) : 'unknown' },
      outcome: 'failure',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { reason },
    })
    return { ok: false as const }
  }

  const s = await getSecuritySettings(payload)
  const limiter = getLimiter(payload)
  const [ipHit, acctHit, dayHit] = await Promise.all([
    limiter.hit(limitKey('login:ip', input.ip), { limit: 30, windowMs: 15 * 60_000 }),
    limiter.hit(limitKey('login:account', email || 'invalid'), {
      limit: s.lockoutThreshold,
      windowMs: s.lockoutMinutes * 60_000,
    }),
    limiter.hit(limitKey('login:account-day', email || 'invalid'), {
      limit: 20,
      windowMs: 24 * 3_600_000,
    }),
  ])

  const found = EMAIL.test(email)
    ? ((
        await payload.find({
          collection: 'users',
          where: { email: { equals: email } },
          overrideAccess: true,
          limit: 1,
          depth: 0,
        })
      ).docs[0] as { id: number; status?: string; email: string } | undefined)
    : undefined

  if (!ipHit.allowed || !acctHit.allowed || !dayHit.allowed) {
    await dummyPasswordWork(password || 'x')
    // One lockout notice + audit per lockout window, not one per blocked attempt.
    const notice =
      found && !acctHit.allowed && !acctHit.failed
        ? await limiter.hit(limitKey('login:lockout-notice', email), {
            limit: 1,
            windowMs: s.lockoutMinutes * 60_000,
          })
        : undefined
    if (found && notice?.allowed) {
      await recordAudit(payload, {
        actor: `user:${found.id}`,
        action: 'auth.lockout',
        target: { type: 'users', id: String(found.id) },
        outcome: 'success',
        ip: input.ip,
        userAgent: input.userAgent,
      })
      await sendNotice(found.email, 'lockout').catch(() => undefined)
    }
    return fail(ipHit.failed || acctHit.failed ? 'limiter_unavailable' : 'rate_limited', found?.id)
  }
  if (!found || !password) {
    await dummyPasswordWork(password || 'x')
    return fail('invalid')
  }
  if (found.status === 'suspended') {
    await dummyPasswordWork(password)
    return fail('suspended', found.id)
  }
  try {
    const res = await payload.login({ collection: 'users', data: { email, password } as never })
    const token = res.token!
    const sid = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()).sid as string
    await createSessionState(poolOf(payload), sid, found.id)
    await recordAudit(payload, {
      actor: `user:${found.id}`,
      action: 'auth.login.success',
      target: { type: 'users', id: String(found.id) },
      outcome: 'success',
      ip: input.ip,
      userAgent: input.userAgent,
    })
    return { ok: true, token, exp: res.exp!, userId: found.id, sid }
  } catch {
    return fail('invalid', found.id)
  }
}
