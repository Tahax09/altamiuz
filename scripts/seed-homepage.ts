// `pnpm seed:homepage [--replace-draft]`: loads the homepage copy and illustrations as a DRAFT
// (scripts/homepage.ts). Never publishes. Refuses to touch an existing home page unless
// --replace-draft is given, and even then only its draft changes.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { HomepageSeedError, seedHomepage } from './homepage'

const payload = await getPayload({ config })
try {
  const r = await seedHomepage(payload, { replaceDraft: process.argv.includes('--replace-draft') })
  payload.logger.info(
    `Homepage draft ${r.replaced ? 'replaced' : 'created'} (page ${r.id}); not published. ` +
      `Hidden until their inputs exist: ${r.hidden.join(' | ')}. ` +
      (r.contactLinked
        ? 'Calls to action link to the contact page.'
        : 'No page with slug "contact" exists: the calls to action have no link yet.'),
  )
  process.exit(0)
} catch (e) {
  payload.logger.error(e instanceof HomepageSeedError ? e.message : e)
  process.exit(1)
}
