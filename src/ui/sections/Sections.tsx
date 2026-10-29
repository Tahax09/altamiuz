// Section renderer shared by preview and the public site (T083/T102, FR-013d, FR-014, FR-018).
// Semantic markup with the design-system classes of src/app/(site)/site.css. Hidden sections
// never render; every link goes through safeHref or the typed route map. Internal links resolve
// only to published targets, so preview and public produce the same markup for the same document.
import { safeHref } from '@/modules/content'
import { formatDate, href, t, type Locale } from '@/modules/i18n'
import { RichText, type InternalHref } from '../richtext/RichText'

type Link =
  | {
      linkType?: string
      url?: string
      email?: string
      tel?: string
      label?: string
      newTab?: boolean
      doc?: { relationTo?: string; value?: unknown } | null
    }
  | undefined
type Block = Record<string, unknown> & {
  blockType?: string
  hidden?: boolean
  anchorId?: string
  id?: string
}
type ListItem = { title?: unknown; slug?: unknown; summary?: unknown; _status?: unknown }

export type RenderContext = {
  locale: Locale
  /** Automatic listings (published, non-hidden, editor order) for `mode: all` blocks. */
  listings?: { services?: ListItem[]; courses?: ListItem[] }
}

const ROUTE_OF: Record<string, 'page' | 'service' | 'course'> = {
  pages: 'page',
  services: 'service',
  courses: 'course',
}

/** Internal target → path, only for populated targets that are published (or public reads). */
export function internalHrefFor(locale: Locale): InternalHref {
  return (relationTo, value) => {
    const key = ROUTE_OF[relationTo]
    const v = value as ListItem | null
    if (!key || !v || typeof v !== 'object' || typeof v.slug !== 'string') return null
    if (v._status !== undefined && v._status !== 'published') return null
    try {
      return href(key, locale, { slug: v.slug })
    } catch {
      return null
    }
  }
}

function LinkOut({
  link,
  resolve,
  className,
}: {
  link: Link
  resolve: InternalHref
  className?: string
}) {
  if (!link?.label) return null
  const target =
    link.linkType === 'external'
      ? safeHref(link.url)
      : link.linkType === 'email'
        ? safeHref(`mailto:${link.email}`)
        : link.linkType === 'tel'
          ? safeHref(`tel:${link.tel}`)
          : link.linkType === 'internal' && link.doc?.relationTo
            ? resolve(link.doc.relationTo, link.doc.value)
            : null
  if (!target) return <span>{link.label}</span>
  const newTab = link.newTab === true && /^https?:/.test(target)
  return (
    <a
      href={target}
      className={className}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  )
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/** Published services or courses as linked cards (sections and the listing pages). */
export function ListingCards({
  items,
  kind,
  locale,
  headingLevel = 3,
}: {
  items: ListItem[]
  kind: 'service' | 'course'
  locale: Locale
  headingLevel?: 2 | 3
}) {
  const visible = items.filter(
    (r) =>
      r &&
      typeof r === 'object' &&
      typeof r.slug === 'string' &&
      (r._status === undefined || r._status === 'published'),
  )
  if (!visible.length) return null
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <ul className="listing card-grid">
      {visible.map((r) => (
        <li key={String(r.slug)} className="card card--link">
          <Heading>
            <a href={href(kind, locale, { slug: String(r.slug) })}>{str(r.title)}</a>
          </Heading>
          {r.summary ? <p>{str(r.summary)}</p> : null}
        </li>
      ))}
    </ul>
  )
}

/** A credential's expiry date, or null when absent or not a valid date. */
function validUntil(v: unknown, locale: Locale): string | null {
  const d = typeof v === 'string' ? new Date(v) : null
  return d && !Number.isNaN(d.getTime()) ? formatDate(locale, d) : null
}

