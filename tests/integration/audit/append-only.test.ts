// T034 (FR-045–FR-048, D-9): audit events are append-only at the API AND database levels.
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'

let t: TestPayload
let recordAudit: typeof import('@/modules/audit').recordAudit
let purgeExpiredAuditEvents: typeof import('@/modules/audit').purgeExpiredAuditEvents
let AuditMetaError: typeof import('@/modules/audit').AuditMetaError

beforeAll(async () => {
  t = await bootPayload()
  ;({ recordAudit, purgeExpiredAuditEvents, AuditMetaError } = await import('@/modules/audit'))
}, 180_000)
afterAll(async () => t?.close())

const roles = ['editor', 'publisher', 'administrator', 'owner'] as const
const userOf = (role: string) => ({ id: 1, role, mfaVerified: true, collection: 'users' })

describe('recording', () => {
  it('records a complete entry (actor, action, target, time, source, outcome)', async () => {
    const doc = await recordAudit(t.payload, {
      actor: 'user:7',
      action: 'user.role_change',
      target: { type: 'users', id: '9' },
      outcome: 'success',
      ip: '203.0.113.7',
      userAgent: 'Mozilla/5.0 test',
      meta: { from: 'editor', to: 'publisher' },
    })
    expect(doc).toMatchObject({
      actor: 'user:7',
      action: 'user.role_change',
      targetType: 'users',
      targetId: '9',
      outcome: 'success',
      ip: '203.0.113.7',
    })
    expect(new Date(doc.at as string).getTime()).toBeGreaterThan(Date.now() - 60_000)
  })

  it.each([
    ['secret-like key', { password: 'x' }],
    ['token key', { resetToken: 'x' }],
    ['unknown key for the action', { from: 'editor', to: 'publisher', note: 'free text' }],
    ['nested object', { from: { $ne: 1 }, to: 'publisher' }],
  ])('rejects meta with %s', async (_l, meta) => {
    await expect(
      recordAudit(t.payload, {
        actor: 'user:7',
        action: 'user.role_change',
        target: { type: 'users', id: '9' },
        outcome: 'success',
        meta: meta as never,
      }),
    ).rejects.toBeInstanceOf(AuditMetaError)
  })

  it('rejects an action outside the FR-045 enum', async () => {
    await expect(
      recordAudit(t.payload, {
        actor: 'user:7',
        action: 'free.text' as never,
        target: { type: 'x', id: '1' },
        outcome: 'success',
      }),
    ).rejects.toThrow()
  })

  it('truncates user agents to 256 characters', async () => {
    const doc = await recordAudit(t.payload, {
      actor: 'anonymous',
      action: 'auth.login.failure',
      target: { type: 'users', id: 'unknown' },
      outcome: 'failure',
      userAgent: 'x'.repeat(1000),
    })
    expect((doc.userAgent as string).length).toBe(256)
  })
})

