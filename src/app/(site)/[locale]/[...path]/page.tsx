// Public pages, listings and details (T103, FR-002, FR-004, FR-017, FR-018, FR-021). Paths are
// resolved by the typed route map only; content comes from the published-only read path. A URL
// whose slug exists only in the other language shows a localized notice (no fallback, noindex).
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { LANGUAGE_NAMES, t, type Locale, type RoutedCollection } from '@/modules/i18n'
import {
  decodeSegments,
  resolvePublicPath,
  type PublicDoc,
  type PublicReaders,
} from '@/modules/content'
import { DocumentView, ListingCards } from '@/ui'
import {
  cachedAlternates,
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
  if (r.kind === 'listing')
    return { title: t(r.locale, r.collection === 'services' ? 'services' : 'training') }
  const seo = (r.doc.seo ?? {}) as { title?: string; description?: string; noindex?: boolean }
  return {
    title: seo.title || r.doc.title,
    description: seo.description || undefined,
    robots: seo.noindex ? { index: false, follow: true } : undefined,
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

function CourseFacts({ doc, locale }: { doc: PublicDoc; locale: Locale }) {
  const duration = doc.duration as { value?: number; unit?: string } | undefined
  const unitKey = { hours: 'unitHours', days: 'unitDays', weeks: 'unitWeeks' } as const
  const formatKey = {
    'in-person': 'formatInPerson',
    online: 'formatOnline',
    hybrid: 'formatHybrid',
  } as const
  const rows: [string, string][] = []
  if (doc.audience) rows.push([t(locale, 'audience'), str(doc.audience)])
  if (duration?.value && duration.unit && duration.unit in unitKey)
    rows.push([
      t(locale, 'duration'),
      `${duration.value} ${t(locale, unitKey[duration.unit as keyof typeof unitKey])}`,
    ])
  if (typeof doc.deliveryFormat === 'string' && doc.deliveryFormat in formatKey)
    rows.push([
      t(locale, 'deliveryFormat'),
      t(locale, formatKey[doc.deliveryFormat as keyof typeof formatKey]),
    ])
  if (doc.provider) rows.push([t(locale, 'provider'), str(doc.provider)])
  if (!rows.length && !doc.accreditationStatement) return null
  return (
    <aside className="course-facts">
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {doc.accreditationStatement ? <p>{str(doc.accreditationStatement)}</p> : null}
    </aside>
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
      <section className="missing-translation" lang={r.locale}>
        <div className="notice">
          <h1>{t(r.locale, 'translationMissing', { language: LANGUAGE_NAMES[r.locale] })}</h1>
          <p lang={r.other} dir={r.other === 'ar' ? 'rtl' : 'ltr'}>
            <a className="button" href={r.otherPath} hrefLang={r.other}>
              {LANGUAGE_NAMES[r.other]}
            </a>
          </p>
        </div>
      </section>
    )
  if (r.kind === 'listing') {
    const kind = r.collection === 'services' ? 'service' : 'course'
    return (
      <>
        <header className="page-header">
          <h1>{t(r.locale, r.collection === 'services' ? 'services' : 'training')}</h1>
        </header>
        <section className="section">
          {r.items.length ? (
            <ListingCards items={r.items} kind={kind} locale={r.locale} headingLevel={2} />
          ) : (
            <p>{t(r.locale, r.collection === 'services' ? 'noServices' : 'noCourses')}</p>
          )}
        </section>
      </>
    )
  }
  return (
    <>
      <DocumentView
        doc={r.doc}
        locale={r.locale}
        ctx={{ listings: await listingsFor(r.doc, r.locale) }}
      />
      {r.collection === 'courses' ? <CourseFacts doc={r.doc} locale={r.locale} /> : null}
    </>
  )
}
