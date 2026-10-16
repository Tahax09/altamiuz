import { defineConfig } from '@playwright/test'

// Smoke tests run against a production build (`pnpm build` first) on an isolated port.
const PORT = Number(process.env.SMOKE_PORT ?? 3100)

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [
    { name: 'smoke', testDir: './tests/smoke', use: { browserName: 'chromium' } },
    { name: 'webkit-smoke', testDir: './tests/smoke', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: `pnpm start --port ${PORT} --hostname 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
