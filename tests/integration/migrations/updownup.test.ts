// Constitution X: every committed migration must apply, roll back completely, and re-apply on a
// disposable database. Runs the real Payload CLI against the per-run test database.
import { execFileSync } from 'node:child_process'
import pg from 'pg'
import { describe, expect, it } from 'vitest'

const env = { ...process.env, APP_ENV: 'test', DATABASE_ALLOW_PUSH: 'false' }
const payload = (...args: string[]) =>
  execFileSync('pnpm', ['-s', 'payload', ...args], { env, encoding: 'utf8', stdio: 'pipe' })

async function tables(): Promise<string[]> {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const res = await client.query<{ tablename: string }>(
    "select tablename from pg_tables where schemaname = 'public' order by tablename",
  )
  await client.end()
  return res.rows.map((r) => r.tablename)
}

describe('migrations up → down → up', () => {
  it('uses a disposable database, never the configured one', () => {
    expect(process.env.TEST_DATABASE_NAME).toMatch(/^altamiuz_test_[0-9a-f]{12}$/)
    expect(process.env.DATABASE_URL).toContain(process.env.TEST_DATABASE_NAME)
  })

  it('applies, fully reverts and re-applies all migrations', async () => {
    payload('migrate')
    const afterUp = await tables()
    expect(afterUp).toEqual(expect.arrayContaining(['users', 'payload_migrations']))

    payload('migrate:reset')
    const afterDown = (await tables()).filter((t) => t !== 'payload_migrations')
    expect(afterDown).toEqual([])

    payload('migrate')
    expect(await tables()).toEqual(afterUp)
  }, 180_000)
})
