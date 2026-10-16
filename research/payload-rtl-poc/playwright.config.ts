import { defineConfig } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './evidence-tests',
  timeout: 900_000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3100', headless: true, actionTimeout: 15_000, navigationTimeout: 120_000 },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
})
