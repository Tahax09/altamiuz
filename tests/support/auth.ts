// Drives the real account flows for integration tests: system-path user creation, sign-in through
// the actual login route handler, MFA enrolment with real TOTP codes, and endpoint calls with the
// resulting session cookie. Time is controlled with fake Date where steps matter.
import { generate } from 'otplib'
import type { Payload } from 'payload'
import { vi } from 'vitest'

export type Role = 'editor' | 'publisher' | 'administrator' | 'owner'
export type Session = {
  token: string
  cookie: string
  userId: number
  email: string
  password: string
  secret?: string
  recoveryCodes?: string[]
}

const ORIGIN = 'http://localhost:3000'
const randomIp = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}`
let seq = 0
export const strongPassword = () => `test pass phrase ${Math.random().toString(36).slice(2)} 9!` // gitleaks:allow (synthetic)

export async function createUser(
  payload: Payload,
  role: Role,
  opts: { status?: string; email?: string; password?: string } = {},
) {
  const email = opts.email ?? `${role}-${Date.now()}-${seq++}@example.invalid`
  const password = opts.password ?? strongPassword()
  const user = (await payload.create({
    collection: 'users',
    data: { email, password, name: `${role} user`, role, status: opts.status ?? 'active' } as never,
    overrideAccess: true,
    context: { authSystem: true },
  })) as unknown as { id: number }
  return { id: user.id, email, password }
}

export const cookieValue = (setCookie: string | null) =>
  /altamiuz-token=([^;]+)/.exec(setCookie ?? '')?.[1] ?? ''

export async function routeLogin(
  email: string,
  password: string,
  headers: Record<string, string> = {},
) {
  const { POST } = await import('../../src/app/(payload)/api/users/login/route')
  const res = await POST(
    new Request(`${ORIGIN}/api/users/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: ORIGIN,
        'x-forwarded-for': randomIp(),
        ...headers,
      },
      body: JSON.stringify({ email, password }),
    }),
  )
  return {
    res,
    status: res.status,
    body: (await res.json()) as Record<string, unknown>,
    token: cookieValue(res.headers.get('set-cookie')),
  }
}

export async function userFor(payload: Payload, token: string) {
  return (await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) }))
    .user as unknown as (Record<string, unknown> & { id: number }) | null
}

/** Calls a collection endpoint handler exactly as Payload would route it. */
export async function callEndpoint(
  payload: Payload,
  collection: 'users' | 'invitations',
  path: string,
  method: 'get' | 'post' | 'delete',
  opts: {
    token?: string
    body?: unknown
    params?: Record<string, string>
    headers?: Record<string, string>
  } = {},
) {
  const endpoint = (payload.collections[collection]!.config.endpoints || []).find(
    (e) => e.path === path && e.method === method,
  )
  if (!endpoint) throw new Error(`no endpoint ${method} ${path}`)
  const headers = new Headers({
    origin: ORIGIN,
    'content-type': 'application/json',
    'x-forwarded-for': randomIp(),
    ...(opts.headers ?? {}),
  })
  if (opts.token) headers.set('authorization', `JWT ${opts.token}`)
  const user = opts.token ? await userFor(payload, opts.token) : null
  const req = {
    payload,
    user,
    headers,
    routeParams: opts.params ?? {},
    json: async () => opts.body ?? {},
    context: {},
    method: method.toUpperCase(),
  } as never
  const res = (await endpoint.handler(req)) as Response
  return {
    status: res.status,
    body: (await res.json().catch(() => ({}))) as Record<string, unknown>,
    token: cookieValue(res.headers.get('set-cookie')),
    setCookie: res.headers.get('set-cookie'),
  }
}

/** Advances the fake clock to the next TOTP step so a fresh code is not a replay. */
export function nextStep(seconds = 31) {
  vi.setSystemTime(new Date(Date.now() + seconds * 1000))
}
export const totp = (secret: string) => generate({ secret })

/** Full path: sign in → enrol MFA → verified session. Returns the verified session. */
export async function verifiedSession(
  payload: Payload,
  role: Role,
  opts: { status?: string } = {},
): Promise<Session> {
  const u = await createUser(payload, role, { status: opts.status ?? 'invited' })
  const login = await routeLogin(u.email, u.password)
  if (login.status !== 200) throw new Error(`login failed ${login.status}`)
  let start = await callEndpoint(payload, 'users', '/mfa/enrol/start', 'post', {
    token: login.token,
  })
  if (start.body.error === 'reauth_required') {
    // Optional policy: the password session is already complete, so adding an authenticator app
    // needs re-authentication first (FR-039, ADR-012).
    await callEndpoint(payload, 'users', '/reauth', 'post', {
      token: login.token,
      body: { password: u.password },
    })
    start = await callEndpoint(payload, 'users', '/mfa/enrol/start', 'post', { token: login.token })
  }
  const secret = start.body.secret as string
  const confirm = await callEndpoint(payload, 'users', '/mfa/enrol/confirm', 'post', {
    token: login.token,
    body: { code: await totp(secret) },
  })
  if (confirm.status !== 200)
    throw new Error(`enrol failed ${confirm.status} ${JSON.stringify(confirm.body)}`)
  return {
    token: confirm.token,
    cookie: confirm.setCookie ?? '',
    userId: u.id,
    email: u.email,
    password: u.password,
    secret,
    recoveryCodes: confirm.body.recoveryCodes as string[],
  }
}

/** Marks a verified session as recently re-authenticated (FR-039) via the real endpoint. */
export async function reauth(payload: Payload, s: Session) {
  const r = await callEndpoint(payload, 'users', '/reauth', 'post', {
    token: s.token,
    body: { password: s.password },
  })
  if (r.status !== 200) throw new Error(`reauth failed ${r.status}`)
}
