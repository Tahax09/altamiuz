// Payload configuration: composes module configs only (plan Structure Decision).
import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { auditDeniedOperations, auditEvents } from '@/modules/audit'
import { invitations, securitySettings, users } from '@/modules/auth'
import { courses, pages, safeEditor, services, siteGlobals } from '@/modules/content'
import { enquiries, jobsRunEndpoints, sendEnquiryTask } from '@/modules/enquiries'
import { mediaCollection } from '@/modules/media'
import { redirects } from '@/modules/seo'
import { getConfig } from '@/modules/platform'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = getConfig()

export default buildConfig({
  secret: cfg.secrets.payload,
  serverURL: cfg.siteUrl,
  telemetry: false,
  debug: false,
  admin: {
    user: users.slug,
    // Payload's default avatar is Gravatar, which would send a hash of each user's email to a
    // third party (and is blocked by the admin CSP anyway).
    avatar: 'default',
    components: {
      afterLogin: ['/modules/auth/admin/PasskeyLogin#PasskeyLogin'],
      // CD-09: supplied emblem in place of Payload's graphics; colours in (payload)/custom.scss.
      graphics: {
        Logo: '/modules/platform/admin/Brand#AdminLogo',
        Icon: '/modules/platform/admin/Brand#AdminIcon',
      },
      providers: [
        '/modules/auth/admin/MfaGate#MfaGate',
        '/modules/content/admin/ErrorFocus#ErrorFocus',
        '/modules/content/admin/PaginationLabels#PaginationLabels',
      ],
    },
    importMap: { baseDir: dirname },
    meta: {
      titleSuffix: ' · Altamiuz CMS',
      icons: [
        { rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' },
        { rel: 'apple-touch-icon', url: '/apple-icon.png' },
      ],
      // No generated Open Graph images for admin pages; this also disables /api/og.
      defaultOGImageType: 'off',
      robots: { index: false, follow: false },
    },
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
  collections: [
    // HttpOnly session cookie; Secure whenever the public origin is https (always in production).
    {
      ...users,
      auth: {
        ...(users.auth as object),
        cookies: { sameSite: 'Lax', secure: cfg.siteUrl.startsWith('https://') },
      },
    },
    invitations,
    auditEvents,
    pages,
    services,
    courses,
    mediaCollection(),
    enquiries,
    redirects,
  ],
  globals: [securitySettings, ...siteGlobals],
  hooks: { afterError: [auditDeniedOperations] },
  // Jobs (D-14, D-15): enquiry notifications with retries. Only the signed runner endpoint
  // (`/api/jobs/run`, `/api/jobs/retention`; Vercel Cron in production, ADR-009) and the local
  // runner start jobs; Payload's own job endpoints are closed.
  jobs: {
    tasks: [sendEnquiryTask],
    access: { run: () => false, queue: () => false, cancel: () => false },
    autoRun: [{ cron: '* * * * *', queue: 'default', limit: 20 }],
    shouldAutoRun: () => cfg.jobs.trigger === 'local-runner' && cfg.appEnv !== 'test',
  },
  endpoints: [...jobsRunEndpoints],
  // __Host- prefix requires https; local http uses a plain name (ADR-005).
  cookiePrefix: cfg.siteUrl.startsWith('https://') ? '__Host-altamiuz' : 'altamiuz',
  db: postgresAdapter({
    pool: { connectionString: cfg.database.url },
    push: cfg.database.allowPush,
    migrationDir: path.resolve(dirname, '../migrations'),
  }),
  // Any rich-text field without its own editor still gets the allow-listed one (D-22).
  editor: safeEditor,
  sharp,
  // A-7: the multipart parser stops at 20 MB (also its default; pinned here so a Payload upgrade
  // cannot loosen it). The media hook re-checks the size and content (D-12).
  upload: { limits: { fileSize: 20 * 1024 * 1024 }, abortOnLimit: true },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
