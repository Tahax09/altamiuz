// Section renderer shared by preview and the public site (T083/T102, FR-013d, FR-014, FR-018).
// Semantic markup with the design-system classes of src/app/(site)/site.css. Hidden sections
// never render; every link goes through safeHref or the typed route map. Internal links resolve
// only to published targets, so preview and public produce the same markup for the same document.
import type { ReactNode } from 'react'
import { safeHref } from '@/modules/content'
import { formatDate, href, t, type Locale } from '@/modules/i18n'
import { Picture } from '../media/Picture'
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
  /** The contact form for `contactBlock` sections (public pages only; preview shows none). */
  contactForm?: ReactNode
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

/** Optional section header (eyebrow, heading, intro); renders nothing when all are empty. */
function SectionHead({ b }: { b: Block }) {
  if (!b.eyebrow && !b.heading && !b.intro) return null
  return (
    <div className="section__head">
      {b.eyebrow ? <p className="eyebrow">{str(b.eyebrow)}</p> : null}
      {b.heading ? <h2>{str(b.heading)}</h2> : null}
      {b.intro ? <p className="section__intro">{str(b.intro)}</p> : null}
    </div>
  )
}

function More({ link, resolve }: { link: unknown; resolve: InternalHref }) {
  if (!(link as Link)?.label) return null
  return (
    <p className="section__more">
      <LinkOut link={link as Link} resolve={resolve} className="text-link" />
    </p>
  )
}

