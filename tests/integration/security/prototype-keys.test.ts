// E-4 (GHSA-gcqx-w48m-w2h4, docs/security/dependency-exceptions.md): Payload's beforeChange field
// hook deep-merges every write's data with the stored document (`deepmerge` 4.3.1, prototype
// poisoning of the merged object) before field validators run. These tests send raw JSON with own
// `__proto__` and `constructor.prototype` keys through the real REST router and the Local API and
// check that (1) no validator is satisfied by an inherited value, (2) no status or role is gained,
// (3) no unsafe key or smuggled value is persisted, and (4) Object.prototype stays clean.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Session } from '../../support/auth'
import { MALICIOUS_RICH_TEXT, pageData, rest, rt } from '../../support/content'

let t: TestPayload
let ed: Session
let pub: Session
let adm: Session

beforeAll(async () => {
  t = await bootPayload()
  ed = await verifiedSession(t.payload, 'editor')
  pub = await verifiedSession(t.payload, 'publisher')
  adm = await verifiedSession(t.payload, 'administrator')
}, 240_000)
afterAll(async () => t?.close())

const PROTO_KEYS = ['polluted', 'isAdmin', 'role', '_status', 'title', 'root', 'blockType']
afterEach(() => {
  // Global prototype pollution would show up on every plain object.
  const probe = {} as Record<string, unknown>
  for (const k of PROTO_KEYS) expect(probe[k], `Object.prototype.${k}`).toBeUndefined()
  expect(
    Object.getOwnPropertyNames(Object.prototype).filter((k) => PROTO_KEYS.includes(k)),
  ).toEqual([])
})

let n = 0
const slug = () => `proto-${Date.now()}-${n++}`
/** Raw JSON must parse (JSON.parse keeps `__proto__` as an own key), so a 400 is never "Invalid JSON". */
const valid = (json: string) => {
  const parsed = JSON.parse(json) as Record<string, unknown>
  expect(json).toMatch(/"__proto__"|"constructor"/)
  void parsed
  return json
}
/** A valid page body as JSON text, with `extra` spliced in verbatim (own `__proto__` keys survive). */
const pageJson = (s: string, extra: string, drop: string[] = []) => {
  const base = pageData(s) as Record<string, unknown>
  for (const k of drop) delete base[k]
  const json = JSON.stringify(base)
  return valid(`${json.slice(0, -1)},${extra}}`)
}
/** A valid page body whose first section (or its content) is replaced by raw JSON. */
const pageWith = (s: string, placeholder: 'section' | 'content', raw: string) => {
  const base = pageData(s) as { sections: Record<string, unknown>[] }
  if (placeholder === 'section') base.sections = ['@@RAW@@' as never]
  else base.sections[0]!.content = '@@RAW@@'
  return valid(JSON.stringify(base).replace('"@@RAW@@"', raw))
}
/** A 400 must come from validation or the content policy, not from JSON parsing. */
const rejected = (r: { status: number; raw: string }) => {
  expect(r.status, r.raw).toBe(400)
  expect(r.raw).not.toContain('Invalid JSON')
}

/** Raw DB scan of every pages/users table: does any stored text contain `needle`? */
async function stored(needle: string, tables = ['pages', '_pages', 'users']) {
  const cols = await t.sql.query(
    `select table_name, column_name from information_schema.columns
     where table_schema = 'public' and data_type in ('jsonb', 'json', 'character varying', 'text')
       and (${tables.map((_, i) => `table_name like $${i + 1}`).join(' or ')})`,
    tables.map((x) => `${x.replace(/_/g, '\\_')}%`),
  )
  for (const { table_name, column_name } of cols.rows) {
    const hit = await t.sql.query(
      `select 1 from "${table_name}" where "${column_name}"::text like $1 limit 1`,
      [`%${needle}%`],
    )
    if (hit.rowCount) return `${table_name}.${column_name}`
  }
  return null
}

