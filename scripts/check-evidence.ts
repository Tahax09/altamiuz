// `pnpm check:evidence` (T143, FR-016, SC-016): prints the evidence register of published content
// and exits 1 when any published claim lacks verified, current, referenced evidence. Read-only.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { evidenceRegister } from '../src/modules/content'

const payload = await getPayload({ config })
const { rows, problems } = await evidenceRegister(payload)
for (const r of rows)
  console.log(
    [r.source, r.claim, r.status, r.reference || '(no reference)', r.verifiedAt ?? '-'].join(' | '),
  )
console.log(`check:evidence: ${rows.length} published claims, ${problems.length} problems`)
for (const p of problems) console.error(`  ${p}`)
process.exit(problems.length ? 1 : 0)
