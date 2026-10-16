'use client'
// Validation focus and announcements (T079/T093, FR-080a). After a failed save, moves focus to the
// first invalid field, marks it aria-invalid and points aria-describedby at its message. Uses the
// supported admin `providers` extension point; Payload core behaviour is otherwise unchanged.
import { useEffect, type ReactNode } from 'react'

// Payload 3.91.0 renders each field error as a `.field-type.field-error` tooltip inside the
// field's own `.field-type` wrapper.
const ERROR_SELECTOR = '.field-error'
const INPUT = 'input, textarea, select, [contenteditable="true"]'

function markInvalid() {
  let first: HTMLElement | null = null
  const invalid = new Set<HTMLElement>()
  for (const msg of Array.from(document.querySelectorAll<HTMLElement>(ERROR_SELECTOR))) {
    const field = msg.parentElement?.closest<HTMLElement>('.field-type')
    const input = field?.querySelector<HTMLElement>(INPUT)
    if (!input) continue
    invalid.add(input)
    input.setAttribute('aria-invalid', 'true')
    msg.id ||= `err-${input.id || Math.random().toString(36).slice(2)}`
    msg.setAttribute('role', 'alert')
    input.setAttribute('aria-describedby', msg.id)
    first ??= input
  }
  // Payload sometimes reports a failed save only in its error toast ("The following fields are
  // invalid (n): …") without inline errors, so map the listed field names to their labels too.
  const toast = document.querySelector<HTMLElement>('.payload-toast-item.toast-error')
  if (toast) {
    toast.id ||= 'err-toast'
    const names = Array.from(toast.querySelectorAll('li')).map((li) => li.textContent?.trim())
    for (const label of Array.from(
      document.querySelectorAll<HTMLLabelElement>('label.field-label'),
    )) {
      const name = label.firstChild?.textContent?.trim()
      const input = label.htmlFor ? document.getElementById(label.htmlFor) : null
      if (!name || !input || !names.includes(name) || invalid.has(input)) continue
      invalid.add(input)
      input.setAttribute('aria-invalid', 'true')
      input.setAttribute('aria-describedby', toast.id)
      first ??= input
    }
  }
  // Clear the state from fields that are no longer invalid.
  for (const input of Array.from(document.querySelectorAll<HTMLElement>('[aria-invalid="true"]')))
    if (!invalid.has(input)) {
      input.removeAttribute('aria-invalid')
      if (input.getAttribute('aria-describedby')?.startsWith('err-'))
        input.removeAttribute('aria-describedby')
    }
  return first
}

export function ErrorFocus({ children }: { children?: ReactNode }) {
  useEffect(() => {
    let scheduled = false
    // Focus moves once per failed save (errors appearing), never again while the user is fixing
    // them, so keyboard users are not pulled back to the first field.
    let hadErrors = false
    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        const first = markInvalid()
        const has = first !== null
        if (first && !hadErrors && !first.contains(document.activeElement)) first.focus()
        hadErrors = has
      })
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])
  return <>{children}</>
}
