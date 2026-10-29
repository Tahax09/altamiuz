// FR-015 (WS10): the second of two conflicting saves never silently overwrites the first.
// Payload 3.91.0 deletes the document lock on every save, so locks alone cannot guarantee this.
// The server rejects an update whose base `updatedAt` (sent by the admin form with every save) is
// older than the document's current draft: 409, nothing written.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { pageData, rest } from '../../support/content'

let t: TestPayload
const S = {} as Record<Role, Session>
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ['editor', 'publisher'] as const) S[r] = await verifiedSession(t.payload, r)
}, 240_000)
afterAll(async () => t?.close())

let n = 0
const newPage = async () =>
  (await t.payload.create({
    collection: 'pages',
    data: pageData(`cc-${Date.now()}-${n++}`, 'Base') as never,
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })) as unknown as { id: number; updatedAt: string }

const current = async (id: number) =>
  (await t.payload.findByID({
    collection: 'pages',
    id,
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })) as unknown as { title: string; updatedAt: string }

const save = async (role: Role, id: number, data: Record<string, unknown>, draft = true) =>
  t.payload.update({
    collection: 'pages',
    id,
    locale: 'en',
    draft,
    data: data as never,
    user: await u(role),
    overrideAccess: false,
  }) as unknown as Promise<{ updatedAt: string; title: string }>

describe('FR-015 optimistic concurrency', () => {
  it('a stale save after someone else saved is rejected with 409 and changes nothing', async () => {
    const p = await newPage()
    const base = (await current(p.id)).updatedAt // both editors opened this version
    await save('publisher', p.id, { title: 'Publisher wins', updatedAt: base })
    await expect(
      save('editor', p.id, { title: 'Editor stale', updatedAt: base }),
    ).rejects.toMatchObject({ status: 409 })
    expect((await current(p.id)).title).toBe('Publisher wins')
  })

  it('consecutive saves by one editor using the returned updatedAt succeed', async () => {
    const p = await newPage()
    let base = (await current(p.id)).updatedAt
    for (const title of ['One', 'Two', 'Three']) {
      const saved = await save('editor', p.id, { title, updatedAt: base })
      base = saved.updatedAt
    }
    expect((await current(p.id)).title).toBe('Three')
  })

  it('a stale publish is rejected too', async () => {
    const p = await newPage()
    const base = (await current(p.id)).updatedAt
    await save('editor', p.id, { title: 'Newer draft', updatedAt: base })
    await expect(
      save('publisher', p.id, { _status: 'published', updatedAt: base }, false),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('REST PATCH with a stale base is rejected', async () => {
    const p = await newPage()
    const base = (await current(p.id)).updatedAt
    await save('publisher', p.id, { title: 'Fresh', updatedAt: base })
    const r = await rest(t.payload, 'PATCH', `/api/pages/${p.id}?draft=true&locale=en`, {
      token: S.editor.token,
      body: { title: 'Stale via REST', updatedAt: base },
    })
    expect(r.status).toBe(409)
    expect((await current(p.id)).title).toBe('Fresh')
  })

  it('a malformed base timestamp is rejected rather than ignored', async () => {
    const p = await newPage()
    await expect(
      save('editor', p.id, { title: 'x', updatedAt: 'yesterday' }),
    ).rejects.toMatchObject({
      status: 400,
    })
  })
})

describe('FR-015 on globals', () => {
  it('a save using the updatedAt just read (after a publish) is not a false conflict', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    const items = (label: string) => [
      { link: { linkType: 'external', url: 'https://example.org/', label } },
    ]
    for (const label of ['First', 'Second', 'Third']) {
      const base = await rest(t.payload, 'GET', '/api/globals/header-nav?draft=true&locale=en', {
        token: owner.token,
      })
      const r = await rest(t.payload, 'POST', '/api/globals/header-nav?locale=en', {
        token: owner.token,
        body: { items: items(label), _status: 'published', updatedAt: base.body.updatedAt },
      })
      expect(r.status, `${label}: ${r.raw.slice(0, 160)}`).toBe(200)
    }
  })

  it('a genuinely stale global save is refused with 409', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    // A first save so the global exists (the very first write has no base to compare).
    await rest(t.payload, 'POST', '/api/globals/footer-nav?draft=true&locale=en', {
      token: owner.token,
      body: { items: [] },
    })
    const base = await rest(t.payload, 'GET', '/api/globals/footer-nav?draft=true&locale=en', {
      token: owner.token,
    })
    const save = (label: string) =>
      rest(t.payload, 'POST', '/api/globals/footer-nav?draft=true&locale=en', {
        token: owner.token,
        body: {
          items: [{ link: { linkType: 'external', url: 'https://example.org/', label } }],
          updatedAt: base.body.updatedAt,
        },
      })
    expect((await save('Newer')).status).toBe(200)
    expect((await save('Stale')).status).toBe(409)
  })

  it('a stale publish after someone else published is refused (published state was frozen)', async () => {
    const owner = await verifiedSession(t.payload, 'owner')
    const admin = await verifiedSession(t.payload, 'administrator')
    const publish = (token: string, label: string, updatedAt: unknown) =>
      rest(t.payload, 'POST', '/api/globals/header-nav?locale=en', {
        token,
        body: {
          items: [{ link: { linkType: 'external', url: 'https://example.org/', label } }],
          _status: 'published',
          updatedAt,
        },
      })
    const seed = await rest(t.payload, 'GET', '/api/globals/header-nav?draft=true&locale=en', {
      token: owner.token,
    })
    expect((await publish(owner.token, 'Seed', seed.body.updatedAt)).status).toBe(200)
    const both = await rest(t.payload, 'GET', '/api/globals/header-nav?draft=true&locale=en', {
      token: owner.token,
    })
    expect((await publish(admin.token, 'Admin wins', both.body.updatedAt)).status).toBe(200)
    expect((await publish(owner.token, 'Owner stale', both.body.updatedAt)).status).toBe(409)
  })
})
