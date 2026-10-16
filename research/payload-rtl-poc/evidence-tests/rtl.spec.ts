// R-A evidence collector. Records measurements; never asserts success it did not observe.
import AxeBuilder from '@axe-core/playwright'
import { type BrowserContext, type Page, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

type Status = 'pass' | 'partial' | 'fail' | 'blocked' | 'not-tested'
type Result = { check: string; config: string; width: number; status: Status; data: unknown }

const env = process.env
const OUT = path.resolve('evidence')
const results: Result[] = []

async function login(ctx: BrowserContext, email: string, password: string, lng: 'ar' | 'en') {
  await ctx.addCookies([{ name: 'payload-lng', value: lng, url: 'http://localhost:3100' }])
  const res = await ctx.request.post('/api/users/login', { data: { email, password } })
  if (!res.ok()) throw new Error(`login failed ${res.status()}`)
}

async function shot(page: Page, browser: string, name: string) {
  const dir = path.join(OUT, browser)
  fs.mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: false })
}

async function record(
  r: Omit<Result, 'status' | 'data'>,
  fn: () => Promise<{ status: Status; data: unknown }>,
) {
  try {
    const { status, data } = await fn()
    results.push({ ...r, status, data })
  } catch (e) {
    results.push({ ...r, status: 'blocked', data: String(e).slice(0, 400) })
  }
}

const htmlDir = (page: Page) =>
  page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }))

