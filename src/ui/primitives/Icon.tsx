// Interface icons: 24 px line glyphs, decorative (the adjacent text carries the meaning).
// `arrow` and `chevron` point toward the end of the line and are mirrored in right-to-left pages
// by CSS (`.icon--directional`), so they always follow the reading direction.
import { cn } from '../lib/cn'

const PATHS = {
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  chevron: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  close: 'M6 6l12 12 M18 6L6 18',
  mail: 'M3 6h18v12H3z M3 7l9 6 9-6',
  phone:
    'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z M12 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M12 7v5l3 2',
  image: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15.5 9.5a1.5 1.5 0 1 0 0-.01',
  compass: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M15.5 8.5l-2 5-5 2 2-5 5-2z',
  alert: 'M12 4l9 16H3L12 4z M12 10v4 M12 17v.5',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
} as const
export type IconName = keyof typeof PATHS
const DIRECTIONAL = new Set<IconName>(['arrow', 'chevron'])

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={cn('ui-icon', DIRECTIONAL.has(name) && 'icon--directional', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
