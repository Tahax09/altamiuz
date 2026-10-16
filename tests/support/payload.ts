// Integration-test harness: a fresh database per test file, migrated with the real Payload CLI,
// and a Payload instance built from the real src/payload.config.ts. Dropped in afterAll.
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import type { Payload } from 'payload'

export type TestPayload = {
  payload: Payload
  databaseUrl: string
  sql: pg.Pool
  close: () => Promise<void>
}

const adminUrl = () => {
  const u = process.env.TEST_ADMIN_DATABASE_URL
  if (!u) throw new Error('integration globalSetup did not run')
  return u
}

export async function createDatabase(): Promise<{ url: string; drop: () => Promise<void> }> {
  const name = `altamiuz_t_${randomBytes(6).toString('hex')}`
  const admin = new pg.Client({ connectionString: adminUrl() })
  await admin.connect()
  await admin.query(`CREATE DATABASE "${name}"`)
  await admin.end()
  const url = new URL(adminUrl())
  url.pathname = `/${name}`
  return {
    url: url.toString(),
    drop: async () => {
      const c = new pg.Client({ connectionString: adminUrl() })
      await c.connect()
      await c.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
      await c.end()
    },
  }
}

/** A fresh database with every committed migration applied (no Payload instance). */
export async function createMigratedDatabase(): Promise<{
  url: string
  drop: () => Promise<void>
}> {
  const db = await createDatabase()
  const env = {
    ...process.env,
    APP_ENV: 'test',
    DATABASE_URL: db.url,
    DATABASE_ALLOW_PUSH: 'false',
  }
  execFileSync('pnpm', ['-s', 'payload', 'migrate'], { env, stdio: 'pipe' })
  return db
}

export async function bootPayload(): Promise<TestPayload> {
  const db = await createMigratedDatabase()
  Object.assign(process.env, {
    APP_ENV: 'test',
    DATABASE_URL: db.url,
    DATABASE_ALLOW_PUSH: 'false',
  })
  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })
  const sql = new pg.Pool({ connectionString: db.url, max: 4 })
  return {
    payload,
    databaseUrl: db.url,
    sql,
    close: async () => {
      await sql.end()
      // Payload's adapter destroy() does not end its pg pool (3.91.0), so close it here first;
      // otherwise DROP DATABASE (FORCE) terminates live connections and surfaces as errors.
      const pool = (payload.db as unknown as { pool?: pg.Pool }).pool
      if (pool) {
        pool.on('error', () => undefined) // teardown-only: our own forced drop
        await Promise.race([pool.end(), new Promise((r) => setTimeout(r, 5_000))])
      }
      await db.drop()
    },
  }
}
