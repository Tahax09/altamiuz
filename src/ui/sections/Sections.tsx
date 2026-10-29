// Section renderer shared by preview and the public site (T083/T102, FR-013d, FR-014, FR-018).
// Semantic markup only. Hidden sections never render; every link goes through safeHref or the
// typed route map. Internal links resolve only to published targets, so preview and public
// produce the same markup for the same document.
import { safeHref } from '@/modules/content'
import { href, type Locale } from '@/modules/i18n'
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

function LinkOut({ link, resolve }: { link: Link; resolve: InternalHref }) {
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
    <a href={target} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {link.label}
    </a>
  )
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

function Listing({
  items,
  kind,
  locale,
}: {
  items: ListItem[]
  kind: 'service' | 'course'
  locale: Locale
}) {
  const visible = items.filter(
    (r) =>
      r &&
      typeof r === 'object' &&
      typeof r.slug === 'string' &&
      (r._status === undefined || r._status === 'published'),
  )
  if (!visible.length) return null
  return (
    <ul className="listing">
      {visible.map((r) => (
        <li key={String(r.slug)}>
          <a href={href(kind, locale, { slug: String(r.slug) })}>{str(r.title)}</a>
          {r.summary ? <p>{str(r.summary)}</p> : null}
        </li>
      ))}
    </ul>
  )
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
          switch (b.blockType) {
            case 'hero':
            case 'cta':
              return (
                <section key={b.id ?? i} id={id} data-block={b.blockType}>
                  <h2>{str(b.heading)}</h2>
                  {b.subheading || b.text ? <p>{str(b.subheading ?? b.text)}</p> : null}
                  <LinkOut link={(b.primaryCta ?? b.link) as Link} resolve={resolve} />
                  <LinkOut link={b.secondaryCta as Link} resolve={resolve} />
                </section>
              )
            case 'richText':
              return (
                <section key={b.id ?? i} id={id} data-block="richText">
                  <RichText value={b.content} dir={dir} internalHref={resolve} />
                </section>
              )
            case 'faq':
              return (
                <section key={b.id ?? i} id={id} data-block="faq">
                  {items.map((q, j) => (
                    <details key={j}>
                      <summary>{str(q.question)}</summary>
                      <RichText value={q.answer} dir={dir} internalHref={resolve} />
                    </details>
                  ))}
                </section>
              )
            case 'featureGrid':
            case 'stats':
            case 'credentials':
              return (
                <section key={b.id ?? i} id={id} data-block={b.blockType}>
                  {b.heading ? <h2>{str(b.heading)}</h2> : null}
                  <ul>
                    {items.map((it, j) => (
                      <li key={j}>
                        {[
                          str(it.title ?? it.name ?? it.value),
                          str(it.text ?? it.label ?? it.issuer),
                        ]
                          .filter(Boolean)
                          .join(' — ')}
                      </li>
                    ))}
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
                <section key={b.id ?? i} id={id} data-block={b.blockType}>
                  {b.heading ? <h2>{str(b.heading)}</h2> : null}
                  <Listing items={b.mode === 'all' ? all : selected} kind={kind} locale={locale} />
                </section>
              )
            }
            case 'contactBlock':
              return (
                <section key={b.id ?? i} id={id} data-block="contactBlock">
                  <h2>{str(b.heading)}</h2>
                  <p>{str(b.intro)}</p>
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
  return (
    <article lang={locale} dir={dir}>
      <h1>{str(doc.title)}</h1>
      {doc.summary ? <p>{str(doc.summary)}</p> : null}
      <Sections sections={doc.sections} dir={dir} ctx={{ ...ctx, locale }} />
    </article>
  )
}
