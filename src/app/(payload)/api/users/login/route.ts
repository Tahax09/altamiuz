// Overrides Payload's /api/users/login (static route beats the catch-all) with the
// enumeration-resistant sign-in (ADR-005). The token is set only as an HttpOnly cookie.
import config from '@payload-config'
import { getPayload } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import { clientIp, padToFloor, sameOrigin, signIn } from '@/modules/auth'

export const dynamic = 'force-dynamic'
const FAILED = { errors: [{ message: 'Sign-in failed. Check your details or try again later.' }] }
const noStore = { 'cache-control': 'no-store' }

export async function POST(request: Request): Promise<Response> {
  const started = performance.now()
  if (Number(request.headers.get('content-length') ?? 0) > 16_384)
    return Response.json(FAILED, { status: 413, headers: noStore })
  if (!sameOrigin(request.headers)) return Response.json(FAILED, { status: 403, headers: noStore })
  const payload = await getPayload({ config })
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    body = {}
  }
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
