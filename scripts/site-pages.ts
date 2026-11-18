// Loads the remaining site pages (content/pages/copy.ts) as DRAFTS in English and Arabic through
// the Payload Local API, and fills EMPTY navigation and site-settings drafts (header and footer
// menus, legal links, contact page, services introduction). It never publishes anything and never
// replaces a non-empty menu or setting. Run after `pnpm seed:contact` so links to the contact page
// and privacy notice resolve.
import type { Payload } from 'payload'
import { attestClaimBlocks } from './attest'
import { loadPartnerLogos } from './partner-logos'
import { contactPage, privacyPage } from '../content/contact/copy'
import {
  about,
  cta,
  footerNav,
  headerNav,
  headings,
  legalLinks,
  listings,
  pages,
  pending,
  type Locale,
  type NavItem,
  type PageDef,
} from '../content/pages/copy'
import { sections as home } from '../content/homepage/copy'

type Obj = Record<string, unknown>
export class SitePagesSeedError extends Error {}

const LOCALES: Locale[] = ['en', 'ar']

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
const richText = (blocks: { h?: string; p?: string[] }[]) => ({
  root: el(
    'root',
    blocks.flatMap((b) => [
      ...(b.h ? [el('heading', [txt(b.h)], { tag: 'h2' })] : []),
      ...(b.p ?? []).map((x) => el('paragraph', [txt(x)])),
    ]),
  ),
})

type Ids = Partial<Record<PageDef['key'] | 'contact' | 'privacy', number>> & {
  /** Partner logos in the media library (scripts/partner-logos.ts). */
  partners?: { name: string; id: number }[]
}

/** Partner logos as a credentials block (logos display); nothing when no logo is loaded. */
const partnersBlock = (l: Locale, ids: Ids): Obj[] =>
  ids.partners?.length
    ? [
        {
          blockType: 'credentials',
          blockName: 'Partners',
          display: 'logos',
          eyebrow: home.partners.eyebrow[l],
          heading: home.partners.heading[l],
          items: ids.partners.map((p) => ({ name: p.name, logo: p.id })),
        },
      ]
    : []

const internal = (id: number | undefined, label: string) =>
  id ? { linkType: 'internal', doc: { relationTo: 'pages', value: id }, label } : null

const ctaBlock = (l: Locale, ids: Ids) => {
  const link = internal(ids.contact, cta.cta[l])
  return {
    blockType: 'cta',
    blockName: 'Contact call to action',
    heading: cta.heading[l],
    text: cta.text[l],
    ...(link ? { link } : {}),
  }
}

/** Section lists per page and language. Hidden "Pending:" sections wait for the named input. */
export function pageSections(key: PageDef['key'], l: Locale, ids: Ids): Obj[] {
  switch (key) {
    case 'about':
      // Rewritten from the owner's legacy About page (2026-11-13): who we are, vision, how we
      // work, method, values; company facts, people and capabilities stay hidden until their
      // inputs are confirmed (labels name the dependency).
      return [
        {
          blockType: 'textMedia',
          blockName: 'Who we are (illustration slot)',
          eyebrow: about.intro.eyebrow[l],
          heading: about.intro.heading[l],
          body: richText([{ p: [...about.intro.body[l]] }]),
          mediaPosition: 'end',
        },
        {
          blockType: 'richText',
          blockName: 'Company',
          content: richText([{ h: headings.company[l], p: [about.company[l]] }]),
        },
        {
          blockType: 'textMedia',
          blockName: 'Our vision',
          eyebrow: about.vision.eyebrow[l],
          heading: about.vision.heading[l],
          body: richText([{ p: [...about.vision.body[l]] }]),
          mediaPosition: 'start',
        },
        {
          blockType: 'featureGrid',
          blockName: 'How we work',
          eyebrow: about.approach.eyebrow[l],
          heading: about.approach.heading[l],
          items: about.approach.items.map((i) => ({
            icon: i.icon,
            title: i.title[l],
            text: i.text[l],
          })),
        },
        {
          blockType: 'process',
          blockName: 'Methodology',
          eyebrow: home.methodology.eyebrow[l],
          heading: home.methodology.heading[l],
          intro: home.methodology.intro[l],
          steps: home.methodology.steps.map((st) => ({ title: st.title[l], text: st.text[l] })),
        },
        {
          blockType: 'featureGrid',
          blockName: 'Our values',
          eyebrow: about.values.eyebrow[l],
          heading: about.values.heading[l],
          items: about.values.items.map((i) => ({
            icon: i.icon,
            title: i.title[l],
            text: i.text[l],
          })),
        },
        {
          blockType: 'featureGrid',
          hidden: true,
          blockName: `Pending: ${pending.capabilities}`,
          items: about.capabilities.map((i) => ({ icon: i.icon, title: i.title[l] })),
        },
        {
          blockType: 'credentials',
          blockName: 'Registration',
          display: 'cards',
          eyebrow: about.registration.eyebrow[l],
          heading: about.registration.heading[l],
          items: about.registration.items.map((i) => ({ name: i.name[l], issuer: i.issuer[l] })),
        },
        ...partnersBlock(l, ids),
        ctaBlock(l, ids),
      ]
    case 'standards':
      return [
        {
          blockType: 'standards',
          hidden: true,
          blockName: `Pending: ${pending.standards}`,
          eyebrow: home.standards.eyebrow[l],
          heading: home.standards.heading[l],
          items: home.standards.items.map((i) => ({ name: i.name[l], text: i.text[l] })),
        },
        ctaBlock(l, ids),
      ]
    case 'expertise':
      return [
        {
          blockType: 'stats',
          blockName: 'Experience',
          eyebrow: home.experience.eyebrow[l],
          heading: home.experience.heading[l],
          items: home.experience.items.map((it) => ({ value: it.value, label: it.label[l] })),
        },
        {
          blockType: 'team',
          blockName: 'Founder',
          eyebrow: about.founder.eyebrow[l],
          heading: about.founder.heading[l],
          members: [
            {
              name: about.founder.name[l],
              role: about.founder.role[l],
              bio: about.founder.bio[l],
            },
          ],
        },
        ctaBlock(l, ids),
      ]
    case 'insights':
      return [
        {
          blockType: 'resourceList',
          hidden: true,
          blockName: `Pending: ${pending.insights}`,
          eyebrow: home.insights.eyebrow[l],
          heading: home.insights.heading[l],
          intro: home.insights.intro[l],
        },
      ]
    case 'terms':
      return headings.terms.map((h) => ({
        blockType: 'richText',
        hidden: true,
        blockName: `Pending: ${pending.terms}`,
        content: richText([{ h: h[l] }]),
      }))
  }
}

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

