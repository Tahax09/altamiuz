import { defineConfig } from '@playwright/test'

// Browser/HTTP suites run against a production build (`pnpm build` first) on an isolated port,
// with a disposable altamiuz_e2e database created, migrated and seeded in global setup.
const PORT = Number(process.env.SMOKE_PORT ?? 3100)
if (process.env.DATABASE_URL && !process.env.E2E_ADMIN_DATABASE_URL) {
  process.env.E2E_ADMIN_DATABASE_URL = process.env.DATABASE_URL
  const e2e = new URL(process.env.DATABASE_URL)
  e2e.pathname = '/altamiuz_e2e'
  process.env.DATABASE_URL = e2e.toString()
}
process.env.SITE_URL = `http://127.0.0.1:${PORT}`
process.env.EMAIL_DRIVER = 'memory'

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/support/e2e-setup.ts',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [
    { name: 'smoke', testDir: './tests/smoke', use: { browserName: 'chromium' } },
    { name: 'webkit-smoke', testDir: './tests/smoke', use: { browserName: 'webkit' } },
    { name: 'security', testDir: './tests/security', use: { browserName: 'chromium' } },
    { name: 'a11y-admin', testDir: './tests/a11y/admin', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: `pnpm start --port ${PORT} --hostname 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
