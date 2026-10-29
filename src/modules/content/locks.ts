// Document-lock REST surface (FR-015, FR-033, WS10). Payload's `payload-locked-documents`
// collection uses `defaultAccess` (any signed-in user), so a password-only (MFA-pending) session
// could list and delete locks, and any user could silently release someone else's lock. The admin
// UI only needs: list locks for one document, delete its own lock, and take a lock over (assign
// it to itself, after Payload's warning dialog). Locks are created server-side by Payload.
import type { Payload, Where } from 'payload'
import { can, isMfaVerified, roleOf } from '../access'
import { recordAudit } from '../audit'

const SLUG = 'payload-locked-documents'
const forbidden = () =>
  Response.json(
    { errors: [{ message: 'You are not allowed to perform this action.' }] },
    { status: 403, headers: { 'cache-control': 'no-store' } },
  )
const notFound = () => Response.json({ errors: [{ message: 'Not Found' }] }, { status: 404 })
const json = (body: unknown) => Response.json(body, { headers: { 'cache-control': 'no-store' } })

type LockDoc = {
  id: number
  document?: { relationTo: string; value: unknown } | null
  globalSlug?: string | null
  user?: { relationTo: string; value: unknown } | null
  updatedAt?: string
  createdAt?: string
}

const idOf = (v: unknown) =>
  typeof v === 'object' && v ? (v as { id?: unknown }).id : (v as number | string | undefined)

/** Only what the lock dialog shows (`email ?? id`), and the email only for directory readers. */
async function view(payload: Payload, lock: LockDoc, showEmail: boolean) {
  const userId = idOf(lock.user?.value)
  let value: unknown = userId
  if (showEmail && userId !== undefined) {
    const u = (await payload
      .findByID({ collection: 'users', id: userId as number, depth: 0, overrideAccess: true })
      .catch(() => null)) as { email?: string } | null
    value = { id: userId, email: u?.email, collection: 'users' }
  }
  return {
    id: lock.id,
    document: lock.document
      ? { relationTo: lock.document.relationTo, value: idOf(lock.document.value) }
      : null,
    globalSlug: lock.globalSlug ?? null,
    user: { relationTo: 'users', value },
    updatedAt: lock.updatedAt,
    createdAt: lock.createdAt,
  }
}

export async function handleLockRequest(
  payload: Payload,
  request: Request,
  segments: string[],
): Promise<Response> {
  const { user } = await payload.auth({ headers: request.headers })
  const role = roleOf(user)
  if (!user || !isMfaVerified(user) || !role) return forbidden()
  const showEmail = can(role, 'users', 'read')
  const method = request.method.toUpperCase()
  const id = segments[0]
  if (segments.length > 1 || (id !== undefined && !/^[0-9]{1,12}$/.test(id))) return notFound()

  const deny = async (action: string) => {
    await recordAudit(payload, {
      actor: `user:${user.id}`,
      action: 'access.denied',
      target: { type: SLUG, id: id ?? '-' },
      outcome: 'denied',
      meta: { resource: SLUG, action },
    })
    return forbidden()
  }

  if (method === 'GET' && id === undefined) {
    // Only the filters the admin uses; anything else is ignored rather than passed through.
    const q = new URL(request.url).searchParams
    const and: Where[] = []
    const rel = q.get('where[document.relationTo][equals]')
    const val = q.get('where[document.value][equals]')
    const glob = q.get('where[globalSlug][equals]')
    if (rel) and.push({ 'document.relationTo': { equals: rel } })
    if (val && /^[0-9]{1,12}$/.test(val)) and.push({ 'document.value': { equals: Number(val) } })
    if (glob) and.push({ globalSlug: { equals: glob } })
    if (!and.length) return json({ docs: [], totalDocs: 0 })
    const res = await payload.find({
      collection: SLUG,
      where: { and },
      depth: 0,
      limit: 10,
      overrideAccess: true,
    })
    const docs = await Promise.all(
      (res.docs as unknown as LockDoc[]).map((d) => view(payload, d, showEmail)),
    )
    return json({ docs, totalDocs: docs.length })
  }

  if (id === undefined) return method === 'POST' ? deny('create') : forbidden()
  const lock = (await payload
    .findByID({ collection: SLUG, id: Number(id), depth: 0, overrideAccess: true })
    .catch(() => null)) as LockDoc | null
  if (!lock) return notFound()
  const ownsLock = String(idOf(lock.user?.value)) === String(user.id)

  if (method === 'GET') return json(await view(payload, lock, showEmail))
  if (method === 'DELETE') {
    if (!ownsLock) return deny('delete')
    await payload.delete({ collection: SLUG, id: lock.id, overrideAccess: true })
    return json({ doc: { id: lock.id }, message: 'Deleted' })
  }
  if (method === 'PATCH') {
    // Take-over: the only change allowed is assigning the lock to the requester.
    const body = (await request.json().catch(() => null)) as {
      user?: { relationTo?: string; value?: unknown }
    } | null
    const keys = body && typeof body === 'object' ? Object.keys(body) : []
    const target = body?.user
    if (
      keys.length !== 1 ||
      keys[0] !== 'user' ||
      target?.relationTo !== 'users' ||
      String(target.value) !== String(user.id)
    )
      return deny('update')
    const doc = await payload.update({
      collection: SLUG,
      id: lock.id,
      data: { user: { relationTo: 'users', value: user.id } } as never,
      overrideAccess: true,
    })
    return json({ doc: await view(payload, doc as unknown as LockDoc, showEmail) })
  }
  return forbidden()
}
