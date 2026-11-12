// `pnpm seed:redirects [apply]` (T119, FR-065, CD-12): checks docs/content/legacy-redirect-map.md
// against the published site and, only with `apply`, writes the approved legacy redirects
// (scripts/legacy-redirects.ts). Without `apply` it prints the plan and changes nothing. Any
// PENDING, unapproved or unresolvable row refuses the whole run.
import fs from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {
  applyLegacyRedirects,
  describePlan,
  LegacyRedirectError,
  parseRedirectMap,
  planLegacyRedirects,
} from './legacy-redirects'

const MAP = 'docs/content/legacy-redirect-map.md'
// `payload run` passes only positional arguments (minimist drops `--flags`).
const apply = process.argv.slice(2).some((a) => a === 'apply' || a === '--apply')

const payload = await getPayload({ config })
try {
  const rows = parseRedirectMap(fs.readFileSync(MAP, 'utf8'))
  if (!rows.length) throw new LegacyRedirectError(`${MAP}: no legacy rows found.`)
  const plan = await planLegacyRedirects(payload, rows)
  if (apply) {
    await applyLegacyRedirects(payload, plan)
    payload.logger.info(`Legacy redirects written: ${describePlan(plan)}.`)
  } else
    payload.logger.info(
      `Legacy redirect plan (nothing written; add "apply"): ${describePlan(plan)}.`,
    )
  process.exit(0)
} catch (e) {
  payload.logger.error(e instanceof LegacyRedirectError ? e.message : e)
  process.exit(1)
}
