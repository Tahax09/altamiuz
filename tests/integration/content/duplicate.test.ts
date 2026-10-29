// WS11 finding M-2: Payload 3.91.0 duplicate = createOperation({ duplicateFromID }). A non-draft
// duplicate without `_status` copies the source's per-locale status, so a duplicate of a published
// page could itself be published without passing the publish permission check. Duplicates must
// always be drafts (publishing stays an explicit, permission-checked, audited act), on the Local
// API and REST (`POST /api/:collection/:id/duplicate`, which the admin Duplicate action calls).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import {
  createUser,
  routeLogin,
  userFor,
  verifiedSession,
  type Role,
  type Session,
} from '../../support/auth'
import { pageData, rest, rt } from '../../support/content'

let t: TestPayload
const S = {} as Record<Role, Session>
const ROLES: Role[] = ['editor', 'publisher', 'administrator', 'owner']
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ROLES) S[r] = await verifiedSession(t.payload, r)
}, 240_000)
afterAll(async () => t?.close())

let n = 0
const slug = () => `dup-${Date.now()}-${n++}`

async function publishedSource() {
  const doc = (await t.payload.create({
    collection: 'pages',
    data: pageData(slug(), 'Published source') as never,
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })) as unknown as { id: number }
  await t.payload.update({
    collection: 'pages',
    id: doc.id,
    locale: 'en',
    data: { _status: 'published' } as never,
    overrideAccess: true,
  })
  return doc.id
}

/** Published in BOTH locales: the duplicate's request locale is only one of them (localized
 * `_status`; the other locale's status is carried over from the source unless forced). */
async function bilingualSource(collection: 'pages' | 'services' = 'pages') {
  const id = await (async () => {
    if (collection === 'pages') return publishedSource()
    const d = (await t.payload.create({
      collection,
      data: {
        title: 'Published service',
        slug: slug(),
        summary: 'Summary',
        sections: [{ blockType: 'richText', content: rt('Body') }],
        seo: { title: 'Service | SEO', description: 'Search description' },
      } as never,
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })) as unknown as { id: number }
    await t.payload.update({
      collection,
      id: d.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      overrideAccess: true,
    })
    return d.id
  })()
  await t.payload.update({
    collection,
    id,
    locale: 'ar',
    data: {
      title: 'مصدر منشور',
      slug: `ع-${slug()}`,
      summary: 'ملخص',
      seo: { title: 'مصدر', description: 'وصف البحث' },
      _status: 'published',
    } as never,
    overrideAccess: true,
  })
  return id
}

/** Public (anonymous, published-only) visibility of a document in a locale. */
const isPublic = async (
  id: number,
  locale: 'ar' | 'en' = 'en',
  collection: 'pages' | 'services' = 'pages',
) =>
  (
    await t.payload.find({
      collection,
      where: { id: { equals: id } },
      locale,
      fallbackLocale: false,
      overrideAccess: false,
      context: { publicSite: true },
    })
  ).docs.length > 0

const statusOf = async (id: number, collection: 'pages' | 'services' = 'pages') =>
  (
    await t.sql.query(`select _locale, _status from ${collection}_locales where _parent_id = $1`, [
      id,
    ])
  ).rows.reduce((acc: Record<string, string>, r) => ({ ...acc, [r._locale]: r._status }), {})

describe('M-2 duplicate never publishes', () => {
  for (const role of ROLES) {
    for (const draft of [false, true]) {
      it(`${role}: Local API duplicate (draft: ${draft}) creates an unpublished draft`, async () => {
        const source = await publishedSource()
        const copy = (await t.payload.duplicate({
          collection: 'pages',
          id: source,
          locale: 'en',
          draft,
          data: { slug: slug() } as never,
          user: await u(role),
          overrideAccess: false,
        } as never)) as unknown as { id: number }
        expect(copy.id).not.toBe(source)
        expect(await isPublic(copy.id, 'en')).toBe(false)
        expect(await isPublic(copy.id, 'ar')).toBe(false)
        for (const status of Object.values(await statusOf(copy.id)))
          expect(status).not.toBe('published')
        expect(await isPublic(source)).toBe(true) // the source is untouched
      })
    }

    it(`${role}: REST duplicate with ?draft=false and _status=published creates an unpublished draft`, async () => {
      const source = await publishedSource()
      for (const [q, body] of [
        ['draft=false', { slug: slug() }],
        ['draft=false', { slug: slug(), _status: 'published' }],
        ['draft=true', { slug: slug(), _status: 'published' }],
        ['', { slug: slug(), _status: 'draft' }], // what the admin Duplicate action sends
      ] as const) {
        const r = await rest(t.payload, 'POST', `/api/pages/${source}/duplicate?locale=en&${q}`, {
          token: S[role].token,
          body,
        })
        expect(r.status, `${q} ${JSON.stringify(body)} ${r.raw.slice(0, 200)}`).toBe(200)
        const id = (r.body.doc as { id: number }).id
        expect(await isPublic(id), `${q} ${JSON.stringify(body)}`).toBe(false)
        for (const status of Object.values(await statusOf(id))) expect(status).not.toBe('published')
      }
    })
  }

  it('anonymous and password-only duplicates are refused', async () => {
    const source = await publishedSource()
    const anon = await rest(t.payload, 'POST', `/api/pages/${source}/duplicate?draft=false`, {
      body: { slug: slug() },
    })
    expect(anon.status).toBe(403)
  })

  it('a duplicate that keeps the source slug is refused (unique per locale), never published', async () => {
    const source = await publishedSource()
    const before = Number((await t.sql.query('select count(*) from pages')).rows[0].count)
    const r = await rest(
      t.payload,
      'POST',
      `/api/pages/${source}/duplicate?locale=en&draft=false`,
      {
        token: S.owner.token,
        body: {},
      },
    )
    expect(r.status).toBe(400)
    expect(Number((await t.sql.query('select count(*) from pages')).rows[0].count)).toBe(before)
  })
})

