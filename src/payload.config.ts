// Payload configuration: composes module configs only (plan Structure Decision).
import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { auditEvents } from '@/modules/audit'
import { usersPlaceholder } from '@/modules/auth'
import { getConfig } from '@/modules/platform'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = getConfig()

export default buildConfig({
  secret: cfg.secrets.payload,
  serverURL: cfg.siteUrl,
  telemetry: false,
  debug: false,
  admin: {
    user: usersPlaceholder.slug,
    importMap: { baseDir: dirname },
  },
  // D-23: English-only CMS navigation and controls in v1.
  i18n: { supportedLanguages: { en }, fallbackLanguage: 'en' },
  // FR-001/FR-004: Arabic (RTL, default) and English content; no silent fallback.
  localization: {
    locales: [
      { code: 'ar', label: 'Arabic', rtl: true },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'ar',
    fallback: false,
  },
  // D-4: per-locale publish status; pinned version + regression test (T075).
  experimental: { localizeStatus: true },
  // D-3: public site uses the Local API only; GraphQL is off.
  graphQL: { disable: true },
  csrf: [cfg.siteUrl],
  collections: [usersPlaceholder, auditEvents],
  db: postgresAdapter({
    pool: { connectionString: cfg.database.url },
    push: cfg.database.allowPush,
    migrationDir: path.resolve(dirname, '../migrations'),
  }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
