// Passkeys (WebAuthn / FIDO2, ADR-012). Two distinct uses, never confused:
//
// 1. Passwordless sign-in: a passkey REPLACES the password as the first factor. User verification
//    (device PIN or biometric) is required, but the session still counts as one sign-in step:
//    an account with an authenticator app, or any account while the owner requires two-factor
//    authentication, must still complete the second step. A passkey session can never use a
//    passkey as its second step (same factor twice is not two factors).
// 2. Second factor after a password: a passkey confirms a password session. This is genuine
//    two-factor authentication (something you know + a device you hold).
//
// Credentials, user handles and challenges live in project tables no Payload API can read
// (migration 20261114_120000_passkeys). Every challenge is single-use (DELETE … RETURNING), expires
// after five minutes and is bound to its purpose and, where a session exists, to that user and
// session. Origin and RP ID come from SITE_URL. Signature counters may only move forward
// (compare-and-set), so a cloned authenticator that replays an old counter is refused.
import { randomBytes } from 'node:crypto'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server'
import type { Payload, PayloadRequest } from 'payload'
import { recordAudit } from '../audit'
import { getConfig, limitKey } from '../platform'
import { poolOf } from './db'
import { sendNotice } from './emails'
import { mfaStatus } from './mfa'
import { getLimiter } from './services'
import { issueSession, revokeAllSessions, rotateSession } from './sessions'
import { getSecuritySettings } from './settings'

export const MAX_PASSKEYS = 10
const RP_NAME = 'Altamiuz CMS'
const CHALLENGE_TTL = '5 minutes'
const TIMEOUT_MS = 120_000

export type ChallengePurpose = 'register' | 'login' | 'second-factor'

export class PasskeyError extends Error {
  constructor(
    readonly code:
      | 'invalid'
      | 'rate_limited'
      | 'not_enrolled'
      | 'too_many'
      | 'already_registered'
      | 'not_found'
      | 'not_allowed',
  ) {
    super(code)
    this.name = 'PasskeyError'
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

/** Relying party derived from SITE_URL: the browser enforces the same origin and RP ID. */
export function relyingParty() {
  const url = new URL(getConfig().siteUrl)
  return { rpID: url.hostname, origin: url.origin }
}

const CREDENTIAL_ID = /^[A-Za-z0-9_-]{16,1024}$/
const CHALLENGE_ID = /^[A-Za-z0-9_-]{32}$/

/** Shape check before the library: an object with a plausible credential id and type. */
function asResponse<T>(v: unknown): T | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const r = v as { id?: unknown; rawId?: unknown; type?: unknown; response?: unknown }
  if (typeof r.id !== 'string' || !CREDENTIAL_ID.test(r.id) || r.rawId !== r.id) return null
  if (r.type !== 'public-key' || !r.response || typeof r.response !== 'object') return null
  return v as T
}

async function throttle(payload: Payload, scope: string, id: string, ip?: string) {
  const l = getLimiter(payload)
  const [a, b] = await Promise.all([
    l.hit(limitKey(`${scope}:id`, id), { limit: 10, windowMs: 15 * 60_000 }),
    l.hit(limitKey(`${scope}:ip`, ip ?? 'unknown'), { limit: 30, windowMs: 15 * 60_000 }),
  ])
  if (!a.allowed || !b.allowed) throw new PasskeyError('rate_limited')
}

async function storeChallenge(
  payload: Payload,
  purpose: ChallengePurpose,
  challenge: string,
  userId: number | string | null,
  sid: string | null,
): Promise<string> {
  const pool = poolOf(payload)
  await pool.query('delete from webauthn_challenges where expires_at < now()')
  const id = randomBytes(24).toString('base64url')
  await pool.query(
    `insert into webauthn_challenges (id, purpose, user_id, session_id, challenge, expires_at)
     values ($1, $2, $3, $4, $5, now() + interval '${CHALLENGE_TTL}')`,
    [id, purpose, userId, sid, challenge],
  )
  return id
}

/** Consumes a challenge exactly once; null if unknown, used, expired or bound elsewhere. */
export async function takeChallenge(
  payload: Payload,
  id: unknown,
  purpose: ChallengePurpose,
  userId: number | string | null,
  sid: string | null,
): Promise<string | null> {
  if (typeof id !== 'string' || !CHALLENGE_ID.test(id)) return null
  const res = await poolOf(payload).query(
    `delete from webauthn_challenges
      where id = $1 and purpose = $2 and expires_at > now()
        and user_id is not distinct from $3::integer and session_id is not distinct from $4::varchar
      returning challenge`,
    [id, purpose, userId === null ? null : Number(userId), sid],
  )
  return (res.rows[0]?.challenge as string | undefined) ?? null
}

async function userHandle(payload: Payload, userId: number | string): Promise<string> {
  const pool = poolOf(payload)
  const found = await pool.query('select handle from user_passkey_handles where user_id = $1', [
    userId,
  ])
  if (found.rows[0]) return found.rows[0].handle as string
  const handle = randomBytes(32).toString('base64url')
  await pool.query(
    'insert into user_passkey_handles (user_id, handle) values ($1, $2) on conflict (user_id) do nothing',
    [userId, handle],
  )
  return (await pool.query('select handle from user_passkey_handles where user_id = $1', [userId]))
    .rows[0].handle as string
}

type Row = {
  id: number
  user_id: number
  credential_id: string
  public_key: Buffer
  counter: string
  transports: string | null
}

const transportsOf = (r: { transports: string | null }) =>
  r.transports ? r.transports.split(',').filter(Boolean) : undefined

/** Moves the stored counter forward atomically. Authenticators that always report 0 stay at 0. */
async function advanceCounter(payload: Payload, id: number, next: number): Promise<boolean> {
  const res = await poolOf(payload).query(
    `update user_passkeys set counter = $2, last_used_at = now()
      where id = $1 and ((counter = 0 and $2::bigint = 0) or counter < $2::bigint)`,
    [id, next],
  )
  return (res.rowCount ?? 0) === 1
}

async function verifyAssertion(
  payload: Payload,
  row: Row,
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
): Promise<boolean> {
  const { rpID, origin } = relyingParty()
  try {
    const v = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: row.credential_id,
        publicKey: new Uint8Array(row.public_key),
        counter: Number(row.counter),
        transports: transportsOf(row),
      },
    })
    if (!v.verified || !v.authenticationInfo.userVerified) return false
    return advanceCounter(payload, row.id, v.authenticationInfo.newCounter)
  } catch {
    return false
  }
}

