// T118 (FR-064, FR-065, D-13): redirect writes through REST and the Local API. Paths are
// normalised (trailing slash, percent-encoding, NFC); self-redirects, loops, chains, external and
// open-redirect targets are refused; lookups match every spelling in one hop; changes are audited
// and record their author; Editors cannot write redirects. Synthetic paths only (CD-12 pending).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { verifiedSession, type Session } from '../../support/auth'
import { rest } from '../../support/content'

let t: TestPayload
let admin: Session
let editor: Session
let findRedirect: typeof import('../../../src/modules/seo').findRedirect

beforeAll(async () => {
  t = await bootPayload()
  ;({ findRedirect } = await import('../../../src/modules/seo'))
  admin = await verifiedSession(t.payload, 'administrator')
  editor = await verifiedSession(t.payload, 'editor')
}, 240_000)
afterAll(async () => t?.close())

const create = (from: string, to: string, token = admin.token, type = '301') =>
  rest(t.payload, 'POST', '/api/redirects', { token, body: { from, to, type } })
const msg = (r: { body: Record<string, unknown> }) => JSON.stringify(r.body)

describe('normalisation and lookup (FR-065)', () => {
  it('stores the normalised path and matches it with/without trailing slash and percent-encoded', async () => {
    const r = await create('/legacy-test/%D8%AF%D9%88%D8%B1%D8%A9/', '/en/training/')
    expect(r.status, msg(r)).toBe(201)
    const doc = (r.body as { doc: { from: string; to: string; createdBy: unknown } }).doc
    expect(doc.from).toBe('/legacy-test/دورة')
    expect(doc.to).toBe('/en/training')
    expect(doc.createdBy).toBeTruthy() // author recorded
    for (const spelling of [
      '/legacy-test/دورة',
      '/legacy-test/دورة/',
      '/legacy-test/%D8%AF%D9%88%D8%B1%D8%A9',
      '/legacy-test/%D8%AF%D9%88%D8%B1%D8%A9/',
    ])
      expect(await findRedirect(t.payload, spelling), spelling).toEqual({
        to: '/en/training',
        permanent: true,
      })
    // Equivalent spellings collide on the unique `from`.
    expect((await create('/legacy-test/دورة', '/en/about')).status).toBe(400)
  })

  it('302 is temporary; unknown and malformed paths find nothing', async () => {
    expect((await create('/legacy-temp', '/en/about', admin.token, '302')).status).toBe(201)
    expect(await findRedirect(t.payload, '/legacy-temp/')).toEqual({
      to: '/en/about',
      permanent: false,
    })
    for (const p of ['/nope', '/%E0%A4%A', '//legacy-temp', '/legacy-temp/../x'])
      expect(await findRedirect(t.payload, p), p).toBeNull()
  })
})

describe('graph rules (FR-064)', () => {
  it('refuses self-redirects, including equivalent spellings', async () => {
    for (const [from, to] of [
      ['/self-a', '/self-a'],
      ['/self-b/', '/self-b'],
      ['/self-%D8%A7', '/self-ا/'],
    ]) {
      const r = await create(from!, to!)
      expect(r.status, `${from} → ${to}`).toBe(400)
      expect(msg(r)).toContain('cannot point to itself')
    }
  })

  it('refuses chains in both directions, and therefore loops', async () => {
    expect((await create('/chain-a', '/chain-b')).status).toBe(201)
    const toSource = await create('/chain-b', '/chain-c') // chain-a → chain-b → chain-c
    expect(toSource.status).toBe(400)
    expect(msg(toSource)).toContain('Another redirect points to this source')
    const toRedirected = await create('/chain-z', '/chain-a') // chain-z → chain-a → chain-b
    expect(toRedirected.status).toBe(400)
    expect(msg(toRedirected)).toContain('target is itself redirected')
    const loop = await create('/chain-b', '/chain-a') // would loop
    expect(loop.status).toBe(400)
    // Updating an existing redirect is checked the same way.
    const id = ((await create('/chain-x', '/en/about')).body as { doc: { id: number } }).doc.id
    const upd = await rest(t.payload, 'PATCH', `/api/redirects/${id}`, {
      token: admin.token,
      body: { to: '/chain-a' },
    })
    expect(upd.status).toBe(400)
    // Re-saving a redirect unchanged is not a conflict with itself.
    expect(
      (
        await rest(t.payload, 'PATCH', `/api/redirects/${id}`, {
          token: admin.token,
          body: { type: '302' },
        })
      ).status,
    ).toBe(200)
  })

  it('refuses external and open-redirect targets and sources', async () => {
    for (const to of [
      'https://evil.example/',
      '//evil.example',
      '/\\evil.example',
      '/%5Cevil.example',
      '/%2F%2Fevil.example',
      'javascript:alert(1)',
      '/a b',
      '/x/../admin',
    ]) {
      const r = await create(`/ext-${Math.random().toString(36).slice(2, 8)}`, to)
      expect(r.status, to).toBe(400)
    }
    expect((await create('//evil.example', '/en/about')).status).toBe(400)
    expect(
      (await t.sql.query(`select count(*)::int n from redirects where "to" like '%evil%'`)).rows[0]
        .n,
    ).toBe(0)
  })
})

describe('permissions and audit', () => {
  it('Editors cannot create redirects; every change by an Administrator is audited', async () => {
    expect((await create('/editor-try', '/en/about', editor.token)).status).toBe(403)
    const r = await create('/audit-me', '/en/about')
    const id = (r.body as { doc: { id: number } }).doc.id
    const rows = (
      await t.sql.query(
        `select actor, meta from audit_events where action = 'redirect.change' and target_id = $1`,
        [String(id)],
      )
    ).rows
    expect(rows).toEqual([{ actor: `user:${admin.userId}`, meta: { operation: 'create' } }])
  })
})
