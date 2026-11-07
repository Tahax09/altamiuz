// T134 (FR-102, SC-013): encrypted backups and restore fail closed. Needs `age` and a Postgres
// client >= the server's major version on PATH (CI installs both; docs/runbooks/backup.md).
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createDatabase, createMigratedDatabase } from '../../support/payload'

const run = promisify(execFile)
const ROOT = path.resolve(import.meta.dirname, '../../..')
type Db = { url: string; drop: () => Promise<void> }

let work: string
let source: Db
let identity: string
let recipients: string
let otherIdentity: string
const drops: Db[] = []

async function sh(script: string, env: Record<string, string>) {
  try {
    const r = await run(path.join(ROOT, script), [], {
      env: {
        PATH: process.env.PATH!,
        HOME: os.homedir(),
        ...(process.env.PG_BIN_DIR ? { PG_BIN_DIR: process.env.PG_BIN_DIR } : {}),
        ...env,
      } as unknown as NodeJS.ProcessEnv,
      cwd: ROOT,
    })
    return { code: 0, stdout: r.stdout, stderr: r.stderr }
  } catch (e) {
    const err = e as { code?: number; stdout?: string; stderr?: string }
    return { code: err.code ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' }
  }
}
const dir = (name: string) => {
  const d = path.join(work, name)
  fs.mkdirSync(d, { recursive: true })
  return d
}
const ls = (d: string) => (fs.existsSync(d) ? fs.readdirSync(d).sort() : [])
async function tableCount(url: string) {
  const c = new pg.Client({ connectionString: url })
  await c.connect()
  try {
    return Number(
      (
        await c.query(
          `select count(*)::int n from information_schema.tables where table_schema = 'public'`,
        )
      ).rows[0].n,
    )
  } finally {
    await c.end()
  }
}
async function emptyDb() {
  const d = await createDatabase()
  drops.push(d)
  return d.url
}

beforeAll(async () => {
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'altamiuz-backup-test-'))
  source = await createMigratedDatabase()
  identity = path.join(work, 'identity.txt')
  otherIdentity = path.join(work, 'other-identity.txt')
  recipients = path.join(work, 'recipients.txt')
  await run('age-keygen', ['-o', identity])
  await run('age-keygen', ['-o', otherIdentity])
  fs.writeFileSync(recipients, (await run('age-keygen', ['-y', identity])).stdout)
}, 240_000)
afterAll(async () => {
  for (const d of drops) await d.drop().catch(() => undefined)
  await source?.drop()
  fs.rmSync(work, { recursive: true, force: true })
})

let backupSet: { db: string; media: string; mediaSrc: string } | undefined
async function goodBackup() {
  if (backupSet) return backupSet
  const out = dir('good')
  const mediaSrc = dir('media-src')
  fs.writeFileSync(path.join(mediaSrc, 'a1b2c3.jpg'), Buffer.from('fake-jpeg-bytes'))
  fs.mkdirSync(path.join(mediaSrc, 'sub'), { recursive: true })
  fs.writeFileSync(path.join(mediaSrc, 'sub', 'd4e5f6.webp'), Buffer.from('fake-webp-bytes'))
  const db = await sh('ops/backup/db.sh', {
    BACKUP_DATABASE_URL: source.url,
    AGE_RECIPIENTS_FILE: recipients,
    BACKUP_DIR: out,
  })
  expect(db.code, db.stderr).toBe(0)
  const media = await sh('ops/backup/media.sh', {
    MEDIA_SOURCE_DIR: mediaSrc,
    AGE_RECIPIENTS_FILE: recipients,
    BACKUP_DIR: out,
  })
  expect(media.code, media.stderr).toBe(0)
  const files = ls(out)
  backupSet = {
    db: path.join(
      out,
      files.find((f) => /^db-.*\.dump\.age$/.test(f))!,
    ),
    media: path.join(
      out,
      files.find((f) => /^media-.*\.tar\.age$/.test(f))!,
    ),
    mediaSrc,
  }
  return backupSet
}