export function Sections({
  sections,
  dir,
  ctx,
}: {
  sections: unknown
  dir: 'rtl' | 'ltr'
  ctx?: RenderContext
}) {
  if (!Array.isArray(sections)) return null
  const locale: Locale = ctx?.locale ?? (dir === 'rtl' ? 'ar' : 'en')
  const resolve = internalHrefFor(locale)
  return (
    <>
      {(sections as Block[])
        .filter((b) => b && !b.hidden)
        .map((b, i) => {
          const id = b.anchorId && /^[a-z0-9-]{1,64}$/.test(b.anchorId) ? b.anchorId : undefined
          const items = Array.isArray(b.items) ? (b.items as Record<string, unknown>[]) : []
          const key = b.id ?? i
          switch (b.blockType) {
            case 'hero':
            case 'cta': {
              const primary = (b.primaryCta ?? b.link) as Link
              return (
                <section
                  key={key}
                  id={id}
                  data-block={b.blockType}
                  className={`section section--${b.blockType}`}
                >
                  <h2>{str(b.heading)}</h2>
                  {b.subheading || b.text ? <p>{str(b.subheading ?? b.text)}</p> : null}
                  {primary?.label || (b.secondaryCta as Link)?.label ? (
                    <div className="actions">
                      <LinkOut link={primary} resolve={resolve} className="button" />
                      <LinkOut
                        link={b.secondaryCta as Link}
                        resolve={resolve}
                        className="button button--secondary"
                      />
                    </div>
                  ) : null}
                </section>
              )
            }
            case 'richText':
              return (
                <section key={key} id={id} data-block="richText" className="section prose">
                  <RichText value={b.content} dir={dir} internalHref={resolve} />
                </section>
              )
            case 'faq':
              return (
                <section key={key} id={id} data-block="faq" className="section">
                  <div className="faq">
                    {items.map((q, j) => (
                      <details key={j}>
                        <summary>{str(q.question)}</summary>
                        <div className="prose">
                          <RichText value={q.answer} dir={dir} internalHref={resolve} />
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )
            case 'featureGrid':
              return (
                <section key={key} id={id} data-block="featureGrid" className="section">
                  {b.heading ? <h2>{str(b.heading)}</h2> : null}
                  <ul className="card-grid">
                    {items.map((it, j) => (
                      <li key={j} className="card">
                        <h3>{str(it.title)}</h3>
                        {it.text ? <p>{str(it.text)}</p> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            case 'stats':
              return (
                <section key={key} id={id} data-block="stats" className="section">
                  {b.heading ? <h2>{str(b.heading)}</h2> : null}
                  <ul className="stats">
                    {items.map((it, j) => (
                      <li key={j}>
                        <span className="stats__value">{str(it.value)}</span>{' '}
                        <span className="stats__label">{str(it.label)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            case 'credentials':
              return (
                <section key={key} id={id} data-block="credentials" className="section">
                  {b.heading ? <h2>{str(b.heading)}</h2> : null}
                  <ul className="card-grid">
                    {items.map((it, j) => {
                      const until = validUntil(it.validUntil, locale)
                      return (
                        <li key={j} className="card">
                          <h3>{str(it.name)}</h3>
                          {it.issuer ? <p>{str(it.issuer)}</p> : null}
                          {until ? (
                            <p className="meta">{t(locale, 'validUntil', { date: until })}</p>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            case 'serviceList':
            case 'courseList': {
              const kind = b.blockType === 'serviceList' ? 'service' : 'course'
              const selected = ((b.services ?? b.courses) as ListItem[] | undefined) ?? []
              const all =
                (kind === 'service' ? ctx?.listings?.services : ctx?.listings?.courses) ?? []
              return (
                <section key={key} id={id} data-block={b.blockType} className="section">
                  {b.heading ? <h2>{str(b.heading)}</h2> : null}
                  <ListingCards
                    items={b.mode === 'all' ? all : selected}
                    kind={kind}
                    locale={locale}
                    headingLevel={b.heading ? 3 : 2}
                  />
                </section>
              )
            }
            case 'contactBlock':
              return (
                <section key={key} id={id} data-block="contactBlock" className="section">
                  <div className="contact-panel">
                    <h2>{str(b.heading)}</h2>
                    {b.intro ? <p>{str(b.intro)}</p> : null}
                  </div>
                </section>
              )
            default:
              return null
          }
        })}
    </>
  )
}

export function DocumentView({
  doc,
  locale,
  ctx,
}: {
  doc: Record<string, unknown>
  locale: Locale
  ctx?: Omit<RenderContext, 'locale'>
}) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  // A home page that opens with a hero shows the hero as its visual title; the page title stays
  // the document's h1 for assistive technology and outline.
  const first = Array.isArray(doc.sections)
    ? (doc.sections as Block[]).find((b) => b && !b.hidden)
    : undefined
  const heroLed = doc.template === 'home' && first?.blockType === 'hero'
  return (
    <article lang={locale} dir={dir}>
      {heroLed ? (
        <h1 className="sr-only">{str(doc.title)}</h1>
      ) : (
        <header className="page-header">
          <h1>{str(doc.title)}</h1>
          {doc.summary ? <p className="lead">{str(doc.summary)}</p> : null}
        </header>
      )}
      <Sections sections={doc.sections} dir={dir} ctx={{ ...ctx, locale }} />
    </article>
  )
}
