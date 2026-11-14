// `pnpm brand:icons`: app icons from the owner-supplied emblem (content/brand/emblem.svg, CD-09),
// scaled and padded only; the artwork is not redrawn. Writes the Next.js metadata files
// src/app/icon.svg, src/app/apple-icon.png (180 px, white ground) and src/app/favicon.ico
// (16/32/48 px PNG entries).
import fs from 'node:fs'
import sharp from 'sharp'

const SRC = 'content/brand/emblem.svg'
const svg = fs.readFileSync(SRC, 'utf8')
// Refuse anything but plain vector paths (the media pipeline would reject SVG; this file is
// served as-is from the app's own origin).
if (/<script|<image|<foreignObject|\son[a-z]+=|href=|url\(/i.test(svg))
  throw new Error(`${SRC} contains active or external content; refusing to publish it as an icon.`)

const png = (size: number, pad: number, background?: string) =>
  sharp(Buffer.from(svg), { density: 600 })
    .resize(size - pad * 2, size - pad * 2, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .flatten(background ? { background } : false)
    .png({ compressionLevel: 9 })
    .toBuffer()

/** ICO container with PNG-encoded entries (supported by every current browser). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + 16 * images.length
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt8(0, 2)
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    return e
  })
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

const sizes = [16, 32, 48]
const favicon = ico(
  await Promise.all(sizes.map(async (size) => ({ size, data: await png(size, 0) }))),
)
fs.writeFileSync('src/app/favicon.ico', favicon)
fs.writeFileSync('src/app/apple-icon.png', await png(180, 18, '#ffffff'))
// The SVG icon: the supplied file without its XML declaration and editor title.
fs.writeFileSync(
  'src/app/icon.svg',
  svg.replace(/<\?xml[^>]*>\s*/, '').replace(/<title>[^<]*<\/title>\s*/, ''),
)
console.log('Wrote src/app/favicon.ico, src/app/apple-icon.png, src/app/icon.svg')
