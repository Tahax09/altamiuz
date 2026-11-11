// Listing rows for services and courses (FR-018, W-1): numbered rows with the title link as the
// accessible name and the whole row as the pointer target. Order is the editors' order.
import { href, type Locale } from '@/modules/i18n'
import { Icon } from '../primitives/Icon'

type Item = { title?: unknown; slug?: unknown; summary?: unknown; _status?: unknown }

export function ListingIndex({
  items,
  kind,
  locale,
  headingLevel = 2,
}: {
  items: Item[]
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
  const H = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <ol className="listing listing-index" data-reveal="">
      {visible.map((r, i) => (
        <li key={String(r.slug)} className="listing-index__row" data-reveal-item="">
          <span className="listing-index__num" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="listing-index__text">
            <H className="listing-index__title">
              <a href={href(kind, locale, { slug: String(r.slug) })}>{String(r.title ?? '')}</a>
            </H>
            {typeof r.summary === 'string' && r.summary ? (
              <p className="listing-index__summary">{r.summary}</p>
            ) : null}
          </div>
          <Icon name="arrow" className="listing-index__arrow" />
        </li>
      ))}
    </ol>
  )
}
