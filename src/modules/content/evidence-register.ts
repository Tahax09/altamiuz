// Evidence register (T143, FR-016, SC-016): every claim in published content with its evidence
// status and reference, and every problem (claim without verified evidence matching its current
// text, or verified evidence without a reference). Read-only. Used by `pnpm check:evidence`.
import type { Payload } from 'payload'
import { CLAIM_BLOCKS, CLAIM_EVIDENCE, storedClaimProblems } from './evidence'

export type RegisterRow = {
  source: string
  claim: string
  status: string
  reference: string
  verifiedAt: string | null
}
export type EvidenceRegister = { rows: RegisterRow[]; problems: string[] }

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

function collect(source: string, doc: Obj, out: EvidenceRegister) {
  const add = (claim: string, ev: unknown) => {
    const e = isObj(ev) ? ev : {}
    const row: RegisterRow = {
      source,
      claim,
      status: typeof e.status === 'string' ? e.status : 'missing',
      reference: typeof e.reference === 'string' ? e.reference.trim() : '',
      verifiedAt: typeof e.verifiedAt === 'string' ? e.verifiedAt : null,
    }
    out.rows.push(row)
    if (row.status === 'verified' && !row.reference)
      out.problems.push(`${source} ${claim}: verified without an evidence reference`)
  }
  for (const [claim, evidence] of CLAIM_EVIDENCE) {
    const v = doc[claim]
    if (isObj(v) && Object.values(v).some((x) => typeof x === 'string' && x.trim()))
      add(claim, doc[evidence])
  }
  const sections = Array.isArray(doc.sections) ? (doc.sections as Obj[]) : []
  sections.forEach((b, i) => {
    if (typeof b.blockType === 'string' && b.blockType in CLAIM_BLOCKS)
      add(`sections.${i} (${b.blockType})`, b.evidence)
  })
  for (const p of storedClaimProblems(doc))
    out.problems.push(`${source} ${p}: claim without verified evidence matching its current text`)
}

export async function evidenceRegister(payload: Payload): Promise<EvidenceRegister> {
  const out: EvidenceRegister = { rows: [], problems: [] }
  for (const collection of ['pages', 'services', 'courses'] as const) {
    for (let page = 1; ; page++) {
      const res = await payload.find({
        collection,
        locale: 'all',
        draft: false,
        depth: 0,
        overrideAccess: true,
        limit: 50,
        page,
        // Published in at least one language (localized status, D-4).
        where: {
          or: [
            { '_status.ar': { equals: 'published' } },
            { '_status.en': { equals: 'published' } },
          ],
        },
      } as never)
      for (const d of res.docs as unknown as Obj[]) collect(`${collection}/${String(d.id)}`, d, out)
      if (!res.hasNextPage) break
    }
  }
  const settings = (await payload.findGlobal({
    slug: 'site-settings' as never,
    locale: 'all' as never,
    draft: false,
    depth: 0,
    overrideAccess: true,
  })) as unknown as Obj
  collect('site-settings', settings, out)
  return out
}
