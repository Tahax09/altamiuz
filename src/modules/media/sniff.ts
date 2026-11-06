// Content sniffing for uploads (D-12 check 1, FR-051). The declared MIME type and file name are
// never trusted: the format comes from the file's own leading bytes, and must later agree with what
// sharp actually decodes (validate.ts). Allow-list only: JPEG, PNG, WebP, AVIF (A-7).

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif'

export const FORMATS: Record<ImageFormat, { mime: string; ext: string }> = {
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
  png: { mime: 'image/png', ext: 'png' },
  webp: { mime: 'image/webp', ext: 'webp' },
  avif: { mime: 'image/avif', ext: 'avif' },
}

export const ALLOWED_MIME_TYPES = Object.values(FORMATS).map((f) => f.mime)

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const ascii = (buf: Uint8Array, at: number, len: number) =>
  String.fromCharCode(...buf.subarray(at, at + len))

/** The allow-listed format the bytes start with, or null for anything else. */
export function sniffImage(buf: Uint8Array): ImageFormat | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (PNG.every((b, i) => buf[i] === b)) return 'png'
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 4) === 'WEBP') return 'webp'
  // ISO-BMFF: [size][ftyp][major brand][minor][compatible brands…]; AVIF uses avif/avis.
  if (ascii(buf, 4, 4) === 'ftyp') {
    const size = ((buf[0]! << 24) | (buf[1]! << 16) | (buf[2]! << 8) | buf[3]!) >>> 0
    const end = Math.min(size, buf.length, 64)
    if (size < 16 || end < 12) return null
    for (let at = 8; at + 4 <= end; at += 4) {
      if (at === 12) continue // minor version
      const brand = ascii(buf, at, 4)
      if (brand === 'avif' || brand === 'avis') return 'avif'
    }
  }
  return null
}
