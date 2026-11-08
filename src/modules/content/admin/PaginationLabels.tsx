'use client'
// List-view pagination names (FR-080a, admin finding A-13). Payload 3.91.0 renders the previous and
// next page controls as icon-only `<button class="clickable-arrow …">` elements with no accessible
// name (axe `button-name`, critical), so a screen reader announces only "button". They appear as
// soon as a list has more rows than one page. Uses the supported admin `providers` extension
// point; Payload behaviour is otherwise unchanged. The admin UI is English only (D-23).
import { useEffect, type ReactNode } from 'react'

const ARROW = 'button.clickable-arrow:not([aria-label])'

function label() {
  for (const b of Array.from(document.querySelectorAll<HTMLButtonElement>(ARROW)))
    b.setAttribute(
      'aria-label',
      b.classList.contains('clickable-arrow--left') ? 'Previous page' : 'Next page',
    )
}

export function PaginationLabels({ children }: { children?: ReactNode }) {
  useEffect(() => {
    label()
    const observer = new MutationObserver(label)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return <>{children}</>
}
