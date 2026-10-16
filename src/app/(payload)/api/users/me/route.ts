// Overrides Payload's /api/users/me so the session token is never returned in a response body
// (Payload's built-in returns it, defeating HttpOnly). Returns an allow-listed user view only.
import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  const u = user as unknown as Record<string, unknown> | null
  if (!u) return Response.json({ user: null }, { headers: { 'cache-control': 'no-store' } })
  return Response.json(
    {
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        collection: 'users',
        mfaVerified: u.mfaVerified === true,
      },
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
