// Status pages (FR-008, FR-095): not found, error, translation unavailable. A large code, the
// page's h1, a short explanation and ways back in the same language. No internal details.
import type { ReactNode } from 'react'

export function StatusView({
  code,
  title,
  body,
  actions,
  children,
  className,
}: {
  code: string
  title: string
  body?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={['status-page', className].filter(Boolean).join(' ')}>
      <div className="status-page__inner">
        <p className="status-page__code" aria-hidden="true">
          {code}
        </p>
        <h1>{title}</h1>
        {body ? <div className="lead">{body}</div> : null}
        {actions ? <div className="actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
