// Contact page and privacy-notice foundation (CD-10, FR-079): drafts only, a legal page cannot be
// published while it has "Pending" sections, the enquiry path refuses languages without a
// published notice, and the public notice lookup never returns drafts or other templates.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestCaptcha } from '../../../src/modules/platform/adapters/captcha'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { pageData, rt } from '../../support/content'
import { ContactSeedError, seedContactAndPrivacy } from '../../../scripts/contact-privacy'
import { privacySections } from '../../../content/contact/copy'

let t: TestPayload
let m: typeof import('@/modules/enquiries')
const S = {} as Record<Role, Session>
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never
type Block = Record<string, unknown> & { blockType: string; blockName?: string; hidden?: boolean }
let seeded: Awaited<ReturnType<typeof seedContactAndPrivacy>>

const ORIGIN = 'http://localhost:3000'
const headers = (ip: string) =>
  new Headers({ origin: ORIGIN, host: 'localhost:3000', 'x-forwarded-for': ip })
const raw = (locale: 'en' | 'ar', topic: string) => ({
  name: 'Visitor',
  email: 'visitor@example.org',
  topic,
  message: 'Please contact me.',
  consent: 'true',
  locale,
  turnstileToken: `XXXX.DUMMY.TOKEN.XXXX-${Math.random()}`,
})

beforeAll(async () => {
  t = await bootPayload()
  m = await import('@/modules/enquiries')
  m.setCaptchaForTests(createTestCaptcha('1x0000000000000000000000000000000AA'))
  m.setEnquiryMailerForTests({ send: async () => ({ id: 'x' }) } as never)
  for (const r of ['editor', 'publisher', 'administrator'] as Role[])
    S[r] = await verifiedSession(t.payload, r)
  // This suite owns the contact/privacy slugs and the settings link in its database.
  for (const slug of ['contact', 'privacy']) {
    const r = await t.payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      draft: true,
      locale: 'en',
      depth: 0,
      overrideAccess: true,
    })
    for (const d of r.docs)
      await t.payload.delete({
        collection: 'pages',
        id: (d as { id: number }).id,
        overrideAccess: true,
      })
  }
  await t.payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      defaultSeo: { title: 'Site', description: 'Site description' },
      privacyNotice: null,
      enquiryTopics: [],
      _status: 'published',
    } as never,
    publishSpecificLocale: 'en',
    overrideAccess: true,
  })
  seeded = await seedContactAndPrivacy(t.payload)
}, 240_000)
afterAll(async () => t?.close())

const draft = async (id: number, locale: 'en' | 'ar') =>
  (await t.payload.findByID({
    collection: 'pages',
    id,
    draft: true,
    locale,
    depth: 0,
    overrideAccess: true,
  })) as unknown as { _status: string; template: string; slug: string; sections: Block[] }
const publish = async (id: number, role: Role, locale: 'en' | 'ar' = 'en') =>
  t.payload.update({
    collection: 'pages',
    id,
    locale,
    data: { _status: 'published' } as never,
    ...(locale === 'ar' ? { publishSpecificLocale: 'ar' } : {}),
    user: await u(role),
    overrideAccess: false,
  })

