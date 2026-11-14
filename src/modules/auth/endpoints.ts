// Account endpoints (contracts/http-surface.md): /api/users/... Each is authenticated (except the
// recovery pair), rate-limited in its service, audited, and re-auth-gated where FR-039 applies.
import type { Endpoint, PayloadRequest } from 'payload'
import { canActOnUser, isMfaVerified, roleOf, type Role } from '../access'
import { recordAudit } from '../audit'
import { getConfig, resolveClientIp } from '../platform'
import { poolOf } from './db'
import { padToFloor } from './login'
import {
  confirmEnrolment,
  disableMfa,
  isLastActiveOwner,
  MfaError,
  mfaStatus,
  regenerateRecoveryCodes,
  resetMfa,
  startEnrolment,
  useRecoveryCode,
  verifySecondFactor,
} from './mfa'
import { checkPassword } from './password'
import {
  finishPasskeyLogin,
  finishPasskeySecondFactor,
  finishRegistration,
  listPasskeys,
  passkeyCount,
  PasskeyError,
  removePasskey,
  startPasskeyLogin,
  startPasskeySecondFactor,
  startRegistration,
} from './passkeys'
import { completeRecovery, requestRecovery } from './recovery'
import { hasRecentReauth, reauthenticate } from './reauth'
import { listSessions, revokeAllSessions, revokeSession } from './sessions'
import { sendNotice } from './emails'

type AuthedUser = {
  id: number
  email: string
  role?: Role
  _sid?: string
  status?: string
  authMethod?: string
}

export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', ...(headers ?? {}) } })

const bodyOf = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    const b = req.json ? await req.json() : {}
    return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export const clientIp = (headers: Headers) => {
  const c = getConfig()
  return resolveClientIp(headers, {
    trustedProxyHops: c.rateLimit.trustedProxyHops,
    clientIpHeader: c.rateLimit.clientIpHeader,
  })
}

/** Rejects cross-origin state changes (FR-091) for endpoints that may run without a session. */
export function sameOrigin(headers: Headers): boolean {
  const origin = headers.get('origin')
  if (!origin) return headers.get('sec-fetch-site') !== 'cross-site'
  return origin === new URL(getConfig().siteUrl).origin
}

const ctx = (req: PayloadRequest) => {
  const u = req.user as unknown as AuthedUser
  return {
    payload: req.payload,
    req,
    userId: u.id,
    email: u.email,
    sid: u._sid!,
    ip: clientIp(req.headers),
    userAgent: req.headers.get('user-agent') ?? undefined,
    authMethod: u.authMethod ?? 'password',
  }
}

const passkeyError = (e: unknown) => {
  if (e instanceof PasskeyError)
    return json(
      { error: e.code },
      e.code === 'rate_limited'
        ? 429
        : e.code === 'not_found'
          ? 404
          : e.code === 'not_allowed'
            ? 403
            : 400,
    )
  throw e
}

const mfaError = (e: unknown) => {
  if (e instanceof MfaError)
    return json(
      { error: e.code },
      e.code === 'rate_limited' ? 429 : e.code === 'forbidden' ? 403 : 400,
    )
  throw e
}

const withCookie = (body: unknown, cookie: string) => json(body, 200, { 'set-cookie': cookie })

const authed =
  (
    handler: (req: PayloadRequest) => Promise<Response>,
    opts: { verified?: boolean; reauth?: boolean } = {},
  ) =>
  async (req: PayloadRequest) => {
    const u = req.user as unknown as AuthedUser | null
    if (!u?._sid) return json({ error: 'unauthenticated' }, 401)
    if (!sameOrigin(req.headers)) return json({ error: 'forbidden' }, 403)
    if (opts.verified && !isMfaVerified(u)) return json({ error: 'mfa_required' }, 403)
    if (opts.reauth && !hasRecentReauth(u)) return json({ error: 'reauth_required' }, 403)
    return handler(req)
  }

