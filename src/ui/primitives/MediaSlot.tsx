// Image and illustration slot (FR-052–FR-054). A fixed aspect ratio reserves the space (no layout
// shift) and the CMS image fills it through <Picture> (variants, focal point, per-locale alt text).
// Without an image the slot renders nothing on the public site; in preview it shows a labelled
// placeholder of the same size, so editors see where an image is expected before assets exist.
import { t, type Locale } from '@/modules/i18n'
import { cn } from '../lib/cn'
import { Picture } from '../media/Picture'
import { Icon } from './Icon'

export const SLOT_RATIOS = {
  wide: { css: 'slot--wide', label: '16:9' },
  landscape: { css: 'slot--landscape', label: '4:3' },
  classic: { css: 'slot--classic', label: '3:2' },
  square: { css: 'slot--square', label: '1:1' },
  portrait: { css: 'slot--portrait', label: '4:5' },
  /** The image's own proportions (illustrations); placeholder uses 16:9. */
  natural: { css: 'slot--natural', label: '16:9' },
} as const
export type SlotRatio = keyof typeof SLOT_RATIOS

export const hasMedia = (m: unknown) => !!m && typeof m === 'object'

export function MediaSlot({
  media,
  ratio,
  sizes,
  locale,
  preview = false,
  eager = false,
  className,
}: {
  media: unknown
  ratio: SlotRatio
  sizes: string
  locale: Locale
  preview?: boolean
  eager?: boolean
  className?: string
}) {
  const r = SLOT_RATIOS[ratio]
  const picture = hasMedia(media) ? (
    <Picture media={media} sizes={sizes} crop={ratio !== 'natural'} eager={eager} />
  ) : null
  if (picture) return <div className={cn('slot', r.css, className)}>{picture}</div>
  if (!preview) return null
  return (
    <div className={cn('slot slot--empty', r.css, className)} data-slot-placeholder="">
      <span className="slot__label">
        <Icon name="image" className="size-6" />
        {t(locale, 'mediaPending', { ratio: r.label })}
      </span>
    </div>
  )
}