describe('API: no role can create, update or delete audit events', () => {
  let id: string | number
  beforeAll(async () => {
    id = (
      await recordAudit(t.payload, {
        actor: 'system',
        action: 'settings.change',
        target: { type: 'site-settings', id: 'global' },
        outcome: 'success',
      })
    ).id
  })

  for (const role of roles) {
    it(`${role}: create denied`, async () => {
      await expect(
        t.payload.create({
          collection: 'audit-events',
          data: {
            actor: 'x',
            action: 'settings.change',
            outcome: 'success',
            at: new Date().toISOString(),
          } as never,
          overrideAccess: false,
          user: userOf(role) as never,
        }),
      ).rejects.toThrow()
    })
    it(`${role}: update denied`, async () => {
      await expect(
        t.payload.update({
          collection: 'audit-events',
          id,
          data: { actor: 'tampered' } as never,
          overrideAccess: false,
          user: userOf(role) as never,
        }),
      ).rejects.toThrow()
    })
    it(`${role}: delete denied`, async () => {
      await expect(
        t.payload.delete({
          collection: 'audit-events',
          id,
          overrideAccess: false,
          user: userOf(role) as never,
        }),
      ).rejects.toThrow()
    })
  }

  it('read: administrator/owner allowed, editor/publisher/anonymous denied', async () => {
    for (const role of ['administrator', 'owner'])
      expect(
        (
          await t.payload.find({
            collection: 'audit-events',
            overrideAccess: false,
            user: userOf(role) as never,
          })
        ).totalDocs,
      ).toBeGreaterThan(0)
    for (const role of ['editor', 'publisher'])
      await expect(
        t.payload.find({
          collection: 'audit-events',
          overrideAccess: false,
          user: userOf(role) as never,
        }),
      ).rejects.toThrow()
    await expect(
      t.payload.find({ collection: 'audit-events', overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('read requires a completed second factor', async () => {
    await expect(
      t.payload.find({
        collection: 'audit-events',
        overrideAccess: false,
        user: { id: 1, role: 'owner', mfaVerified: false, collection: 'users' } as never,
      }),
    ).rejects.toThrow()
  })
})

describe('database: append-only even when the API is bypassed', () => {
  it('rejects UPDATE', async () => {
    await expect(t.sql.query("update audit_events set actor = 'tampered'")).rejects.toThrow(
      /append-only/,
    )
  })
  it('rejects DELETE of recent rows, even with the retention flag set by hand', async () => {
    await expect(t.sql.query('delete from audit_events')).rejects.toThrow(/append-only/)
    const c = await t.sql.connect()
    try {
      await c.query('begin')
      await c.query("select set_config('altamiuz.audit_retention', 'on', true)")
      await expect(c.query('delete from audit_events')).rejects.toThrow(/append-only/)
    } finally {
      await c.query('rollback')
      c.release()
    }
  })
  it('rejects TRUNCATE', async () => {
    await expect(t.sql.query('truncate audit_events')).rejects.toThrow(/append-only/)
  })
  it('Payload ORM updates are rejected too (overrideAccess: true)', async () => {
    const [row] = (await t.payload.find({ collection: 'audit-events', limit: 1 })).docs
    await expect(
      t.payload.update({
        collection: 'audit-events',
        id: row!.id,
        data: { actor: 'x' } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    await expect(
      t.payload.delete({ collection: 'audit-events', id: row!.id, overrideAccess: true }),
    ).rejects.toThrow()
  })
})

describe('retention (A-9: 24 months)', () => {
  it('purges only entries older than 24 months and records the purge', async () => {
    await t.sql.query(
      "insert into audit_events (actor, action, outcome, at) values ('system', 'settings.change', 'success', now() - interval '25 months'), ('system', 'settings.change', 'success', now() - interval '23 months')",
    )
    const before = Number((await t.sql.query('select count(*) from audit_events')).rows[0].count)
    const purged = await purgeExpiredAuditEvents(t.payload)
    expect(purged).toBe(1)
    const after = await t.sql.query(
      "select count(*) filter (where at < now() - interval '24 months') as old, count(*) as total from audit_events",
    )
    expect(Number(after.rows[0].old)).toBe(0)
    // one row purged, one purge event recorded
    expect(Number(after.rows[0].total)).toBe(before - 1 + 1)
    const ev = await t.sql.query(
      "select meta from audit_events where action = 'audit.retention_purge'",
    )
    expect(ev.rows[0].meta).toEqual({ count: 1 })
  })
})

describe('production role split (documented maintenance path)', () => {
  it('a non-owner application role cannot disable triggers, drop the table or truncate', async () => {
    const role = `altamiuz_app_${randomBytes(4).toString('hex')}`
    const pw = randomBytes(12).toString('hex')
    const dbName = new URL(t.databaseUrl).pathname.slice(1)
    await t.sql.query(`create role ${role} login password '${pw}'`)
    try {
      await t.sql.query(`grant connect on database "${dbName}" to ${role}`)
      await t.sql.query(`grant usage on schema public to ${role}`)
      await t.sql.query(`grant select, insert, update, delete on audit_events to ${role}`)
      const url = new URL(t.databaseUrl)
      url.username = role
      url.password = pw
      const app = new pg.Client({ connectionString: url.toString() })
      await app.connect()
      try {
        await expect(app.query('alter table audit_events disable trigger all')).rejects.toThrow(
          /owner|permission/i,
        )
        await expect(
          app.query('drop trigger audit_events_no_update on audit_events'),
        ).rejects.toThrow(/owner|permission/i)
        await expect(app.query('truncate audit_events')).rejects.toThrow(/permission|append-only/i)
        await expect(app.query("update audit_events set actor = 'x'")).rejects.toThrow(
          /append-only/,
        )
      } finally {
        await app.end()
      }
    } finally {
      await t.sql.query(`revoke all on audit_events from ${role}`)
      await t.sql.query(`revoke usage on schema public from ${role}`)
      await t.sql.query(`revoke connect on database "${dbName}" from ${role}`)
      await t.sql.query(`drop role ${role}`)
    }
  })
})
