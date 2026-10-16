// Recent re-authentication for sensitive actions (FR-039): within 5 minutes in this session.
import type { Payload } from 'payload'
import { limitKey } from '../platform'
import { verifyPayloadPassword } from './crypto'
import { poolOf } from './db'
import { getLimiter } from './services'
import { markReauth } from './sessions'

export const REAUTH_WINDOW_MS = 5 * 60_000

export function hasRecentReauth(user: unknown): boolean {
  const at = (user as { reauthAt?: unknown } | null)?.reauthAt
  return typeof at === 'string' && Date.now() - new Date(at).getTime() <= REAUTH_WINDOW_MS
}

export async function reauthenticate(
  payload: Payload,
  userId: number | string,
  sid: string,
  password: unknown,
): Promise<boolean> {
  const hit = await getLimiter(payload).hit(limitKey('reauth:account', String(userId)), {
    limit: 5,
    windowMs: 15 * 60_000,
  })
  if (!hit.allowed || typeof password !== 'string') return false
  const doc = (await payload.findByID({
    collection: 'users',
    id: userId,
    overrideAccess: true,
    showHiddenFields: true,
    depth: 0,
  })) as { hash?: string; salt?: string }
  if (!(await verifyPayloadPassword(doc, password))) return false
  await markReauth(poolOf(payload), sid)
  return true
}