export async function listPasskeys(payload: Payload, userId: number | string) {
  const res = await poolOf(payload).query(
    `select id, name, created_at, last_used_at, device_type, backed_up
       from user_passkeys where user_id = $1 order by created_at`,
    [userId],
  )
  return res.rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    createdAt: r.created_at as Date,
    lastUsedAt: (r.last_used_at as Date | null) ?? null,
    synced: r.backed_up === true,
  }))
}

export async function passkeyCount(payload: Payload, userId: number | string): Promise<number> {
  const res = await poolOf(payload).query(
    'select count(*)::int as n from user_passkeys where user_id = $1',
    [userId],
  )
  return res.rows[0].n as number
}

// ── Registration (verified session + recent re-authentication, enforced by the endpoint) ──────

export async function startRegistration(c: Ctx) {
  if ((await passkeyCount(c.payload, c.userId)) >= MAX_PASSKEYS) throw new PasskeyError('too_many')
  const { rpID } = relyingParty()
  const existing = await poolOf(c.payload).query(
    'select credential_id, transports from user_passkeys where user_id = $1',
    [c.userId],
  )
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: c.email,
    userDisplayName: c.email,
    userID: new Uint8Array(Buffer.from(await userHandle(c.payload, c.userId), 'base64url')),
    attestationType: 'none',
    timeout: TIMEOUT_MS,
    excludeCredentials: existing.rows.map((r) => ({
      id: r.credential_id as string,
      transports: transportsOf(r as Row),
    })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  })
  const challengeId = await storeChallenge(
    c.payload,
    'register',
    options.challenge,
    c.userId,
    c.sid,
  )
  return { challengeId, options }
}

const cleanName = (v: unknown) => {
  const s = typeof v === 'string' ? v.replace(/[\p{Cc}\p{Cf}]/gu, '').trim() : ''
  return s.slice(0, 64) || 'Passkey'
}

