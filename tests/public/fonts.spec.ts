// T101 (D-24) and T102: public typefaces are served from this origin (no requests to Google or any
// other host at runtime), each language stays within its 120 KB first-load font budget, a page
// never downloads the other script's face, and the design system's faces are what render.
// Planned as tests/perf/fonts.test.ts; font downloads only exist in a browser, so this runs in the
// `public` and `public-webkit` projects against the production build.
import { expect, test } from '@playwright/test'
import { createHash } from 'node:crypto'
import { woff2Names } from '../support/woff2-names'

const BUDGET = 120 * 1024

for (const [path, own, other] of [
  ['/en', /Inter|Manrope/, /Plex Sans Arabic/],
  ['/ar', /Plex Sans Arabic/, /Inter|Manrope/],
] as const) {
  test(`${path}: fonts are self-hosted, within budget and only for this language`, async ({
    page,
    baseURL,
  }) => {
    const fonts: { url: string; bytes: number }[] = []
    const offOrigin: string[] = []
    page.on('request', (r) => {
      if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) offOrigin.push(r.url())
    })
    page.on('response', async (r) => {
      if (r.request().resourceType() === 'font')
        fonts.push({ url: r.url(), bytes: (await r.body()).length })
    })
    await page.goto(path, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)

    expect(offOrigin).toEqual([])
    expect(fonts.length).toBeGreaterThan(0)
    for (const f of fonts) expect(f.url).toMatch(/\/_next\/static\/media\/[^/]+\.woff2$/)
    const total = fonts.reduce((a, f) => a + f.bytes, 0)
    expect(total, `${path} downloads ${total} bytes of fonts`).toBeLessThanOrEqual(BUDGET)

    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    )
    expect(loaded.some((f) => own.test(f))).toBe(true)
    expect(loaded.some((f) => other.test(f))).toBe(false)
    // The body text and the main heading render in the design system's faces.
    const families = await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      h1: getComputedStyle(document.querySelector('h1')!).fontFamily,
    }))
    expect(families.body).toMatch(own)
    expect(families.h1).toMatch(own)
  })
}

// T101: licence and copyright of the exact files served (docs/licences.md, "Fonts").
const LICENCES: Record<string, { copyright: string; url: RegExp; file: string; sha256: string }> = {
  Inter: {
    copyright: 'Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)',
    url: /^https:\/\/openfontlicense\.org$/,
    file: 'Inter-OFL.txt',
    sha256: '5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57',
  },
  Manrope: {
    copyright:
      'Copyright 2019 The Manrope Project Authors (https://github.com/googlefonts/manrope)',
    url: /^https:\/\/openfontlicense\.org$/,
    file: 'Manrope-OFL.txt',
    sha256: '58172e0c0fac2cda8a37b348164bb55e44b0e69051e557e92b1d3f6910141f7b',
  },
  'IBM Plex Sans Arabic': {
    copyright: 'Copyright 2019 IBM Corp. All rights reserved.',
    url: /^http:\/\/scripts\.sil\.org\/OFL$/,
    file: 'IBMPlexSansArabic-OFL.txt',
    sha256: '7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da',
  },
}

test('every served font file carries its OFL licence URL and copyright; licence texts are served unchanged', async ({
  page,
  request,
}) => {
  const families = new Set<string>()
  for (const path of ['/en', '/ar']) {
    const bodies: Buffer[] = []
    page.on('response', async (r) => {
      if (r.request().resourceType() === 'font') bodies.push(await r.body())
    })
    await page.goto(path, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    page.removeAllListeners('response')
    expect(bodies.length, path).toBeGreaterThan(0)
    for (const body of bodies) {
      const names = woff2Names(body)
      const family = Object.keys(LICENCES).find((f) => names[1]?.startsWith(f))
      expect(family, `unexpected family ${names[1]}`).toBeTruthy()
      families.add(family!)
      expect(names[0]).toBe(LICENCES[family!]!.copyright)
      expect(names[14]).toMatch(LICENCES[family!]!.url)
    }
  }
  expect([...families].sort()).toEqual(Object.keys(LICENCES).sort())
  for (const { file, sha256 } of Object.values(LICENCES)) {
    const r = await request.get(`/fonts/LICENSES/${file}`)
    expect(r.status(), file).toBe(200)
    const text = await r.body()
    expect(text.toString()).toContain('SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007')
    expect(createHash('sha256').update(text).digest('hex'), file).toBe(sha256)
  }
})
