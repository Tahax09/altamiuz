// A-9 retention: entries older than 24 months are removed only by the database function
// audit_events_purge_expired() (migration *_audit_append_only), never by ordinary deletes.
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { recordAudit } from './record'

type DrizzleDb = { execute: (q: unknown) => Promise<{ rows: { n: number | string }[] }> }

export async function purgeExpiredAuditEvents(payload: Payload): Promise<number> {
  const db = (payload.db as unknown as { drizzle: DrizzleDb }).drizzle
  const res = await db.execute(sql`select audit_events_purge_expired() as n`)
  const count = Number(res.rows[0]?.n ?? 0)
  await recordAudit(payload, {
    actor: 'system',
    action: 'audit.retention_purge',
    target: { type: 'audit-events', id: 'retention' },
    outcome: 'success',
    meta: { count },
  })
  return count
}
