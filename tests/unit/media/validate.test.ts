// T110 (D-12 checks 1–4, FR-051, FR-052): sniffing and the validation pipeline, without Payload.
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'
import { sniffImage } from '../../../src/modules/media/sniff'
import {
  containsActiveContent,
  MAX_PIXELS,
  prepareImage,
  randomFileName,
  UPLOAD_MESSAGES,
} from '../../../src/modules/media/validate'
import {
  blankPng,
  fixtures,
  validAvif,
  validJpeg,
  validPng,
  validWebp,
  type Fixture,
} from '../../fixtures/uploads/generate'

let all: Fixture[]
beforeAll(async () => {
  all = await fixtures()
}, 60_000)

describe('sniffImage', () => {
  it('recognises the four allowed formats by their bytes', async () => {
    expect(sniffImage(await validJpeg(64, 64))).toBe('jpeg')
    expect(sniffImage(await validPng(64, 64))).toBe('png')
    expect(sniffImage(await validWebp(64, 64))).toBe('webp')
    expect(sniffImage(await validAvif(64, 64))).toBe('avif')
  })

  it('rejects everything else, including near misses', async () => {
    const gif = Buffer.from('GIF89a\x01\x00\x01\x00\x00\x00\x00;', 'latin1')
    const heic = Buffer.concat([
      Buffer.from([0, 0, 0, 24]),
      Buffer.from('ftypheic\0\0\0\0mif1heic'),
    ])
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom\0\0\0\0isomavc1')])
    const tiff = Buffer.from('II*\0\x08\0\0\0\0\0\0\0', 'latin1')
    const bmp = Buffer.from('BM' + '\0'.repeat(20), 'latin1')
    const riffAvi = Buffer.from('RIFF\0\0\0\0AVI LIST', 'latin1')
    for (const b of [
      gif,
      heic,
      mp4,
      tiff,
      bmp,
      riffAvi,
      Buffer.from('<svg/>      '),
      Buffer.alloc(0),
    ])
      expect(sniffImage(b)).toBeNull()
  })

  it('needs avif in the brand list, not anywhere in the box', () => {
    const fake = Buffer.concat([
      Buffer.from([0, 0, 0, 16]),
      Buffer.from('ftypisom\0\0\0\0'),
      Buffer.from('avif'),
    ])
    expect(sniffImage(fake)).toBeNull()
  })
})

describe('containsActiveContent', () => {
  it('finds markup and script signatures in any case', () => {
    for (const s of ['<SCRIPT>', '<svg ', '<?php', 'JavaScript:', '<!DOCTYPE html>', '<?xml '])
      expect(containsActiveContent(Buffer.from(`\xff\xd8\xff${s}`, 'latin1')), s).toBe(true)
    expect(containsActiveContent(Buffer.from('\xff\xd8\xff plain bytes', 'latin1'))).toBe(false)
  })
})

describe('prepareImage', () => {
  it('handles every fixture as specified (T107)', async () => {
    for (const f of all) {
      const result = await prepareImage(f.data).then(
        (p) => ({ outcome: 'accept', format: p.format }),
        (e: { data?: { reason?: string }; status?: number; message?: string }) => {
          expect(e.status, f.name).toBe(400)
          const reason = e.data!.reason!.replace(/^upload\./, '')
          expect(e.message).toBe(UPLOAD_MESSAGES[reason as keyof typeof UPLOAD_MESSAGES])
          return { outcome: 'reject', reason }
        },
      )
      expect(result, f.name).toEqual(f.expect)
    }
  })

  it('re-encodes without any metadata and keeps the format', async () => {
    const gps = all.find((f) => f.name === 'gps.jpg')!
    expect((await sharp(gps.data).metadata()).exif).toBeDefined()
    const p = await prepareImage(gps.data)
    const meta = await sharp(p.data).metadata()
    expect([meta.format, meta.exif, meta.xmp, meta.iptc]).toEqual([
      'jpeg',
      undefined,
      undefined,
      undefined,
    ])
    expect(p.data.equals(gps.data)).toBe(false)
  })

  it('enforces the pixel limit at exactly 40 megapixels', async () => {
    expect((await prepareImage(await blankPng(8_000, 5_000))).width).toBe(8_000) // 40,000,000
    await expect(prepareImage(await blankPng(8_001, 5_000))).rejects.toMatchObject({
      data: { reason: 'upload.tooManyPixels' },
    })
    expect(MAX_PIXELS).toBe(40_000_000)
  })

  it('rejects empty input and names files with 128 random bits', async () => {
    await expect(prepareImage(Buffer.alloc(0))).rejects.toMatchObject({
      data: { reason: 'upload.missing' },
    })
    const names = new Set(Array.from({ length: 50 }, () => randomFileName('webp')))
    expect(names.size).toBe(50)
    for (const n of names) expect(n).toMatch(/^[0-9a-f]{32}\.webp$/)
  })
})
