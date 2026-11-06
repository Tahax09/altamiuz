// Audited CSV export of enquiries (FR-076, T126). Needs the separate `export` permission, MFA and
// recent re-authentication (collection endpoint). Values are CSV-escaped and formula-neutralised.
// The export is one `enquiry.export` audit entry with the row count only (no content).
import type { PayloadRequest } from 'payload'
import { csvCell, recordAudit } from '../audit'

const MAX_ROWS = 10_000
const COLUMNS = [
  'createdAt',
  'name',
  'email',
  'phone',
  'organization',
  'topic',
  'message',
  'locale',
  'delivery.status',
  'deleteAfter',
] as const

const get = (d: Record<string, unknown>, path: string) =>
  path
    .split('.')
    .reduce<unknown>(
      (v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined),
      d,
    )

export async function exportEnquiriesCsv(req: PayloadRequest): Promise<Response> {
  const res = await req.payload.find({
    collection: 'enquiries' as never,
    sort: '-createdAt',
    limit: MAX_ROWS,
    pagination: false,
    depth: 0,
    user: req.user,
    overrideAccess: false,
    // One export entry instead of a view entry per row.
    context: { enquirySystem: true },
  })
  const lines = [
    COLUMNS.join(','),
    ...res.docs.map((d) =>
      COLUMNS.map((c) => csvCell(get(d as Record<string, unknown>, c))).join(','),
    ),
  ]
  await recordAudit(req.payload, {
    actor: `user:${req.user!.id}`,
    action: 'enquiry.export',
    target: { type: 'enquiries', id: 'export' },
    outcome: 'success',
    meta: { count: res.docs.length },
  })
  return new Response(`${lines.join('\r\n')}\r\n`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="enquiries.csv"',
      'cache-control': 'no-store',
    },
  })
}
