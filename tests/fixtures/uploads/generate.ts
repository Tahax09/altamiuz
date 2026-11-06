// T107 (FR-051): malicious and edge-case upload fixtures, generated in memory so no hostile binary
// is committed. `pnpm tsx tests/fixtures/uploads/generate.ts <dir>` writes them to disk for manual
// inspection. Each fixture says how it must be treated: `reject` with a reason code, or `accept`.
import { createDeflate } from 'node:zlib'
import { crc32 } from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

export type Fixture = {
  name: string
  type: string
  data: Buffer
  /** Expected outcome; `reason` matches `upload.<reason>` in the API error. */
  expect: { outcome: 'reject'; reason: string } | { outcome: 'accept'; format: string }
}

const chunk = (type: string, body: Buffer) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(body.length)
  const tb = Buffer.concat([Buffer.from(type, 'ascii'), body])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(tb) >>> 0)
  return Buffer.concat([len, tb, crc])
}

/** A valid 1-bit greyscale PNG of any size: tiny on disk, `width × height` pixels when decoded. */
export async function blankPng(width: number, height: number): Promise<Buffer> {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 1 // bit depth
  ihdr[9] = 0 // greyscale
  const row = Buffer.alloc(1 + Math.ceil(width / 8)) // filter byte 0 + zero bits
  const deflate = createDeflate({ level: 9 })
  const parts: Buffer[] = []
  deflate.on('data', (d: Buffer) => parts.push(d))
  const done = new Promise<void>((r) => deflate.on('end', () => r()))
  for (let y = 0; y < height; y++)
    if (!deflate.write(row)) await new Promise((r) => deflate.once('drain', r))
  deflate.end()
  await done
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', Buffer.concat(parts)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** A photo-like gradient so re-encoding and variants have real content. */
export const photo = (width = 2000, height = 1200) =>
  sharp({
    create: { width, height, channels: 3, background: { r: 40, g: 90, b: 160 } },
  }).composite([
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g"><stop offset="0" stop-color="#f60"/><stop offset="1" stop-color="#06f"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${width * 0.8}" cy="${height * 0.2}" r="${height / 6}" fill="#fff"/></svg>`,
      ),
    },
  ])

export const validJpeg = async (w = 2000, h = 1200) => photo(w, h).jpeg({ quality: 80 }).toBuffer()
export const validPng = async (w = 800, h = 600) => photo(w, h).png().toBuffer()
export const validWebp = async (w = 800, h = 600) => photo(w, h).webp().toBuffer()
export const validAvif = async (w = 800, h = 600) => photo(w, h).avif({ effort: 2 }).toBuffer()

/** JPEG with a comment segment holding HTML/script, right after SOI (a JPEG/HTML polyglot). */
export async function polyglotJpegHtml(): Promise<Buffer> {
  const jpeg = await validJpeg(400, 300)
  const html = Buffer.from('<html><body><script>alert(document.domain)</script></body></html>')
  const len = Buffer.alloc(2)
  len.writeUInt16BE(html.length + 2)
  return Buffer.concat([
    jpeg.subarray(0, 2),
    Buffer.from([0xff, 0xfe]),
    len,
    html,
    jpeg.subarray(2),
  ])
}

/** JPEG carrying EXIF with GPS coordinates and a camera owner (must be stripped, not rejected). */
export const exifGpsJpeg = async () =>
  photo(1200, 800)
    .jpeg()
    .withExif({
      IFD0: { Make: 'FixtureCam', Artist: 'EXIF-OWNER-MARKER', Copyright: 'EXIF-COPYRIGHT-MARKER' },
      IFD3: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '24/1 42/1 0/1',
        GPSLongitudeRef: 'E',
        GPSLongitude: '46/1 40/1 0/1',
      },
    })
    .toBuffer()

export async function fixtures(): Promise<Fixture[]> {
  const jpeg = await validJpeg(400, 300)
  const big = Buffer.concat([jpeg, Buffer.alloc(21 * 1024 * 1024 - jpeg.length, 0x41)])
  return [
    {
      name: 'polyglot.jpg',
      type: 'image/jpeg',
      data: await polyglotJpegHtml(),
      expect: { outcome: 'reject', reason: 'activeContent' },
    },
    {
      name: 'script.svg',
      type: 'image/svg+xml',
      data: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
      ),
      expect: { outcome: 'reject', reason: 'type' },
    },
    {
      name: 'script-svg-renamed.png',
      type: 'image/png',
      data: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)" width="10" height="10"/>',
      ),
      expect: { outcome: 'reject', reason: 'type' },
    },
    {
      name: 'bomb.png',
      type: 'image/png',
      data: await blankPng(20_000, 20_000),
      expect: { outcome: 'reject', reason: 'tooManyPixels' },
    },
    {
      name: 'big.jpg',
      type: 'image/jpeg',
      data: big,
      expect: { outcome: 'reject', reason: 'tooLarge' },
    },
    {
      name: '41mp.png',
      type: 'image/png',
      data: await blankPng(8_100, 5_100),
      expect: { outcome: 'reject', reason: 'tooManyPixels' },
    },
    {
      name: 'document.jpg',
      type: 'image/jpeg',
      data: Buffer.from(
        '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
      ),
      expect: { outcome: 'reject', reason: 'type' },
    },
    {
      name: 'truncated.jpg',
      type: 'image/jpeg',
      data: (await validJpeg(1200, 800)).subarray(0, 4000),
      expect: { outcome: 'reject', reason: 'unreadable' },
    },
    {
      name: 'gps.jpg',
      type: 'image/jpeg',
      data: await exifGpsJpeg(),
      expect: { outcome: 'accept', format: 'jpeg' },
    },
    {
      // MIME spoofing the other way: real PNG bytes declared as JPEG. Stored as what it is.
      name: 'really-a-png.jpg',
      type: 'image/jpeg',
      data: await validPng(640, 480),
      expect: { outcome: 'accept', format: 'png' },
    },
  ]
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const dir = process.argv[2]
  if (!dir) throw new Error('usage: tsx tests/fixtures/uploads/generate.ts <output dir>')
  fs.mkdirSync(dir, { recursive: true })
  for (const f of await fixtures()) fs.writeFileSync(path.join(dir, f.name), f.data)
  console.log(`wrote fixtures to ${dir}`)
}
