// T094a (D-22, data-model "Drafts are validated (versions.drafts.validate: true)", FR-013b):
// draft saves run full field validation — required fields, field validators and length limits —
// through the Local API and REST, per locale, and rich-text policy still applies to every save.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Session } from '../../support/auth'
import { MALICIOUS_RICH_TEXT, pageData, rest } from '../../support/content'

let t: TestPayload
let ed: Session
const user = async () => (await userFor(t.payload, ed.token)) as never

beforeAll(async () => {
  t = await bootPayload()
  ed = await verifiedSession(t.payload, 'editor')
}, 240_000)
afterAll(async () => t?.close())

let n = 0
const slug = () => `dv-${Date.now()}-${n++}`
const draftCreate = async (data: Record<string, unknown>, locale: 'ar' | 'en' = 'en') =>
  t.payload.create({
    collection: 'pages',
    data: data as never,
    draft: true,
    locale,
    user: await user(),
    overrideAccess: false,
  })

describe('T094a drafts are validated (D-22)', () => {
  it('versioned content collections declare drafts.validate: true', () => {
    for (const c of ['pages', 'services', 'courses'] as const) {
      const drafts = t.payload.collections[c]!.config.versions?.drafts
      expect(drafts && typeof drafts === 'object' && drafts.validate, c).toBe(true)
    }
  })

  for (const locale of ['en', 'ar'] as const) {
    it(`Local API draft create without a title or slug is rejected [${locale}]`, async () => {
      await expect(draftCreate({ slug: slug() }, locale)).rejects.toMatchObject({ status: 400 })
      await expect(draftCreate({ title: 'T' }, locale)).rejects.toMatchObject({ status: 400 })
    })
  }

  it('Local API draft update that clears a required field or breaks a validator is rejected', async () => {
    const p = (await draftCreate(pageData(slug()))) as unknown as { id: number }
    for (const data of [
      { title: '' },
      { slug: 'not/a/segment' },
      { slug: 'admin' },
      { title: 'x'.repeat(161) },
    ])
      await expect(
        t.payload.update({
          collection: 'pages',
          id: p.id,
          locale: 'en',
          draft: true,
          data: data as never,
          user: await user(),
          overrideAccess: false,
        }),
        JSON.stringify(data).slice(0, 40),
      ).rejects.toMatchObject({ status: 400 })
  })

  it('a draft slug that duplicates another page in the same locale is rejected', async () => {
    const s = slug()
    await draftCreate(pageData(s))
    await expect(draftCreate(pageData(s))).rejects.toMatchObject({ status: 400 })
  })

  it('REST draft create and draft PATCH enforce the same rules', async () => {
    const missing = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
      token: ed.token,
      body: { slug: slug() },
    })
    expect(missing.status).toBe(400)
    expect(missing.raw).toMatch(/title/i)
    const ok = await rest(t.payload, 'POST', '/api/pages?draft=true&locale=en', {
      token: ed.token,
      body: pageData(slug()),
    })
    expect(ok.status, ok.raw).toBe(201)
    const id = (ok.body.doc as { id: number }).id
    for (const q of ['draft=true', 'draft=true&autosave=true']) {
      const r = await rest(t.payload, 'PATCH', `/api/pages/${id}?${q}&locale=en`, {
        token: ed.token,
        body: { title: '' },
      })
      expect(r.status, q).toBe(400)
    }
  })

  it('a complete English draft does not require the Arabic locale to be filled in', async () => {
    const p = (await draftCreate(pageData(slug()), 'en')) as unknown as { id: number }
    const saved = await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      draft: true,
      data: { title: 'Edited' } as never,
      user: await user(),
      overrideAccess: false,
    })
    expect((saved as unknown as { title: string }).title).toBe('Edited')
  })

  it('rich-text policy still rejects unsafe content on otherwise valid drafts', async () => {
    await expect(
      draftCreate(
        pageData(slug(), 'T', {
          sections: [{ blockType: 'richText', content: MALICIOUS_RICH_TEXT.javascriptUrl }],
        }),
      ),
    ).rejects.toMatchObject({ status: 400 })
  })
})
