// CD-09 brand assets through site settings (FR-054, FR-056, FR-060): a logo chosen in the draft
// settings stays private; publishing the settings makes it public and lists the settings as a use;
// a logo without alt text in a published language blocks the publish unless decorative; the
// public read populates the logo and the default social image.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Session } from '../../support/auth'
import { getFile, mediaDoc, uploadMedia } from '../../support/media'
import { validPng } from '../../fixtures/uploads/generate'
import { findMediaUsage } from '../../../src/modules/media/usage'
import { variantName } from '../../../src/modules/media/variants'

let t: TestPayload
let admin: Session
let editor: Session
const user = async (s: Session) => (await userFor(t.payload, s.token)) as never

beforeAll(async () => {
  t = await bootPayload()
  admin = await verifiedSession(t.payload, 'administrator')
  editor = await verifiedSession(t.payload, 'editor')
}, 240_000)
afterAll(async () => t?.close())

async function logo(alt: Record<'en' | 'ar', string | undefined>, decorative = false) {
  const r = await uploadMedia({
    token: editor.token,
    file: { name: 'logo.png', type: 'image/png', data: await validPng(1200, 300) },
    data: { alt: alt.en, decorative },
    locale: 'en',
  })
  expect(r.status, r.raw.toString().slice(0, 200)).toBe(201)
  const id = (r.body.doc as { id: number }).id
  if (alt.ar)
    await t.payload.update({
      collection: 'media',
      id,
      locale: 'ar',
      data: { alt: alt.ar } as never,
      overrideAccess: true,
    })
  return mediaDoc(t.payload, id)
}

const settings = async (data: Record<string, unknown>, locale: 'en' | 'ar' = 'en', draft = true) =>
  t.payload.updateGlobal({
    slug: 'site-settings',
    locale,
    draft,
    data: data as never,
    user: await user(admin),
    overrideAccess: false,
  })

const publishSettings = (locale: 'en' | 'ar') =>
  t.payload.updateGlobal({
    slug: 'site-settings',
    locale,
    draft: false,
    data: { _status: 'published' } as never,
    publishSpecificLocale: locale,
    overrideAccess: true,
  })

const publicSettings = (locale: 'en' | 'ar') =>
  t.payload.findGlobal({
    slug: 'site-settings',
    locale,
    depth: 1,
    draft: false,
    fallbackLocale: false,
    overrideAccess: false,
    context: { publicSite: true },
  }) as unknown as Promise<Record<string, unknown>>

describe('brand assets in site settings (CD-09)', () => {
  it('a draft logo is private; publishing the settings makes it public and lists the use', async () => {
    const m = await logo({ en: 'Altamiuz wordmark', ar: 'شعار' })
    const variant = m.sizes[variantName(480, 'webp')]!.filename!
    await settings({
      defaultSeo: { title: 'Site', description: 'Site description' },
      brand: { logo: m.id },
    })
    expect((await getFile(variant)).status).toBe(403)
    expect(await findMediaUsage(t.payload, m.id)).toEqual([
      {
        collection: 'site-settings',
        id: expect.any(Number),
        title: 'Site settings',
        published: false,
        draft: true,
      },
    ])
    await publishSettings('en')
    expect((await getFile(variant)).status).toBe(200)
    expect((await getFile(m.filename)).status).toBe(200)
    const uses = await findMediaUsage(t.payload, m.id)
    expect(uses.map((u) => [u.collection, u.published, u.draft])).toEqual([
      ['site-settings', true, true],
    ])
    const pub = await publicSettings('en')
    const brand = pub.brand as { logo?: { filename?: string; alt?: string; sizes?: unknown } }
    expect(brand.logo?.filename).toBe(m.filename)
    expect(brand.logo?.alt).toBe('Altamiuz wordmark')
    expect(brand.logo?.sizes).toBeTruthy()
    // Per language: the Arabic settings carry no logo until one is chosen there.
    await settings({ defaultSeo: { title: 'الموقع', description: 'وصف' } }, 'ar')
    await publishSettings('ar')
    const ar = await publicSettings('ar')
    expect((ar.brand as { logo?: unknown } | undefined)?.logo ?? null).toBeNull()
  })

  it('a logo without alt text in the published language blocks the publish unless decorative', async () => {
    const m = await logo({ en: 'English only', ar: undefined })
    await settings(
      { defaultSeo: { title: 'الموقع', description: 'وصف' }, brand: { logo: m.id } },
      'ar',
    )
    await expect(publishSettings('ar')).rejects.toMatchObject({ status: 400 })
    await t.payload.update({
      collection: 'media',
      id: m.id,
      data: { decorative: true } as never,
      overrideAccess: true,
    })
    await expect(publishSettings('ar')).resolves.toBeTruthy()
  })

  it('the default social image becomes public with the settings', async () => {
    const m = await logo({ en: 'Default social image', ar: 'صورة' })
    await settings({
      defaultSeo: { title: 'Site', description: 'Site description', ogImage: m.id },
    })
    expect((await getFile(m.filename)).status).toBe(403)
    await publishSettings('en')
    expect((await getFile(m.filename)).status).toBe(200)
    const pub = await publicSettings('en')
    expect((pub.defaultSeo as { ogImage?: { filename?: string } }).ogImage?.filename).toBe(
      m.filename,
    )
  })
})