/** Keeps stored section and row ids, so the second language translates rows instead of
 * replacing them (localized fields inside shared arrays). */
function withIds(stored: Obj[], next: Obj[]): Obj[] {
  return next.map((b, i) => {
    // Reuse a stored id only for the same block type, and always send `hidden`: otherwise a block
    // inherits the stored flags of whatever block used that position before.
    const prev = stored[i]?.blockType === b.blockType ? stored[i]! : {}
    const out: Obj = { ...b, hidden: b.hidden ?? false, id: prev.id }
    for (const list of ['items', 'steps', 'members'] as const)
      if (Array.isArray(b[list]) && Array.isArray(prev[list]))
        out[list] = (b[list] as Obj[]).map((row, j) => ({
          ...row,
          id: (prev[list] as Obj[])[j]?.id,
        }))
    return out
  })
}

async function upsertPage(
  payload: Payload,
  def: PageDef,
  ids: Ids,
  replaceDraft: boolean,
): Promise<{ id: number; replaced: boolean }> {
  const existing = await findBySlug(payload, def.slug.en)
  if (existing && !replaceDraft)
    throw new SitePagesSeedError(
      `A page with slug "${def.slug.en}" already exists (id ${existing.id}). Re-run as "pnpm seed:pages replace-draft" to replace its draft; the published version is not changed.`,
    )
  const base = (l: Locale) => ({
    title: def.title[l],
    slug: def.slug[l],
    summary: def.summary?.[l] ?? null,
    template: def.template,
    seo: { title: def.seo.title[l], description: def.seo.description[l] },
  })
  const stored = async (id: number) =>
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
  const en = { ...base('en'), sections: pageSections(def.key, 'en', ids) }
  const id = existing
    ? (
        (await payload.update({
          collection: 'pages',
          id: existing.id,
          locale: 'en',
          draft: true,
          data: { ...en, sections: withIds(await stored(existing.id), en.sections) } as never,
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
    data: {
      ...base('ar'),
      sections: withIds(await stored(id), pageSections(def.key, 'ar', ids)),
    } as never,
    overrideAccess: true,
  })
  return { id, replaced: !!existing }
}

/** A menu row's link in one language; null when its target page does not exist. */
function navLink(item: NavItem, l: Locale, ids: Ids): Obj | null {
  const t = item.target
  if (!t) return { linkType: 'route', route: null, label: item.label[l] } // heading-only parent
  if ('route' in t) return { linkType: 'route', route: t.route, label: item.label[l] }
  const id = ids[t.page]
  return id
    ? { linkType: 'internal', doc: { relationTo: 'pages', value: id }, label: item.label[l] }
    : null
}

function menuRows(items: NavItem[], l: Locale, ids: Ids, stored?: Obj[]): Obj[] {
  const rows: Obj[] = []
  items.forEach((item) => {
    const link = navLink(item, l, ids)
    if (!link) return
    const prev = stored?.[rows.length]
    const children = item.children ? menuRows(item.children, l, ids, prev?.children as Obj[]) : []
    rows.push({
      ...(prev?.id ? { id: prev.id } : {}),
      link,
      ...(item.children ? { children } : {}),
    })
  })
  return rows
}

type GlobalSlug = 'header-nav' | 'footer-nav' | 'site-settings'
const readDraft = async (payload: Payload, slug: GlobalSlug, locale: Locale) =>
  (await payload.findGlobal({
    slug,
    draft: true,
    locale,
    depth: 0,
    overrideAccess: true,
  })) as unknown as Obj

async function fillMenu(
  payload: Payload,
  slug: 'header-nav' | 'footer-nav',
  items: NavItem[],
  ids: Ids,
): Promise<boolean> {
  const current = await readDraft(payload, slug, 'en')
  if (Array.isArray(current.items) && current.items.length) return false // never replaced
  for (const l of LOCALES) {
    const stored = l === 'en' ? undefined : ((await readDraft(payload, slug, 'en')).items as Obj[])
    await payload.updateGlobal({
      slug,
      draft: true,
      locale: l,
      data: { items: menuRows(items, l, ids, stored) } as never,
      overrideAccess: true,
    })
  }
  return true
}

async function fillSettings(payload: Payload, ids: Ids) {
  const s = await readDraft(payload, 'site-settings', 'en')
  const done = { contactPage: false, legalLinks: false, servicesIntro: false }
  const lst = (s.listings ?? {}) as Obj
  const legal = legalLinks.filter((i) => navLink(i, 'en', ids)) // targets that exist
  const data: Obj = {}
  if (s.contactPage == null && ids.contact) {
    data.contactPage = ids.contact
    done.contactPage = true
  }
  if (!(Array.isArray(s.legalLinks) && s.legalLinks.length)) {
    if (legal.length) {
      data.legalLinks = legal.map((i) => ({ link: navLink(i, 'en', ids) }))
      done.legalLinks = true
    }
  }
  if (!lst.servicesIntro) {
    data.listings = { ...lst, servicesIntro: listings.servicesIntro.en }
    done.servicesIntro = true
  }
  if (!Object.keys(data).length) return done
  await payload.updateGlobal({
    slug: 'site-settings',
    draft: true,
    locale: 'en',
    data: data as never,
    overrideAccess: true,
  })
  // Arabic labels on the same rows, Arabic introduction.
  const en = await readDraft(payload, 'site-settings', 'en')
  const ar: Obj = {}
  if (done.legalLinks)
    ar.legalLinks = ((en.legalLinks as Obj[]) ?? []).map((row, i) => ({
      id: row.id,
      link: { ...(row.link as Obj), label: legal[i]?.label.ar },
    }))
  if (done.servicesIntro)
    ar.listings = { ...((en.listings as Obj) ?? {}), servicesIntro: listings.servicesIntro.ar }
  if (Object.keys(ar).length)
    await payload.updateGlobal({
      slug: 'site-settings',
      draft: true,
      locale: 'ar',
      data: ar as never,
      overrideAccess: true,
    })
  return done
}

export type SitePagesSeedResult = {
  pages: Record<PageDef['key'], number>
  menus: { header: boolean; footer: boolean }
  settings: { contactPage: boolean; legalLinks: boolean; servicesIntro: boolean }
}

export async function seedSitePages(
  payload: Payload,
  opts: { replaceDraft?: boolean } = {},
): Promise<SitePagesSeedResult> {
  const ids: Ids = {
    contact: (await findBySlug(payload, contactPage.slug.en))?.id,
    privacy: (await findBySlug(payload, privacyPage.slug.en))?.id,
    partners: await loadPartnerLogos(payload),
  }
  const out = {} as Record<PageDef['key'], number>
  for (const def of Object.values(pages)) {
    const r = await upsertPage(payload, def, ids, !!opts.replaceDraft)
    out[def.key] = r.id
    ids[def.key] = r.id
    // Owner attestation on figures, registration, founder and partners (content/attestation.ts).
    await attestClaimBlocks(payload, 'pages', r.id)
  }
  // CTA blocks link only to the contact page, which exists before this run (seed:contact) or not
  // at all; menus and settings below use the ids of the pages created here.
  const header = await fillMenu(payload, 'header-nav', headerNav, ids)
  const footer = await fillMenu(payload, 'footer-nav', footerNav, ids)
  const settings = await fillSettings(payload, ids)
  return { pages: out, menus: { header, footer }, settings }
}
