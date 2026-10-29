// T080 (FR-002, FR-025, D-5): slug collisions and slug-change redirects.
// T084: scan:richtext finds stored violations. T089 (A-11): version retention pruning.
import { execFileSync } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Session } from '../../support/auth'
import { MALICIOUS_RICH_TEXT, pageData } from '../../support/content'

let t: TestPayload
let ed: Session
let pub: Session
const user = async (s: Session) => (await userFor(t.payload, s.token)) as never

beforeAll(async () => {
  t = await bootPayload()
  ed = await verifiedSession(t.payload, 'editor')
  pub = await verifiedSession(t.payload, 'publisher')
}, 240_000)
afterAll(async () => t?.close())

let n = 0
const uniq = () => `s${Date.now()}${n++}`

async function draft(
  slug: string,
  locale: 'ar' | 'en' = 'en',
  collection: 'pages' | 'services' = 'pages',
) {
  const data =
    collection === 'pages'
      ? pageData(slug)
      : {
          title: 'S',
          slug,
          summary: 's',
          seo: { title: 'SEO title', description: 'SEO description' },
          sections: [],
        }
  return (await t.payload.create({
    collection,
    data: data as never,
    draft: true,
    locale,
    user: await user(ed),
    overrideAccess: false,
  })) as unknown as { id: number }
}
const publish = async (
  id: number,
  locale: 'ar' | 'en' = 'en',
  data: Record<string, unknown> = {},
  collection: 'pages' | 'services' = 'pages',
) =>
  t.payload.update({
    collection,
    id,
    locale,
    data: { ...data, _status: 'published' } as never,
    publishSpecificLocale: locale,
    user: await user(pub),
    overrideAccess: false,
  })

describe('T080 slug rules', () => {
  it('reserved and static route segments cannot be page slugs (both locales)', async () => {
    for (const s of ['admin', 'api', 'preview', 'services', 'training', 'ADMIN', ' api ']) {
      const p = await draft(`tmp-${uniq()}`)
      await expect(publish(p.id, 'en', { slug: s }), s).rejects.toThrow()
    }
  })

  it('slugs must be single segments of letters, digits and hyphens (Arabic allowed, NFC)', async () => {
    for (const s of ['a/b', '../x', 'a b', 'a?b', 'a%2Fb', 'x<y', '']) {
      const p = await draft(`tmp-${uniq()}`)
      await expect(publish(p.id, 'en', { slug: s }), JSON.stringify(s)).rejects.toThrow()
    }
    const ar = await draft(`اختبار-${uniq()}`, 'ar')
    await publish(ar.id, 'ar')
    // Decomposed input is normalised to NFC before storage.
    const p = await draft(`tmp-${uniq()}`)
    const decomposed = `café-${uniq()}`
    const res = (await publish(p.id, 'en', { slug: decomposed })) as unknown as { slug: string }
    expect(res.slug).toBe(decomposed.normalize('NFC'))
  })

  it('a slug is unique per locale and collection, not across locales or collections', async () => {
    const s = `dup-${uniq()}`
    const a = await draft(s, 'en')
    await publish(a.id, 'en')
    const b = await draft(`other-${uniq()}`, 'en')
    await expect(publish(b.id, 'en', { slug: s })).rejects.toThrow()
    // Same slug in the other locale is fine.
    const c = await draft(s, 'ar')
    await publish(c.id, 'ar')
    // Same slug in another collection is fine.
    const svc = await draft(s, 'en', 'services')
    await publish(svc.id, 'en', {}, 'services')
  })

  it('a slug that is an active redirect source cannot be used', async () => {
    const s = `moved-${uniq()}`
    await t.payload.create({
      collection: 'redirects',
      data: { from: `/en/${s}`, to: '/en/elsewhere', type: '301', source: 'manual' } as never,
      overrideAccess: true,
    })
    const p = await draft(`tmp-${uniq()}`)
    await expect(publish(p.id, 'en', { slug: s })).rejects.toThrow()
  })

  it('changing a published slug (edited as a draft, then published) creates a redirect', async () => {
    const old = `old-${uniq()}`
    const neu = `new-${uniq()}`
    const p = await draft(old)
    await publish(p.id)
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      draft: true,
      data: { slug: neu } as never,
      user: await user(ed),
      overrideAccess: false,
    })
    // A draft-only slug edit creates nothing yet.
    let r = await t.payload.find({
      collection: 'redirects',
      where: { from: { equals: `/en/${old}` } },
      overrideAccess: true,
    })
    expect(r.totalDocs).toBe(0)
    await publish(p.id)
    r = await t.payload.find({
      collection: 'redirects',
      where: { from: { equals: `/en/${old}` } },
      overrideAccess: true,
    })
    expect(r.docs[0]).toMatchObject({ to: `/en/${neu}`, source: 'slug-change', type: '301' })
  })

  it('a second slug change re-points earlier redirects (no chains)', async () => {
    const a = `a-${uniq()}`
    const b = `b-${uniq()}`
    const c = `c-${uniq()}`
    const p = await draft(a)
    await publish(p.id)
    await publish(p.id, 'en', { slug: b })
    await publish(p.id, 'en', { slug: c })
    const r = await t.payload.find({
      collection: 'redirects',
      where: { from: { in: [`/en/${a}`, `/en/${b}`] } },
      overrideAccess: true,
    })
    expect(r.docs.map((d) => (d as unknown as { to: string }).to)).toEqual([`/en/${c}`, `/en/${c}`])
  })
})

