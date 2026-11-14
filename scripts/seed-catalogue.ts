// `pnpm seed:catalogue [replace-draft]`: loads the services, training programmes and the first
// insight article as DRAFTS (scripts/catalogue.ts) and fills empty contact e-mail and phone
// numbers in the site-settings draft. Never publishes.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { CatalogueSeedError, seedCatalogue } from './catalogue'

// `payload run` passes only positional arguments (minimist drops `--flags`).
const replaceDraftRequested = () =>
  process.argv.slice(2).some((a) => a === 'replace-draft' || a === '--replace-draft')

const payload = await getPayload({ config })
try {
  const r = await seedCatalogue(payload, { replaceDraft: replaceDraftRequested() })
  const c = r.contact
  payload.logger.info(
    `Saved as drafts (nothing published): ${r.services.length} services, ${r.courses.length} courses, article ${r.article}. Site settings draft: e-mail ${c.email ? 'added' : 'unchanged'}, main phone ${c.phone ? 'added' : 'unchanged'}, other phones ${c.additionalPhones ? 'added' : 'unchanged'}. The address is not seeded (needs verified evidence, CD-02).`,
  )
  process.exit(0)
} catch (e) {
  payload.logger.error(e instanceof CatalogueSeedError ? e.message : e)
  process.exit(1)
}
