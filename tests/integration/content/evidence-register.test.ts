// T143 (FR-016, SC-016): the evidence register lists every published claim with its reference and
// flags claims whose stored text no longer matches verified evidence (e.g. an out-of-band write).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { pageData } from '../../support/content'
import { bootPayload, type TestPayload } from '../../support/payload'

let t: TestPayload
const S = {} as Record<Role, Session>
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never
type Mod = typeof import('../../../src/modules/content')
let m: Mod

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ['editor', 'owner'] as Role[]) S[r] = await verifiedSession(t.payload, r)
  m = await import('../../../src/modules/content')
}, 240_000)
afterAll(async () => t?.close())

const stats = (status: 'verified' | 'unverified', reference = '') => ({
  blockType: 'stats',
  items: [{ value: '10', label: 'Engagements' }],
  evidence: { status, reference },
})

async function publishedStatsPage(slug: string, reference: string) {
  const p = (await t.payload.create({
    collection: 'pages',
    data: pageData(slug, 'Stats', { sections: [stats('verified', reference)] }) as never,
    draft: true,
    locale: 'en',
    user: await u('owner'),
    overrideAccess: false,
  })) as unknown as { id: number }
  await t.payload.update({
    collection: 'pages',
    id: p.id,
    locale: 'en',
    data: { _status: 'published' } as never,
    user: await u('owner'),
    overrideAccess: false,
  })
  return p.id
}

describe('evidence register (T143)', () => {
  it('an empty site has no claims and no problems', async () => {
    expect(await m.evidenceRegister(t.payload)).toEqual({ rows: [], problems: [] })
  })

  it('lists a published, verified claim with its reference; drafts are not listed', async () => {
    const id = await publishedStatsPage(`ev-${Date.now()}`, 'Contract register 2026-014')
    await t.payload.create({
      collection: 'pages',
      data: pageData(`ev-draft-${Date.now()}`, 'Draft', {
        sections: [stats('unverified')],
      }) as never,
      draft: true,
      locale: 'en',
      user: await u('editor'),
      overrideAccess: false,
    })
    const reg = await m.evidenceRegister(t.payload)
    expect(reg.problems).toEqual([])
    expect(reg.rows).toEqual([
      expect.objectContaining({
        source: `pages/${id}`,
        claim: 'sections.0 (stats)',
        status: 'verified',
        reference: 'Contract register 2026-014',
        verifiedAt: expect.any(String),
      }),
    ])
  })

  it('flags a claim changed outside the application after verification', async () => {
    const id = await publishedStatsPage(`ev-oob-${Date.now()}`, 'REF-OOB')
    await t.sql.query(
      `update pages_blocks_stats_items set value = '99' where _parent_id in
         (select id from pages_blocks_stats where _parent_id = $1)`,
      [id],
    )
    const reg = await m.evidenceRegister(t.payload)
    expect(reg.problems).toContain(
      `pages/${id} $.sections.0.evidence: claim without verified evidence matching its current text`,
    )
  })

  it('flags verified evidence without a reference', async () => {
    const id = await publishedStatsPage(`ev-noref-${Date.now()}`, 'REF-TMP')
    await t.sql.query(
      `update pages_blocks_stats set evidence_reference = null where _parent_id = $1`,
      [id],
    )
    const reg = await m.evidenceRegister(t.payload)
    expect(reg.problems).toContain(
      `pages/${id} sections.0 (stats): verified without an evidence reference`,
    )
  })
})