describe('contact page and privacy notice seed', () => {
  it('creates both pages as drafts in both languages and publishes nothing', async () => {
    for (const id of [seeded.contactId, seeded.privacyId])
      for (const l of ['en', 'ar'] as const) {
        const d = await draft(id, l)
        expect(d.slug).toBeTruthy()
        const live = await t.payload.find({
          collection: 'pages',
          where: { id: { equals: id } },
          locale: l,
          draft: false,
          fallbackLocale: false,
          overrideAccess: false,
          context: { publicSite: true },
        })
        expect(live.docs).toHaveLength(0)
      }
    expect((await draft(seeded.privacyId, 'en')).template).toBe('legal')
    expect((await draft(seeded.contactId, 'ar')).slug).toBe('تواصل-معنا')
    // The settings change is a draft: the published settings still name no notice.
    expect(await m.privacyNoticeFor(t.payload, 'en')).toBeNull()
    await expect(seedContactAndPrivacy(t.payload)).rejects.toBeInstanceOf(ContactSeedError)
  })

  it('the contact page states no contact details; the missing ones are a hidden pending section', async () => {
    const d = await draft(seeded.contactId, 'en')
    expect(d.sections.map((b) => b.blockType)).toEqual(['contactBlock', 'richText'])
    expect(d.sections[1]!.hidden).toBe(true)
    expect(d.sections[1]!.blockName).toMatch(/^Pending: CD-02/)
    expect(JSON.stringify(d)).not.toMatch(/@|\+218|Tripoli|طرابلس/)
  })

  it('every open legal decision in the notice is a hidden "Pending" section', async () => {
    const d = await draft(seeded.privacyId, 'en')
    const pending = d.sections.filter((b) => /^Pending: /.test(b.blockName ?? ''))
    expect(pending.length).toBe(privacySections.filter((s) => s.pending).length)
    for (const b of pending) expect(b.hidden).toBe(true)
    // Nothing invented: no legal basis, controller, processor or compliance wording is visible.
    const visible = JSON.stringify(d.sections.filter((b) => !b.hidden))
    expect(visible).not.toMatch(
      /GDPR|legitimate interest|consent as|controller|Resend|Cloudflare|complian/i,
    )
  })

  it('a legal page with a Pending section cannot be published, even hidden; without one it can', async () => {
    await expect(publish(seeded.privacyId, 'editor')).rejects.toBeTruthy()
    for (const role of ['publisher', 'administrator'] as const)
      await expect(publish(seeded.privacyId, role)).rejects.toMatchObject({ status: 400 })
    // Rolled back: still not public.
    expect(await m.privacyNoticeFor(t.payload, 'en')).toBeNull()
    // Once the decisions are resolved (pending sections removed), it publishes.
    const d = await draft(seeded.privacyId, 'en')
    await t.payload.update({
      collection: 'pages',
      id: seeded.privacyId,
      locale: 'en',
      draft: true,
      data: { sections: d.sections.filter((b) => !/^Pending/.test(b.blockName ?? '')) } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    await publish(seeded.privacyId, 'publisher')
    // The same label on a default-template page does not block it (the homepage pattern).
    const other = (await t.payload.create({
      collection: 'pages',
      draft: true,
      locale: 'en',
      data: pageData(`pending-ok-${Date.now()}`, 'Other', {
        sections: [
          { blockType: 'richText', content: rt('x') },
          {
            blockType: 'richText',
            hidden: true,
            blockName: 'Pending: something',
            content: rt('y'),
          },
        ],
      }) as never,
      user: await u('editor'),
      overrideAccess: false,
    })) as unknown as { id: number }
    await publish(other.id, 'publisher')
  })

  it('enquiries are refused in a language without a published notice, accepted once it exists', async () => {
    // Topics present, notice not linked in the published settings: refused (direct post too).
    await t.payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      // Publishing settings publishes their draft, which the seed linked; unlink explicitly.
      data: {
        enquiryTopics: [{ label: 'General enquiry' }],
        privacyNotice: null,
        _status: 'published',
      } as never,
      publishSpecificLocale: 'en',
      overrideAccess: true,
    })
    expect(
      await m.submitEnquiry(t.payload, raw('en', 'General enquiry'), headers('198.51.100.7')),
    ).toEqual({
      status: 503,
    })
    // Linked to the notice, which is published in English only (from the previous test).
    await t.payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      data: { privacyNotice: seeded.privacyId, _status: 'published' } as never,
      publishSpecificLocale: 'en',
      overrideAccess: true,
    })
    expect(await m.privacyNoticeFor(t.payload, 'en')).toEqual({
      id: seeded.privacyId,
      slug: 'privacy',
    })
    expect(await m.privacyNoticeFor(t.payload, 'ar')).toBeNull()
    const ok = await m.submitEnquiry(
      t.payload,
      raw('en', 'General enquiry'),
      headers('198.51.100.8'),
    )
    expect(ok.status).toBe(200)
    expect(
      (await m.submitEnquiry(t.payload, raw('ar', 'General enquiry'), headers('198.51.100.9')))
        .status,
    ).toBe(503)
  })

  it('the notice lookup ignores a linked page that is not a legal page', async () => {
    const plain = (await t.payload.create({
      collection: 'pages',
      locale: 'en',
      draft: false,
      data: { ...pageData(`not-legal-${Date.now()}`), _status: 'published' } as never,
      overrideAccess: true,
    })) as unknown as { id: number }
    // The admin filter offers only legal pages; a forced link is still not treated as the notice.
    await t.payload.db.updateGlobal({
      slug: 'site-settings',
      data: { privacyNotice: plain.id } as never,
    })
    expect(await m.privacyNoticeFor(t.payload, 'en')).toBeNull()
  })
})
