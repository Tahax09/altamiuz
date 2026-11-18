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
import { OfficeMap } from '../site/OfficeMap'
import { RichText, type InternalHref } from '../richtext/RichText'
import { CourseFacts } from '../page/CourseFacts'
import { ContactDetails, hasContactDetails } from '../site/ContactDetails'
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
type ListItem = {
  title?: unknown
  slug?: unknown
  summary?: unknown
  _status?: unknown
  image?: unknown
  icon?: unknown
}

export type RenderContext = {
  locale: Locale
  /** Automatic listings (published, non-hidden, editor order) for `mode: all` blocks. */
  listings?: { services?: ListItem[]; courses?: ListItem[] }
  /** The contact form for `contactBlock` sections (public pages only; preview shows none). */
  contactForm?: ReactNode
  /** Empty image slots show a labelled placeholder of the expected size: draft preview, or public
   * pages when MEDIA_PLACEHOLDERS=on (local/test only). Changes nothing else. */
  preview?: boolean
  /** Published site settings (contact details for `contactBlock`). */
  settings?: Record<string, unknown> | null
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

/** Published services or courses as ledger rows (sections and related items): index, title link
 * (the row's accessible name and pointer target), summary, arrow. */
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
    <ol className="listing ledger">
      {visible.map((r, j) => (
        <li key={String(r.slug)} className="ledger__row" data-reveal-item="">
          <span className="ledger__index" aria-hidden="true">
            {pad(j + 1)}
          </span>
          <Heading className="ledger__title">
            <a href={href(kind, locale, { slug: String(r.slug) })}>{str(r.title)}</a>
          </Heading>
          {r.summary ? <p className="ledger__summary">{str(r.summary)}</p> : null}
          <UiIcon name="arrow" className="ledger__arrow" />
        </li>
      ))}
    </ol>
  )
}

/** Published (or public-read) services or courses with a slug. */
function publishedItems(items: ListItem[]): ListItem[] {
  return items.filter(
    (r) =>
      r &&
      typeof r === 'object' &&
      typeof r.slug === 'string' &&
      (r._status === undefined || r._status === 'published'),
  )
}

/** Services or courses as offer cards: optional image (or icon), index, title, summary, arrow.
 * The first card leads when there are three or more. Nothing renders for an empty list. */
