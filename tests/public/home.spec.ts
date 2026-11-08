// Homepage (Direction A, Institutional Precision) on the production build with the e2e seed:
// sections render server-side in the stored order in both languages, at mobile, tablet and
// desktop widths, without horizontal overflow, broken internal links or client JavaScript over
// the 150 KB budget (FR-083). Fixture content only (tests/support/e2e-seed.ts).
import { expect, test } from '@playwright/test'

const SEQUENCE = [
  'hero',
  'serviceList',
  'stats',
  'textMedia',
  'featureGrid',
  'process',
  'standards',
  'resourceList',
  'cta',
]
const WIDTHS = [320, 768, 1440]

for (const [locale, dir] of [
  ['en', 'ltr'],
  ['ar', 'rtl'],
] as const) {
  test(`${locale}: sections in order, readable at every width`, async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      const r = await page.goto(`/${locale}`)
      expect(r?.status()).toBe(200)
      await expect(page.locator('article')).toHaveAttribute('dir', dir)
      const blocks = await page
        .locator('article [data-block]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-block')))
      expect(blocks, `${locale} ${width}`).toEqual(SEQUENCE)
      // The hidden richText section of the seed never renders.
      await expect(page.getByText('Hidden section e2e text')).toHaveCount(0)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${locale} ${width}px horizontal overflow`).toBeLessThanOrEqual(0)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.locator('ol.process > li')).toHaveCount(4)
    }
  })
}

test('approach steps read in the language direction (first step at the start edge)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const [locale, startIsLeft] of [
    ['en', true],
    ['ar', false],
  ] as const) {
    await page.goto(`/${locale}`)
    const [a, b] = await page
      .locator('ol.process > li')
      .evaluateAll((els) => els.slice(0, 2).map((e) => e.getBoundingClientRect().x))
    expect(a! < b!, locale).toBe(startIsLeft)
  }
})

test('internal links on the home page resolve; client JavaScript stays within budget', async ({
  browser,
  request,
}) => {
  for (const locale of ['en', 'ar'] as const) {
    // A fresh context per language: cached scripts report no transferred bytes.
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`/${locale}`)
    await page.waitForLoadState('networkidle')
    // Bytes over the wire (encoded), as the Lighthouse budget counts them (tests/perf).
    const scriptBytes = await page.evaluate(() =>
      (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
        .filter((e) => e.initiatorType === 'script' || /\.js(\?|$)/.test(e.name))
        .reduce((sum, e) => sum + e.encodedBodySize, 0),
    )
    expect(scriptBytes, `${locale} script bytes`).toBeGreaterThan(0)
    expect(scriptBytes, `${locale} script bytes`).toBeLessThanOrEqual(150 * 1024)

    const hrefs = await page
      .locator('main a[href^="/"]')
      .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('href')!))])
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      const res = await request.get(href, { maxRedirects: 0 })
      expect(res.status(), href).toBe(200)
    }
    await context.close()
  }
})
