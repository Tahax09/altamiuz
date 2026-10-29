// T071 (FR-013c, D-22, contracts/rich-text.md): every write path rejects policy-violating rich text
// and link URLs — REST create/update/bulk, Local API, draft, autosave, duplicate, copy-to-locale,
// restore of a version that bypassed hooks, nested blocks/arrays, link groups, both locales.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Session } from '../../support/auth'
import {
  doc,
  link,
  MALICIOUS_LINK_URLS,
  MALICIOUS_RICH_TEXT,
  pageData,
  para,
  rest,
  rt,
  text,
} from '../../support/content'

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
const slug = () => `rt-${Date.now()}-${n++}`
const withContent = (content: unknown) =>
  pageData(slug(), 'T', { sections: [{ blockType: 'richText', content }] })

async function goodPage(locale: 'ar' | 'en' = 'en') {
  return (await t.payload.create({
    collection: 'pages',
    data: pageData(slug()) as never,
    draft: true,
    locale,
    user: await user(ed),
    overrideAccess: false,
  })) as unknown as { id: number }
}

/** Raw DB check: no stored row anywhere contains the payload's marker. */
async function storedAnywhere(marker: string) {
  const r = await t.sql.query(
    `select table_name, column_name from information_schema.columns
     where table_schema = 'public' and data_type in ('jsonb', 'json', 'character varying', 'text')
       and (table_name like 'pages%' or table_name like '\\_pages%')`,
  )
  for (const { table_name, column_name } of r.rows) {
    const hit = await t.sql.query(
      `select 1 from "${table_name}" where "${column_name}"::text like $1 limit 1`,
      [`%${marker}%`],
    )
    if (hit.rowCount) return `${table_name}.${column_name}`
  }
  return null
}

const rejects = async (p: Promise<unknown>) => {
  const r = await p.then(
    () => 'stored',
    (e: { status?: number }) => e.status ?? 'error',
  )
  expect(r, 'must be rejected').not.toBe('stored')
  return r
}

describe('Local API create/update (draft and autosave), both locales', () => {
  for (const [name, value] of Object.entries(MALICIOUS_RICH_TEXT)) {
    for (const locale of ['en', 'ar'] as const) {
      it(`${name} [${locale}] is rejected on create (draft)`, async () => {
        const status = await rejects(
          t.payload.create({
            collection: 'pages',
            data: withContent(value) as never,
            draft: true,
            locale,
            user: await user(ed),
            overrideAccess: false,
          }),
        )
        expect(status).toBe(400)
      })
    }

    it(`${name} is rejected on draft update and autosave`, async () => {
      const p = await goodPage()
      for (const autosave of [false, true])
        expect(
          await rejects(
            t.payload.update({
              collection: 'pages',
              id: p.id,
              data: { sections: [{ blockType: 'richText', content: value }] } as never,
              draft: true,
              autosave,
              locale: 'en',
              user: await user(ed),
              overrideAccess: false,
            }),
          ),
        ).toBe(400)
    })
  }

  it('nested rich text (FAQ answers inside arrays) is checked', async () => {
    await rejects(
      t.payload.create({
        collection: 'pages',
        data: pageData(slug(), 'T', {
          sections: [
            {
              blockType: 'faq',
              items: [
                { question: 'ok', answer: rt('fine') },
                { question: 'bad', answer: MALICIOUS_RICH_TEXT.javascriptUrl },
              ],
            },
          ],
        }) as never,
        draft: true,
        locale: 'en',
        user: await user(ed),
        overrideAccess: false,
      }),
    )
  })

  it('services and courses rich text is checked too', async () => {
    for (const collection of ['services', 'courses'] as const)
      await rejects(
        t.payload.create({
          collection,
          data: {
            title: 'S',
            slug: slug(),
            summary: 's',
            seo: { title: 'SEO title', description: 'SEO description' },
            sections: [{ blockType: 'richText', content: MALICIOUS_RICH_TEXT.dataUrl }],
          } as never,
          draft: true,
          locale: 'en',
          user: await user(ed),
          overrideAccess: false,
        }),
      )
  })

  it('safe content with https, mailto, tel, fragment and relative links is accepted', async () => {
    const ok = doc(
      para(
        text('Contact '),
        link('https://example.org/a?b=1'),
        link('mailto:info@example.org', 'mail'),
        link('tel:+218910000000', 'tel'),
        link('#section-2', 'jump'),
        link('/en/services', 'rel'),
      ),
    )
    const p = await t.payload.create({
      collection: 'pages',
      data: withContent(ok) as never,
      draft: true,
      locale: 'ar',
      user: await user(ed),
      overrideAccess: false,
    })
    expect(p.id).toBeTruthy()
  })
})