for (const cfg of [
  { id: 'C1', lng: 'ar' as const, label: 'Arabic UI + Arabic content' },
  { id: 'C2', lng: 'en' as const, label: 'English UI + Arabic content' },
]) {
  for (const width of [1440, 768]) {
    test(`${cfg.id} ${width}`, async ({ browser, browserName }) => {
      const full = browserName === 'chromium'
      const ctx = await browser.newContext({ viewport: { width, height: 900 } })
      const page = await ctx.newPage()
      const tag = (n: string) => `${cfg.id}-${n}-${width}`
      const base = { config: cfg.id, width }

      // 1 login screen
      await record({ ...base, check: '01-login' }, async () => {
        await ctx.addCookies([{ name: 'payload-lng', value: cfg.lng, url: 'http://localhost:3100' }])
        await page.goto('/admin/login')
        await page.waitForSelector('#field-email')
        await shot(page, browserName, tag('01-login'))
        const d = await htmlDir(page)
        const want = cfg.lng === 'ar' ? 'rtl' : 'ltr'
        return { status: d.dir === want ? 'pass' : 'fail', data: d }
      })

      await login(ctx, env.POC_ADMIN_EMAIL!, env.POC_ADMIN_PASSWORD!, cfg.lng)

      // 2 navigation side
      await record({ ...base, check: '02-nav' }, async () => {
        await page.goto('/admin')
        await page.waitForLoadState('networkidle')
        if (width < 1000) {
          const toggle = page.locator('button.nav-toggler, [aria-label*="menu" i]').first()
          if (await toggle.count()) await toggle.click().catch(() => {})
          await page.waitForTimeout(400)
        }
        await shot(page, browserName, tag('02-nav'))
        const box = await page.locator('nav, aside.nav, .nav').first().boundingBox()
        const d = await htmlDir(page)
        const side = box ? (box.x + box.width / 2 < width / 2 ? 'left' : 'right') : 'none'
        const want = cfg.lng === 'ar' ? 'right' : 'left'
        return { status: side === want ? 'pass' : side === 'none' ? 'blocked' : 'fail', data: { ...d, side, box } }
      })

      // 3 list view + Arabic search
      await record({ ...base, check: '03-list' }, async () => {
        await page.goto('/admin/collections/poc-pages?locale=ar')
        await page.waitForSelector('table, .collection-list')
        const search = page.locator('input[type="text"]').first()
        await search.fill('أمن')
        await page.waitForTimeout(800)
        await shot(page, browserName, tag('03-list'))
        const align = await page
          .locator('th')
          .first()
          .evaluate((el) => getComputedStyle(el).textAlign)
          .catch(() => 'n/a')
        const rows = await page.locator('tbody tr').count()
        return { status: rows > 0 ? 'pass' : 'partial', data: { thAlign: align, rowsAfterArabicSearch: rows } }
      })

      const editUrl = '/admin/collections/poc-pages/1?locale=ar'

      // 4 field direction (Arabic content locale)
      await record({ ...base, check: '04-field-direction' }, async () => {
        await page.goto(editUrl)
        await page.waitForSelector('#field-title')
        await page.waitForTimeout(800)
        await shot(page, browserName, tag('04-edit'))
        const read = (sel: string) =>
          page
            .locator(sel)
            .first()
            .evaluate((el) => ({ dirAttr: el.getAttribute('dir'), computed: getComputedStyle(el).direction }))
            .catch(() => null)
        const data = {
          title: await read('#field-title'),
          summary: await read('#field-summary'),
          number: await read('#field-durationDays'),
          html: await htmlDir(page),
        }
        const ok = data.title?.computed === 'rtl' && data.summary?.computed === 'rtl'
        return { status: ok ? 'pass' : 'fail', data }
      })

      // 5 rich text direction + unsafe paste
      await record({ ...base, check: '05-richtext' }, async () => {
        const ed = page.locator('[data-lexical-editor="true"]').first()
        await ed.waitFor()
        const dir = await ed.evaluate((el) => ({
          computed: getComputedStyle(el).direction,
          pDir: el.querySelector('p')?.getAttribute('dir') ?? null,
        }))
        await ed.click()
        await page.keyboard.press('End')
        const pasted = await ed.evaluate((el) => {
          const dt = new DataTransfer()
          dt.setData(
            'text/html',
            '<p>نص ملصوق <b>عريض</b><script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">رابط</a><iframe src="https://example.com"></iframe></p>',
          )
          dt.setData('text/plain', 'نص ملصوق')
          el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }))
          return new Promise<string>((r) => setTimeout(() => r(el.innerHTML), 500))
        })
        await shot(page, browserName, tag('05-richtext'))
        const unsafe = /<script|onerror=|javascript:|<iframe/i.test(pasted)
        const ok = dir.computed === 'rtl' || dir.pDir === 'rtl'
        return {
          status: ok && !unsafe ? 'pass' : unsafe ? 'fail' : 'partial',
          data: { dir, unsafeMarkupInEditorDom: unsafe, pastedSample: pasted.slice(0, 300) },
        }
      })

      // 6 mixed-direction string rendering (visual evidence + bidi attributes)
      await record({ ...base, check: '06-mixed-direction' }, async () => {
        const s = page.locator('#field-summary')
        await s.scrollIntoViewIfNeeded()
        await shot(page, browserName, tag('06-mixed'))
        const v = await s.inputValue()
        return { status: 'partial', data: { note: 'visual review of screenshot required', value: v } }
      })

      if (full) {
        // 7 array keyboard reorder + persistence
        await record({ ...base, check: '07-array-reorder' }, async () => {
          const field = page.locator('#field-gallery')
          await field.scrollIntoViewIfNeeded()
          const captions = async () =>
            field.locator('input[id^="field-gallery__"][id$="__caption"]').evaluateAll((els) =>
              els.map((e) => (e as HTMLInputElement).value),
            )
          const before = await captions()
          const handle = field.locator('[aria-roledescription="sortable"], .drag-handle, [class*="drag"]').first()
          const handleInfo = await handle
            .evaluate((el) => ({ tag: el.tagName, role: el.getAttribute('role'), label: el.getAttribute('aria-label'), tabindex: el.getAttribute('tabindex'), cls: el.className }))
            .catch(() => null)
          let keyboard = 'no-handle'
          if (handleInfo) {
            await handle.focus()
            await page.keyboard.press('Space')
            await page.waitForTimeout(200)
            await page.keyboard.press('ArrowDown')
            await page.waitForTimeout(200)
            await page.keyboard.press('Space')
            await page.waitForTimeout(500)
            keyboard = 'attempted'
          }
          const live = await page
            .locator('[id^="DndLiveRegion"], [aria-live="assertive"], [aria-live="polite"]')
            .allTextContents()
          const afterKeyboard = await captions()
          // row action menu alternative (move down)
          const menuBtn = field.locator('button.array-actions__button, [class*="array-actions"] button').first()
          let menuItems: string[] = []
          if (await menuBtn.count()) {
            await menuBtn.click()
            await page.waitForTimeout(300)
            menuItems = await page.locator('.popup__content button, [class*="array-actions__action"]').allTextContents()
            await page.keyboard.press('Escape')
          }
          await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s')
          await page.waitForTimeout(1500)
          await page.reload()
          await page.waitForSelector('#field-gallery')
          const afterReload = await captions()
          await shot(page, browserName, tag('07-array'))
          const moved = JSON.stringify(before) !== JSON.stringify(afterKeyboard)
          const persisted = JSON.stringify(afterKeyboard) === JSON.stringify(afterReload)
          return {
            status: moved && persisted ? 'pass' : moved ? 'partial' : 'fail',
            data: { before, afterKeyboard, afterReload, handleInfo, keyboard, liveRegionText: live.filter(Boolean).slice(0, 4), menuItems },
          }
        })

        // 8 focal point UI
        await record({ ...base, check: '08-focal-point' }, async () => {
          await page.goto('/admin/collections/poc-media/1?locale=ar')
          await page.waitForLoadState('networkidle')
          const editBtn = page.getByRole('button', { name: /edit image|تحرير الصورة|edit|تعديل/i }).first()
          let opened = false
          if (await editBtn.count()) {
            await editBtn.click().catch(() => {})
            await page.waitForTimeout(800)
            opened = true
          }
          await shot(page, browserName, tag('08-focal'))
          const focalInputs = await page.locator('input[name*="focal" i], [class*="focal" i]').count()
          return { status: focalInputs > 0 ? 'partial' : 'fail', data: { opened, focalElements: focalInputs, note: 'keyboard operability judged from screenshot/DOM' } }
        })

        // 9 date picker
        await record({ ...base, check: '09-date' }, async () => {
          await page.goto(editUrl)
          const date = page.locator('#field-startsOn input, .date-time-picker input').first()
          await date.click()
          await page.waitForTimeout(500)
          await shot(page, browserName, tag('09-date'))
          const month = await page.locator('.react-datepicker__current-month, [class*="current-month"]').first().textContent().catch(() => null)
          const pickerDir = await page.locator('.react-datepicker').first().evaluate((e) => getComputedStyle(e).direction).catch(() => null)
          await page.keyboard.press('Escape')
          return { status: month ? 'partial' : 'blocked', data: { month, pickerDir } }
        })

        // 10 select + relationship with Arabic type-ahead
        await record({ ...base, check: '10-dropdowns' }, async () => {
          const rel = page.locator('#field-service .rs__control, #field-service [class*="control"]').first()
          await rel.click()
          await page.keyboard.type('اختبار')
          await page.waitForTimeout(800)
          const opts = await page.locator('.rs__option').allTextContents()
          await shot(page, browserName, tag('10-relationship'))
          await page.keyboard.press('Escape')
          const menuDir = await page.locator('#field-service').evaluate((e) => getComputedStyle(e).direction)
          return { status: opts.length ? 'pass' : 'partial', data: { optionsForArabicQuery: opts, fieldDirection: menuDir } }
        })

        // 11 publish controls (UI) – semantics measured separately via API
        await record({ ...base, check: '11-publish-ui' }, async () => {
          await page.goto(editUrl)
          await page.waitForSelector('#field-title')
          const popupBtn = page.locator('.popup-button, [class*="publish"] [aria-haspopup], button[id*="publish"]').first()
          let options: string[] = []
          const publishButtons = await page.locator('button').filter({ hasText: /publish|نشر/i }).allTextContents()
          if (await popupBtn.count()) {
            await popupBtn.click().catch(() => {})
            await page.waitForTimeout(300)
            options = await page.locator('.popup__content button, .popup-button-list__button').allTextContents()
          }
          await shot(page, browserName, tag('11-publish'))
          await page.keyboard.press('Escape')
          return { status: 'partial', data: { publishButtons, options } }
        })

        // 13 document locking with a second user
        await record({ ...base, check: '13-locking' }, async () => {
          await page.goto(editUrl)
          await page.waitForSelector('#field-title')
          await page.locator('#field-title').click()
          await page.keyboard.type(' ')
          await page.waitForTimeout(2500)
          const ctx2 = await browser.newContext({ viewport: { width, height: 900 } })
          await login(ctx2, env.POC_EDITOR_EMAIL!, env.POC_EDITOR_PASSWORD!, cfg.lng)
          const p2 = await ctx2.newPage()
          await p2.goto(editUrl)
          await p2.waitForTimeout(2500)
          await shot(p2, browserName, tag('13-locked'))
          const modal = await p2.locator('[class*="document-locked"], [class*="locked"]').count()
          await ctx2.close()
          await page.keyboard.press('Backspace')
          return { status: modal > 0 ? 'pass' : 'fail', data: { lockedIndicators: modal } }
        })

        // 14 validation error presentation
        await record({ ...base, check: '14-validation' }, async () => {
          await page.goto('/admin/collections/poc-pages/create?locale=ar')
          await page.waitForSelector('#field-title')
          await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s')
          await page.waitForTimeout(1200)
          await shot(page, browserName, tag('14-validation'))
          const err = await page.locator('.field-error, [class*="tooltip--error"], .toast, [role="alert"]').allTextContents()
          const toastDir = await page.locator('.toast, [data-sonner-toast]').first().evaluate((e) => getComputedStyle(e).direction).catch(() => null)
          const active = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
          return { status: err.length ? 'partial' : 'fail', data: { messages: err.slice(0, 5), toastDir, focusAfterError: active } }
        })

        // 15 keyboard focus visibility / not obscured on edit view
        await record({ ...base, check: '15-keyboard-focus' }, async () => {
          await page.goto(editUrl)
          await page.waitForSelector('#field-title')
          await page.locator('body').click({ position: { x: 5, y: 300 } })
          const samples: { el: string; visible: boolean; obscured: boolean }[] = []
          for (let i = 0; i < 45; i++) {
            await page.keyboard.press('Tab')
            samples.push(
              await page.evaluate(() => {
                const a = document.activeElement as HTMLElement | null
                if (!a || a === document.body) return { el: 'body', visible: false, obscured: false }
                const cs = getComputedStyle(a)
                const visible =
                  (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'
                const r = a.getBoundingClientRect()
                const top = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 8))
                const obscured = !!top && !a.contains(top) && !top.contains(a)
                return { el: `${a.tagName}#${a.id}.${String(a.className).slice(0, 30)}`, visible, obscured }
              }),
            )
          }
          const noIndicator = samples.filter((s) => s.el !== 'body' && !s.visible).length
          const obscured = samples.filter((s) => s.obscured).length
          return {
            status: noIndicator === 0 && obscured === 0 ? 'pass' : 'partial',
            data: { stops: samples.length, withoutVisibleIndicator: noIndicator, obscured, sample: samples.slice(0, 12) },
          }
        })

        // 16 axe on admin views
        await record({ ...base, check: '16-axe' }, async () => {
          const urls = [
            '/admin',
            '/admin/collections/poc-pages?locale=ar',
            editUrl,
            '/admin/collections/poc-pages/1/versions?locale=ar',
            '/admin/collections/poc-media/1?locale=ar',
          ]
          const out: Record<string, { serious: number; critical: number; ids: string[] }> = {}
          for (const u of urls) {
            await page.goto(u)
            await page.waitForLoadState('networkidle')
            const r = await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
              .analyze()
            const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
            out[u] = {
              serious: bad.filter((v) => v.impact === 'serious').length,
              critical: bad.filter((v) => v.impact === 'critical').length,
              ids: bad.map((v) => `${v.id}(${v.nodes.length})`),
            }
          }
          const total = Object.values(out).reduce((n, v) => n + v.serious + v.critical, 0)
          return { status: total === 0 ? 'pass' : 'fail', data: out }
        })
      }

      fs.mkdirSync(OUT, { recursive: true })
      fs.writeFileSync(
        path.join(OUT, `results-${browserName}-${cfg.id}-${width}.json`),
        JSON.stringify(results.filter((r) => r.config === cfg.id && r.width === width), null, 2),
      )
      await ctx.close()
    })
  }
}
