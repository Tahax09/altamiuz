// Responsive image (FR-052, FR-053, FR-054, D-12). Renders the generated variants as a <picture>
// with AVIF and WebP sources and a JPEG fallback, served by Payload's access-checked file route.
// Alt text comes from the image for the current locale; decorative images get alt="" and are
// hidden from assistive technology. The focal point becomes CSS classes (the public CSP allows no
// inline styles) that set `object-position`, so every crop keeps the subject (site.css `.fx-*`).
// Artwork with transparency (logos) uses `fallback="webp"`: the JPEG variants have no alpha
// channel, so they are left out and WebP (universal since 2020) is the fallback instead.
import { MEDIA_FORMATS, MEDIA_WIDTHS, variantName, type MediaFormat } from '@/modules/media'

type Size = { filename?: string | null; width?: number | null; height?: number | null }
export type PublicMedia = {
  id?: number
  filename?: string | null
  alt?: unknown
  decorative?: unknown
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
  sizes?: Record<string, Size | undefined>
}

const SAFE_NAME = /^[0-9a-f]{32}(-\d{1,5}x\d{1,5})?\.(jpg|png|webp|avif)$/
const TYPE: Record<MediaFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
}
const fileUrl = (name: string) => `/api/media/file/${name}`

const pct = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : 50

function srcset(m: PublicMedia, format: MediaFormat) {
  const seen = new Set<string>()
  const parts: string[] = []
  for (const w of MEDIA_WIDTHS) {
    const s = m.sizes?.[variantName(w, format)]
    if (!s?.filename || !s.width || !SAFE_NAME.test(s.filename) || seen.has(s.filename)) continue
    seen.add(s.filename)
    parts.push(`${fileUrl(s.filename)} ${s.width}w`)
  }
  return parts.join(', ')
}

/** Only a populated, public image renders; an id (not readable) or a deleted image renders nothing. */
export function Picture({
  media,
  sizes = '100vw',
  className,
  crop = true,
  eager = false,
  fallback: fallbackFormat = 'jpeg',
}: {
  media: unknown
  sizes?: string
  className?: string
  /** Fill a fixed aspect ratio (cover + focal point); otherwise keep the whole image (contain). */
  crop?: boolean
  eager?: boolean
  /** `webp` keeps transparency (logos); JPEG variants are then not offered at all. */
  fallback?: 'jpeg' | 'webp'
}) {
  if (!media || typeof media !== 'object') return null
  const m = media as PublicMedia
  if (!m.filename || !SAFE_NAME.test(m.filename) || !m.width || !m.height) return null
  const decorative = m.decorative === true
  const alt = decorative ? '' : typeof m.alt === 'string' ? m.alt : ''
  const fallback = srcset(m, fallbackFormat)
  const largestJpeg = fallback.split(', ').at(-1)?.split(' ')[0] ?? fileUrl(m.filename)
  const sources: MediaFormat[] =
    fallbackFormat === 'webp' ? ['avif'] : MEDIA_FORMATS.filter((f) => f !== 'jpeg')
  const classes = [
    'media',
    crop ? 'media--crop' : 'media--contain',
    crop ? `fx-${pct(m.focalX)} fy-${pct(m.focalY)}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <picture className={classes}>
      {sources.map((f) => {
        const set = srcset(m, f)
        return set ? <source key={f} type={TYPE[f]} srcSet={set} sizes={sizes} /> : null
      })}
      <img
        src={largestJpeg}
        srcSet={fallback || undefined}
        sizes={fallback ? sizes : undefined}
        alt={alt}
        aria-hidden={decorative ? true : undefined}
        width={m.width}
        height={m.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  )
}
