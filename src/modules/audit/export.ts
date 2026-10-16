// Audited CSV export of the audit log (T067, FR-047). Filters: actor, action, from, to (ISO).
// Values are CSV-escaped and formula-neutralised; the export itself is recorded.
import type { PayloadRequest, Where } from 'payload'
import { recordAudit } from './record'

const MAX_ROWS = 10_000
const COLUMNS = [
  'at',
  'actor',
  'action',
  'targetType',
  'targetId',
  'outcome',
  'ip',
  'userAgent',
  'meta',
] as const

/** RFC 4180 quoting plus neutralising spreadsheet formulas (=, +, -, @, tab, CR). */
export function csvCell(value: unknown): string {
  let s =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export async function exportAuditCsv(req: PayloadRequest): Promise<Response> {
  const q = new URL(req.url ?? 'http://x/').searchParams
  const and: Where[] = []
  if (q.get('actor')) and.push({ actor: { equals: q.get('actor') } })
  if (q.get('action')) and.push({ action: { equals: q.get('action') } })
  if (q.get('from') && !Number.isNaN(Date.parse(q.get('from')!)))
    and.push({ at: { greater_than_equal: q.get('from') } })
  if (q.get('to') && !Number.isNaN(Date.parse(q.get('to')!)))
    and.push({ at: { less_than_equal: q.get('to') } })
  const res = await req.payload.find({
    collection: 'audit-events' as never,
    where: and.length ? { and } : undefined,
    sort: '-at',
    limit: MAX_ROWS,
    pagination: false,
    user: req.user,
    overrideAccess: false,
  })
  const lines = [
    COLUMNS.join(','),
    ...res.docs.map((d) =>
      COLUMNS.map((c) => csvCell((d as Record<string, unknown>)[c])).join(','),
    ),
  ]
  await recordAudit(req.payload, {
    actor: `user:${req.user!.id}`,
    action: 'audit.export',
    target: { type: 'audit-events', id: 'export' },
    outcome: 'success',
    meta: { count: res.docs.length },
  })
  return new Response(`${lines.join('\r\n')}\r\n`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="audit-events.csv"',
      'cache-control': 'no-store',
    },
  })
}
