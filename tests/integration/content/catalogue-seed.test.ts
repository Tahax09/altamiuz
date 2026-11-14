// C-1 catalogue seed: services, courses and the first insight article are created as drafts in
// both languages and nothing is published; no legacy claim reaches the drafts (experience figures,
// partners, accreditation, superseded editions); empty contact settings are filled, non-empty
// ones are kept; a second run refuses without replace-draft and keeps ids with it. The new
// contact fields validate (E.164 numbers, Apple Maps links only).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { CatalogueSeedError, seedCatalogue } from '../../../scripts/catalogue'
import { article, contactDetails, courses, services } from '../../../content/catalogue/copy'
import { getPublished } from '../../../src/modules/content/public'

let t: TestPayload
let seeded: Awaited<ReturnType<typeof seedCatalogue>>

// Legacy statements that need evidence or an owner decision before they can appear anywhere.
const CLAIMS =
  /PECB|ZeroChance|زيرشانس|DataProtect|داتا بروتيكت|Intracom|انتراكوم|آمن\+|Aman\+|27001:2013|22301:2012|\b(20|25|30)\b|عشر|ثلاثين|الأول(?: لوغريثم)|first Libyan/i

const doc = (collection: 'services' | 'courses' | 'pages', id: number, locale: 'en' | 'ar') =>
  t.payload.findByID({
    collection,
    id,
    draft: true,
    locale,
    depth: 0,
    overrideAccess: true,
  }) as unknown as Promise<Record<string, unknown>>

beforeAll(async () => {
  t = await bootPayload()
  // An existing e-mail must survive the seed; the phones are empty and get filled.
  await t.payload.updateGlobal({
    slug: 'site-settings',
    draft: true,
    locale: 'en',
    data: { email: 'kept@example.org' } as never,
    overrideAccess: true,
  })
  seeded = await seedCatalogue(t.payload)
}, 240_000)

afterAll(async () => t?.close())

describe('catalogue seed (C-1)', () => {
  it('creates every item as a draft in both languages and publishes nothing', async () => {
    expect(seeded.services).toHaveLength(services.length)
    expect(seeded.courses).toHaveLength(courses.length)
    const all = [
      ...seeded.services.map((id, i) => ['services', id, services[i]!] as const),
      ...seeded.courses.map((id, i) => ['courses', id, courses[i]!] as const),
      ['pages', seeded.article, article] as const,
    ]
    for (const [c, id, item] of all)
      for (const l of ['en', 'ar'] as const) {
        const d = await doc(c, id, l)
        expect(d.title).toBe(item.title[l])
        expect(d.slug).toBe(item.slug[l])
        expect(d._status).toBe('draft')
        expect(await getPublished(t.payload, c, l, item.slug[l])).toBeNull()
      }
  })

  it('keeps legacy claims out of the drafts', async () => {
    const ids = [
      ...seeded.services.map((id) => ['services', id] as const),
      ...seeded.courses.map((id) => ['courses', id] as const),
      ['pages', seeded.article] as const,
    ]
    for (const [c, id] of ids)
      for (const l of ['en', 'ar'] as const) {
        const d = await doc(c, id, l)
        const text = JSON.stringify([d.title, d.summary, d.sections, d.audience, d.seo])
        expect(text, `${c} ${id} ${l}`).not.toMatch(CLAIMS)
        if (c === 'courses') {
          expect(d.accreditationStatement ?? null).toBeNull()
          expect(d.provider ?? null).toBeNull()
        }
      }
  })

  it('fills empty contact settings and keeps existing ones', async () => {
    const s = (await t.payload.findGlobal({
      slug: 'site-settings',
      draft: true,
      locale: 'en',
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>
    expect(s.email).toBe('kept@example.org')
    expect(s.phone).toBe(contactDetails.phones[0])
    expect((s.additionalPhones as { number: string }[]).map((r) => r.number)).toEqual(
      contactDetails.phones.slice(1),
    )
    expect(s.address ?? null).toBeNull() // claim-bearing, never seeded
    expect(seeded.contact).toEqual({ email: false, phone: true, additionalPhones: true })
  })

  it('refuses a second run without replace-draft and keeps ids with it', async () => {
    await expect(seedCatalogue(t.payload)).rejects.toBeInstanceOf(CatalogueSeedError)
    const again = await seedCatalogue(t.payload, { replaceDraft: true })
    expect(again.services).toEqual(seeded.services)
    expect(again.courses).toEqual(seeded.courses)
    expect(again.article).toBe(seeded.article)
    expect(again.contact).toEqual({ email: false, phone: false, additionalPhones: false })
  }, 240_000)

  it('validates phone numbers and map links', async () => {
    const save = (data: Record<string, unknown>) =>
      t.payload.updateGlobal({
        slug: 'site-settings',
        draft: true,
        locale: 'en',
        data: data as never,
        overrideAccess: true,
      })
    await expect(save({ additionalPhones: [{ number: '091-737-3202' }] })).rejects.toThrow()
    await expect(save({ mapLink: 'https://evil.example/maps' })).rejects.toThrow()
    await expect(save({ mapLink: 'javascript:alert(1)' })).rejects.toThrow()
    await expect(
      save({ mapLink: 'https://maps.apple.com/?ll=32.8,13.2&q=Altamiuz' }),
    ).resolves.toBeTruthy()
  })
})