const pageBySlug = async (s: string) =>
  (
    await t.sql.query(
      'select p.id, l._status from pages p join pages_locales l on l._parent_id = p.id where l.slug = $1',
      [s],
    )
  ).rows[0] as { id: number; _status: string | null } | undefined

describe('create: inherited values never satisfy validation', () => {
  it('a required title supplied only through __proto__ is rejected', async () => {
    const s = slug()
    const r = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
      token: ed.token,
      rawBody: pageJson(s, '"__proto__":{"title":"proto-title-marker"}', ['title']),
    })
    rejected(r)
    expect(r.raw).toContain('Title')
    expect(await pageBySlug(s)).toBeUndefined()
    expect(await stored('proto-title-marker')).toBeNull()
  })

  it('a required title supplied only through constructor.prototype is rejected', async () => {
    const s = slug()
    const r = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
      token: ed.token,
      rawBody: pageJson(s, '"constructor":{"prototype":{"title":"ctor-title-marker"}}', ['title']),
    })
    rejected(r)
    expect(r.raw).toContain('Title')
    expect(await pageBySlug(s)).toBeUndefined()
    expect(await stored('ctor-title-marker')).toBeNull()
  })

  it('unsafe rich text hidden in a section __proto__ never reaches storage', async () => {
    const s = slug()
    const evil = JSON.stringify({
      blockType: 'richText',
      content: MALICIOUS_RICH_TEXT.javascriptUrl,
    })
    const r = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
      token: ed.token,
      rawBody: pageWith(s, 'section', `{"__proto__":${evil}}`),
    })
    // The section has no blockType of its own, so it is rejected, not resolved via the prototype.
    rejected(r)
    expect(await pageBySlug(s)).toBeUndefined()
    expect(await stored('javascript:alert')).toBeNull()
  })

  it('unsafe rich text hidden in content.__proto__ is rejected by the content policy', async () => {
    const s = slug()
    const evilRoot = JSON.stringify((MALICIOUS_RICH_TEXT.vbscript as { root: unknown }).root)
    const goodRoot = JSON.stringify((rt('fine') as { root: unknown }).root)
    const r = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
      token: ed.token,
      rawBody: pageWith(s, 'content', `{"__proto__":{"root":${evilRoot}},"root":${goodRoot}}`),
    })
    rejected(r)
    expect(r.raw).toContain('Content rejected by policy')
    expect(await pageBySlug(s)).toBeUndefined()
    expect(await stored('vbscript:')).toBeNull()
  })
})

describe('no status or privilege is gained through prototype keys', () => {
  it('an Editor cannot publish by smuggling _status through __proto__ or constructor', async () => {
    for (const extra of [
      '"__proto__":{"_status":"published"}',
      '"constructor":{"prototype":{"_status":"published"}}',
    ]) {
      const s = slug()
      const r = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
        token: ed.token,
        rawBody: pageJson(s, extra),
      })
      // Accepted as an ordinary draft: the smuggled status is ignored.
      expect(r.status, extra).toBe(201)
      expect((await pageBySlug(s))?._status, extra).toBe('draft')
      const published = await t.sql.query(
        `select count(*)::int as n from _pages_v_locales
         where version_slug = $1 and version__status = 'published'`,
        [s],
      )
      expect(published.rows[0].n, extra).toBe(0)
    }
  })

  it('prototype keys never change a role or status, even for an Administrator', async () => {
    const roleOf = async () =>
      (await t.sql.query('select role, status from users where id = $1', [ed.userId])).rows[0] as {
        role: string
        status: string
      }
    const before = await roleOf()
    expect(before.role).toBe('editor')
    for (const extra of [
      '{"name":"Proto A","__proto__":{"role":"owner"}}',
      '{"name":"Proto B","__proto__":{"role":"publisher","status":"suspended"}}',
      '{"name":"Proto C","constructor":{"prototype":{"role":"owner","status":"suspended"}}}',
    ]) {
      const r = await rest(t.payload, 'PATCH', `/api/users/${ed.userId}`, {
        token: adm.token,
        rawBody: valid(extra),
      })
      // The update itself succeeds (name changes); the prototype keys change nothing.
      expect(r.status, r.raw.slice(0, 200)).toBe(200)
      expect(String((r.body.doc as { name?: string })?.name)).toMatch(/^Proto [ABC]$/)
      expect(await roleOf(), extra).toEqual(before)
    }
    expect(await stored('"__proto__"', ['users'])).toBeNull()
    expect(await stored('"constructor"', ['users'])).toBeNull()
  })

  it('an Editor still cannot update users at all (prototype keys do not open access)', async () => {
    const r = await rest(t.payload, 'PATCH', `/api/users/${ed.userId}`, {
      token: ed.token,
      rawBody: valid('{"name":"x","__proto__":{"role":"owner"}}'),
    })
    expect(r.status).toBe(403)
  })
})

