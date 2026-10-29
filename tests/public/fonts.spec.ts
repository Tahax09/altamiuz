// T101 (D-24) and T102: public typefaces are served from this origin (no requests to Google or any
// other host at runtime), each language stays within its 120 KB first-load font budget, a page
// never downloads the other script's face, and the design system's faces are what render.
// Planned as tests/perf/fonts.test.ts; font downloads only exist in a browser, so this runs in the
// `public` and `public-webkit` projects against the production build.
import { expect, test } from '@playwright/test'

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
