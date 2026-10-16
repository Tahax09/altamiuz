// Section renderer shared by preview and (US1) the public site. Semantic markup only; styling and
// visual design arrive with US1 (D-24). Hidden sections never render. Links go through safeHref.
import { safeHref } from '@/modules/content'
import { RichText } from '../richtext/RichText'

type Link =
  | {
      linkType?: string
      url?: string
      email?: string
      tel?: string
      label?: string
      newTab?: boolean
    }
  | undefined
type Block = Record<string, unknown> & {
  blockType?: string
  hidden?: boolean
  anchorId?: string
  id?: string
}

function LinkOut({ link }: { link: Link }) {
  if (!link?.label) return null
  const href =
    link.linkType === 'external'
      ? safeHref(link.url)
      : link.linkType === 'email'
        ? safeHref(`mailto:${link.email}`)
        : link.linkType === 'tel'
          ? safeHref(`tel:${link.tel}`)
          : null
  if (!href) return <span>{link.label}</span>
  const newTab = link.newTab === true && /^https?:/.test(href)
  return (
    <a href={href} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {link.label}
    </a>
  )
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export function Sections({ sections, dir }: { sections: unknown; dir: 'rtl' | 'ltr' }) {
  if (!Array.isArray(sections)) return null
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
                  <LinkOut link={(b.primaryCta ?? b.link) as Link} />
                  <LinkOut link={b.secondaryCta as Link} />
                </section>
              )
            case 'richText':
              return (
                <section key={b.id ?? i} id={id} data-block="richText">
                  <RichText value={b.content} dir={dir} />
                </section>
              )
            case 'faq':
              return (
                <section key={b.id ?? i} id={id} data-block="faq">
                  {items.map((q, j) => (
                    <details key={j}>
                      <summary>{str(q.question)}</summary>
                      <RichText value={q.answer} dir={dir} />
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
              const refs = (b.services ?? b.courses) as { title?: string }[] | undefined
              return (
                <section key={b.id ?? i} id={id} data-block={b.blockType}>
                  {b.heading ? <h2>{str(b.heading)}</h2> : null}
                  <ul>
                    {(refs ?? [])
                      .filter((r) => typeof r === 'object' && r)
                      .map((r, j) => (
                        <li key={j}>{str(r.title)}</li>
                      ))}
                  </ul>
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
}: {
  doc: Record<string, unknown>
  locale: 'ar' | 'en'
}) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  return (
    <article lang={locale} dir={dir}>
      <h1>{str(doc.title)}</h1>
      {doc.summary ? <p>{str(doc.summary)}</p> : null}
      <Sections sections={doc.sections} dir={dir} />
    </article>
  )
}