describe('T084 scan:richtext', () => {
  const scan = () => {
    try {
      execFileSync('pnpm', ['-s', 'payload', 'run', 'scripts/scan-richtext.ts'], {
        env: { ...process.env },
        stdio: 'pipe',
        encoding: 'utf8',
      })
      return 0
    } catch (e) {
      return (e as { status: number }).status
    }
  }

  it('exits 0 on clean content and 1 after a violation is written behind the hooks', async () => {
    expect(scan()).toBe(0)
    const p = await draft(`scan-${uniq()}`)
    const v = await t.sql.query('select id from _pages_v where parent_id = $1 and latest = true', [
      p.id,
    ])
    const block = await t.sql.query(
      'select id from _pages_v_blocks_rich_text where _parent_id = $1',
      [v.rows[0].id],
    )
    await t.sql.query(
      'update _pages_v_blocks_rich_text_locales set content = $1 where _parent_id = $2',
      [JSON.stringify(MALICIOUS_RICH_TEXT.javascriptUrl), block.rows[0].id],
    )
    expect(scan()).toBe(1)
  }, 120_000)
})

describe('T089 version retention (A-11)', () => {
  it('keeps the newest 50 and anything younger than 12 months; never the latest', async () => {
    const { pruneVersions } = await import('@/modules/content')
    const p = await draft(`prune-${uniq()}`)
    const base = (await t.sql.query('select * from _pages_v where parent_id = $1 limit 1', [p.id]))
      .rows[0]
    // 60 old versions (2 years ago) plus the existing latest one.
    for (let i = 0; i < 60; i++)
      await t.sql.query(
        `insert into _pages_v (parent_id, version_template, created_at, updated_at, latest)
         values ($1, $2, now() - interval '2 years' + ($3 || ' minutes')::interval,
                 now() - interval '2 years' + ($3 || ' minutes')::interval, false)`,
        [p.id, base.version_template, String(i)],
      )
    const count = async () =>
      Number(
        (await t.sql.query('select count(*) from _pages_v where parent_id = $1', [p.id])).rows[0]
          .count,
      )
    expect(await count()).toBe(61)
    const removed = await pruneVersions(t.payload, 'pages')
    expect(removed).toBe(11)
    expect(await count()).toBe(50)
    const latest = await t.sql.query(
      'select count(*) from _pages_v where parent_id = $1 and latest',
      [p.id],
    )
    expect(Number(latest.rows[0].count)).toBe(1)
    // Young versions are never pruned, however many there are.
    expect(await pruneVersions(t.payload, 'pages')).toBe(0)
  })
})
