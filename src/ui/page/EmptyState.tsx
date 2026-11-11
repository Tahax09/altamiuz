// Empty state for listings with nothing published yet (FR-018): says so plainly and offers the
// contact page when it exists. No placeholder items are ever invented.
import { cn } from '../lib/cn'
import { buttonVariants } from '../primitives/button'
import { Icon, type IconName } from '../primitives/Icon'

export function EmptyState({
  title,
  body,
  action,
  icon = 'compass',
}: {
  title: string
  body?: string
  action?: { label: string; href: string } | null
  icon?: IconName
}) {
  return (
    <div className="empty-state">
      <Icon name={icon} className="empty-state__icon" />
      <p className="empty-state__title">{title}</p>
      {body ? <p className="empty-state__body">{body}</p> : null}
      {action ? (
        <a href={action.href} className={cn(buttonVariants({ variant: 'secondary', arrow: true }))}>
          {action.label}
          <Icon name="arrow" />
        </a>
      ) : null}
    </div>
  )
}