describe('backup scripts', () => {
  it('db.sh writes an age-encrypted dump with a checksum and prints no secret', async () => {
    const { db } = await goodBackup()
    const bytes = fs.readFileSync(db)
    expect(bytes.subarray(0, 21).toString()).toBe('age-encryption.org/v1')
    for (const marker of ['payload_migrations', 'audit_events', 'CREATE TABLE'])
      expect(bytes.includes(Buffer.from(marker))).toBe(false)
    const [sum, name] = fs.readFileSync(`${db}.sha256`, 'utf8').trim().split(/\s+/)
    expect(name).toBe(path.basename(db))
    expect(sum).toMatch(/^[0-9a-f]{64}$/)
    const again = await sh('ops/backup/db.sh', {
      BACKUP_DATABASE_URL: source.url,
      AGE_RECIPIENTS_FILE: recipients,
      BACKUP_DIR: dir('again'),
    })
    const password = new URL(source.url).password
    expect(JSON.parse(again.stdout)).toMatchObject({ kind: 'db', bytes: expect.any(Number) })
    if (password) expect(again.stdout + again.stderr).not.toContain(password)
  })

  it.each([
    ['BACKUP_DATABASE_URL', {}],
    ['AGE_RECIPIENTS_FILE', { BACKUP_DATABASE_URL: 'postgres://x@127.0.0.1:1/x' }],
  ])('db.sh refuses to run without %s', async (variable, env) => {
    const out = path.join(work, `missing-${variable}`)
    const r = await sh('ops/backup/db.sh', { BACKUP_DIR: out, ...env })
    expect(r.code).not.toBe(0)
    expect(r.stderr).toContain(variable)
    expect(ls(out)).toEqual([])
  })

  it('db.sh refuses a recipients file without an age public key', async () => {
    const bad = path.join(work, 'bad-recipients.txt')
    fs.writeFileSync(bad, 'not-a-key\n')
    const out = path.join(work, 'bad-recip-out')
    const r = await sh('ops/backup/db.sh', {
      BACKUP_DATABASE_URL: source.url,
      AGE_RECIPIENTS_FILE: bad,
      BACKUP_DIR: out,
    })
    expect(r.code).not.toBe(0)
    expect(ls(out)).toEqual([])
  })

  it('db.sh with an unreachable database fails and leaves no partial file', async () => {
    const out = dir('unreachable')
    const r = await sh('ops/backup/db.sh', {
      BACKUP_DATABASE_URL: 'postgres://nobody:pw-5521@127.0.0.1:1/none',
      AGE_RECIPIENTS_FILE: recipients,
      BACKUP_DIR: out,
    })
    expect(r.code).not.toBe(0)
    expect(r.stderr).toContain('no backup written')
    expect(r.stdout + r.stderr).not.toContain('pw-5521')
    expect(ls(out)).toEqual([])
  })

  it('media.sh refuses a missing source directory', async () => {
    const out = path.join(work, 'media-missing-out')
    const r = await sh('ops/backup/media.sh', {
      MEDIA_SOURCE_DIR: path.join(work, 'does-not-exist'),
      AGE_RECIPIENTS_FILE: recipients,
      BACKUP_DIR: out,
    })
    expect(r.code).not.toBe(0)
    expect(ls(out)).toEqual([])
  })

  it('prunes backups older than the retention period and rejects a bad period', async () => {
    const out = dir('prune')
    const old = path.join(out, 'db-20200101T000000Z.dump.age')
    fs.writeFileSync(old, 'x')
    fs.writeFileSync(`${old}.sha256`, 'x')
    const past = new Date(Date.now() - 40 * 86_400_000)
    fs.utimesSync(old, past, past)
    fs.utimesSync(`${old}.sha256`, past, past)
    const env = {
      BACKUP_DATABASE_URL: source.url,
      AGE_RECIPIENTS_FILE: recipients,
      BACKUP_DIR: out,
    }
    const r = await sh('ops/backup/db.sh', env)
    expect(r.code, r.stderr).toBe(0)
    expect(ls(out).some((f) => f.startsWith('db-2020'))).toBe(false)
    expect(ls(out).filter((f) => f.endsWith('.dump.age'))).toHaveLength(1)
    const bad = await sh('ops/backup/db.sh', { ...env, BACKUP_RETENTION_DAYS: '30; rm -rf /' })
    expect(bad.code).not.toBe(0)
  })
})