describe('link groups (hero/CTA)', () => {
  for (const url of MALICIOUS_LINK_URLS)
    it(`external link ${JSON.stringify(url)} is rejected`, async () => {
      await rejects(
        t.payload.create({
          collection: 'pages',
          data: pageData(slug(), 'T', {
            sections: [
              {
                blockType: 'cta',
                heading: 'Go',
                link: { linkType: 'external', url, label: 'Go' },
              },
            ],
          }) as never,
          draft: true,
          locale: 'en',
          user: await user(ed),
          overrideAccess: false,
        }),
      )
    })

  it('malformed email/tel link values are rejected', async () => {
    for (const link of [
      { linkType: 'tel', tel: '+21 8 ; javascript:x', label: 'x' },
      { linkType: 'email', email: 'a@b.c?cc=evil@x.y', label: 'x' },
    ])
      await rejects(
        t.payload.create({
          collection: 'pages',
          data: pageData(slug(), 'T', {
            sections: [{ blockType: 'hero', heading: 'H', primaryCta: link }],
          }) as never,
          draft: true,
          locale: 'en',
          user: await user(ed),
          overrideAccess: false,
        }),
      )
  })
})

describe('REST create, update and bulk update', () => {
  it('POST /api/pages with javascript: link is rejected and nothing is stored', async () => {
    const marker = `xss-rest-${Date.now()}`
    const r = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
      token: ed.token,
      body: withContent(doc(para(link(`javascript:alert('${marker}')`)))),
    })
    expect(r.status).toBe(400)
    expect(r.raw).not.toContain(marker)
    expect(await storedAnywhere(marker)).toBeNull()
  })

  it('PATCH /api/pages/:id (draft and autosave) with an unknown node is rejected', async () => {
    const p = await goodPage()
    for (const q of ['draft=true', 'draft=true&autosave=true']) {
      const r = await rest(t.payload, 'PATCH', `/api/pages/${p.id}?${q}&locale=ar`, {
        token: ed.token,
        body: { sections: [{ blockType: 'richText', content: MALICIOUS_RICH_TEXT.htmlNode }] },
      })
      expect(r.status, q).toBe(400)
    }
    expect(await storedAnywhere('onerror=alert')).toBeNull()
  })

  it('bulk PATCH /api/pages?where=… rejects every document', async () => {
    const a = await goodPage()
    const b = await goodPage()
    const r = await rest(
      t.payload,
      'PATCH',
      `/api/pages?draft=true&locale=en&where[id][in]=${a.id},${b.id}`,
      {
        token: ed.token,
        body: { sections: [{ blockType: 'richText', content: MALICIOUS_RICH_TEXT.vbscript }] },
      },
    )
    expect((r.body.docs as unknown[] | undefined)?.length ?? 0).toBe(0)
    expect(await storedAnywhere('vbscript:')).toBeNull()
  })

  it('malformed payloads (wrong types, huge depth) are rejected without a 500', async () => {
    let deep: Record<string, unknown> = text('x')
    for (let i = 0; i < 30; i++) deep = { ...para(), children: [deep] }
    for (const content of [
      42,
      [],
      { root: 'x' },
      { root: { type: 'root', children: 'x' } },
      doc(deep),
    ]) {
      const r = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
        token: ed.token,
        body: withContent(content),
      })
      expect(r.status, JSON.stringify(content).slice(0, 60)).toBe(400)
    }
    const junk = await rest(t.payload, 'POST', '/api/pages?draft=true', {
      token: ed.token,
      body: { title: { $ne: 1 }, slug: ['a'], sections: 'nope' },
    })
    expect(junk.status).toBeGreaterThanOrEqual(400)
    expect(junk.status).toBeLessThan(500)
  })
})

/** Writes a locale's rich text straight into the database (document and latest version), as
 * pre-policy or imported data would be, bypassing every hook. */
