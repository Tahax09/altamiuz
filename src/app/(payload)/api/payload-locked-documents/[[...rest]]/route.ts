// Overrides Payload's REST routes for document locks (more specific than the [...slug] catch-all):
// MFA-verified CMS sessions only; delete own lock, take over to self, no REST create; minimal
// user data in responses. See src/modules/content/locks.ts.
import config from '@payload-config'
import { getPayload } from 'payload'
import { handleLockRequest } from '@/modules/content'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ rest?: string[] }> }

const handle = async (request: Request, { params }: Ctx) =>
  handleLockRequest(await getPayload({ config }), request, (await params).rest ?? [])

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
