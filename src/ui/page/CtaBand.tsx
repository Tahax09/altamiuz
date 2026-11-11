// Closing call to action on service and course pages (W-1): links to the contact page from site
// settings, only where that page is published in the language.
import { cn } from '../lib/cn'
import { buttonVariants } from '../primitives/button'
import { Icon } from '../primitives/Icon'

export function CtaBand({
  heading,
  body,
  action,
}: {
  heading: string
  body?: string
  action: { label: string; href: string } | null
}) {
  if (!action) return null
  return (
    <section className="cta-band" data-reveal="">
      <div className="cta-band__inner" data-reveal-item="">
        <div>
          <h2 className="m-0">{heading}</h2>
          {body ? <p className="cta-band__body">{body}</p> : null}
        </div>
        <a href={action.href} className={cn(buttonVariants({ variant: 'inverse', arrow: true }))}>
          {action.label}
          <Icon name="arrow" />
        </a>
      </div>
    </section>
  )
}