async function poisonSql(pageId: number, locale: 'ar' | 'en', value: unknown) {
  const targets = [
    ['pages_blocks_rich_text', pageId],
    [
      '_pages_v_blocks_rich_text',
      (
        await t.sql.query('select id from _pages_v where parent_id = $1 and latest = true', [
          pageId,
        ])
      ).rows[0].id,
    ],
  ] as const
  for (const [table, parent] of targets) {
    const block = await t.sql.query(`select id from ${table} where _parent_id = $1`, [parent])
    const id = block.rows[0].id
    await t.sql.query(`delete from ${table}_locales where _parent_id = $1 and _locale = $2`, [
      id,
      locale,
    ])
    await t.sql.query(
      `insert into ${table}_locales (content, _locale, _parent_id) values ($1, $2, $3)`,
      [JSON.stringify(value), locale, id],
    )
  }
  // Sanity: the poison is really visible to Payload's draft read.
  const seen = await t.payload.findByID({
    collection: 'pages',
    id: pageId,
    locale: 'all',
    draft: true,
    overrideAccess: true,
  })
  const { findContentIssues } = await import('@/modules/content')
  expect(findContentIssues(seen).length).toBeGreaterThan(0)
}

describe('paths that carry other locales or stored data', () => {
  async function poisonDraft(locale: 'ar' | 'en', value: unknown) {
    // Bypass every hook, as a compromised import or pre-policy data would.
    const p = await goodPage()
    const full = (await t.payload.findByID({
      collection: 'pages',
      id: p.id,
      locale: 'all',
      draft: true,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>
    const version = {
      ...full,
      // The poisoned locale has real content, so restore will try to write it.
      title: { ...(full.title as object), [locale]: 'Poisoned' },
      slug: { ...(full.slug as object), [locale]: `poisoned-${Date.now()}` },
      sections: [{ blockType: 'richText', content: { [locale]: value } }],
    }
    await t.payload.db.createVersion({
      collectionSlug: 'pages',
      parent: p.id,
      versionData: version as never,
      autosave: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      returning: true,
      snapshot: false,
    } as never)
    return p
  }

  it('restoring a version with unsafe Arabic content (stored behind the hooks) is rolled back', async () => {
    const p = await poisonDraft('ar', MALICIOUS_RICH_TEXT.javascriptUrl)
    const v = (
      await t.payload.findVersions({
        collection: 'pages',
        where: { parent: { equals: p.id } },
        sort: '-updatedAt',
        overrideAccess: true,
        limit: 1,
      })
    ).docs[0]!
    const { createLocalReq } = await import('payload')
    const { restoreAsDraft } = await import('@/modules/content')
    const req = await createLocalReq({ user: await user(pub), locale: 'en' }, t.payload)
    const versionsBefore = (await t.sql.query('select count(*) from _pages_v')).rows[0].count
    await rejects(restoreAsDraft(req, 'pages', v.id))
    // Rolled back: no new version row, and the document itself holds no unsafe content.
    expect((await t.sql.query('select count(*) from _pages_v')).rows[0].count).toBe(versionsBefore)
    const main = await t.sql.query(
      `select l.content from pages_blocks_rich_text b
       join pages_blocks_rich_text_locales l on l._parent_id = b.id where b._parent_id = $1`,
      [p.id],
    )
    expect(JSON.stringify(main.rows)).not.toContain('javascript:')
  })

  it('duplicating a document whose other locale was poisoned in the database is rejected', async () => {
    const p = await goodPage()
    // Poison the Arabic locale directly in the database (bypassing hooks).
    await poisonSql(p.id, 'ar', MALICIOUS_RICH_TEXT.dataUrl)
    await rejects(
      t.payload.duplicate({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        draft: true,
        user: await user(ed),
        overrideAccess: false,
      } as never),
    )
  })

  it('copy-to-locale (admin copyDataFromLocale) cannot move unsafe content into the other locale', async () => {
    const p = await goodPage()
    await poisonSql(p.id, 'en', MALICIOUS_RICH_TEXT.htmlNode)
    const { copyDataFromLocale } = await import('@payloadcms/ui/utilities/copyDataFromLocale')
    const { createLocalReq } = await import('payload')
    const req = await createLocalReq({ user: await user(ed) }, t.payload)
    await rejects(
      copyDataFromLocale({
        collectionSlug: 'pages',
        docID: p.id,
        fromLocale: 'en',
        toLocale: 'ar',
        overrideData: true,
        req,
      }),
    )
  })

  it('any later save of a poisoned document fails until the unsafe content is removed', async () => {
    const p = await goodPage()
    await poisonSql(p.id, 'ar', MALICIOUS_RICH_TEXT.scriptNode)
    await rejects(
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        draft: true,
        data: { title: 'unrelated edit' } as never,
        user: await user(ed),
        overrideAccess: false,
      }),
    )
  })
})