export async function finishRegistration(
  c: Ctx,
  input: { challengeId: unknown; response: unknown; name?: unknown },
) {
  await throttle(c.payload, 'passkey-register', String(c.userId), c.ip)
  const challenge = await takeChallenge(c.payload, input.challengeId, 'register', c.userId, c.sid)
  const response = asResponse<RegistrationResponseJSON>(input.response)
  const fail = async () => {
    await recordAudit(c.payload, {
      actor: `user:${c.userId}`,
      action: 'passkey.register',
      target: { type: 'users', id: String(c.userId) },
      outcome: 'failure',
      ip: c.ip,
      userAgent: c.userAgent,
    })
    return new PasskeyError('invalid')
  }
  if (!challenge || !response) throw await fail()
  const { rpID, origin } = relyingParty()
  let info
  try {
    const v = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })
    if (!v.verified) throw await fail()
    info = v.registrationInfo
  } catch (e) {
    if (e instanceof PasskeyError) throw e
    throw await fail()
  }
  if ((await passkeyCount(c.payload, c.userId)) >= MAX_PASSKEYS) throw new PasskeyError('too_many')
  try {
    await poolOf(c.payload).query(
      `insert into user_passkeys
         (user_id, credential_id, public_key, counter, transports, device_type, backed_up, name)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        c.userId,
        info.credential.id,
        Buffer.from(info.credential.publicKey),
        info.credential.counter,
        (info.credential.transports ?? []).join(',').slice(0, 200) || null,
        info.credentialDeviceType,
        info.credentialBackedUp,
        cleanName(input.name),
      ],
    )
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw new PasskeyError('already_registered')
    throw e
  }
  await recordAudit(c.payload, {
    actor: `user:${c.userId}`,
    action: 'passkey.register',
    target: { type: 'users', id: String(c.userId) },
    outcome: 'success',
    ip: c.ip,
    userAgent: c.userAgent,
  })
  await sendNotice(c.email, 'passkeyChanged', 'added')
  return { ok: true }
}

/** Removes one of the caller's own passkeys and ends their other sessions. */
export async function removePasskey(c: Ctx, id: unknown) {
  const n = Number(id)
  const res = Number.isInteger(n)
    ? await poolOf(c.payload).query(
        'delete from user_passkeys where id = $1 and user_id = $2 returning id',
        [n, c.userId],
      )
    : { rowCount: 0 }
  await recordAudit(c.payload, {
    actor: `user:${c.userId}`,
    action: 'passkey.remove',
    target: { type: 'users', id: String(c.userId) },
    outcome: res.rowCount ? 'success' : 'denied',
    ip: c.ip,
    userAgent: c.userAgent,
  })
  if (!res.rowCount) throw new PasskeyError('not_found')
  await revokeAllSessions(poolOf(c.payload), c.userId, c.sid)
  await sendNotice(c.email, 'passkeyChanged', 'removed')
}

// ── Passwordless sign-in (first factor) ──────────────────────────────────────────────────────

export async function startPasskeyLogin(payload: Payload, ip: string) {
  const l = await getLimiter(payload).hit(limitKey('passkey-login-options:ip', ip), {
    limit: 30,
    windowMs: 15 * 60_000,
  })
  if (!l.allowed) throw new PasskeyError('rate_limited')
  const { rpID } = relyingParty()
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    timeout: TIMEOUT_MS,
  })
  return {
    challengeId: await storeChallenge(payload, 'login', options.challenge, null, null),
    options,
  }
}

export type PasskeyLoginResult =
  | {
      ok: true
      token: string
      exp: number
      cookie: string
      userId: number
      sid: string
      secondStepRequired: boolean
    }
  | { ok: false; reason: string }

export async function finishPasskeyLogin(
  payload: Payload,
  req: PayloadRequest | undefined,
  input: { challengeId: unknown; response: unknown; ip: string; userAgent?: string },
): Promise<PasskeyLoginResult> {
  const fail = async (reason: string, userId?: number): Promise<PasskeyLoginResult> => {
    await recordAudit(payload, {
      actor: userId ? `user:${userId}` : 'anonymous',
      action: 'auth.login.failure',
      target: { type: 'users', id: userId ? String(userId) : 'unknown' },
      outcome: 'failure',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { reason, method: 'passkey' },
    })
    return { ok: false, reason }
  }
  const response = asResponse<AuthenticationResponseJSON>(input.response)
  try {
    await throttle(payload, 'passkey-login', response?.id ?? 'invalid', input.ip)
  } catch {
    return fail('rate_limited')
  }
  const challenge = await takeChallenge(payload, input.challengeId, 'login', null, null)
  if (!challenge || !response) return fail('invalid')
  const row = (
    await poolOf(payload).query(
      `select p.*, h.handle, u.status
         from user_passkeys p
         join user_passkey_handles h on h.user_id = p.user_id
         join users u on u.id = p.user_id
        where p.credential_id = $1`,
      [response.id],
    )
  ).rows[0] as (Row & { handle: string; status: string }) | undefined
  if (!row) return fail('invalid')
  // Discoverable sign-in: the authenticator names the account; it must be the credential's owner.
  if (response.response.userHandle !== row.handle) return fail('invalid', row.user_id)
  if (!(await verifyAssertion(payload, row, response, challenge)))
    return fail('invalid', row.user_id)
  if (row.status !== 'active')
    return fail(row.status === 'suspended' ? 'suspended' : 'invalid', row.user_id)
  const session = await issueSession(payload, req, row.user_id, {
    authMethod: 'passkey',
    mfaVerified: false,
  })
  await recordAudit(payload, {
    actor: `user:${row.user_id}`,
    action: 'auth.login.success',
    target: { type: 'users', id: String(row.user_id) },
    outcome: 'success',
    ip: input.ip,
    userAgent: input.userAgent,
    meta: { method: 'passkey' },
  })
  const settings = await getSecuritySettings(payload)
  const totp = (await mfaStatus(payload, row.user_id)).enrolled
  return {
    ok: true,
    ...session,
    userId: row.user_id,
    secondStepRequired: settings.requireMfa || totp,
  }
}

// ── Passkey as the second step after a password ──────────────────────────────────────────────

export async function startPasskeySecondFactor(c: Ctx & { authMethod: string }) {
  if (c.authMethod !== 'password') throw new PasskeyError('not_allowed')
  const rows = await poolOf(c.payload).query(
    'select credential_id, transports from user_passkeys where user_id = $1',
    [c.userId],
  )
  if (!rows.rowCount) throw new PasskeyError('not_enrolled')
  const { rpID } = relyingParty()
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    timeout: TIMEOUT_MS,
    allowCredentials: rows.rows.map((r) => ({
      id: r.credential_id as string,
      transports: transportsOf(r as Row),
    })),
  })
  const challengeId = await storeChallenge(
    c.payload,
    'second-factor',
    options.challenge,
    c.userId,
    c.sid,
  )
  return { challengeId, options }
}

export async function finishPasskeySecondFactor(
  c: Ctx & { authMethod: string },
  input: { challengeId: unknown; response: unknown },
) {
  if (c.authMethod !== 'password') throw new PasskeyError('not_allowed')
  await throttle(c.payload, 'mfa-passkey', String(c.userId), c.ip)
  const challenge = await takeChallenge(
    c.payload,
    input.challengeId,
    'second-factor',
    c.userId,
    c.sid,
  )
  const response = asResponse<AuthenticationResponseJSON>(input.response)
  const row = response
    ? ((
        await poolOf(c.payload).query(
          `select p.*, h.handle from user_passkeys p
             join user_passkey_handles h on h.user_id = p.user_id
            where p.credential_id = $1 and p.user_id = $2`,
          [response.id, c.userId],
        )
      ).rows[0] as (Row & { handle: string }) | undefined)
    : undefined
  const ok =
    !!challenge &&
    !!response &&
    !!row &&
    (response.response.userHandle === undefined || response.response.userHandle === row.handle) &&
    (await verifyAssertion(c.payload, row, response, challenge))
  if (!ok) {
    await recordAudit(c.payload, {
      actor: `user:${c.userId}`,
      action: 'auth.login.failure',
      target: { type: 'users', id: String(c.userId) },
      outcome: 'failure',
      ip: c.ip,
      userAgent: c.userAgent,
      meta: { reason: 'mfa', method: 'passkey' },
    })
    throw new PasskeyError('invalid')
  }
  return rotateSession(c.payload, c.req, c.userId, c.sid, { mfaVerified: true, reauth: true })
}
