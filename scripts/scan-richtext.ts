// Read-only scan (T084, FR-013c): every rich-text value and link group in pages, services and
// courses (current docs, drafts and all versions, all locales) against the policy. Exit 1 on any
// violation. Run after restores or migrations: pnpm scan:richtext
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { findContentIssues } from '../src/modules/content'

const payload = await getPayload({ config })
let violations = 0
for (const collection of ['pages', 'services', 'courses'] as const) {
  for (let page = 1; ; page++) {
    const docs = await payload.find({
      collection,
      locale: 'all',
      draft: true,
      depth: 0,
      overrideAccess: true,
      limit: 50,
      page,
    })
    for (const d of docs.docs) {
      const issues = findContentIssues(d)
      if (issues.length) {
        violations += issues.length
        payload.logger.error(
          { collection, id: d.id, codes: [...new Set(issues.map((i) => i.code))] },
          'rich-text policy violation',
        )
      }
    }
    if (!docs.hasNextPage) break
  }
  for (let page = 1; ; page++) {
    const versions = await payload.findVersions({
      collection,
      locale: 'all',
      depth: 0,
      overrideAccess: true,
      limit: 50,
      page,
    })
    for (const v of versions.docs) {
      const issues = findContentIssues(v.version)
      if (issues.length) {
        violations += issues.length
        payload.logger.error(
          { collection, versionId: v.id, codes: [...new Set(issues.map((i) => i.code))] },
          'rich-text policy violation in version',
        )
      }
    }
    if (!versions.hasNextPage) break
  }
}
payload.logger.info({ violations }, 'scan:richtext finished')
process.exit(violations ? 1 : 0)
