// `pnpm seed:pages [replace-draft]`: loads About, Standards and frameworks, Expertise and
// experience, Insights and resources and Terms of use as DRAFTS (scripts/site-pages.ts), and fills
// empty header/footer menu and site-settings drafts. Never publishes. Run after `pnpm seed:contact`.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seedSitePages, SitePagesSeedError } from './site-pages'

// `payload run` passes only positional arguments (minimist drops `--flags`).
const replaceDraftRequested = () =>
  process.argv.slice(2).some((a) => a === 'replace-draft' || a === '--replace-draft')

const payload = await getPayload({ config })
try {
  const r = await seedSitePages(payload, { replaceDraft: replaceDraftRequested() })
  payload.logger.info(
    `Pages saved as drafts (nothing published): ${Object.entries(r.pages)
      .map(([k, id]) => `${k} ${id}`)
      .join(', ')}. Menus: header ${r.menus.header ? 'filled' : 'unchanged'}, footer ${
      r.menus.footer ? 'filled' : 'unchanged'
    }. Site settings draft: contact page ${r.settings.contactPage ? 'linked' : 'unchanged'}, legal links ${
      r.settings.legalLinks ? 'added' : 'unchanged'
    }, services introduction ${r.settings.servicesIntro ? 'added' : 'unchanged'}.`,
  )
  process.exit(0)
} catch (e) {
  payload.logger.error(e instanceof SitePagesSeedError ? e.message : e)
  process.exit(1)
}
