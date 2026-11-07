// Enquiry delivery backlog as a readiness check (FR-074, FR-100, SC-010; docs/runbooks/monitoring.md).
// Fails while any enquiry email has failed permanently in the last 24 hours, or any notification
// is still undelivered 30 minutes after submission (the retry schedule ends after ~15 minutes, and
// the scheduler runs every minute). It reads the database, so it still alerts when the failing
// part is the email provider or the log pipeline. Only a pass/fail leaves this function.
import type { ReadinessCheck } from '../platform'

export const BACKLOG_SQL = `select count(*)::int as n from enquiries
  where (delivery_status = 'failed' and updated_at > now() - interval '24 hours')
     or (delivery_status in ('pending', 'retrying') and created_at < now() - interval '30 minutes')`

export const enquiryDeliveryCheck: ReadinessCheck = {
  critical: false,
  run: async (db) => {
    const res = await db.query<{ n: number }>(BACKLOG_SQL)
    return Number(res.rows[0]?.n ?? 1) === 0
  },
}
