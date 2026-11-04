// T105 (FR-080, WCAG 2.2 AA): public accessibility baseline. Every public template is measured in
// both languages at a phone and a desktop width with axe-core. Public pages are project-built, so
// the rule is stricter than the admin baseline: no WCAG 2.2 A/AA violation of any impact, ever.
// Axe best-practice findings are recorded in tests/a11y/public/baseline.json and may not grow.
// Regenerate deliberately with A11Y_UPDATE_BASELINE=1 (review the diff; never to hide a
// regression). Manual keyboard and screen-reader checks remain T138.
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

const BASELINE = 'tests/a11y/public/baseline.json'
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const UPDATE = process.env.A11Y_UPDATE_BASELINE === '1'
type Finding = { rule: string; impact: string; nodes: number }
type Baseline = Record<string, Finding[]>
const load = (): Baseline =>
  fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {}

const ar = (s: string) => encodeURIComponent(s)
// Templates × languages (paths from tests/support/e2e-seed.ts).
const TEMPLATES: [string, string][] = [
  ['home:en', '/en'],
  ['home:ar', '/ar'],
  ['page:en', '/en/about'],
  ['services:en', '/en/services'],
  ['services:ar', '/ar/ar-vocab-pending-services'],
  ['service:en', '/en/services/penetration-testing'],
  ['service:ar', `/ar/ar-vocab-pending-services/${ar('اختبار-الاختراق')}`],
  ['training:en', '/en/training'],
  ['training:ar', '/ar/ar-vocab-pending-training'],
  ['course:en', '/en/training/security-awareness'],
  ['missing-translation:ar', '/ar/ar-vocab-pending-training/security-awareness'],
  ['not-found:en', '/en/no-such-page'],
  ['not-found:ar', `/ar/${ar('لا-توجد')}`],
]
const WIDTHS = [375, 1440]

const measured: Baseline = {}
test.describe.configure({ mode: 'serial' })

async function analyse(page: Page, key: string) {
  const wcag = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  const bp = await new AxeBuilder({ page }).withTags(['best-practice']).analyze()
  const best: Finding[] = bp.violations
    .map((v) => ({ rule: v.id, impact: v.impact ?? 'unknown', nodes: v.nodes.length }))
    .sort((a, b) => a.rule.localeCompare(b.rule))
  measured[key] = best
  return { wcag: wcag.violations, best }
}

for (const width of WIDTHS)
  for (const [name, path] of TEMPLATES)
    test(`${name} @${width}px: no WCAG 2.2 AA violations; best practice not worse`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      const res = await page.goto(path)
      expect(res?.status(), path).toBe(name.startsWith('not-found') ? 404 : 200)
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts.ready)
      const key = `${name}@${width}`
      const { wcag, best } = await analyse(page, key)
      expect(
        wcag.map((v) => `${v.id} [${v.impact}] ×${v.nodes.length}: ${v.nodes[0]?.target}`),
      ).toEqual([])
      if (!UPDATE) {
        const known = new Set((load()[key] ?? []).map((f) => f.rule))
        expect(best.filter((f) => !known.has(f.rule))).toEqual([])
      }
    })

test('keyboard: the skip link comes first, is visible on focus and moves focus to the content', async ({
  page,
}) => {
  for (const path of ['/en', '/ar']) {
    await page.goto(path)
    await page.keyboard.press('Tab')
    const skip = page.locator('.skip-link')
    await expect(skip).toBeFocused()
    const box = await skip.boundingBox()
    expect(box && box.y >= 0 && box.height >= 24, `${path} skip link visible`).toBe(true)
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
    // The next Tab lands inside the content, not back in the header.
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement?.closest('#main'))).toBe(true)
  }
})

test('keyboard: every focused link and button shows a visible focus indicator', async ({
  page,
}) => {
  await page.goto('/en/services')
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const card = el.closest('.card--link')
      const s = getComputedStyle(card ?? el)
      return { tag: el.tagName, outline: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    if (!style) break
    expect(style.outline, `${style.tag} #${i}`).not.toBe('none')
    expect(style.width).toBeGreaterThanOrEqual(2)
  }
})

test.afterAll(() => {
  if (UPDATE) fs.writeFileSync(BASELINE, `${JSON.stringify({ ...load(), ...measured }, null, 2)}\n`)
})
