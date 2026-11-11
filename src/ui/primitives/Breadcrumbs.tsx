// Breadcrumbs (shadcn/ui Breadcrumb structure, ADR-011; WCAG 2.4.8). The trail mirrors the
// BreadcrumbList JSON-LD (seo.tsx): Home › listing › document. The last item is the current page
// (aria-current, not a link). Separators are decorative and follow the reading direction.
import { t, type Locale } from '@/modules/i18n'
import { Icon } from './Icon'

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ locale, items }: { locale: Locale; items: Crumb[] }) {
  if (items.length < 2) return null
  return (
    <nav aria-label={t(locale, 'breadcrumb')} className="breadcrumbs">
      <ol className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 p-0 text-xs">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${i}-${c.label}`} className="inline-flex max-w-full items-center gap-1.5">
              {last || !c.href ? (
                <span aria-current={last ? 'page' : undefined} className="text-ink-muted">
                  {c.label}
                </span>
              ) : (
                <a href={c.href} className="breadcrumbs__link">
                  {c.label}
                </a>
              )}
              {last ? null : <Icon name="chevron" className="size-3.5 text-ink-muted" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
