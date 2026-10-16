// Sessions (ADR-005, FR-035, FR-091): Payload's built-in sessions for revocation and signing,
// plus project state per session (MFA completion, idle timeout, absolute lifetime, re-auth).
// The "altamiuz-session" strategy runs before Payload's local-jwt strategy; whenever it rejects
// a session it also deletes it, so the built-in strategy cannot accept the same token.
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'
import {
  getFieldsToSign,
  JWTAuthentication,
  jwtSign,
  type AuthStrategy,
  type Payload,
  type PayloadRequest,
} from 'payload'
import type pg from 'pg'
import { poolOf } from './db'
import { getSecuritySettings } from './settings'

export const SESSION_STRATEGY = 'altamiuz-session'
const TOUCH_INTERVAL_MS = 60_000

export type SessionState = {
  session_id: string
  user_id: number
  created_at: Date
  last_seen_at: Date
  mfa_verified_at: Date | null
  reauth_at: Date | null
}

export async function createSessionState(
  pool: pg.Pool,
  sid: string,
  userId: number | string,
  init: { createdAt?: Date; mfaVerified?: boolean; reauth?: boolean } = {},
) {
  await pool.query(
    `insert into auth_sessions (session_id, user_id, created_at, last_seen_at, mfa_verified_at, reauth_at)
     values ($1, $2, $3, $4, case when $5 then $4::timestamptz end, case when $6 then $4::timestamptz end)`,
    [sid, userId, init.createdAt ?? new Date(), new Date(), !!init.mfaVerified, !!init.reauth],
  )
}

export async function revokeSession(pool: pg.Pool, sid: string) {
  await pool.query('delete from users_sessions where id = $1', [sid])
  await pool.query('delete from auth_sessions where session_id = $1', [sid])
}

/** Ends every session of a user (optionally keeping one). Returns the number ended. */
export async function revokeAllSessions(
  pool: pg.Pool,
  userId: number | string,
  exceptSid?: string,
): Promise<number> {
  const res = await pool.query(
    'delete from users_sessions where _parent_id = $1 and ($2::varchar is null or id <> $2) returning id',
    [userId, exceptSid ?? null],
  )
  await pool.query(
    'delete from auth_sessions where user_id = $1 and ($2::varchar is null or session_id <> $2)',
    [userId, exceptSid ?? null],
  )
  return res.rowCount ?? 0
}

/**
 * Ends every session inside the caller's Payload transaction (used from collection hooks, where a
 * separate connection would deadlock on the user row being updated).
 */
export async function revokeAllSessionsInTx(req: PayloadRequest, userId: number | string) {
  await req.payload.db.updateOne({
    collection: 'users',
    id: userId,
    data: { sessions: [] },
    req,
    returning: false,
  })
  await poolOf(req.payload).query('delete from auth_sessions where user_id = $1', [userId])
}

export async function listSessions(pool: pg.Pool, userId: number | string) {
  const res = await pool.query(
    'select session_id, created_at, last_seen_at, mfa_verified_at is not null as mfa_verified from auth_sessions where user_id = $1 order by created_at desc',
    [userId],
  )
  return res.rows as {
    session_id: string
    created_at: Date
    last_seen_at: Date
    mfa_verified: boolean
  }[]
}

export async function markReauth(pool: pg.Pool, sid: string) {
  await pool.query('update auth_sessions set reauth_at = $2 where session_id = $1', [
    sid,
    new Date(),
  ])
}

export async function getSessionState(pool: pg.Pool, sid: string): Promise<SessionState | null> {
  const res = await pool.query('select * from auth_sessions where session_id = $1', [sid])
  return (res.rows[0] as SessionState | undefined) ?? null
}

export const sessionStrategy: AuthStrategy = {
  name: SESSION_STRATEGY,
  authenticate: async (args) => {
    const result = await JWTAuthentication({ ...args, strategyName: SESSION_STRATEGY })
    const user = result.user as (Record<string, unknown> & { id: number; _sid?: string }) | null
    if (!user?._sid) return { user: null }
    const pool = poolOf(args.payload)
    const state = await getSessionState(pool, user._sid)
    const settings = await getSecuritySettings(args.payload)
    const now = Date.now()
    const idle =
      !state || now - new Date(state.last_seen_at).getTime() > settings.idleMinutes * 60_000
    const expired =
      !state || now - new Date(state.created_at).getTime() > settings.absoluteHours * 3_600_000
    if (idle || expired || user.status === 'suspended') {
      await revokeSession(pool, user._sid)
      return { user: null }
    }
    if (now - new Date(state.last_seen_at).getTime() > TOUCH_INTERVAL_MS) {
      await pool.query('update auth_sessions set last_seen_at = $2 where session_id = $1', [
        user._sid,
        new Date(),
      ])
    }
    user.mfaVerified = state.mfa_verified_at !== null
    user.reauthAt = state.reauth_at ? new Date(state.reauth_at).toISOString() : null
    return { user: user as never }
  },
}

/**
 * Replaces the current session with a new one (FR-035: rotate on MFA completion and privilege
 * change), keeping the original creation time so rotation never extends the absolute lifetime.
 */
export async function rotateSession(
  payload: Payload,
  req: PayloadRequest | undefined,
  userId: number | string,
  oldSid: string,
  flags: { mfaVerified: boolean; reauth?: boolean },
) {
  const pool = poolOf(payload)
  const collection = payload.collections.users!
  const old = await getSessionState(pool, oldSid)
  const user = (await payload.findByID({
    collection: 'users',
    id: userId,
    overrideAccess: true,
    showHiddenFields: true,
    depth: 0,
  })) as unknown as Record<string, unknown> & { email: string; id: number }
  const { sid } = await addSessionToUser({
    collectionConfig: collection.config,
    payload,
    req: req as PayloadRequest,
    user: user as never,
  })
  if (!sid) throw new Error('sessions disabled')
  await createSessionState(pool, sid, userId, {
    createdAt: old?.created_at,
    mfaVerified: flags.mfaVerified,
    reauth: flags.reauth,
  })
  const fieldsToSign = getFieldsToSign({
    collectionConfig: collection.config,
    email: user.email,
    sid,
    user: user as never,
  })
  const { token, exp } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collection.config.auth.tokenExpiration,
  })
  await revokeSession(pool, oldSid)
  const cookie = generatePayloadCookie({
    collectionAuthConfig: collection.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  })
  return { token, exp, cookie, sid }
}
