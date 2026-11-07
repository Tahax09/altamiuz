// Upload validation and normalisation (D-12, FR-051, FR-052, A-7). Runs before Payload stores
// anything. Order: size → leading-byte sniff → active-content scan → header decode (format and
// pixel limits) → full decode and re-encode without metadata → random 128-bit name.
// Every rejection is a 400 with a fixed, user-facing message and a stable `reason` code; nothing
// from the file (name, bytes, decoder errors) is echoed back.
import { randomBytes } from 'node:crypto'
import sharp, { type Metadata, type OutputInfo, type Sharp } from 'sharp'
import { publicError } from '../content/errors'
import { emitSignal } from '../platform/signals'
import { MAX_UPLOAD_BYTES, UPLOAD_TOO_LARGE_MESSAGE } from '../security'
import { FORMATS, sniffImage, type ImageFormat } from './sniff'

/** A-7: 20 MB per file (MiB, matching the multipart parser's limit) and 40 megapixels. */
export { MAX_UPLOAD_BYTES }
export const MAX_PIXELS = 40_000_000

export const UPLOAD_MESSAGES = {
  missing: 'Choose an image file to upload.',
  tooLarge: UPLOAD_TOO_LARGE_MESSAGE,
  type: 'Only JPEG, PNG, WebP and AVIF images can be uploaded.',
  activeContent: 'This file contains embedded markup or script and cannot be uploaded.',
  tooManyPixels: 'This image is larger than 40 megapixels. Resize it and upload again.',
  unreadable: 'This image could not be read. It may be damaged or incomplete.',
  storage: 'The image could not be saved. Try again.',
} as const
export type UploadRejection = keyof typeof UPLOAD_MESSAGES

export const uploadError = (reason: UploadRejection) => {
  emitSignal('upload.rejected', { reason }) // FR-100: every rejection is thrown right after this
  return publicError(UPLOAD_MESSAGES[reason], 400, { reason: `upload.${reason}` })
}

/**
 * Markup or script signatures anywhere in the raw bytes (JPEG/HTML and similar polyglots, SVG or
 * HTML renamed to an image type). Compressed image data practically never contains these ASCII
 * sequences; a false positive costs a re-export, a false negative is neutralised anyway by
 * re-encoding, so this check is defence in depth.
 */
const ACTIVE = [
  '<script',
  '<html',
  '<svg',
  '<iframe',
  '<object',
  '<embed',
  '<body',
  '<!doctype',
  '<?php',
  '<?xml',
  'javascript:',
]
export function containsActiveContent(buf: Buffer): boolean {
  const text = buf.toString('latin1').toLowerCase()
  return ACTIVE.some((sig) => text.includes(sig))
}

export type PreparedImage = {
  data: Buffer
  format: ImageFormat
  mimetype: string
  name: string
  width: number
  height: number
}

const ENCODE: Record<ImageFormat, (s: Sharp) => Sharp> = {
  jpeg: (s) => s.jpeg({ quality: 85, mozjpeg: true }),
  png: (s) => s.png({ compressionLevel: 9 }),
  webp: (s) => s.webp({ quality: 85 }),
  avif: (s) => s.avif({ quality: 60, effort: 4 }),
}

/** Random 128-bit identifier + canonical extension for the detected format (D-12 check 4). */
export const randomFileName = (format: ImageFormat) =>
  `${randomBytes(16).toString('hex')}.${FORMATS[format].ext}`

/** Validates raw upload bytes and returns a metadata-free re-encoding, or throws a 400. */
export async function prepareImage(input: Buffer | undefined | null): Promise<PreparedImage> {
  if (!input || input.length === 0) throw uploadError('missing')
  if (input.length > MAX_UPLOAD_BYTES) throw uploadError('tooLarge')
  const format = sniffImage(input)
  if (!format) throw uploadError('type')
  if (containsActiveContent(input)) throw uploadError('activeContent')

  // Header only: format and dimensions, before any pixel is decoded (decompression bombs).
  let meta: Metadata
  try {
    meta = await sharp(input, { limitInputPixels: false }).metadata()
  } catch {
    throw uploadError('unreadable')
  }
  const decoded: ImageFormat | null =
    meta.format === 'jpeg' || meta.format === 'png' || meta.format === 'webp'
      ? meta.format
      : meta.format === 'heif' && meta.compression === 'av1'
        ? 'avif'
        : null
  // The decoder must agree with the leading bytes (a PDF or HEIC renamed .jpg fails here).
  if (decoded !== format) throw uploadError('type')
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (!width || !height) throw uploadError('unreadable')
  if (width * height > MAX_PIXELS) throw uploadError('tooManyPixels')

  // Full decode (truncated or corrupt data fails here) and re-encode. Metadata (EXIF, GPS, XMP,
  // ICC comments) is dropped because withMetadata/keepMetadata is never called.
  let out: { data: Buffer; info: OutputInfo }
  try {
    out = await ENCODE[format](
      sharp(input, { limitInputPixels: MAX_PIXELS, failOn: 'error', pages: 1 }).rotate(),
    ).toBuffer({ resolveWithObject: true })
  } catch {
    throw uploadError('unreadable')
  }
  if (sniffImage(out.data) !== format) throw uploadError('unreadable')
  return {
    data: out.data,
    format,
    mimetype: FORMATS[format].mime,
    name: randomFileName(format),
    width: out.info.width,
    height: out.info.height,
  }
}
