'use client'
// Accessible reorder control (T092, FR-012, FR-055, D-12): keyboard- and single-pointer-operable
// Move up / Move down buttons in each array/blocks row, with a polite live announcement and focus
// kept on the moved item. Uses Payload's supported RowLabel extension point and form API.
import { useField, useForm, useRowLabel } from '@payloadcms/ui'
import { useEffect } from 'react'

function rowTitle(data: Record<string, unknown> | undefined, n: number) {
  const pick =
    data?.blockName ||
    data?.heading ||
    data?.title ||
    data?.question ||
    data?.name ||
    data?.blockType
  const t =
    typeof pick === 'string'
      ? pick
      : typeof pick === 'object' && pick
        ? Object.values(pick as Record<string, unknown>).find((x) => typeof x === 'string')
        : undefined
  return `${typeof t === 'string' && t ? t : 'Item'} ${n}`
}

// Payload re-mounts row labels after a move (form state is rebuilt), so the focus target and the
// announcement live outside the component: one shared live region, and focus retried for a few
// frames until the moved row's button exists again.
const LIVE_ID = 'altamiuz-reorder-live'

function announce(msg: string) {
  let el = document.getElementById(LIVE_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = LIVE_ID
    el.className = 'altamiuz-sr-only'
    el.setAttribute('role', 'status')
    el.setAttribute('aria-live', 'polite')
    document.body.appendChild(el)
  }
  el.textContent = ''
  // A fresh text node after clearing makes screen readers announce repeated messages.
  requestAnimationFrame(() => {
    el!.textContent = msg
  })
}

let pending: { id: string; until: number } | null = null

function focusWhenReady(id: string, frames = 60) {
  pending = { id, until: Date.now() + 3_000 }
  // The first matching element may be the pre-move node that Payload is about to replace, so
  // keep focus on the current node with this id for a while, unless the user has moved elsewhere.
  const active = document.activeElement
  const lost = !active || active === document.body
  if (!lost && active.id !== id) return
  const el = document.getElementById(id) as HTMLButtonElement | null
  if (el && !el.disabled && active !== el) el.focus()
  if (frames > 0) requestAnimationFrame(() => focusWhenReady(id, frames - 1))
}

/** Called by each label as it (re)mounts: claims focus if it holds the pending target. */
function claimPendingFocus() {
  if (!pending || Date.now() > pending.until) return
  const active = document.activeElement
  if (active && active !== document.body && active.id !== pending.id) return
  const el = document.getElementById(pending.id) as HTMLButtonElement | null
  if (el && !el.disabled) el.focus()
}

export function ReorderRowLabel() {
  const { data, path, rowNumber = 0 } = useRowLabel<Record<string, unknown>>()
  const parentPath = path?.replace(/\.\d+$/, '') ?? ''
  const { rows } = useField<unknown>({ path: parentPath }) as unknown as { rows?: unknown[] }
  const { moveFieldRow, setModified } = useForm()
  const total = rows?.length ?? 0
  const index = rowNumber
  const label = rowTitle(data, index + 1)
  useEffect(claimPendingFocus)

  const move = (to: number) => {
    if (to < 0 || to >= total) return
    moveFieldRow({ path: parentPath, moveFromIndex: index, moveToIndex: to })
    setModified(true)
    announce(`Moved ${label.replace(/ \d+$/, '')} to position ${to + 1} of ${total}`)
    // Keep focus on the same control of the moved row; at an edge, use the one still enabled.
    const dir = to > index ? 'down' : 'up'
    const edge = (dir === 'down' && to === total - 1) || (dir === 'up' && to === 0)
    focusWhenReady(`reorder-${parentPath}-${to}-${edge ? (dir === 'down' ? 'up' : 'down') : dir}`)
  }

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  return (
    <span className="altamiuz-row-label" onClick={stop} onKeyDown={stop}>
      <span>{label}</span>
      <span role="group" aria-label={`Reorder ${label}`} className="altamiuz-reorder">
        <button
          type="button"
          id={`reorder-${parentPath}-${index}-up`}
          className="btn btn--size-small btn--style-secondary"
          disabled={index === 0}
          onClick={() => move(index - 1)}
        >
          Move up<span className="altamiuz-sr-only"> {label}</span>
        </button>
        <button
          type="button"
          id={`reorder-${parentPath}-${index}-down`}
          className="btn btn--size-small btn--style-secondary"
          disabled={index >= total - 1}
          onClick={() => move(index + 1)}
        >
          Move down<span className="altamiuz-sr-only"> {label}</span>
        </button>
      </span>
    </span>
  )
}
