import type pg from 'pg'
import type { Payload } from 'payload'

/** The Postgres pool Payload already manages (auth tables live beside Payload's). */
export function poolOf(payload: Payload): pg.Pool {
  const pool = (payload.db as unknown as { pool?: pg.Pool }).pool
  if (!pool) throw new Error('database pool unavailable')
  return pool
}