/** Every locale row of the copy is unpublished and no anonymous reader sees it. */
async function expectUnpublished(
  id: number,
  label: string,
  collection: 'pages' | 'services' = 'pages',
) {
  const statuses = await statusOf(id, collection)
  expect(Object.keys(statuses).length, label).toBeGreaterThan(0)
  for (const [locale, status] of Object.entries(statuses))
    expect(status, `${label} ${locale}`).not.toBe('published')
  for (const locale of ['ar', 'en'] as const)
    expect(await isPublic(id, locale, collection), `${label} public ${locale}`).toBe(false)
}

describe('M-2 duplicate of a source published in both locales', () => {
  for (const role of ROLES) {
    it(`${role}: Local API duplicate, draft and non-draft, publishes no locale`, async () => {
      for (const draft of [false, true])
        for (const locale of ['en', 'ar'] as const) {
          const source = await bilingualSource()
          const copy = (await t.payload.duplicate({
            collection: 'pages',
            id: source,
            locale,
            draft,
            data: { slug: locale === 'ar' ? `ع-${slug()}` : slug() } as never,
            user: await u(role),
            overrideAccess: false,
          } as never)) as unknown as { id: number }
          await expectUnpublished(copy.id, `draft=${draft} locale=${locale}`)
          expect(await isPublic(source, 'ar')).toBe(true)
          expect(await isPublic(source, 'en')).toBe(true)
        }
    })

    it(`${role}: REST duplicate (admin action and bypass parameters) publishes no locale`, async () => {
      for (const [q, extra] of [
        ['', { _status: 'draft' }], // the admin Duplicate action
        ['draft=false', {}],
        ['draft=false', { _status: 'published' }],
        ['draft=false&publishAllLocales=true', { _status: 'published' }],
        ['draft=false&publishSpecificLocale=en', { _status: 'published' }],
        ['draft=false&selectedLocales[]=ar&selectedLocales[]=en', { _status: 'published' }],
        ['selectedLocales[]=en&selectedLocales[]=ar', { _status: 'draft' }], // admin "selected locales"
      ] as const) {
        const source = await bilingualSource()
        const r = await rest(t.payload, 'POST', `/api/pages/${source}/duplicate?locale=en&${q}`, {
          token: S[role].token,
          body: { slug: slug(), ...extra },
        })
        const label = `${q} ${JSON.stringify(extra)}`
        expect(r.status, `${label} ${r.raw.slice(0, 200)}`).toBe(200)
        await expectUnpublished((r.body.doc as { id: number }).id, label)
      }
    })

    it(`${role}: services duplicate publishes no locale`, async () => {
      const source = await bilingualSource('services')
      const r = await rest(t.payload, 'POST', `/api/services/${source}/duplicate?locale=en`, {
        token: S[role].token,
        body: { slug: slug(), _status: 'published' },
      })
      expect(r.status, r.raw.slice(0, 200)).toBe(200)
      await expectUnpublished((r.body.doc as { id: number }).id, 'services', 'services')
    })
  }

  it('a password-only (MFA not completed) session cannot duplicate', async () => {
    const source = await bilingualSource()
    const user = await createUser(t.payload, 'owner')
    const login = await routeLogin(user.email, user.password)
    expect(login.status).toBe(200)
    const before = Number((await t.sql.query('select count(*) from pages')).rows[0].count)
    const r = await rest(t.payload, 'POST', `/api/pages/${source}/duplicate?locale=en`, {
      token: login.token,
      body: { slug: slug(), _status: 'draft' },
    })
    expect(r.status).toBe(403)
    expect(Number((await t.sql.query('select count(*) from pages')).rows[0].count)).toBe(before)
  })
})

describe('redirects duplicate follows the create permission (contracts/access-matrix.md)', () => {
  for (const role of ROLES) {
    const allowed = role === 'administrator' || role === 'owner'
    it(`${role}: ${allowed ? 'may' : 'may not'} duplicate a redirect`, async () => {
      const source = (await t.payload.create({
        collection: 'redirects',
        data: { from: `/en/${slug()}`, to: '/en/about', type: '301', source: 'manual' } as never,
        overrideAccess: true,
      })) as unknown as { id: number }
      const before = Number((await t.sql.query('select count(*) from redirects')).rows[0].count)
      const r = await rest(t.payload, 'POST', `/api/redirects/${source.id}/duplicate`, {
        token: S[role].token,
        body: { from: `/en/${slug()}` },
      })
      const after = Number((await t.sql.query('select count(*) from redirects')).rows[0].count)
      if (allowed) {
        expect(r.status, r.raw.slice(0, 200)).toBe(200)
        expect(after).toBe(before + 1)
      } else {
        expect(r.status).toBe(403)
        expect(after).toBe(before)
      }
    })
  }
})