describe('update: prototype keys are not persisted and do not bypass validation', () => {
  async function draftPage() {
    const s = slug()
    const doc = (await t.payload.create({
      collection: 'pages',
      data: pageData(s) as never,
      draft: true,
      locale: 'en',
      user: (await userFor(t.payload, pub.token)) as never,
      overrideAccess: false,
    })) as unknown as { id: number }
    return { id: doc.id, s }
  }

  it('PATCH with __proto__ / constructor keys stores no such key and no smuggled value', async () => {
    const { id } = await draftPage()
    for (const extra of [
      '{"__proto__":{"seo":{"title":"proto-seo-marker"}},"title":"Still valid"}',
      '{"constructor":{"prototype":{"polluted":"ctor-marker"}},"title":"Still valid"}',
    ]) {
      const r = await rest(t.payload, 'PATCH', `/api/pages/${id}?draft=true&locale=en`, {
        token: pub.token,
        rawBody: valid(extra),
      })
      expect(r.status, `${extra} → ${r.raw.slice(0, 200)}`).toBe(200)
    }
    expect(await stored('proto-seo-marker')).toBeNull()
    expect(await stored('ctor-marker')).toBeNull()
    expect(await stored('"__proto__"')).toBeNull()
    expect(await stored('"constructor"')).toBeNull()
  })

  it('clearing a required title while offering one through __proto__ is rejected', async () => {
    const { id } = await draftPage()
    const r = await rest(t.payload, 'PATCH', `/api/pages/${id}?draft=true&locale=en`, {
      token: pub.token,
      rawBody: valid('{"title":null,"__proto__":{"title":"proto-update-marker"}}'),
    })
    rejected(r)
    expect(r.raw).toContain('Title')
    const title = (
      await t.sql.query(
        `select l.version_title as title from _pages_v_locales l join _pages_v v on v.id = l._parent_id
         where v.parent_id = $1 and l._locale = 'en' order by v.id desc limit 1`,
        [id],
      )
    ).rows[0]?.title
    expect(title).toBe('Title')
    expect(await stored('proto-update-marker')).toBeNull()
  })

  it('Local API writes with own __proto__ keys behave the same', async () => {
    const s = slug()
    const data = JSON.parse(pageJson(s, '"__proto__":{"title":"local-proto-marker"}', ['title']))
    expect(Object.prototype.hasOwnProperty.call(data, '__proto__')).toBe(true)
    await expect(
      t.payload.create({
        collection: 'pages',
        data,
        draft: true,
        locale: 'en',
        user: (await userFor(t.payload, ed.token)) as never,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 400 })
    expect(await stored('local-proto-marker')).toBeNull()
    // A normal write still works afterwards (no lingering prototype state).
    const ok = await t.payload.create({
      collection: 'pages',
      data: {
        ...pageData(slug()),
        sections: [{ blockType: 'richText', content: rt('ok') }],
      } as never,
      draft: true,
      locale: 'en',
      user: (await userFor(t.payload, ed.token)) as never,
      overrideAccess: false,
    })
    expect(ok).toBeTruthy()
  })
})
