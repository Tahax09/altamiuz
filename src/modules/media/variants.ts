// Responsive variants (D-12, FR-052): 5 widths × AVIF/WebP/JPEG. Pure constants, no config.
export const MEDIA_WIDTHS = [480, 768, 1024, 1440, 1920] as const
export const MEDIA_FORMATS = ['avif', 'webp', 'jpeg'] as const
export type MediaFormat = (typeof MEDIA_FORMATS)[number]
export const variantName = (width: number, format: MediaFormat) => `w${width}_${format}`
