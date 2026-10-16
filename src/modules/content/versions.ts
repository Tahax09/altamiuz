// A-11 version retention (ADR-006): keep every version for 12 months and at least the newest 50
// per document thereafter. Run as a scheduled job once the jobs runner exists.
import type { Payload } from 'payload'
import type { RoutedCollection } from '../i18n'

export async function pruneVersions(
  payload: Payload,
  collection: RoutedCollection,
  now = new Date(),
): Promise<number> {
  const pool = (payload.db as unknown as { pool: import('pg').Pool }).pool
  const table = `_${collection}_v`
  const res = await pool.query(
    `delete from "${table}" where id in (
       select id from (
         select id, updated_at, latest, row_number() over (partition by parent_id order by updated_at desc) as rn from "${table}"
       ) v where v.rn > 50 and v.updated_at < $1::timestamptz - interval '12 months' and v.latest is not true
     )`,
    [now],
  )
  return res.rowCount ?? 0
}