export const userEndpoints: Endpoint[] = [
  {
    path: '/mfa/status',
    method: 'get',
    handler: async (req) => {
      const u = req.user as unknown as AuthedUser | null
      if (!u?._sid) return json({ authenticated: false, mfaVerified: false, enrolled: false })
      return json({
        authenticated: true,
        mfaVerified: isMfaVerified(u),
        signInMethod: u.authMethod ?? 'password',
        ...(await mfaStatus(req.payload, u.id)),
        passkeys: await passkeyCount(req.payload, u.id),
      })
    },
  },
  {
    path: '/mfa/enrol/start',
    method: 'post',
    handler: authed(async (req) => {
      const u = req.user as unknown as AuthedUser
      // A completed sign-in adds an authenticator app only after re-authentication. An incomplete
      // one (the owner requires two-factor authentication) may set one up as its first second
      // step, except a password session on an account that already holds passkeys: it must use
      // a passkey, so a stolen password alone cannot attach a new factor.
      if (isMfaVerified(u)) {
        if (!hasRecentReauth(u)) return json({ error: 'reauth_required' }, 403)
      } else if (u.authMethod !== 'passkey' && (await passkeyCount(req.payload, u.id)) > 0) {
        return json({ error: 'passkey_required' }, 403)
      }
      return startEnrolment(ctx(req))
        .then((r) => json(r))
        .catch(mfaError)
    }),
  },
  {
    path: '/mfa/disable',
    method: 'post',
    handler: authed(
      async (req) =>
        disableMfa(ctx(req))
          .then(() => json({ ok: true }))
          .catch(mfaError),
      { verified: true, reauth: true },
    ),
  },
  {
    path: '/passkeys',
    method: 'get',
    handler: authed(
      async (req) => json({ passkeys: await listPasskeys(req.payload, ctx(req).userId) }),
      { verified: true },
    ),
  },
  {
    path: '/passkeys/register/options',
    method: 'post',
    handler: authed(
      async (req) =>
        startRegistration(ctx(req))
          .then((r) => json(r))
          .catch(passkeyError),
      { verified: true, reauth: true },
    ),
  },
  {
    path: '/passkeys/register/verify',
    method: 'post',
    handler: authed(
      async (req) => {
        const b = await bodyOf(req)
        return finishRegistration(ctx(req), {
          challengeId: b.challengeId,
          response: b.response,
          name: b.name,
        })
          .then((r) => json(r))
          .catch(passkeyError)
      },
      { verified: true, reauth: true },
    ),
  },
  {
    path: '/passkeys/:id',
    method: 'delete',
    handler: authed(
      async (req) =>
        removePasskey(ctx(req), req.routeParams?.id)
          .then(() => json({ ok: true }))
          .catch(passkeyError),
      { verified: true, reauth: true },
    ),
  },
  {
    // Passwordless sign-in, step 1: a challenge for any passkey of this site (discoverable).
    path: '/passkeys/login/options',
    method: 'post',
    handler: async (req) => {
      if (!sameOrigin(req.headers)) return json({ error: 'forbidden' }, 403)
      return startPasskeyLogin(req.payload, clientIp(req.headers))
        .then((r) => json(r))
        .catch(passkeyError)
    },
  },
  {
    // Passwordless sign-in, step 2. One generic failure for every reason (FR-034).
    path: '/passkeys/login/verify',
    method: 'post',
    handler: async (req) => {
      const started = performance.now()
      if (!sameOrigin(req.headers)) return json({ error: 'forbidden' }, 403)
      const b = await bodyOf(req)
      const r = await finishPasskeyLogin(req.payload, req, {
        challengeId: b.challengeId,
        response: b.response,
        ip: clientIp(req.headers),
        userAgent: req.headers.get('user-agent') ?? undefined,
      })
      if (!r.ok) {
        await padToFloor(started)
        return json(
          { error: r.reason === 'rate_limited' ? 'rate_limited' : 'invalid' },
          r.reason === 'rate_limited' ? 429 : 401,
        )
      }
      return withCookie(
        { ok: true, exp: r.exp, secondStepRequired: r.secondStepRequired },
        r.cookie,
      )
    },
  },
  {
    // Second step after a password: a passkey confirms the session (two-factor authentication).
    path: '/passkeys/second-factor/options',
    method: 'post',
    handler: authed(async (req) =>
      startPasskeySecondFactor(ctx(req))
        .then((r) => json(r))
        .catch(passkeyError),
    ),
  },
  {
    path: '/passkeys/second-factor/verify',
    method: 'post',
    handler: authed(async (req) => {
      const b = await bodyOf(req)
      return finishPasskeySecondFactor(ctx(req), {
        challengeId: b.challengeId,
        response: b.response,
      })
        .then((r) => withCookie({ ok: true, exp: r.exp }, r.cookie))
        .catch(passkeyError)
    }),
  },
  {
    path: '/mfa/enrol/confirm',
    method: 'post',
    handler: authed(async (req) => {
      const { code } = await bodyOf(req)
      return confirmEnrolment(ctx(req), code)
        .then((r) => withCookie({ recoveryCodes: r.recoveryCodes, exp: r.exp }, r.cookie))
        .catch(mfaError)
    }),
  },
  {
    path: '/mfa/verify',
    method: 'post',
    handler: authed(async (req) => {
      const { code } = await bodyOf(req)
      return verifySecondFactor(ctx(req), code)
        .then((r) => withCookie({ ok: true, exp: r.exp }, r.cookie))
        .catch(mfaError)
    }),
  },
  {
    path: '/mfa/recovery',
    method: 'post',
    handler: authed(async (req) => {
      const { code } = await bodyOf(req)
      return useRecoveryCode(ctx(req), code)
        .then((r) => withCookie({ ok: true, remaining: r.remaining, exp: r.exp }, r.cookie))
        .catch(mfaError)
    }),
  },
  {
    path: '/mfa/recovery-codes',
    method: 'post',
    handler: authed(
      async (req) =>
        regenerateRecoveryCodes(ctx(req))
          .then((codes) => json({ recoveryCodes: codes }))
          .catch(mfaError),
      { verified: true, reauth: true },
    ),
  },
  {
    path: '/reauth',
    method: 'post',
    handler: authed(
      async (req) => {
        const { password } = await bodyOf(req)
        const c = ctx(req)
        return (await reauthenticate(req.payload, c.userId, c.sid, password))
          ? json({ ok: true })
          : json({ error: 'invalid' }, 401)
      },
      { verified: true },
    ),
  },
  {
    path: '/sessions',
    method: 'get',
    handler: authed(
      async (req) => {
        const c = ctx(req)
        const rows = await listSessions(poolOf(req.payload), c.userId)
        return json({
          sessions: rows.map((r) => ({
            id: r.session_id,
            createdAt: r.created_at,
            lastSeenAt: r.last_seen_at,
            current: r.session_id === c.sid,
          })),
        })
      },
      { verified: true },
    ),
  },
  {
    path: '/sessions/:sid',
    method: 'delete',
    handler: authed(
      async (req) => {
        const c = ctx(req)
        const sid = String(req.routeParams?.sid ?? '')
        const own = await poolOf(req.payload).query(
          'select 1 from auth_sessions where session_id = $1 and user_id = $2',
          [sid, c.userId],
        )
        if (!own.rowCount) return json({ error: 'not_found' }, 404)
        await revokeSession(poolOf(req.payload), sid)
        await recordAudit(req.payload, {
          actor: `user:${c.userId}`,
          action: 'session.revoke',
          target: { type: 'users', id: String(c.userId) },
          outcome: 'success',
          ip: c.ip,
          meta: { scope: 'own' },
        })
        return json({ ok: true })
      },
      { verified: true },
    ),
  },
  {
    path: '/password',
    method: 'post',
    handler: authed(
      async (req) => {
        const c = ctx(req)
        const { password } = await bodyOf(req)
        const problem = checkPassword(password, { email: c.email })
        if (problem) return json({ error: problem }, 400)
        await req.payload.update({
          collection: 'users',
          id: c.userId,
          data: { password } as never,
          overrideAccess: true,
          context: { authSystem: true },
        })
        // Payload ends every session (including this one) when the password changes; clear state too.
        await revokeAllSessions(poolOf(req.payload), c.userId)
        await recordAudit(req.payload, {
          actor: `user:${c.userId}`,
          action: 'auth.password_change',
          target: { type: 'users', id: String(c.userId) },
          outcome: 'success',
          ip: c.ip,
        })
        await sendNotice(c.email, 'passwordChanged')
        return json({ ok: true })
      },
      { verified: true, reauth: true },
    ),
  },
  {
    path: '/:id/revoke-sessions',
    method: 'post',
    handler: authed(
      async (req) => {
        const c = ctx(req)
        const target = (await req.payload
          .findByID({
            collection: 'users',
            id: String(req.routeParams?.id),
            overrideAccess: true,
            depth: 0,
          })
          .catch(() => null)) as unknown as AuthedUser | null
        const actorRole = roleOf(req.user)
        const ok =
          !!target &&
          !!actorRole &&
          roleOf(target) !== null &&
          canActOnUser(actorRole, 'revokeSessions', {
            targetRole: roleOf(target)!,
            isSelf: target.id === c.userId,
            targetIsLastOwner: await isLastActiveOwner(req.payload, target),
          })
        await recordAudit(req.payload, {
          actor: `user:${c.userId}`,
          action: 'session.revoke',
          target: { type: 'users', id: String(req.routeParams?.id) },
          outcome: ok ? 'success' : 'denied',
          ip: c.ip,
          meta: { scope: 'all' },
        })
        if (!ok) return json({ error: 'forbidden' }, 403)
        return json({ revoked: await revokeAllSessions(poolOf(req.payload), target!.id) })
      },
      { verified: true, reauth: true },
    ),
  },
  {
    path: '/:id/reset-mfa',
    method: 'post',
    handler: authed(
      async (req) => {
        const c = ctx(req)
        return resetMfa(req.payload, {
          actorId: c.userId,
          actorRole: roleOf(req.user),
          targetId: String(req.routeParams?.id),
          ip: c.ip,
          userAgent: c.userAgent,
        })
          .then(() => json({ ok: true }))
          .catch(mfaError)
      },
      { verified: true, reauth: true },
    ),
  },
  {
    path: '/recovery/request',
    method: 'post',
    handler: async (req) => {
      const started = performance.now()
      if (sameOrigin(req.headers)) {
        const { email } = await bodyOf(req)
        await requestRecovery(req.payload, {
          email,
          ip: clientIp(req.headers),
          userAgent: req.headers.get('user-agent') ?? undefined,
        }).catch((e) =>
          req.payload.logger.error({ err: (e as Error).name }, 'recovery request failed'),
        )
      }
      await padToFloor(started)
      return json({ ok: true }, 202) // identical for every input (FR-034)
    },
  },
  {
    path: '/recovery/complete',
    method: 'post',
    handler: async (req) => {
      if (!sameOrigin(req.headers)) return json({ error: 'forbidden' }, 403)
      const { token, password } = await bodyOf(req)
      const r = await completeRecovery(req.payload, {
        token,
        password,
        ip: clientIp(req.headers),
        userAgent: req.headers.get('user-agent') ?? undefined,
      })
      return r.ok
        ? json({ ok: true })
        : json({ error: r.problem }, r.problem === 'rate_limited' ? 429 : 400)
    },
  },
]
