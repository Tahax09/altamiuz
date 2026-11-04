// T097 (FR-082): content and navigation are readable with JavaScript disabled.
import { expect, test } from '@playwright/test'
import { ar } from '../../src/modules/i18n/messages/ar'
import { en } from '../../src/modules/i18n/messages/en'

test.use({ javaScriptEnabled: false })

test('pages render content and working navigation without JavaScript', async ({ page }) => {
  await page.goto('/en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home')
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Penetration testing' })
    .click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Penetration testing')
  await expect(page.locator('body')).toContainText('Service body EN')
  await page.locator('.language-switcher a[hreflang="ar"]').click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('اختبار الاختراق')
  await page.goto('/en/services')
  await expect(page.locator('.listing a')).toHaveText(['Penetration testing'])
})

// Task 6 (FR-008, FR-082, WCAG 3.1.1): the 404 is server-rendered, so a client without JavaScript
// still gets the localized message, a way home, the right status and `<html lang dir>`.
const NOT_FOUND = {
  en: { title: en.notFoundTitle, home: en.backHome, dir: 'ltr' },
  ar: { title: ar.notFoundTitle, home: ar.backHome, dir: 'rtl' },
} as const

for (const [path, locale] of [
  ['/en/no-such-page', 'en'], // unknown page slug
  [`/ar/${encodeURIComponent('لا-توجد-صفحة')}`, 'ar'],
  ['/en/services/no-such-service', 'en'], // unknown detail under a static segment
  ['/en/training/no-such-course', 'en'],
  ['/en/a/b/c', 'en'], // deeper than any route
  ['/en/bad%20slug!', 'en'], // characters no slug may contain
  ['/en/%E0%A4%A', 'en'], // malformed percent-encoding
  ['/fr', 'ar'], // unknown locale: the default (A-2) chrome
  ['/fr/about', 'ar'],
  ['/EN/services', 'ar'], // locales are lower-case only
  ['/xx/%E0%A4%A', 'ar'],
] as const) {
  test(`no-JS 404 ${path} is server-rendered in ${locale}`, async ({ page }) => {
    const res = await page.goto(path)
    expect(res?.status(), path).toBe(404)
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', locale)
    await expect(html).toHaveAttribute('dir', NOT_FOUND[locale].dir)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NOT_FOUND[locale].title)
    await expect(page.getByRole('link', { name: NOT_FOUND[locale].home })).toHaveAttribute(
      'href',
      `/${locale}`,
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    // Static HTML, not a client shell waiting for a script to fill it in.
    expect(await res!.text()).toContain(NOT_FOUND[locale].title)
    // L-5: the real site chrome and design system, not a bare page.
    await expect(page.locator('header.site-header')).toBeVisible()
    await expect(page.locator('footer.site-footer')).toBeAttached()
    await expect(
      page.getByRole('navigation', { name: (locale === 'ar' ? ar : en).mainNavigation }).first(),
    ).toBeVisible()
    const button = page.getByRole('link', { name: NOT_FOUND[locale].home })
    expect(await button.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
      'rgb(18, 53, 91)',
    )
    expect(res!.headers()['x-robots-tag']).toBe('noindex, nofollow')
  })
}

test('the internal 404 page path is itself a 404 when requested directly', async ({ page }) => {
  const res = await page.goto('/en/~404')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.notFoundTitle)
})

test('the localized 404 does not swallow the admin, the API or previews', async ({ request }) => {
  const api = await request.get('/api/no-such-collection', { maxRedirects: 0 })
  expect(api.status()).toBe(404)
  expect(api.headers()['content-type']).toContain('application/json')
  expect((await request.get('/admin/login', { maxRedirects: 0 })).status()).toBe(200)
  const preview = await request.get('/preview/pages/1?locale=en', { maxRedirects: 0 })
  expect(await preview.text()).not.toContain(en.notFoundTitle)
  expect((await request.get('/en', { maxRedirects: 0 })).status()).toBe(200)
  expect((await request.get('/ar', { maxRedirects: 0 })).status()).toBe(200)
})
