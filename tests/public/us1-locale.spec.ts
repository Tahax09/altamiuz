// T096 (FR-001, FR-003, FR-004, FR-007, SC-001, A-3): public site in both languages.
import { expect, test } from '@playwright/test'

const svcAr = `/ar/ar-vocab-pending-services/${encodeURIComponent('اختبار-الاختراق')}`

test('html lang and dir follow the locale', async ({ page }) => {
  for (const [path, lang, dir] of [
    ['/ar', 'ar', 'rtl'],
    ['/en', 'en', 'ltr'],
    ['/en/services', 'en', 'ltr'],
    [svcAr, 'ar', 'rtl'],
  ] as const) {
    const r = await page.goto(path)
    expect(r?.status(), path).toBe(200)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.locator('html')).toHaveAttribute('dir', dir)
  }
})

test('the language switcher reaches the same document in the other language', async ({ page }) => {
  await page.goto('/en/services/penetration-testing')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Penetration testing')
  await page.locator('.language-switcher a[hreflang="ar"]').click()
  await expect(page).toHaveURL(new RegExp(`${encodeURIComponent('اختبار-الاختراق')}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('اختبار الاختراق')
  await page.locator('.language-switcher a[hreflang="en"]').click()
  await expect(page).toHaveURL(/\/en\/services\/penetration-testing$/)
})

test('a document missing in one language: switcher disabled with an explanation', async ({
  page,
}) => {
  await page.goto('/en/training/security-awareness')
  const unavailable = page.locator('.language-switcher [aria-disabled="true"]')
  await expect(unavailable).toBeVisible()
  // The note is in the page's language and names the missing one.
  await expect(unavailable).toContainText('No العربية version of this page')
  await expect(page.locator('.language-switcher a[hreflang="ar"]')).toHaveCount(0)
})

test('visiting the missing language shows a localized notice, never the other text', async ({
  page,
}) => {
  const r = await page.goto('/ar/ar-vocab-pending-training/security-awareness')
  expect(r?.status()).toBe(200)
  await expect(page.locator('.missing-translation h1')).toContainText('غير متوفرة')
  await expect(page.locator('.missing-translation a[hreflang="en"]')).toHaveAttribute(
    'href',
    '/en/training/security-awareness',
  )
  await expect(page.locator('body')).not.toContainText('Course body EN only')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('/ follows A-3: remembered choice, then browser language, then Arabic', async ({
  browser,
}) => {
  for (const [locale, expected] of [
    ['en-GB', '/en'],
    ['ar', '/ar'],
    ['fr-FR', '/ar'],
  ] as const) {
    const ctx = await browser.newContext({ locale })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page).toHaveURL(new RegExp(`${expected}$`))
    await ctx.close()
  }
  const ctx = await browser.newContext({ locale: 'ar' })
  const page = await ctx.newPage()
  await page.goto('/en/services') // remembered
  await page.goto('/')
  await expect(page).toHaveURL(/\/en$/)
  await ctx.close()
})

for (const width of [320, 768, 1440])
  test(`no horizontal scroll and 24px targets at ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    for (const path of ['/ar', '/en', '/en/services', svcAr, '/en/about', '/en/nope-404']) {
      await page.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${path} @${width}`).toBeLessThanOrEqual(0)
      const small = await page.$$eval(
        'header a, header button, footer a, nav a, .site-banner button',
        (els) =>
          els
            .map((e) => e.getBoundingClientRect())
            .filter((r) => r.width > 0 && (r.width < 24 || r.height < 24)).length,
      )
      expect(small, `${path} @${width}`).toBe(0)
    }
    await ctx.close()
  })

test('header, banner and footer come from the published globals', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('.site-banner')).toContainText('E2E banner notice')
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Penetration testing' }),
  ).toHaveAttribute('href', '/en/services/penetration-testing')
  await expect(page.locator('footer')).toContainText('info@example.org')
  await page.goto('/ar')
  await expect(page.locator('.site-banner')).toContainText('إعلان تجريبي')
})

test('banner dismissal is remembered per visitor', async ({ page }) => {
  await page.goto('/en')
  await page.getByRole('button', { name: 'Dismiss announcement' }).click()
  await expect(page.locator('.site-banner')).toBeHidden()
  await page.reload()
  await expect(page.locator('.site-banner')).toBeHidden()
})

test('home lists services automatically; internal CTA resolves through the route map', async ({
  page,
}) => {
  await page.goto('/en')
  await expect(page.locator('[data-block="serviceList"] a')).toHaveText(['Penetration testing'])
  await expect(page.getByRole('link', { name: 'Our services' })).toHaveAttribute(
    'href',
    '/en/services/penetration-testing',
  )
  await expect(page.locator('body')).not.toContainText('Hidden service E2E')
})

test('404 pages are localized with lang and dir after load (FR-008)', async ({ page }) => {
  for (const [path, lang, dir, title] of [
    ['/ar/nope', 'ar', 'rtl', 'الصفحة غير موجودة'],
    ['/en/nope', 'en', 'ltr', 'Page not found'],
  ] as const) {
    const r = await page.goto(path)
    expect(r?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.locator('html')).toHaveAttribute('dir', dir)
    await expect(
      page.getByRole('link', {
        name: lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to the home page',
      }),
    ).toHaveAttribute('href', `/${lang}`)
  }
})
