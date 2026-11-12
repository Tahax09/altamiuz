'use client'
// Progressive enhancements for the public site (ADR-011, FR-081, FR-082). The only client script
// the chrome adds; every page is complete without it.
//
// 1. Entrance motion (Motion for React, WAAPI build). Groups marked `data-reveal` that start below
//    the fold settle into place when they scroll into view. Rules:
//    - nothing is hidden on the server or before this script runs, so content never depends on JS;
//    - groups already on screen at load are never touched (no flash, no LCP delay);
//    - prefers-reduced-motion: reduce turns the effect off entirely;
//    - styles are set through the CSSOM and WAAPI, which the nonce-only style-src CSP allows;
//    - no scroll-linked effects: scrolling is never hijacked, delayed or reinterpreted.
// 2. Disclosure menus (`details[data-disclosure]`): Escape closes the open one and returns focus to
//    its toggle; a click or focus outside closes it; opening one closes the others.
import { inView } from 'motion'
import { useAnimate } from 'motion/react-mini'
import { useEffect } from 'react'
import {
  DURATION,
  EASE_STANDARD,
  REVEAL,
  revealDelay,
  revealOffset,
  type RevealAxis,
} from '../motion/tokens'

type Entrance = { el: HTMLElement; from: Keyframe; to: Keyframe; delay: number }

/** Start and end frames for one group, by kind (`data-reveal` value). */
function entrances(group: HTMLElement, dir: 'ltr' | 'rtl'): Entrance[] {
  const kind = group.dataset.reveal
  if (kind === 'plate')
    // Images unmask downward; the frame keeps its size, so nothing below moves.
    return [
      {
        el: group,
        from: { clipPath: 'inset(0 0 22% 0)', opacity: '0' },
        to: { clipPath: 'inset(0 0 0% 0)', opacity: '1' },
        delay: 0,
      },
    ]
  const out: Entrance[] = []
  // A drawn rule grows from the start of the reading direction (process timeline).
  for (const line of group.querySelectorAll<HTMLElement>('[data-draw]')) {
    const vertical = line.offsetHeight > line.offsetWidth
    const axis = vertical ? 'scaleY' : 'scaleX'
    out.push({
      el: line,
      from: { transform: `${axis}(0)` },
      to: { transform: `${axis}(1)` },
      delay: 0,
    })
  }
  const items = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal-item]'))
  const targets = items.length ? items : [group]
  const axis: RevealAxis = kind === 'inline' ? 'inline' : 'block'
  const { x, y } = revealOffset(axis, dir)
  targets.forEach((el, i) =>
    out.push({
      el,
      from: { opacity: '0', transform: `translate3d(${x}px, ${y}px, 0)` },
      to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
      delay: revealDelay(i) + (out.length && kind === 'inline' ? 0.12 : 0),
    }),
  )
  return out
}

const STYLE_KEYS = ['opacity', 'transform', 'clipPath'] as const
function clear(el: HTMLElement) {
  for (const k of STYLE_KEYS) el.style.removeProperty(k === 'clipPath' ? 'clip-path' : k)
}
function apply(el: HTMLElement, frame: Keyframe) {
  for (const k of STYLE_KEYS) if (frame[k] !== undefined) el.style[k] = String(frame[k])
}

/** `{ prop: [from, to] }` for Motion's animate(). */
const keyframes = (e: Entrance) =>
  Object.fromEntries(Object.keys(e.to).map((k) => [k, [e.from[k], e.to[k]]]))

function useReveal() {
  const [, animate] = useAnimate()
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const dir = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
    const stops: (() => void)[] = []
    const pending: HTMLElement[] = []
    try {
      for (const group of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
        if (group.dataset.reveal === 'none') continue
        if (group.parentElement?.closest('[data-reveal]:not([data-reveal="none"])')) continue
        if (group.getBoundingClientRect().top < window.innerHeight) continue // already visible
        const list = entrances(group, dir)
        for (const e of list) {
          apply(e.el, e.from)
          pending.push(e.el)
        }
        const stop = inView(
          group,
          () => {
            stop()
            for (const e of list)
              void Promise.resolve(
                animate(e.el, keyframes(e) as never, {
                  duration: DURATION.slow,
                  ease: EASE_STANDARD,
                  delay: e.delay,
                }),
              )
                .catch(() => undefined)
                .finally(() => clear(e.el))
          },
          { margin: REVEAL.margin },
        )
        stops.push(stop)
      }
    } catch {
      pending.forEach(clear) // never leave content hidden
    }
    return () => {
      stops.forEach((s) => s())
      pending.forEach(clear)
    }
  }, [animate])
}

function useDisclosures() {
  useEffect(() => {
    const open = () =>
      Array.from(document.querySelectorAll<HTMLDetailsElement>('details[data-disclosure][open]'))
    const close = (d: HTMLDetailsElement, focus = false) => {
      d.open = false
      if (focus) d.querySelector<HTMLElement>(':scope > summary')?.focus()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const target = open().find((d) => d.contains(document.activeElement)) ?? open().at(-1)
      if (target) {
        e.preventDefault()
        close(target, true)
      }
    }
    const onOutside = (e: Event) => {
      for (const d of open()) if (!d.contains(e.target as Node)) close(d)
    }
    const onToggle = (e: Event) => {
      const d = e.target as HTMLDetailsElement
      if (!(d instanceof HTMLDetailsElement) || !d.matches('[data-disclosure]') || !d.open) return
      for (const other of open()) if (other !== d && !other.contains(d)) close(other)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('focusin', onOutside)
    document.addEventListener('toggle', onToggle, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
      document.removeEventListener('focusin', onOutside)
      document.removeEventListener('toggle', onToggle, true)
    }
  }, [])
}

export function SiteEnhancements() {
  useReveal()
  useDisclosures()
  return null
}