export function OfferCards({
  items,
  kind,
  locale,
  headingLevel = 3,
  preview = false,
}: {
  items: ListItem[]
  kind: 'service' | 'course'
  locale: Locale
  headingLevel?: 2 | 3
  preview?: boolean
}) {
  const visible = publishedItems(items)
  if (!visible.length) return null
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <ol className={`listing offers${visible.length > 2 ? ' offers--lead' : ''}`}>
      {visible.map((r, j) => {
        const pic = hasMedia(r.image) || preview
        return (
          <li
            key={String(r.slug)}
            className={`offer${pic ? ' offer--image' : ''}`}
            data-reveal-item=""
          >
            {pic ? (
              <MediaSlot
                media={r.image}
                ratio="classic"
                locale={locale}
                preview={preview}
                className="offer__image"
                sizes="(min-width: 64rem) 40vw, 100vw"
              />
            ) : null}
            <div className="offer__body">
              <p className="offer__meta" aria-hidden="true">
                <span>{pad(j + 1)}</span>
                {!pic ? <Icon name={r.icon} /> : null}
              </p>
              <Heading className="offer__title">
                <a href={href(kind, locale, { slug: String(r.slug) })}>{str(r.title)}</a>
              </Heading>
              {r.summary ? <p className="offer__summary">{str(r.summary)}</p> : null}
              <UiIcon name="arrow" className="offer__arrow" />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** A credential's expiry date, or null when absent or not a valid date. */
function validUntil(v: unknown, locale: Locale): string | null {
  const d = typeof v === 'string' ? new Date(v) : null
  return d && !Number.isNaN(d.getTime()) ? formatDate(locale, d) : null
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Section index in the side rail (decorative: the heading carries the meaning). */
function Rail({ n }: { n: number | null }) {
  return (
    <div className="section__rail" aria-hidden="true">
      {n ? <span className="section__index">{pad(n)}</span> : null}
    </div>
  )
}

/** Image container: rounded frame that reserves the slot and carries the entrance motion. */
function Plate({ className, children }: { className?: string; children: ReactNode }) {
  if (!children) return null
  return (
    <div className={`plate${className ? ` ${className}` : ''}`} data-reveal="plate">
      {children}
    </div>
  )
}

const HEADED = new Set([
  'textMedia',
  'process',
  'standards',
  'resourceList',
  'featureGrid',
  'stats',
  'team',
  'credentials',
  'mediaGallery',
  'serviceList',
  'courseList',
])
const hasHead = (b: Block) =>
  HEADED.has(String(b.blockType)) && !!(b.eyebrow || b.heading || b.intro)

const rows = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : [])

/** Items a block would list; a list block with nothing to list renders nothing at all. */
/** Items shown by an automatic list that also links to its full listing page. */
export const LIST_PREVIEW = 4

const hasLink = (l: unknown) =>
  !!l && typeof l === 'object' && !!((l as { linkType?: unknown }).linkType ?? null)

function listOf(b: Block, ctx?: RenderContext): unknown[] | null {
  switch (b.blockType) {
    case 'process':
      return rows(b.steps)
    case 'team':
      return rows(b.members)
    case 'standards':
    case 'resourceList':
    case 'featureGrid':
    case 'stats':
    case 'credentials':
    case 'faq':
      return rows(b.items)
    case 'mediaGallery':
      return rows(b.items).filter((it) => it.media && typeof it.media === 'object')
    case 'serviceList':
    case 'courseList': {
      const kind = b.blockType === 'serviceList' ? 'services' : 'courses'
      const list = b.mode === 'all' ? (ctx?.listings?.[kind] ?? []) : rows(b[kind])
      const items = publishedItems(list as ListItem[])
      // An automatic list that links to its full listing page is a preview: the first few items
      // (editor order), so a homepage never repeats the whole catalogue.
      return b.mode === 'all' && hasLink(b.moreLink) ? items.slice(0, LIST_PREVIEW) : items
    }
    default:
      return null
  }
}

/** Up to two initials of a name, in its own script (decorative monogram). */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? '')
    .join('\u200c') // zero-width non-joiner: Arabic initials stay separate letters
}

/** A short date for an insight card, or null. */
function shortDate(v: unknown, locale: Locale): { text: string; iso: string } | null {
  const d = typeof v === 'string' ? new Date(v) : null
  return d && !Number.isNaN(d.getTime())
    ? { text: formatDate(locale, d), iso: d.toISOString().slice(0, 10) }
    : null
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
  const visible = (sections as Block[]).filter((b) => {
    if (!b || b.hidden) return false
    const list = listOf(b, ctx)
    return list === null || list.length > 0 // CMS-aware: no empty list sections
  })
  // Running section numbers for the rail (only sections with a header are numbered).
  let counter = 0
  const numbers = visible.map((b) => (hasHead(b) ? ++counter : null))
  return (
    <>
      {visible.map((b, i) => {
        const id = b.anchorId && /^[a-z0-9-]{1,64}$/.test(b.anchorId) ? b.anchorId : undefined
        const items = rows(b.items)
        const key = b.id ?? i
        const n = numbers[i] ?? null
        const shell = (
          kind: string,
          children: ReactNode,
          opts: { surface?: 'raised' | 'stone' | 'ink'; reveal?: string; rail?: boolean } = {},
        ) => (
          <section
            key={key}
            id={id}
            data-block={b.blockType}
            data-reveal={opts.reveal ?? ''}
            className={`section section--${kind}${opts.surface ? ` surface--${opts.surface}` : ''}`}
          >
            {opts.rail === false ? null : <Rail n={n} />}
            <div className="section__main">{children}</div>
          </section>
        )
        switch (b.blockType) {
          case 'hero': {
            const primary = b.primaryCta as Link
            const showSlot = hasMedia(b.media) || !!ctx?.preview
            return (
              <section
                key={key}
                id={id}
                data-block="hero"
                className={`section--hero hero${showSlot ? ' hero--visual' : ''}`}
              >
                <div className="hero__copy">
                  {b.eyebrow ? <p className="eyebrow hero__eyebrow">{str(b.eyebrow)}</p> : null}
                  <h2 className="hero__title">{str(b.heading)}</h2>
                  {b.subheading ? <p className="hero__lead">{str(b.subheading)}</p> : null}
                  {primary?.label || (b.secondaryCta as Link)?.label ? (
                    <div className="actions">
                      <LinkOut
                        link={primary}
                        resolve={resolve}
                        locale={locale}
                        className="button button--arrow"
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
                  <Plate className="hero__visual">
                    <MediaSlot
                      media={b.media}
                      ratio="landscape"
                      locale={locale}
                      preview={ctx?.preview}
                      sizes="(min-width: 64rem) 40vw, 100vw"
                      eager={i === 0}
                    />
                  </Plate>
                ) : null}
                <svg className="hero__field" aria-hidden="true" focusable="false">
                  <defs>
                    <pattern
                      id={`field-${key}`}
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M40 0H0V40" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#field-${key})`} />
                </svg>
              </section>
            )
          }
          case 'cta': {
            const link = b.link as Link
            return (
              <section
                key={key}
                id={id}
                data-block="cta"
                data-reveal=""
                className="section section--cta"
              >
                <div className="cta__panel" data-reveal-item="">
                  <h2 className="cta__title">{str(b.heading)}</h2>
                  {b.text ? <p className="cta__text">{str(b.text)}</p> : null}
                  {link?.label ? (
                    <div className="actions">
                      <LinkOut
                        link={link}
                        resolve={resolve}
                        locale={locale}
                        className="button button--inverse button--arrow"
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            )
          }
          case 'textMedia': {
            const loc = b.location as
              | { latitude?: number | null; longitude?: number | null; zoom?: number | null }
              | undefined
            const hasMap = typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number'
            const showSlot = hasMedia(b.media) || !!ctx?.preview || hasMap
            const start = b.mediaPosition === 'start'
            return shell(
              `text-media${showSlot ? ' section--split' : ''}${start ? ' section--media-start' : ''}`,
              <>
                <div className="split__text" data-reveal="">
                  {b.eyebrow ? <p className="eyebrow">{str(b.eyebrow)}</p> : null}
                  <h2>{str(b.heading)}</h2>
                  <div className="prose prose--lead">
                    <RichText value={b.body} dir={dir} internalHref={resolve} />
                  </div>
                  <More link={b.link} resolve={resolve} locale={locale} />
                </div>
                {hasMap ? (
                  <div className="split__visual split__visual--map">
                    <OfficeMap
                      latitude={loc!.latitude!}
                      longitude={loc!.longitude!}
                      zoom={loc?.zoom ?? 15}
                      label={str(b.heading)}
                      openLabel={t(locale, 'mapOpen')}
                      loadingLabel={t(locale, 'mapLoading')}
                      failedLabel={t(locale, 'mapFailed')}
                    >
                      {hasMedia(b.media) ? (
                        <MediaSlot
                          media={b.media}
                          ratio="landscape"
                          locale={locale}
                          className="media--split"
                          sizes="(min-width: 64rem) 40vw, 100vw"
                        />
                      ) : null}
                    </OfficeMap>
                  </div>
                ) : showSlot ? (
                  <Plate className="split__visual">
                    <MediaSlot
                      media={b.media}
                      ratio="landscape"
                      locale={locale}
                      preview={ctx?.preview}
                      className="media--split"
                      sizes="(min-width: 64rem) 40vw, 100vw"
                    />
                  </Plate>
                ) : null}
              </>,
              { reveal: 'none' },
            )
          }
          case 'process': {
            const steps = rows(b.steps)
            const hasVisual = hasMedia(b.media) || !!ctx?.preview
            return shell(
              'process',
              <>
                <SectionHead b={b} />
                {hasVisual ? (
                  <Plate className="process__visual">
                    <MediaSlot
                      media={b.media}
                      ratio="natural"
                      locale={locale}
                      preview={ctx?.preview}
                      className="media--process"
                      sizes="(min-width: 72rem) 60rem, 100vw"
                    />
                  </Plate>
                ) : null}
                <div className="process__track" data-reveal="inline">
                  <span className="process__line" data-draw="" aria-hidden="true" />
                  <ol className="process">
                    {steps.map((s, j) => (
                      <li
                        key={(s.id as string | undefined) ?? j}
                        className="process__step"
                        data-reveal-item=""
                      >
                        <span className="process__index" aria-hidden="true">
                          {pad(j + 1)}
                        </span>
                        {b.heading ? <h3>{str(s.title)}</h3> : <h2>{str(s.title)}</h2>}
                        {s.text ? <p>{str(s.text)}</p> : null}
                        <span className="process__count" aria-hidden="true">
                          {pad(j + 1)}/{pad(steps.length)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>,
              { surface: 'ink', reveal: 'none' },
            )
          }
          case 'standards':
            return shell(
              'standards',
              <>
                <SectionHead b={b} />
                <ul className="register">
                  {items.map((it, j) => (
                    <li
                      key={(it.id as string | undefined) ?? j}
                      className="register__row"
                      data-reveal-item=""
                    >
                      <span className="register__index" aria-hidden="true">
                        {pad(j + 1)}
                      </span>
                      {b.heading ? (
                        <h3 className="register__name">{str(it.name)}</h3>
                      ) : (
                        <h2 className="register__name">{str(it.name)}</h2>
                      )}
                      {it.text ? <p className="register__text">{str(it.text)}</p> : null}
                      <Picture
                        media={it.logo}
                        crop={false}
                        className="media--logo register__logo"
                        sizes="8rem"
                      />
                    </li>
                  ))}
                </ul>
              </>,
            )
          case 'resourceList':
            return shell(
              'resources',
              <>
                <SectionHead b={b} />
                <ul className={`articles${items.length > 2 ? ' articles--lead' : ''}`}>
                  {items.map((it, j) => {
                    const Heading = b.heading ? 'h3' : 'h2'
                    const link = it.link as Link
                    const date = shortDate(it.date, locale)
                    const pic = hasMedia(it.image) || !!ctx?.preview
                    return (
                      <li
                        key={(it.id as string | undefined) ?? j}
                        className={`article${link?.linkType ? ' article--link' : ''}${pic ? ' article--image' : ''}`}
                        data-reveal-item=""
                      >
                        {pic ? (
                          <MediaSlot
                            media={it.image}
                            ratio="classic"
                            locale={locale}
                            preview={ctx?.preview}
                            className="article__image"
                            sizes="(min-width: 64rem) 40vw, 100vw"
                          />
                        ) : null}
                        <div className="article__body">
                          {it.kind || date ? (
                            <p className="article__meta">
                              {it.kind ? <span className="badge">{str(it.kind)}</span> : null}
                              {date ? <time dateTime={date.iso}>{date.text}</time> : null}
                            </p>
                          ) : null}
                          <Heading className="article__title">
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
                          {it.summary ? (
                            <p className="article__summary">{str(it.summary)}</p>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <More link={b.moreLink} resolve={resolve} locale={locale} />
              </>,
            )
          case 'richText':
            return (
              <section key={key} id={id} data-block="richText" className="section section--prose">
                <Rail n={null} />
                <div className="section__main prose">
                  <RichText value={b.content} dir={dir} internalHref={resolve} />
                </div>
              </section>
            )
          case 'faq':
            return shell(
              'faq',
              <div className="faq">
                {items.map((q, j) => (
                  <details key={j} className="faq__item">
                    <summary>
                      <span>{str(q.question)}</span>
                      <span className="faq__icon" aria-hidden="true" />
                    </summary>
                    <div className="prose">
                      <RichText value={q.answer} dir={dir} internalHref={resolve} />
                    </div>
                  </details>
                ))}
              </div>,
            )
          case 'featureGrid':
            return shell(
              'principles',
              <div className="principles">
                <SectionHead b={b} />
                <ul className="principles__list">
                  {items.map((it, j) => (
                    <li key={j} className="principles__item" data-reveal-item="">
                      <span className="principles__index" aria-hidden="true">
                        {pad(j + 1)}
                      </span>
                      <Icon name={it.icon} />
                      <h3>{str(it.title)}</h3>
                      {it.text ? <p>{str(it.text)}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>,
            )
          case 'stats':
            return (
              <section
                key={key}
                id={id}
                data-block="stats"
                data-reveal=""
                className="section stats-band"
              >
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
          case 'team': {
            const members = rows(b.members)
            const Heading = b.heading ? 'h3' : 'h2'
            return shell(
              'team',
              <>
                <SectionHead b={b} />
                <ul className="team">
                  {members.map((m, j) => {
                    const photo = hasMedia(m.photo) || !!ctx?.preview
                    return (
                      <li
                        key={(m.id as string | undefined) ?? j}
                        className="team__member"
                        data-reveal-item=""
                      >
                        {photo ? (
                          <MediaSlot
                            media={m.photo}
                            ratio="portrait"
                            locale={locale}
                            preview={ctx?.preview}
                            className="team__photo"
                            sizes="(min-width: 64rem) 22vw, (min-width: 40rem) 45vw, 100vw"
                          />
                        ) : (
                          // No photo (or no consent): the person's initials in the same frame,
                          // so the row stays aligned without an empty image box.
                          <span className="team__monogram" aria-hidden="true">
                            {initials(str(m.name))}
                          </span>
                        )}
                        <Heading className="team__name">{str(m.name)}</Heading>
                        {m.role ? <p className="team__role">{str(m.role)}</p> : null}
                        {m.bio ? <p className="team__bio">{str(m.bio)}</p> : null}
                      </li>
                    )
                  })}
                </ul>
              </>,
            )
          }
          case 'credentials':
            if (b.display === 'logos')
              return (
                <section
                  key={key}
                  id={id}
                  data-block="credentials"
                  data-reveal=""
                  className="section trust"
                >
                  {b.eyebrow || b.heading ? (
                    <div className="trust__head">
                      {b.eyebrow ? <p className="trust__label">{str(b.eyebrow)}</p> : null}
                      {b.heading ? <h2 className="trust__title">{str(b.heading)}</h2> : null}
                    </div>
                  ) : null}
                  <ul className="logo-wall">
                    {items.map((it, j) => (
                      <li key={(it.id as string | undefined) ?? j} data-reveal-item="">
                        <Picture
                          media={it.logo}
                          crop={false}
                          fallback="webp"
                          className="media--logo"
                          sizes="10rem"
                        />
                        <span className="logo-wall__name">{str(it.name)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            return shell(
              'credentials',
              <>
                <SectionHead b={b} />
                <ul className="register">
                  {items.map((it, j) => {
                    const until = validUntil(it.validUntil, locale)
                    return (
                      <li key={j} className="register__row">
                        <span className="register__index" aria-hidden="true">
                          {pad(j + 1)}
                        </span>
                        <h3 className="register__name">{str(it.name)}</h3>
                        <p className="register__text">
                          {it.issuer ? str(it.issuer) : null}
                          {until ? (
                            <span className="meta">
                              {' '}
                              {t(locale, 'validUntil', { date: until })}
                            </span>
                          ) : null}
                        </p>
                        <Picture
                          media={it.logo}
                          crop={false}
                          fallback="webp"
                          className="media--logo register__logo"
                          sizes="10rem"
                        />
                      </li>
                    )
                  })}
                </ul>
              </>,
            )
          case 'mediaGallery':
            return shell(
              'gallery',
              <>
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
              </>,
            )
          case 'serviceList':
          case 'courseList': {
            const kind = b.blockType === 'serviceList' ? 'service' : 'course'
            return shell(
              'offer',
              <>
                <SectionHead b={b} />
                <OfferCards
                  items={(listOf(b, ctx) ?? []) as ListItem[]}
                  kind={kind}
                  locale={locale}
                  headingLevel={b.heading ? 3 : 2}
                  preview={!!ctx?.preview}
                />
                <More link={b.moreLink} resolve={resolve} locale={locale} />
              </>,
              { surface: 'raised' },
            )
          }
          case 'contactBlock': {
            const details = hasContactDetails(ctx?.settings)
            return (
              <section key={key} id={id} data-block="contactBlock" className="section contact">
                <div className="contact-panel">
                  <h2>{str(b.heading)}</h2>
                  {b.intro ? <p className="contact-panel__intro">{str(b.intro)}</p> : null}
                  {details ? (
                    <ContactDetails
                      settings={ctx?.settings}
                      locale={locale}
                      className="contact-panel__details"
                      iconClassName="contact-panel__icon"
                    />
                  ) : null}
                </div>
                <div className="contact__form">{ctx?.contactForm ?? null}</div>
              </section>
            )
          }
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
