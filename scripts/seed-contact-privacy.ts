// `pnpm seed:contact [replace-draft]`: loads the contact page and privacy notice as DRAFTS
// (scripts/contact-privacy.ts) and fills empty site settings in the settings draft. Never
// publishes. Run it before `pnpm seed:homepage` so the homepage calls to action link here.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { ContactSeedError, seedContactAndPrivacy } from './contact-privacy'

// `payload run` passes only positional arguments to the script (minimist drops `--flags`), so the
// option is the word `replace-draft`: `pnpm seed:… replace-draft`.
const replaceDraftRequested = () =>
  process.argv.slice(2).some((a) => a === 'replace-draft' || a === '--replace-draft')

const payload = await getPayload({ config })
try {
  const r = await seedContactAndPrivacy(payload, {
    replaceDraft: replaceDraftRequested(),
  })
  payload.logger.info(
    `Contact page ${r.contactId} and privacy notice ${r.privacyId} saved as drafts; nothing published. ` +
      `Site settings draft: ${r.settings.privacyNoticeSet ? 'privacy notice linked' : 'privacy notice already set'}, ` +
      `${r.settings.topicAdded ? 'one default topic added' : 'topics unchanged'}. ` +
      'The privacy notice cannot be published until its "Pending" sections are resolved (CD-10).',
  )
  process.exit(0)
} catch (e) {
  payload.logger.error(e instanceof ContactSeedError ? e.message : e)
  process.exit(1)
}
