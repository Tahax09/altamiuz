// T033 (FR-093, FR-095): query operators reach the database layer here (overrideAccess: true), so
// this proves parameterisation and field validation, not just access denial.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'

let t: TestPayload
let recordAudit: typeof import('@/modules/audit').recordAudit
const count = async () =>
  Number((await t.sql.query('select count(*) from audit_events')).rows[0].count)

beforeAll(async () => {
  t = await bootPayload()
  ;({ recordAudit } = await import('@/modules/audit'))
  await recordAudit(t.payload, {
    actor: 'user:1',
    action: 'settings.change',
    target: { type: 'site-settings', id: 'g' },
    outcome: 'success',
  })
}, 180_000)
afterAll(async () => t?.close())

const SQLI = [
  "' OR '1'='1",
  "x'; DROP TABLE audit_events; --",
  '\\x00',
  '1) OR (1=1',
  '%',
  "' UNION SELECT password FROM users --",
]

describe('where values are parameterised', () => {
  for (const v of SQLI) {
    for (const op of ['equals', 'like', 'contains', 'in', 'not_equals'] as const) {
      it(`${op} ${JSON.stringify(v)} is inert`, async () => {
        const before = await count()
        const value = op === 'in' ? [v] : v
        const res = await t.payload
          .find({
            collection: 'audit-events',
            where: { actor: { [op]: value } },
            overrideAccess: true,
          })
          .catch((e: Error) => ({ error: e }))
        if ('docs' in res) {
          // Finding (WS7): Payload does not escape LIKE wildcards in `like`/`contains`, so a bare
          // "%" matches every row. Not SQL injection (values stay parameterised; access control
          // still applies) but noted for any future search feature.
          const wildcard = (op === 'like' || op === 'contains') && v === '%'
          const expected = op === 'not_equals' || wildcard ? before : 0
          expect(res.docs.length).toBe(expected)
        }
        expect(await count()).toBe(before)
        expect(
          (await t.sql.query("select to_regclass('public.audit_events') as t")).rows[0].t,
        ).toBe('audit_events')
      })
    }
  }
})

describe('field names, sort and select cannot inject', () => {
  it('rejects an unknown where path', async () => {
    await expect(
      t.payload.find({
        collection: 'audit-events',
        where: { 'actor; drop table audit_events--': { equals: 'x' } },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
  it('rejects or ignores a malicious sort', async () => {
    const before = await count()
    await t.payload
      .find({
        collection: 'audit-events',
        sort: 'actor; drop table audit_events',
        overrideAccess: true,
      })
      .catch(() => undefined)
    expect(await count()).toBe(before)
  })
  it('rejects unknown operators', async () => {
    await expect(
      t.payload.find({
        collection: 'audit-events',
        where: { actor: { $where: '1==1' } as never },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
  it('ignores unknown select keys without exposing other columns', async () => {
    const res = await t.payload
      .find({
        collection: 'audit-events',
        select: { 'pg_catalog.pg_user': true } as never,
        overrideAccess: true,
      })
      .catch((e: Error) => e)
    if (!(res instanceof Error))
      for (const d of res.docs) expect(Object.keys(d)).not.toContain('pg_catalog.pg_user')
  })
})

describe('JSON body cannot pollute prototypes', () => {
  it('a __proto__ key in meta is rejected by the recorder', async () => {
    await expect(
      recordAudit(t.payload, {
        actor: 'x',
        action: 'settings.change',
        target: { type: 'g', id: 'g' },
        outcome: 'success',
        meta: JSON.parse('{"__proto__":{"polluted":true}}'),
      }),
    ).rejects.toThrow()
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
