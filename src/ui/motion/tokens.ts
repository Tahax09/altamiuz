// Motion tokens (FR-081, ADR-011). The single source for animation timing in JavaScript; the CSS
// custom properties in src/app/(site)/site.css (--duration-*, --ease-standard) carry the same
// values for CSS transitions, and tests/unit/ui/motion-tokens.test.ts keeps them identical.
// Durations are in seconds (Motion's unit).

export const DURATION = { fast: 0.16, base: 0.24, slow: 0.48 } as const

/** cubic-bezier(0.2, 0, 0, 1): quick start, long settle; no overshoot or bounce. */
export const EASE_STANDARD = [0.2, 0, 0, 1] as const

export const REVEAL = {
  /** Travel of an entering element, in CSS pixels. Small: content settles, it does not fly in. */
  distance: 16,
  /** Delay between siblings of one group, in seconds, capped so long lists do not lag. */
  stagger: 0.06,
  maxStaggerSteps: 5,
  /** Part of the viewport an element must reach before it enters (bottom inset). */
  margin: '0px 0px -12% 0px',
} as const

export type RevealAxis = 'block' | 'inline'

/**
 * Start offset for an entering element. `inline` follows the reading direction: content arrives
 * from the end side, so it moves toward the start (left in English, right in Arabic).
 */
export function revealOffset(axis: RevealAxis, dir: 'ltr' | 'rtl'): { x: number; y: number } {
  if (axis === 'block') return { x: 0, y: REVEAL.distance }
  return { x: dir === 'rtl' ? -REVEAL.distance : REVEAL.distance, y: 0 }
}

export function revealDelay(index: number): number {
  return Math.min(Math.max(index, 0), REVEAL.maxStaggerSteps) * REVEAL.stagger
}
