// Public pages, listings and details (T103, FR-002, FR-004, FR-017, FR-018, FR-021). Paths are
// resolved by the typed route map only; content comes from the published-only read path. A URL
// whose slug exists only in the other language shows a localized notice (no fallback, noindex).
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { href, LANGUAGE_NAMES, t, type Locale, type RoutedCollection } from '@/modules/i18n'
import {
  decodeSegments,
  resolvePublicPath,
  type PublicDoc,
  type PublicReaders,
} from '@/modules/content'
import { contactFormFor } from '../../contact-form'
import { contactLink, DocumentView, ListingCards } from '@/ui'
import { CtaBand } from '@/ui/page/CtaBand'
import { EmptyState } from '@/ui/page/EmptyState'
import { ListingIndex } from '@/ui/page/ListingIndex'
import { PageHeader } from '@/ui/page/PageHeader'
import { StatusView } from '@/ui/page/StatusView'
import { Icon } from '@/ui/primitives/Icon'
import { docMetadata, JsonLd, staticMetadata } from '../../seo'
import {
  cachedAlternates,
  cachedGlobal,
  cachedListing,
  cachedPublished,
  cachedRedirect,
  listingsFor,
} from '../../data'

type Params = Promise<{ locale: string; path: string[] }>
type Resolved =
  | { kind: 'doc'; locale: Locale; collection: RoutedCollection; doc: PublicDoc }
  | { kind: 'listing'; locale: Locale; collection: 'services' | 'courses'; items: PublicDoc[] }
  | { kind: 'missing'; locale: Locale; other: Locale; otherPath: string }
  | null

// The same resolution the proxy uses for its server-side 404 (resolvePublicPath), over cached reads.
const readers: PublicReaders = { published: cachedPublished, alternates: cachedAlternates }

async function resolve(params: Params): Promise<Resolved> {
  const { locale, path } = await params
  const segments = decodeSegments([locale, ...path].join('/'))
  const r = segments ? await resolvePublicPath(readers, segments) : null
  if (!r || r.kind === 'home') return null
  if (r.kind === 'listing') return { ...r, items: await cachedListing(r.collection, r.locale) }
  return r
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await resolve(params)
  if (!r) return { robots: { index: false, follow: false } }
  if (r.kind === 'missing')
    return {
      title: t(r.locale, 'translationMissing', { language: LANGUAGE_NAMES[r.locale] }),
      robots: { index: false, follow: true },
    }
  if (r.kind === 'listing') {
    const { heading, intro } = await listingCopy(r.locale, r.collection)
    return staticMetadata(r.locale, LISTING[r.collection], heading, intro)
  }
  return docMetadata(r.locale, r.collection, r.doc)
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const LISTING = { services: 'services', courses: 'training' } as const

/** Listing heading and introduction from published site settings (FR-018), else UI vocabulary. */
async function listingCopy(locale: Locale, collection: 'services' | 'courses') {
  const settings = await cachedGlobal('site-settings', locale)
  const l = (settings?.listings ?? {}) as Record<string, unknown>
  const key = collection === 'services' ? 'services' : 'training'
  return {
    settings,
    heading: str(l[`${key}Heading`]) || t(locale, LISTING[collection]),
    intro: str(l[`${key}Intro`]) || undefined,
  }
}

/** Service or course page extras: the other published items and a call to the contact page. */
async function detailExtras(locale: Locale, collection: 'services' | 'courses', doc: PublicDoc) {
  const [items, settings] = await Promise.all([
    cachedListing(collection, locale),
    cachedGlobal('site-settings', locale),
  ])
  const others = items.filter((i) => i.slug !== doc.slug).slice(0, 3)
  const kind = collection === 'services' ? 'service' : 'course'
  return (
    <>
      {others.length ? (
        <section className="section related" data-reveal="">
          <div className="section__head">
            <h2>{t(locale, collection === 'services' ? 'relatedServices' : 'relatedCourses')}</h2>
          </div>
          <ListingCards items={others} kind={kind} locale={locale} headingLevel={3} />
          <p className="section__more">
            <a className="text-link" href={href(LISTING[collection], locale)}>
              {t(locale, LISTING[collection])}
            </a>
          </p>
        </section>
      ) : null}
      <CtaBand
        heading={t(locale, collection === 'services' ? 'serviceCtaHeading' : 'courseCtaHeading')}
        body={t(locale, 'ctaBody')}
        action={contactLink(settings, locale)}
      />
    </>
  )
}

/** Unresolved path: follow a stored redirect (slug changes, legacy URLs) or 404. */
async function redirectOr404(): Promise<never> {
  // Exact requested path (percent-encoded, as stored by pathFor), set by the proxy.
  const path = (await headers()).get('x-altamiuz-path')
  const hit = path ? await cachedRedirect(path) : null
  if (hit) (hit.permanent ? permanentRedirect : redirect)(hit.to)
  notFound()
}

export default async function PublicPage({ params }: { params: Params }) {
  const r = await resolve(params)
  if (!r) return redirectOr404()
  if (r.kind === 'missing')
    return (
      <StatusView
        className="missing-translation"
        code={LANGUAGE_NAMES[r.locale]}
        title={t(r.locale, 'translationMissing', { language: LANGUAGE_NAMES[r.locale] })}
        actions={
          <>
            <a
              className="button button--arrow"
              href={r.otherPath}
              hrefLang={r.other}
              lang={r.other}
              dir={r.other === 'ar' ? 'rtl' : 'ltr'}
            >
              {LANGUAGE_NAMES[r.other]}
              <Icon name="arrow" />
            </a>
            <a className="button button--secondary" href={href('home', r.locale)}>
              {t(r.locale, 'backHome')}
            </a>
          </>
        }
      />
    )
  if (r.kind === 'listing') {
    const kind = r.collection === 'services' ? 'service' : 'course'
    const { settings, heading, intro } = await listingCopy(r.locale, r.collection)
    const contact = contactLink(settings, r.locale)
    return (
      <>
        <JsonLd locale={r.locale} listing={LISTING[r.collection]} />
        <PageHeader
          locale={r.locale}
          crumbs={[
            { label: t(r.locale, 'home'), href: href('home', r.locale) },
            { label: t(r.locale, LISTING[r.collection]) },
          ]}
          title={heading}
          lead={intro}
        />
        <section className="section section--listing">
          {r.items.length ? (
            <ListingIndex items={r.items} kind={kind} locale={r.locale} headingLevel={2} />
          ) : (
            <EmptyState
              title={t(r.locale, r.collection === 'services' ? 'noServices' : 'noCourses')}
              body={contact ? t(r.locale, 'listingEmptyHint') : undefined}
              action={contact}
            />
          )}
        </section>
      </>
    )
  }
  return (
    <>
      <JsonLd locale={r.locale} collection={r.collection} doc={r.doc} />
      <DocumentView
        doc={r.doc}
        locale={r.locale}
        collection={r.collection}
        ctx={{
          listings: await listingsFor(r.doc, r.locale),
          contactForm: await contactFormFor(r.doc, r.locale),
        }}
        after={r.collection === 'pages' ? null : await detailExtras(r.locale, r.collection, r.doc)}
      />
    </>
  )
}
