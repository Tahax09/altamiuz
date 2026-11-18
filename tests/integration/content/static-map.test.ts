// Office map (pnpm map:static). Mapbox is replaced by a stub fetcher: no network, no token. The
// image goes through the media pipeline with alt text in both languages; the "Find us" section is
// added after the enquiry form in both languages, replaced (not duplicated) on a re-run, and the
// page stays a draft. Bad tokens and non-image answers are refused before anything is written.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { validPng } from '../../fixtures/uploads/generate'
import { seedContactAndPrivacy } from '../../../scripts/contact-privacy'
import { loadStaticMap, StaticMapError, staticMapUrl } from '../../../scripts/static-map'

let t: TestPayload
let page: number
const TOKEN = 'pk.fixture-token' // gitleaks:allow (synthetic, not a real token)

beforeAll(async () => {
  t = await bootPayload()
  page = (await seedContactAndPrivacy(t.payload)).contactId
}, 240_000)
afterAll(async () => t?.close())

const urls: string[] = []
const stub = (body: Buffer, type = 'image/png', status = 200) =>
  (async (url: string) => {
    urls.push(url)
    return new Response(new Uint8Array(body), { status, headers: { 'content-type': type } })
  }) as unknown as typeof fetch

const sections = async (locale: 'en' | 'ar') =>
  (await t.payload.findByID({
    collection: 'pages',
    id: page,
    draft: true,
    locale,
    depth: 0,
    overrideAccess: true,
  })) as unknown as { _status: string; sections: Record<string, unknown>[] }

describe('office static map', () => {
  it('builds the Mapbox URL for the office pin and accepts only public tokens', () => {
    const url = staticMapUrl(TOKEN)
    expect(url).toContain('pin-l+2563eb(13.259694,32.848944)')
    expect(url).toContain('/13.259694,32.848944,15,0/1280x800@2x')
    expect(() => staticMapUrl('sk.secret')).toThrow(StaticMapError)
    expect(() => staticMapUrl('')).toThrow(StaticMapError)
  })

  it('stores the image and adds "Find us" after the form in both languages, draft only', async () => {
    const r = await loadStaticMap(t.payload, TOKEN, stub(await validPng(640, 400)))
    expect(r.page).toBe(page)
    for (const l of ['en', 'ar'] as const) {
      const d = await sections(l)
      const i = d.sections.findIndex((b) => b.blockName === 'Location map')
      expect(d.sections[i - 1]?.blockType).toBe('contactBlock')
      expect(d.sections[i]).toMatchObject({ blockType: 'textMedia', media: r.media, hidden: false })
      expect(JSON.stringify(d.sections[i]!.body)).toContain('Mapbox © OpenStreetMap')
      const m = (await t.payload.findByID({
        collection: 'media',
        id: r.media,
        locale: l,
        depth: 0,
        overrideAccess: true,
      })) as unknown as { alt: string; mimeType: string }
      expect(m.alt).toContain(l === 'en' ? 'Al-Sabaa' : 'السبعة')
    }
    const published = await t.payload.find({
      collection: 'pages',
      where: { id: { equals: page }, _status: { equals: 'published' } },
      overrideAccess: true,
    })
    expect(published.totalDocs).toBe(0)

    // A re-run replaces the section instead of adding a second one.
    const again = await loadStaticMap(t.payload, TOKEN, stub(await validPng(640, 400)))
    const en = await sections('en')
    expect(en.sections.filter((b) => b.blockName === 'Location map')).toHaveLength(1)
    expect(en.sections.find((b) => b.blockName === 'Location map')!.media).toBe(again.media)
  })

  it('refuses an error or a non-image answer without writing anything', async () => {
    const before = await t.payload.count({ collection: 'media', overrideAccess: true })
    await expect(
      loadStaticMap(t.payload, TOKEN, stub(Buffer.from('no'), 'application/json', 401)),
    ).rejects.toThrow(/HTTP 401/)
    await expect(
      loadStaticMap(t.payload, TOKEN, stub(Buffer.from('<html>'), 'text/html')),
    ).rejects.toThrow(StaticMapError)
    expect((await t.payload.count({ collection: 'media', overrideAccess: true })).totalDocs).toBe(
      before.totalDocs,
    )
  })
})
