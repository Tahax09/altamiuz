// T119 (FR-065, SC-012, CD-12): legacy redirects from the owner-approved map
// docs/content/legacy-redirect-map.md. Pure parsing and planning here; `pnpm seed:redirects`
// (scripts/seed-legacy-redirects.ts) runs it. Rules, all fail-closed:
//   - every row needs an approved target and an "Approved by / date" entry; a PENDING target, an
//     empty approval or a `<placeholder>` source refuses the whole run (nothing is written);
//   - targets must be internal site paths under a locale (`/{ar|en}` or `/{ar|en}/…`), must not
//     use a placeholder Arabic route segment (CD-13), and must resolve to a published page,
//     listing or home in that language (one hop, no chain, SC-012);
//   - `/` is owned by the A-3 language redirect (src/proxy.ts); its row is accepted only with the
//     target `A-3` (no stored redirect) and is then skipped;
//   - idempotent: one `redirects` row per source with `source: legacy`, updated in place when the
//     map changes; rows of other sources are never touched.
import type { Payload } from 'payload'
import { alternateSlugs, getPublished, resolvePublicPath } from '../src/modules/content'
import { LOCALES, routeVocabularyPending, STATIC_SEGMENTS, type Locale } from '../src/modules/i18n'
import { normaliseSitePath } from '../src/modules/seo'

export class LegacyRedirectError extends Error {}

export type MapRow = {
  line: number
  from: string
  to: string
  type: '301' | '302'
  approvedBy: string
}

const CELL = /^\s*\|(.*)\|\s*$/
const strip = (cell: string) => cell.trim().replace(/^`|`$/g, '').trim()

/** Table rows of the map (first column a code-quoted legacy path). Header and rule rows skipped. */
export function parseRedirectMap(markdown: string): MapRow[] {
  const rows: MapRow[] = []
  markdown.split('\n').forEach((raw, i) => {
    const m = CELL.exec(raw)
    if (!m) return
    const cells = m[1]!.split('|').map(strip)
    if (cells.length < 4 || !cells[0]!.startsWith('/')) return
    const type = cells[2]
    if (type !== '301' && type !== '302')
      throw new LegacyRedirectError(
        `Line ${i + 1}: redirect type must be 301 or 302 (got "${type}").`,
      )
    rows.push({ line: i + 1, from: cells[0]!, to: cells[1]!, type, approvedBy: cells[3] ?? '' })
  })
  return rows
}

export type Plan = {
  create: MapRow[]
  update: MapRow[]
  unchanged: MapRow[]
  skipped: MapRow[]
}

const isLocale = (v: string | undefined): v is Locale =>
  (LOCALES as readonly string[]).includes(v ?? '')

/** Refuses the run unless every row is approved and every target is a live v1 path. */
export async function planLegacyRedirects(payload: Payload, rows: MapRow[]): Promise<Plan> {
  const problems: string[] = []
  const readers = {
    published: (c: 'pages' | 'services' | 'courses', l: Locale, s: string) =>
      getPublished(payload, c, l, s),
    alternates: (c: 'pages' | 'services' | 'courses', id: number | string) =>
      alternateSlugs(payload, c, id),
  }
  const plan: Plan = { create: [], update: [], unchanged: [], skipped: [] }
  const seen = new Set<string>()
  for (const row of rows) {
    const at = `Line ${row.line} (${row.from})`
    if (/[<>]/.test(row.from)) {
      problems.push(`${at}: the legacy path is a placeholder; supply the exact URL.`)
      continue
    }
    const from = normaliseSitePath(row.from)
    if (!from) {
      problems.push(`${at}: the legacy path is not a valid site path.`)
      continue
    }
    if (seen.has(from)) {
      problems.push(`${at}: duplicate source (same path after normalisation).`)
      continue
    }
    seen.add(from)
    if (!row.approvedBy) {
      problems.push(`${at}: no "Approved by / date" entry (CD-12).`)
      continue
    }
    if (/^PENDING\b/i.test(row.to)) {
      problems.push(`${at}: target is PENDING (CD-12).`)
      continue
    }
    if (from === '/') {
      if (/^A-3\b/.test(row.to)) {
        plan.skipped.push(row)
        continue
      }
      problems.push(
        `${at}: "/" is the A-3 language redirect; write the target "A-3" to keep it, no stored redirect is created.`,
      )
      continue
    }
    const to = normaliseSitePath(row.to)
    if (!to || to === from) {
      problems.push(`${at}: target "${row.to}" is not an internal site path.`)
      continue
    }
    const segments = to.split('/').filter(Boolean)
    if (!isLocale(segments[0])) {
      problems.push(`${at}: target "${to}" must start with a locale (/ar or /en).`)
      continue
    }
    const pendingSegments = new Set(
      LOCALES.flatMap((l) => Object.values(STATIC_SEGMENTS[l])).filter((s) =>
        routeVocabularyPending({
          ar: { services: s, training: s },
          en: { services: s, training: s },
        }),
      ),
    )
    if (segments.some((s) => pendingSegments.has(s))) {
      problems.push(`${at}: target "${to}" uses a placeholder Arabic route segment (CD-13).`)
      continue
    }
    const r = await resolvePublicPath(readers, segments)
    if (!r || r.kind === 'missing') {
      problems.push(`${at}: target "${to}" is not a published page in that language.`)
      continue
    }
    const existing = (
      await payload.find({
        collection: 'redirects',
        where: { from: { equals: from } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
    ).docs[0] as unknown as { id: number; to: string; type: string; source: string } | undefined
    if (!existing) plan.create.push({ ...row, from, to })
    else if (existing.source !== 'legacy')
      problems.push(
        `${at}: a ${existing.source} redirect already exists for this path (#${existing.id}); resolve it in the admin first.`,
      )
    else if (existing.to === to && existing.type === row.type)
      plan.unchanged.push({ ...row, from, to })
    else plan.update.push({ ...row, from, to })
  }
  if (problems.length)
    throw new LegacyRedirectError(
      `Legacy redirect map not ready; nothing written:\n- ${problems.join('\n- ')}`,
    )
  return plan
}

/** Writes the plan through the Local API (graph rules and audit apply), as the system actor. */
export async function applyLegacyRedirects(payload: Payload, plan: Plan): Promise<void> {
  for (const row of plan.create)
    await payload.create({
      collection: 'redirects',
      data: { from: row.from, to: row.to, type: row.type, source: 'legacy' } as never,
      overrideAccess: true,
    })
  for (const row of plan.update) {
    const existing = (
      await payload.find({
        collection: 'redirects',
        where: { from: { equals: row.from } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
    ).docs[0] as unknown as { id: number }
    await payload.update({
      collection: 'redirects',
      id: existing.id,
      data: { to: row.to, type: row.type } as never,
      overrideAccess: true,
    })
  }
}

export function describePlan(plan: Plan): string {
  const list = (rows: MapRow[]) => rows.map((r) => `${r.from} → ${r.to} (${r.type})`).join(', ')
  return [
    `create ${plan.create.length}${plan.create.length ? `: ${list(plan.create)}` : ''}`,
    `update ${plan.update.length}${plan.update.length ? `: ${list(plan.update)}` : ''}`,
    `unchanged ${plan.unchanged.length}`,
    `skipped ${plan.skipped.length}${plan.skipped.length ? ` (${plan.skipped.map((r) => r.from).join(', ')})` : ''}`,
  ].join('; ')
}
