// Overrides Payload's /api/users/login (static route beats the catch-all) with the
// enumeration-resistant sign-in (ADR-005). The token is set only as an HttpOnly cookie.
import config from '@payload-config'
import { getPayload } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import { clientIp, padToFloor, sameOrigin, signIn } from '@/modules/auth'

export const dynamic = 'force-dynamic'
const FAILED = { errors: [{ message: 'Sign-in failed. Check your details or try again later.' }] }
const noStore = { 'cache-control': 'no-store' }

/**
 * The admin login page (Payload's <Form>) posts multipart/form-data with the fields JSON-encoded
 * in a `_payload` part; the account pages and API clients post JSON. Anything else, or anything
 * malformed, yields no credentials and fails like any other sign-in. signIn() only accepts string
 * values, so non-string fields cannot reach the account lookup.
 */
async function credentials(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') ?? ''
  try {
    const parsed: unknown = type.startsWith('multipart/form-data')
      ? JSON.parse(String((await request.formData()).get('_payload') ?? ''))
      : await request.json()
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export async function POST(request: Request): Promise<Response> {
  const started = performance.now()
  if (Number(request.headers.get('content-length') ?? 0) > 16_384)
    return Response.json(FAILED, { status: 413, headers: noStore })
  if (!sameOrigin(request.headers)) return Response.json(FAILED, { status: 403, headers: noStore })
  const payload = await getPayload({ config })
  const body = await credentials(request)
  const r = await signIn(payload, {
    email: body?.email,
    password: body?.password,
    ip: clientIp(request.headers),
    userAgent: request.headers.get('user-agent') ?? undefined,
  })
  if (!r.ok) {
    await padToFloor(started)
    return Response.json(FAILED, { status: 401, headers: noStore })
  }
  const cookie = generatePayloadCookie({
    collectionAuthConfig: payload.collections.users!.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token: r.token,
  })
  return Response.json(
    {
      message: 'Signed in. Second factor required.',
      user: { id: r.userId, collection: 'users' },
      exp: r.exp,
      mfaRequired: true,
    },
    { headers: { ...noStore, 'set-cookie': cookie } },
  )
}
