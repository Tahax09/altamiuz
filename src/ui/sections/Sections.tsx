// Section renderer shared by preview and the public site (T083/T102, FR-013d, FR-014, FR-018).
// Semantic markup with the design-system classes of src/app/(site)/site.css. Hidden sections
// never render; every link goes through safeHref or the typed route map. Internal links resolve
// only to published targets, so preview and public produce the same markup for the same document.
import type { ReactNode } from 'react'
import { formatDate, href, t, type Locale } from '@/modules/i18n'
import { linkTarget, newTabProps, type CmsLink } from '../lib/links'
import { Picture } from '../media/Picture'
import { Icon as UiIcon } from '../primitives/Icon'
import { hasMedia, MediaSlot } from '../primitives/MediaSlot'
import { RichText, type InternalHref } from '../richtext/RichText'
import { CourseFacts } from '../page/CourseFacts'
import { legalOutline, LegalToc } from '../page/LegalToc'
import { PageHeader } from '../page/PageHeader'
import type { Crumb } from '../primitives/Breadcrumbs'

type Link = CmsLink | undefined
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
  /** Draft preview: empty image slots show a labelled placeholder of the expected size. */
  preview?: boolean
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
  locale,
  className,
}: {
  link: Link
  resolve: InternalHref
  locale: Locale
  className?: string
}) {
  if (!link?.label) return null
  const target = linkTarget(link, locale, resolve)
  if (!target) return <span>{link.label}</span>
  return (
    <a href={target} className={className} {...newTabProps(link, target)}>
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

function More({ link, resolve, locale }: { link: unknown; resolve: InternalHref; locale: Locale }) {
  if (!(link as Link)?.label) return null
  return (
    <p className="section__more">
      <LinkOut link={link as Link} resolve={resolve} locale={locale} className="text-link" />
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
        <li key={String(r.slug)} className="card card--link" data-reveal-item="">
          <Heading>
            <a href={href(kind, locale, { slug: String(r.slug) })}>{str(r.title)}</a>
          </Heading>
          {r.summary ? <p>{str(r.summary)}</p> : null}
          <UiIcon name="arrow" className="card__arrow" />
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
              const hero = b.blockType === 'hero'
              const media = hero ? b.media : undefined
              const showSlot = hero && (hasMedia(media) || !!ctx?.preview)
              return (
                <section
                  key={key}
                  id={id}
                  data-block={b.blockType}
                  data-reveal={i === 0 ? undefined : ''}
                  className={`section section--${b.blockType}${showSlot ? ' section--split' : ''}`}
                >
                  <div className="split__text">
                    {b.eyebrow ? <p className="eyebrow">{str(b.eyebrow)}</p> : null}
                    <h2>{str(b.heading)}</h2>
                    {b.subheading || b.text ? <p>{str(b.subheading ?? b.text)}</p> : null}
                    {primary?.label || (b.secondaryCta as Link)?.label ? (
                      <div className="actions">
                        <LinkOut
                          link={primary}
                          resolve={resolve}
                          locale={locale}
                          className="button"
                        />
                        <LinkOut
                          link={b.secondaryCta as Link}
                          resolve={resolve}
                          locale={locale}
                          className="button button--secondary"
                        />
                      </div>
                    ) : null}
                  </div>
                  {showSlot ? (
                    <MediaSlot
                      media={media}
                      ratio="landscape"
                      locale={locale}
                      preview={ctx?.preview}
                      className="media--hero"
                      sizes="(min-width: 64rem) 45vw, 100vw"
                      eager={i === 0}
                    />
                  ) : null}
                </section>
              )
            }
            case 'textMedia': {
              const showSlot = hasMedia(b.media) || !!ctx?.preview
              const cls = showSlot
                ? ` section--split${b.mediaPosition === 'start' ? ' section--media-start' : ''}`
                : ''
              return (
                <section
                  key={key}
                  id={id}
                  data-block="textMedia"
                  data-reveal=""
                  className={`section section--text-media${cls}`}
                >
                  <div className="split__text">
                    {b.eyebrow ? <p className="eyebrow">{str(b.eyebrow)}</p> : null}
                    <h2>{str(b.heading)}</h2>
                    <div className="prose">
                      <RichText value={b.body} dir={dir} internalHref={resolve} />
                    </div>
                    <More link={b.link} resolve={resolve} locale={locale} />
                  </div>
                  {showSlot ? (
                    <MediaSlot
                      media={b.media}
                      ratio="landscape"
                      locale={locale}
                      preview={ctx?.preview}
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
                <section
                  key={key}
                  id={id}
                  data-block="process"
                  data-reveal="inline"
                  className="section section--band"
                >
                  <SectionHead b={b} />
                  <MediaSlot
                    media={b.media}
                    ratio="natural"
                    locale={locale}
                    preview={ctx?.preview}
                    className="media--process"
                    sizes="(min-width: 72rem) 72rem, 100vw"
                  />
                  <ol className="process">
                    {steps.map((s, j) => (
                      <li
                        key={(s.id as string | undefined) ?? j}
                        className="process__step"
                        data-reveal-item=""
                      >
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
                <section
                  key={key}
                  id={id}
                  data-block="standards"
                  data-reveal=""
                  className="section"
                >
                  <SectionHead b={b} />
                  <ul className="standards">
                    {items.map((it, j) => (
                      <li key={(it.id as string | undefined) ?? j} data-reveal-item="">
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
                <section
                  key={key}
                  id={id}
                  data-block="resourceList"
                  data-reveal=""
                  className="section"
                >
                  <SectionHead b={b} />
                  <ul className="card-grid">
                    {items.map((it, j) => {
                      const Heading = b.heading ? 'h3' : 'h2'
                      const link = it.link as Link
                      return (
                        <li
                          key={(it.id as string | undefined) ?? j}
                          className={link?.linkType ? 'card card--link' : 'card'}
                          data-reveal-item=""
                        >
                          {it.kind ? <p className="eyebrow">{str(it.kind)}</p> : null}
                          <Heading>
                            {link?.linkType ? (
                              <LinkOut
                                link={{ ...link, label: str(it.title) }}
                                resolve={resolve}
                                locale={locale}
                              />
                            ) : (
                              str(it.title)
                            )}
                          </Heading>
                          {it.summary ? <p>{str(it.summary)}</p> : null}
                        </li>
                      )
                    })}
                  </ul>
                  <More link={b.moreLink} resolve={resolve} locale={locale} />
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
                <section key={key} id={id} data-block="faq" data-reveal="" className="section">
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
                <section
                  key={key}
                  id={id}
                  data-block="featureGrid"
                  data-reveal=""
                  className="section"
                >
                  <SectionHead b={b} />
                  <ul className="card-grid">
                    {items.map((it, j) => (
                      <li key={j} className="card" data-reveal-item="">
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
                <section key={key} id={id} data-block="stats" data-reveal="" className="section">
                  <SectionHead b={b} />
                  <ul className="stats">
                    {items.map((it, j) => (
                      <li key={j} data-reveal-item="">
                        <span className="stats__value">{str(it.value)}</span>{' '}
                        <span className="stats__label">{str(it.label)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            case 'credentials':
              return (
                <section
                  key={key}
                  id={id}
                  data-block="credentials"
                  data-reveal=""
                  className="section"
                >
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
                <section
                  key={key}
                  id={id}
                  data-block="mediaGallery"
                  data-reveal=""
                  className="section"
                >
                  <SectionHead b={b} />
                  <ul className="gallery">
                    {items.map((it, j) =>
                      it.media && typeof it.media === 'object' ? (
                        <li key={(it.id as string | undefined) ?? j} data-reveal-item="">
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
                  data-reveal=""
                  className={`section${kind === 'service' ? ' section--band' : ''}`}
                >
                  <SectionHead b={b} />
                  <ListingCards
                    items={b.mode === 'all' ? all : selected}
                    kind={kind}
                    locale={locale}
                    headingLevel={b.heading ? 3 : 2}
                  />
                  <More link={b.moreLink} resolve={resolve} locale={locale} />
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

/** Crumbs for a document: Home › listing (services, courses) › the document. */
export function documentCrumbs(
  collection: 'pages' | 'services' | 'courses',
  locale: Locale,
  title: string,
): Crumb[] {
  const crumbs: Crumb[] = [{ label: t(locale, 'home'), href: href('home', locale) }]
  if (collection === 'services')
    crumbs.push({ label: t(locale, 'services'), href: href('services', locale) })
  if (collection === 'courses')
    crumbs.push({ label: t(locale, 'training'), href: href('training', locale) })
  crumbs.push({ label: title })
  return crumbs
}

export function DocumentView({
  doc,
  locale,
  ctx,
  collection = 'pages',
  after,
}: {
  doc: Record<string, unknown>
  locale: Locale
  ctx?: Omit<RenderContext, 'locale'>
  collection?: 'pages' | 'services' | 'courses'
  /** Public-only additions after the sections (related items, closing call to action). */
  after?: ReactNode
}) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const title = str(doc.title)
  const template = str(doc.template)
  // A home page that opens with a hero shows the hero as its visual title; the page title stays
  // the document's h1 for assistive technology and outline.
  const first = Array.isArray(doc.sections)
    ? (doc.sections as Block[]).find((b) => b && !b.hidden)
    : undefined
  const heroLed = template === 'home' && first?.blockType === 'hero'
  const renderCtx = { ...ctx, locale }
  if (heroLed)
    return (
      <article lang={locale} dir={dir} data-template="home">
        <h1 className="sr-only">{title}</h1>
        <Sections sections={doc.sections} dir={dir} ctx={renderCtx} />
        {after}
      </article>
    )
  const crumbs = template === 'home' ? [] : documentCrumbs(collection, locale, title)
  const lead = str(doc.summary) || undefined
  if (template === 'legal') {
    const { sections, outline } = legalOutline(doc.sections)
    return (
      <article lang={locale} dir={dir} data-template="legal">
        <PageHeader locale={locale} crumbs={crumbs} title={title} lead={lead} tone="plain" />
        <div className="legal-layout">
          {outline.length > 1 ? <LegalToc locale={locale} outline={outline} /> : null}
          <div className="legal-body">
            <Sections sections={sections} dir={dir} ctx={renderCtx} />
          </div>
        </div>
        {after}
      </article>
    )
  }
  return (
    <article lang={locale} dir={dir} data-template={template || undefined}>
      <PageHeader locale={locale} crumbs={crumbs} title={title} lead={lead}>
        {collection === 'courses' ? <CourseFacts doc={doc} locale={locale} /> : null}
      </PageHeader>
      <Sections sections={doc.sections} dir={dir} ctx={renderCtx} />
      {after}
    </article>
  )
}
