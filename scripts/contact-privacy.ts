// Loads the contact page and the privacy notice (content/contact/copy.ts) as DRAFTS in English
// and Arabic through the Payload Local API, and points the site settings DRAFT at the notice. It
// never publishes anything. The notice is a `legal`-template page whose open decisions are
// "Pending …" sections, so it cannot be published until they are resolved (CD-10).
import type { Payload } from 'payload'
import { contactPage, privacyPage, privacySections, type Para } from '../content/contact/copy'

type Locale = 'en' | 'ar'
type Obj = Record<string, unknown>
export class ContactSeedError extends Error {}

const el = (type: string, children: Obj[], extra: Obj = {}): Obj => ({
  type,
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  children,
  ...extra,
})
const txt = (text: string): Obj => ({ type: 'text', version: 1, text, format: 0 })
const richText = (paras: Para[], l: Locale) => ({
  root: el(
    'root',
    paras.flatMap((p) => [
      ...(p.h ? [el('heading', [txt(p.h[l])], { tag: 'h2' })] : []),
      ...(p.list
        ? [
            el(
              'list',
              p.list.map((it, i) => el('listitem', [txt(it[l])], { value: i + 1 })),
              { listType: 'bullet', start: 1, tag: 'ul' },
            ),
          ]
        : []),
      ...(p.p ?? []).map((x) => el('paragraph', [txt(x[l])])),
    ]),
  ),
})

const contactSections = (l: Locale) => [
  {
    blockType: 'contactBlock',
    blockName: 'Enquiry form',
    heading: contactPage.form.heading[l],
    intro: contactPage.form.intro[l],
  },
]
const privacyBlocks = (l: Locale) =>
  privacySections.map((s) => ({
    blockType: 'richText',
    blockName: s.pending ? `Pending: ${s.pending}` : s.label,
    ...(s.pending ? { hidden: true } : {}),
    content: richText(s.body, l),
  }))

const withIds = (stored: Obj[], next: Obj[]) => next.map((b, i) => ({ ...b, id: stored[i]?.id }))

async function findBySlug(payload: Payload, slug: string) {
  const r = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    draft: true,
    locale: 'en',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return r.docs[0] as { id: number } | undefined
}

async function upsertPage(
  payload: Payload,
  def: typeof contactPage | typeof privacyPage,
  template: 'default' | 'legal',
  sections: (l: Locale) => Obj[],
  replaceDraft: boolean,
): Promise<{ id: number; replaced: boolean }> {
  const existing = await findBySlug(payload, def.slug.en)
  if (existing && !replaceDraft)
    throw new ContactSeedError(
      `A page with slug "${def.slug.en}" already exists (id ${existing.id}). Re-run as "pnpm seed:contact replace-draft" to replace its draft; the published version is not changed.`,
    )
  const base = (l: Locale) => ({
    title: def.title[l],
    slug: def.slug[l],
    summary: def.summary[l],
    template,
    seo: { title: def.seo.title[l], description: def.seo.description[l] },
  })
  const storedSections = async (id: number) =>
    (
      (await payload.findByID({
        collection: 'pages',
        id,
        draft: true,
        locale: 'en',
        depth: 0,
        overrideAccess: true,
      })) as unknown as { sections?: Obj[] }
    ).sections ?? []
  const en = { ...base('en'), sections: sections('en') }
  const id = existing
    ? (
        (await payload.update({
          collection: 'pages',
          id: existing.id,
          locale: 'en',
          draft: true,
          data: {
            ...en,
            sections: withIds(await storedSections(existing.id), en.sections),
          } as never,
          overrideAccess: true,
        })) as unknown as { id: number }
      ).id
    : (
        (await payload.create({
          collection: 'pages',
          locale: 'en',
          draft: true,
          data: en as never,
          overrideAccess: true,
        })) as unknown as { id: number }
      ).id
  await payload.update({
    collection: 'pages',
    id,
    locale: 'ar',
    draft: true,
    data: { ...base('ar'), sections: withIds(await storedSections(id), sections('ar')) } as never,
    overrideAccess: true,
  })
  return { id, replaced: !!existing }
}

export type ContactSeedResult = {
  contactId: number
  privacyId: number
  settings: { privacyNoticeSet: boolean; topicAdded: boolean }
}

export async function seedContactAndPrivacy(
  payload: Payload,
  opts: { replaceDraft?: boolean } = {},
): Promise<ContactSeedResult> {
  const replace = !!opts.replaceDraft
  const contact = await upsertPage(payload, contactPage, 'default', contactSections, replace)
  const privacy = await upsertPage(payload, privacyPage, 'legal', privacyBlocks, replace)
  // Site settings: only fill what is empty, and only in the draft (publishing stays a decision).
  const settings = (await payload.findGlobal({
    slug: 'site-settings',
    draft: true,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })) as unknown as { privacyNotice?: unknown; enquiryTopics?: { id?: string }[] | null }
  const privacyNoticeSet = settings.privacyNotice == null
  const topicAdded = !settings.enquiryTopics?.length
  if (privacyNoticeSet || topicAdded) {
    await payload.updateGlobal({
      slug: 'site-settings',
      draft: true,
      locale: 'en',
      data: {
        ...(privacyNoticeSet ? { privacyNotice: privacy.id } : {}),
        ...(topicAdded ? { enquiryTopics: [{ label: contactPage.defaultTopic.en }] } : {}),
      } as never,
      overrideAccess: true,
    })
    if (topicAdded) {
      const en = (await payload.findGlobal({
        slug: 'site-settings',
        draft: true,
        locale: 'en',
        depth: 0,
        overrideAccess: true,
      })) as unknown as { enquiryTopics: { id: string }[] }
      await payload.updateGlobal({
        slug: 'site-settings',
        draft: true,
        locale: 'ar',
        data: {
          enquiryTopics: en.enquiryTopics.map((r) => ({
            id: r.id,
            label: contactPage.defaultTopic.ar,
          })),
        } as never,
        overrideAccess: true,
      })
    }
  }
  return {
    contactId: contact.id,
    privacyId: privacy.id,
    settings: { privacyNoticeSet, topicAdded },
  }
}
