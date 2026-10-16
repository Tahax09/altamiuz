// Vitest globalSetup: create a disposable database for one integration run and drop it after.
// Reads the admin connection from DATABASE_URL (local compose or CI service). Never touches the
// configured database itself.
import { randomBytes } from 'node:crypto'
import pg from 'pg'

export default async function setup() {
  const base = process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL is required for integration tests')
  const name = `altamiuz_test_${randomBytes(6).toString('hex')}`
  const admin = new pg.Client({ connectionString: base })
  await admin.connect()
  await admin.query(`CREATE DATABASE "${name}"`)
  await admin.end()

  const url = new URL(base)
  url.pathname = `/${name}`
  process.env.DATABASE_URL = url.toString()
  process.env.TEST_DATABASE_NAME = name

  return async () => {
    const drop = new pg.Client({ connectionString: base })
    await drop.connect()
    await drop.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
    await drop.end()
  }
}
