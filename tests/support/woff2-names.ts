// Reads the `name` table of a WOFF2 font (W3C WOFF2 §5–6) with Node's built-in Brotli, so tests can
// check the licence and copyright records of the exact files the site serves (T101).
import { brotliDecompressSync } from 'node:zlib'

const KNOWN_TAGS = [
  'cmap',
  'head',
  'hhea',
  'hmtx',
  'maxp',
  'name',
  'OS/2',
  'post',
  'cvt ',
  'fpgm',
  'glyf',
  'loca',
  'prep',
  'CFF ',
  'VORG',
  'EBDT',
  'EBLC',
  'gasp',
  'hdmx',
  'kern',
  'LTSH',
  'PCLT',
  'VDMX',
  'vhea',
  'vmtx',
  'BASE',
  'GDEF',
  'GPOS',
  'GSUB',
  'EBSC',
  'JSTF',
  'MATH',
  'CBDT',
  'CBLC',
  'COLR',
  'CPAL',
  'SVG ',
  'sbix',
  'acnt',
  'avar',
  'bdat',
  'bloc',
  'bsln',
  'cvar',
  'fdsc',
  'feat',
  'fmtx',
  'fvar',
  'gvar',
  'hsty',
  'just',
  'lcar',
  'mort',
  'morx',
  'opbd',
  'prop',
  'trak',
  'Zapf',
  'Silf',
  'Glat',
  'Gloc',
  'Feat',
  'Sill',
]

/** nameID → string (Windows Unicode records preferred). */
export function woff2Names(buf: Buffer): Record<number, string> {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not a WOFF2 file')
  const numTables = buf.readUInt16BE(12)
  const compressedSize = buf.readUInt32BE(20)
  let p = 48
  const base128 = () => {
    let v = 0
    for (let i = 0; i < 5; i++) {
      const b = buf[p++]!
      v = v * 128 + (b & 0x7f)
      if (!(b & 0x80)) return v
    }
    throw new Error('bad UIntBase128')
  }
  const tables: { tag: string; length: number }[] = []
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++]!
    const tag =
      (flags & 0x3f) === 0x3f ? buf.toString('latin1', p, (p += 4)) : KNOWN_TAGS[flags & 0x3f]!
    const version = (flags >> 6) & 3
    const orig = base128()
    // glyf/loca are transformed unless version 3; every other table only when version != 0.
    const transformed = tag === 'glyf' || tag === 'loca' ? version !== 3 : version !== 0
    tables.push({ tag, length: transformed ? base128() : orig })
  }
  const data = brotliDecompressSync(buf.subarray(p, p + compressedSize))
  let off = 0
  for (const t of tables) {
    if (t.tag === 'name') return parseName(data.subarray(off, off + t.length))
    off += t.length
  }
  throw new Error('no name table')
}

function parseName(t: Buffer): Record<number, string> {
  const count = t.readUInt16BE(2)
  const strings = t.readUInt16BE(4)
  const out: Record<number, string> = {}
  for (let i = 0; i < count; i++) {
    const r = 6 + i * 12
    const platform = t.readUInt16BE(r)
    const nameId = t.readUInt16BE(r + 6)
    const len = t.readUInt16BE(r + 8)
    const at = strings + t.readUInt16BE(r + 10)
    const raw = t.subarray(at, at + len)
    if (platform === 3 || platform === 0) {
      const s = Buffer.from(raw).swap16().toString('utf16le')
      out[nameId] = s
    } else if (out[nameId] === undefined) out[nameId] = raw.toString('latin1')
  }
  return out
}
