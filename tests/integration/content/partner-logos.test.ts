// Partner logos (supplied 2026-11-14): `pnpm seed:partners` uploads them through the media
// pipeline with the partner's name as alt text in both languages, reuses them on a re-run, and
// creates no page, credentials block or published content (naming a partner is a claim, CD-05).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { mediaDoc } from '../../support/media'
import { PARTNER_LOGOS, loadPartnerLogos } from '../../../scripts/partner-logos'

let t: TestPayload
const pagesCount = async () =>
  (await t.payload.count({ collection: 'pages', overrideAccess: true })).totalDocs

beforeAll(async () => {
  t = await bootPayload()
}, 240_000)
afterAll(async () => t?.close())

describe('partner logos loader', () => {
  it('uploads each logo once, alt text in both languages, and places none of them', async () => {
    const pagesBefore = await pagesCount()
    const first = await loadPartnerLogos(t.payload)
    expect(first.map((l) => l.name)).toEqual(PARTNER_LOGOS.map((l) => l.name))

    for (const { id, name } of first) {
      const m = await mediaDoc(t.payload, id)
      expect(m.mimeType).toBe('image/webp')
      expect(m.width).toBeGreaterThan(0)
      for (const locale of ['en', 'ar'] as const) {
        const d = (await t.payload.findByID({
          collection: 'media',
          id,
          locale,
          depth: 0,
          overrideAccess: true,
        })) as unknown as { alt: string }
        expect(d.alt).toBe(name)
      }
    }

    const second = await loadPartnerLogos(t.payload)
    expect(second.map((l) => l.id)).toEqual(first.map((l) => l.id))
    expect(second.every((l) => !l.created)).toBe(true)
    expect(await pagesCount()).toBe(pagesBefore)
  })
})
