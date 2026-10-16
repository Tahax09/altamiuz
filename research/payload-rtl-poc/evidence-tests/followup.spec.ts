// R-A follow-up: re-tests checks whose first harness was inconclusive (03, 07, 08, 14, 15).
import { test } from '@playwright/test'
import fs from 'node:fs'

const env = process.env
const out: Record<string, unknown> = {}

for (const lng of ['ar', 'en'] as const) {
  test(`followup ${lng}`, async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium')
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await ctx.addCookies([{ name: 'payload-lng', value: lng, url: 'http://localhost:3100' }])
    await ctx.request.post('/api/users/login', {
      data: { email: env.POC_ADMIN_EMAIL, password: env.POC_ADMIN_PASSWORD },
    })
    const page = await ctx.newPage()
    const r: Record<string, unknown> = {}
    const shot = (n: string) => page.screenshot({ path: `evidence/chromium/F-${lng}-${n}.png` })

    // 03 search: diacritic-free vs exact term
    for (const term of ['أمن', 'أَمْنِ', 'صفحة']) {
      await page.goto(`/admin/collections/poc-pages?locale=ar&search=${encodeURIComponent(term)}`)
      await page.waitForLoadState('networkidle')
      r[`03-search:${term}`] = await page.locator('tbody tr').count()
    }

    // 07 array: drag-handle discovery + keyboard via row menu "Move down"
    await page.goto('/admin/collections/poc-pages/1?locale=ar')
    await page.waitForSelector('#field-gallery')
    const caps = () =>
      page.locator('#field-gallery input[id$="__caption"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))
    r['07-before'] = await caps()
    r['07-handles'] = await page
      .locator('#field-gallery [aria-roledescription], #field-gallery [class*="drag"]')
      .evaluateAll((els) =>
        els.slice(0, 4).map((e) => ({
          tag: e.tagName, cls: String(e.className).slice(0, 60), role: e.getAttribute('role'),
          rd: e.getAttribute('aria-roledescription'), label: e.getAttribute('aria-label'), tabindex: e.getAttribute('tabindex'),
        })),
      )
    // keyboard drag attempt on the real handle (if focusable)
    const handle = page.locator('#field-gallery [aria-roledescription="sortable"]').first()
    if (await handle.count()) {
      await handle.focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Space')
      await page.waitForTimeout(400)
      r['07-afterKeyboardDrag'] = await caps()
      r['07-liveRegion'] = await page.locator('[id^="DndLiveRegion"]').allTextContents()
    } else r['07-afterKeyboardDrag'] = 'no focusable sortable handle found'
    // menu path using keyboard only
    const menuBtn = page.locator('#field-gallery .array-actions__button').first()
    await menuBtn.focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    const moveDown = page.getByRole('button', { name: lng === 'ar' ? /التّحريك إلى الأسفل/ : /Move Down/ }).first()
    let menuFocusable = false
    if (await moveDown.count()) {
      await moveDown.focus()
      menuFocusable = await moveDown.evaluate((e) => e === document.activeElement)
      await page.keyboard.press('Enter')
    }
    await page.waitForTimeout(400)
    r['07-menuFocusable'] = menuFocusable
    r['07-afterMenuMove'] = await caps()
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s')
    await page.waitForTimeout(2000)
    await page.reload()
    await page.waitForSelector('#field-gallery')
    r['07-afterReload'] = await caps()
    await shot('07-array')
    // restore original order for the next run
    if (JSON.stringify(r['07-afterReload']) !== JSON.stringify(r['07-before'])) {
      await page.locator('#field-gallery .array-actions__button').first().click()
      await page.getByRole('button', { name: lng === 'ar' ? /التّحريك إلى الأسفل/ : /Move Down/ }).first().click()
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s')
      await page.waitForTimeout(1500)
    }

    // 08 focal point keyboard operability
    await page.goto('/admin/collections/poc-media/1?locale=ar')
    await page.waitForLoadState('networkidle')
    const edit = page.locator('button').filter({ hasText: /edit image|تحرير|تعديل الصورة/i }).first()
    if (await edit.count()) await edit.click()
    await page.waitForTimeout(800)
    r['08-focalControls'] = await page
      .locator('[class*="focal" i]')
      .evaluateAll((els) => els.map((e) => ({ tag: e.tagName, cls: String(e.className).slice(0, 50), tabindex: (e as HTMLElement).tabIndex, role: e.getAttribute('role') })))
    r['08-focalNumericInputs'] = await page.locator('input[name*="focal" i], input[id*="focal" i]').count()
    await shot('08-focal')
    await page.keyboard.press('Escape')

    // 14 validation focus
    await page.goto('/admin/collections/poc-pages/create?locale=ar')
    await page.waitForSelector('#field-title')
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s')
    await page.waitForTimeout(1200)
    r['14-focusAfterError'] = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
    r['14-titleAriaInvalid'] = await page.locator('#field-title').getAttribute('aria-invalid')
    r['14-errorTexts'] = await page.locator('.field-error, [class*="error"]').allTextContents()
    await shot('14-validation')

    // 15 rich-text keyboard trap: does Tab leave the editor? does Escape+Tab?
    await page.goto('/admin/collections/poc-pages/1?locale=ar')
    const ed = page.locator('[data-lexical-editor="true"]').first()
    await ed.click()
    const where = () => page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('data-lexical-editor') === 'true')
    await page.keyboard.press('Tab')
    r['15-tabStillInEditor'] = await where()
    await page.keyboard.press('Escape')
    await page.keyboard.press('Tab')
    r['15-escTabStillInEditor'] = await where()
    await page.keyboard.press('Shift+Tab')
    r['15-shiftTabStillInEditor'] = await where()
    r['15-editorFocusStyle'] = await ed.evaluate((e) => {
      const cs = getComputedStyle(e)
      const p = e.closest('[class*="editor"]') as HTMLElement | null
      return { outline: `${cs.outlineStyle} ${cs.outlineWidth}`, boxShadow: cs.boxShadow, parentOutline: p ? getComputedStyle(p).outlineStyle : null }
    })
    await shot('15-editor-focus')

    out[lng] = r
    fs.writeFileSync('evidence/followup-chromium.json', JSON.stringify(out, null, 2))
    await ctx.close()
  })
}
