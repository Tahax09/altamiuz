// Playwright global setup: a disposable altamiuz_e2e database, migrated and seeded through the
// real account services. Credentials are synthetic and written only to test-results/ (ignored).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import pg from 'pg'

export default async function setup() {
  const admin = process.env.E2E_ADMIN_DATABASE_URL!
  const name = new URL(process.env.DATABASE_URL!).pathname.slice(1)
  const c = new pg.Client({ connectionString: admin })
  await c.connect()
  await c.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
  await c.query(`CREATE DATABASE "${name}"`)
  await c.end()
  // Files from the previous run belong to the database just dropped.
  fs.rmSync(process.env.MEDIA_DIR!, { recursive: true, force: true })
  const env = {
    ...process.env,
    APP_ENV: 'test',
    DATABASE_ALLOW_PUSH: 'false',
    EMAIL_DRIVER: 'memory',
  }
  execFileSync('pnpm', ['-s', 'payload', 'migrate'], { env, stdio: 'pipe' })
  execFileSync('pnpm', ['-s', 'payload', 'run', 'tests/support/e2e-seed.ts'], {
    env,
    stdio: 'pipe',
  })
  // No drop in teardown: Playwright stops the web server after global teardown, and dropping a
  // database under a live pool makes pg print client objects (incl. connection parameters).
  // The next run drops any leftover e2e database before recreating it.
}
