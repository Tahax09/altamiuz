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

function clear(el: HTMLElement) {
  el.style.removeProperty('opacity')
  el.style.removeProperty('transform')
}

function useReveal() {
  const [, animate] = useAnimate()
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const dir = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
    const stops: (() => void)[] = []
    const pending: HTMLElement[] = []
    try {
      for (const group of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
        if (group.getBoundingClientRect().top < window.innerHeight) continue // already visible
        const items = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal-item]'))
        const targets = items.length ? items : [group]
        const axis: RevealAxis = group.dataset.reveal === 'inline' ? 'inline' : 'block'
        const { x, y } = revealOffset(axis, dir)
        const from = `translate3d(${x}px, ${y}px, 0)`
        for (const el of targets) {
          el.style.opacity = '0'
          el.style.transform = from
          pending.push(el)
        }
        const stop = inView(
          group,
          () => {
            stop()
            targets.forEach((el, i) => {
              void Promise.resolve(
                animate(
                  el,
                  { opacity: [0, 1], transform: [from, 'translate3d(0, 0, 0)'] },
                  { duration: DURATION.slow, ease: EASE_STANDARD, delay: revealDelay(i) },
                ),
              )
                .catch(() => undefined)
                .finally(() => clear(el))
            })
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