describe('restore script', () => {
  const restoreEnv = async (over: Record<string, string> = {}) => {
    const set = await goodBackup()
    return {
      RESTORE_DB_FILE: set.db,
      RESTORE_MEDIA_FILE: set.media,
      AGE_IDENTITY_FILE: identity,
      RESTORE_DATABASE_URL: await emptyDb(),
      RESTORE_MEDIA_DIR: path.join(work, `restored-${Math.random().toString(36).slice(2)}`),
      ...over,
    }
  }

  it('restores every table and media file into a clean target', async () => {
    const env = await restoreEnv()
    const r = await sh('ops/restore.sh', env)
    expect(r.code, r.stderr).toBe(0)
    expect(await tableCount(env.RESTORE_DATABASE_URL)).toBe(await tableCount(source.url))
    const { mediaSrc } = await goodBackup()
    expect(fs.readFileSync(path.join(env.RESTORE_MEDIA_DIR, 'sub', 'd4e5f6.webp'))).toEqual(
      fs.readFileSync(path.join(mediaSrc, 'sub', 'd4e5f6.webp')),
    )
  })

  it('refuses a tampered backup before touching the target', async () => {
    const set = await goodBackup()
    const tampered = path.join(dir('tampered'), path.basename(set.db))
    fs.copyFileSync(set.db, tampered)
    fs.copyFileSync(`${set.db}.sha256`, `${tampered}.sha256`)
    const fd = fs.openSync(tampered, 'r+')
    fs.writeSync(fd, Buffer.from([0x00]), 0, 1, 200)
    fs.closeSync(fd)
    const env = await restoreEnv({ RESTORE_DB_FILE: tampered })
    const r = await sh('ops/restore.sh', env)
    expect(r.code).not.toBe(0)
    expect(r.stderr).toContain('checksum mismatch')
    expect(await tableCount(env.RESTORE_DATABASE_URL)).toBe(0)
    expect(fs.existsSync(env.RESTORE_MEDIA_DIR)).toBe(false)
  })

  it('refuses a backup without its checksum file', async () => {
    const set = await goodBackup()
    const lone = path.join(dir('lone'), path.basename(set.media))
    fs.copyFileSync(set.media, lone)
    const env = await restoreEnv({ RESTORE_MEDIA_FILE: lone })
    const r = await sh('ops/restore.sh', env)
    expect(r.code).not.toBe(0)
    expect(r.stderr).toContain('checksum file missing')
    expect(await tableCount(env.RESTORE_DATABASE_URL)).toBe(0)
  })

  it('refuses the wrong private key before touching the target', async () => {
    const env = await restoreEnv({ AGE_IDENTITY_FILE: otherIdentity })
    const r = await sh('ops/restore.sh', env)
    expect(r.code).not.toBe(0)
    expect(r.stderr).toContain('cannot be decrypted')
    expect(await tableCount(env.RESTORE_DATABASE_URL)).toBe(0)
  })

  it('refuses to overwrite a non-empty database', async () => {
    const env = await restoreEnv({ RESTORE_DATABASE_URL: source.url })
    const before = await tableCount(source.url)
    const r = await sh('ops/restore.sh', env)
    expect(r.code).not.toBe(0)
    expect(r.stderr).toContain('refuses to overwrite')
    expect(await tableCount(source.url)).toBe(before)
  })

  it('refuses an unreachable target database', async () => {
    const env = await restoreEnv({
      RESTORE_DATABASE_URL: 'postgres://nobody:pw-8812@127.0.0.1:1/none',
    })
    const r = await sh('ops/restore.sh', env)
    expect(r.code).not.toBe(0)
    expect(r.stdout + r.stderr).not.toContain('pw-8812')
  })
})
