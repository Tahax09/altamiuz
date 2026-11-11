// Page header for every template except a hero-led home page (W-1): breadcrumbs, optional
// eyebrow, the page's only h1, a lead paragraph and optional actions or facts below.
import type { ReactNode } from 'react'
import type { Locale } from '@/modules/i18n'
import { cn } from '../lib/cn'
import { Breadcrumbs, type Crumb } from '../primitives/Breadcrumbs'

export function PageHeader({
  locale,
  crumbs = [],
  eyebrow,
  title,
  lead,
  children,
  tone = 'band',
}: {
  locale: Locale
  crumbs?: Crumb[]
  eyebrow?: string
  title: string
  lead?: string
  children?: ReactNode
  /** `band`: warm band with a rule (listings, details); `plain`: paper (legal, status pages). */
  tone?: 'band' | 'plain'
}) {
  return (
    <header className={cn('page-header', tone === 'band' && 'page-header--band')}>
      <div className="page-header__inner">
        <Breadcrumbs locale={locale} items={crumbs} />
        {eyebrow ? <p className="eyebrow mt-6 mb-0">{eyebrow}</p> : null}
        <h1 className={cn(crumbs.length > 1 && !eyebrow ? 'mt-5' : eyebrow ? 'mt-2' : '')}>
          {title}
        </h1>
        {lead ? <p className="lead">{lead}</p> : null}
        {children}
      </div>
    </header>
  )
}