/** Line icons for feature items (decorative; the item title carries the meaning). */
const ICON_PATHS: Record<string, string> = {
  shield: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z M9 12l2 2 4-4',
  audit: 'M9 4h6v3H9z M7 5H5v16h14V5h-2 M8 12h8 M8 16h5',
  policy: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7',
  training: 'M3 8l9-4 9 4-9 4-9-4z M7 10v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5',
  risk: 'M12 4l9 16H3L12 4z M12 10v4 M12 17v.5',
  response: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M12 7v5l3 2',
}
function Icon({ name }: { name: unknown }) {
  const d = typeof name === 'string' ? ICON_PATHS[name] : undefined
  if (!d) return null
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}

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
              const hasMedia = b.blockType === 'hero' && !!b.media && typeof b.media === 'object'
              return (
                <section
                  key={key}
                  id={id}
                  data-block={b.blockType}
                  className={`section section--${b.blockType}${hasMedia ? ' section--split' : ''}`}
                >
                  <div className="split__text">
                    {b.eyebrow ? <p className="eyebrow">{str(b.eyebrow)}</p> : null}
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
                  </div>
                  {hasMedia ? (
                    <Picture
                      media={b.media}
                      className="media--hero"
                      sizes="(min-width: 64rem) 45vw, 100vw"
                      eager={i === 0}
                    />
                  ) : null}
                </section>
              )
            }
            case 'textMedia': {
              const hasMedia = !!b.media && typeof b.media === 'object'
              const cls = hasMedia
                ? ` section--split${b.mediaPosition === 'start' ? ' section--media-start' : ''}`
                : ''
              return (
                <section
                  key={key}
                  id={id}
                  data-block="textMedia"
                  className={`section section--text-media${cls}`}
                >
                  <div className="split__text">
                    {b.eyebrow ? <p className="eyebrow">{str(b.eyebrow)}</p> : null}
                    <h2>{str(b.heading)}</h2>
                    <div className="prose">
                      <RichText value={b.body} dir={dir} internalHref={resolve} />
                    </div>
                    <More link={b.link} resolve={resolve} />
                  </div>
                  {hasMedia ? (
                    <Picture
                      media={b.media}
                      className="media--split"
                      sizes="(min-width: 64rem) 40vw, 100vw"
                    />
                  ) : null}
                </section>
              )
            }
            case 'process': {
              const steps = Array.isArray(b.steps) ? (b.steps as Record<string, unknown>[]) : []
              return (
                <section key={key} id={id} data-block="process" className="section section--band">
                  <SectionHead b={b} />
                  {b.media && typeof b.media === 'object' ? (
                    <Picture
                      media={b.media}
                      className="media--process"
                      sizes="(min-width: 72rem) 72rem, 100vw"
                    />
                  ) : null}
                  <ol className="process">
                    {steps.map((s, j) => (
                      <li key={(s.id as string | undefined) ?? j} className="process__step">
                        <span className="process__index" aria-hidden="true">
                          {String(j + 1).padStart(2, '0')}
                        </span>
                        {b.heading ? <h3>{str(s.title)}</h3> : <h2>{str(s.title)}</h2>}
                        {s.text ? <p>{str(s.text)}</p> : null}
                      </li>
                    ))}
                  </ol>
                </section>
              )
            }
            case 'standards':
              return (
                <section key={key} id={id} data-block="standards" className="section">
                  <SectionHead b={b} />
                  <ul className="standards">
                    {items.map((it, j) => (
                      <li key={(it.id as string | undefined) ?? j}>
                        <Picture
                          media={it.logo}
                          crop={false}
                          className="media--logo"
                          sizes="8rem"
                        />
                        {b.heading ? <h3>{str(it.name)}</h3> : <h2>{str(it.name)}</h2>}
                        {it.text ? <p>{str(it.text)}</p> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            case 'resourceList':
              return (
                <section key={key} id={id} data-block="resourceList" className="section">
                  <SectionHead b={b} />
                  <ul className="card-grid">
                    {items.map((it, j) => {
                      const Heading = b.heading ? 'h3' : 'h2'
                      const link = it.link as Link
                      return (
                        <li
                          key={(it.id as string | undefined) ?? j}
                          className={link?.linkType ? 'card card--link' : 'card'}
                        >
                          {it.kind ? <p className="eyebrow">{str(it.kind)}</p> : null}
                          <Heading>
                            {link?.linkType ? (
                              <LinkOut link={{ ...link, label: str(it.title) }} resolve={resolve} />
                            ) : (
                              str(it.title)
                            )}
                          </Heading>
                          {it.summary ? <p>{str(it.summary)}</p> : null}
                        </li>
                      )
                    })}
                  </ul>
                  <More link={b.moreLink} resolve={resolve} />
                </section>
              )
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
                  <SectionHead b={b} />
                  <ul className="card-grid">
                    {items.map((it, j) => (
                      <li key={j} className="card">
                        <Icon name={it.icon} />
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
                  <SectionHead b={b} />
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
                  <SectionHead b={b} />
                  {b.display === 'logos' ? (
                    <ul className="logo-wall">
                      {items.map((it, j) => (
                        <li key={(it.id as string | undefined) ?? j}>
                          <Picture
                            media={it.logo}
                            crop={false}
                            className="media--logo"
                            sizes="10rem"
                          />
                          <span className="logo-wall__name">{str(it.name)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="card-grid">
                      {items.map((it, j) => {
                        const until = validUntil(it.validUntil, locale)
                        return (
                          <li key={j} className="card">
                            <Picture
                              media={it.logo}
                              crop={false}
                              className="media--logo"
                              sizes="10rem"
                            />
                            <h3>{str(it.name)}</h3>
                            {it.issuer ? <p>{str(it.issuer)}</p> : null}
                            {until ? (
                              <p className="meta">{t(locale, 'validUntil', { date: until })}</p>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )
            case 'mediaGallery':
              return (
                <section key={key} id={id} data-block="mediaGallery" className="section">
                  <SectionHead b={b} />
                  <ul className="gallery">
                    {items.map((it, j) =>
                      it.media && typeof it.media === 'object' ? (
                        <li key={(it.id as string | undefined) ?? j}>
                          <figure>
                            <Picture
                              media={it.media}
                              className="media--gallery"
                              sizes="(min-width: 48rem) 33vw, 100vw"
                            />
                            {it.caption ? <figcaption>{str(it.caption)}</figcaption> : null}
                          </figure>
                        </li>
                      ) : null,
                    )}
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
                <section
                  key={key}
                  id={id}
                  data-block={b.blockType}
                  className={`section${kind === 'service' ? ' section--band' : ''}`}
                >
                  <SectionHead b={b} />
                  <ListingCards
                    items={b.mode === 'all' ? all : selected}
                    kind={kind}
                    locale={locale}
                    headingLevel={b.heading ? 3 : 2}
                  />
                  <More link={b.moreLink} resolve={resolve} />
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
                  {ctx?.contactForm ?? null}
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
    <article lang={locale} dir={dir} data-template={str(doc.template) || undefined}>
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
