// W-1 site chrome and page templates in a real browser (Chromium and WebKit): header menus with
// keyboard, Escape and outside-click behaviour, the no-JS mobile menu, breadcrumbs that match the
// structured data, listing introductions and empty states, course facts, related items and the
// contact call to action, the legal outline, entrance motion (and none under reduced motion),
// layout at 320/768/1440 px in both languages, and the client JavaScript budget.
import fs from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const F = () =>
  JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as {
    public: { termsId: number }
  }

const PAGES = [
  '/en/services',
  '/ar/ar-vocab-pending-services',
  '/en/training',
  '/ar/ar-vocab-pending-training',
  '/en/services/penetration-testing',
  `/ar/ar-vocab-pending-services/${encodeURIComponent('اختبار-الاختراق')}`,
  '/en/training/security-awareness',
  '/en/terms-e2e',
  '/en/about',
  '/en/contact',
]

const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

test.describe('desktop header', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('a menu group opens by click or keyboard and closes with Escape or outside click', async ({
    page,
  }) => {
    await page.goto('/en/services')
    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    const group = nav.locator('details.site-nav__group')
    const toggle = group.locator('summary')
    await expect(group).not.toHaveAttribute('open', '')
    await toggle.click()
    await expect(group).toHaveAttribute('open', '')
    await expect(nav.getByRole('link', { name: 'About the company' })).toHaveAttribute(
      'href',
      '/en/about',
    )
    // The parent's own target comes first in the panel; route links resolve per language.
    await expect(nav.getByRole('link', { name: 'Learning' })).toHaveAttribute(
      'href',
      '/en/training',
    )
    await expect(nav.getByRole('link', { name: 'All services' })).toHaveAttribute(
      'href',
      '/en/services',
    )
    await page.keyboard.press('Escape')
    await expect(group).not.toHaveAttribute('open', '')
    await expect(toggle).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(group).toHaveAttribute('open', '')
    await page.mouse.click(1400, 860) // outside the panel
    await expect(group).not.toHaveAttribute('open', '')
  })

  test('the current page is marked and the contact action comes from site settings', async ({
    page,
  }) => {
    await page.goto('/en/contact')
    const cta = page.locator('.site-header__cta')
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/en/contact')
    await expect(cta).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('.site-menu')).toBeHidden()
  })
})

test.describe('mobile header', () => {
  test.use({ viewport: { width: 375, height: 740 } })

  test('the menu opens and lists the navigation; desktop nav is hidden', async ({ page }) => {
    await page.goto('/en/services')
    await expect(page.locator('.site-nav--desktop')).toBeHidden()
    const menu = page.locator('details.site-menu')
    await menu.locator('summary').click()
    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(nav.getByRole('link', { name: 'Penetration testing' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'About the company' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/en/contact')
    expect(await noOverflow(page)).toBe(true)
    await page.keyboard.press('Escape')
    await expect(menu).not.toHaveAttribute('open', '')
  })

  test('the menu works without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 740 },
    })
    const page = await ctx.newPage()
    await page.goto('/ar/ar-vocab-pending-services')
    await page.locator('details.site-menu summary').click()
    await page
      .getByRole('navigation', { name: 'التنقل الرئيسي' })
      .getByRole('link', { name: 'اختبار الاختراق' })
      .click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('اختبار الاختراق')
    await ctx.close()
  })
})

test('breadcrumbs match the BreadcrumbList structured data', async ({ page }) => {
  await page.goto('/en/services/penetration-testing')
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(crumbs.getByRole('link')).toHaveText(['Home', 'Services'])
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Penetration testing')
  const names = await page.evaluate(() => {
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      const graph = (JSON.parse(s.textContent ?? '{}')['@graph'] ?? []) as {
        '@type': string
        itemListElement?: { name: string }[]
      }[]
      const list = graph.find((n) => n['@type'] === 'BreadcrumbList')
      if (list) return list.itemListElement!.map((i) => i.name)
    }
    return []
  })
  expect(names).toEqual(['Home', 'Services', 'Penetration testing'])
})

test('listings use the CMS introduction; an empty listing says so and offers contact', async ({
  page,
}) => {
  await page.goto('/en/services')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Services')
  await expect(page.locator('.page-header .lead')).toHaveText('E2E services introduction.')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'E2E services introduction.',
  )
  await page.goto('/en/training')
  await expect(page.locator('.listing a')).toHaveText([
    'Security awareness course',
    'Risk assessment course',
  ])
  // Courses are English-only fixtures: the Arabic listing is empty.
  await page.goto('/ar/ar-vocab-pending-training')
  await expect(page.locator('.empty-state')).toContainText('لا توجد دورات منشورة حالياً.')
  await expect(page.locator('.empty-state a')).toHaveAttribute(
    'href',
    `/ar/${encodeURIComponent('تواصل')}`,
  )
})

test('a course shows its facts, related courses and the contact call to action', async ({
  page,
}) => {
  await page.goto('/en/training/security-awareness')
  const facts = page.locator('.course-facts dl')
  await expect(facts.locator('dt')).toHaveText(['Audience', 'Duration', 'Format'])
  await expect(facts.locator('dd')).toHaveText(['All staff', '2 days', 'Online'])
  await expect(page.locator('.related .listing a')).toHaveText(['Risk assessment course'])
  const cta = page.locator('.cta-band')
  await expect(cta.getByRole('heading', { level: 2 })).toHaveText('Ask about this course')
  await expect(cta.getByRole('link')).toHaveAttribute('href', '/en/contact')
  // A service with no other published services has no related list, but keeps the call to action.
  await page.goto('/en/services/penetration-testing')
  await expect(page.locator('.related')).toHaveCount(0)
  await expect(page.locator('.cta-band a')).toHaveAttribute('href', '/en/contact')
})

test('legal pages have an outline linking to each section', async ({ page }) => {
  expect(F().public.termsId).toBeGreaterThan(0)
  await page.goto('/en/terms-e2e')
  const toc = page.getByRole('navigation', { name: 'On this page' })
  await expect(toc.getByRole('link')).toHaveText(['First topic', 'Second topic', 'Third topic'])
  await toc.getByRole('link', { name: 'Third topic' }).click()
  await expect(page).toHaveURL(/#legal-3$/)
  await expect(page.locator('#legal-3')).toBeInViewport()
  // Not hidden under the sticky header (WCAG 2.4.11).
  const [headerBottom, sectionTop] = await page.evaluate(() => [
    document.querySelector('.site-header')!.getBoundingClientRect().bottom,
    document.querySelector('#legal-3 h2')!.getBoundingClientRect().top,
  ])
  expect(sectionTop).toBeGreaterThanOrEqual(headerBottom)
})

test.describe('entrance motion', () => {
  test.use({ viewport: { width: 375, height: 640 } })

  test('content below the fold settles in when scrolled to, then keeps no inline styles', async ({
    page,
  }) => {
    await page.goto('/en/training/security-awareness')
    const item = page.locator('.cta-band__inner')
    await expect(item).toHaveAttribute('style', /opacity: 0/)
    await item.scrollIntoViewIfNeeded()
    await expect(item).not.toHaveAttribute('style', /opacity/, { timeout: 5000 })
    expect(await item.evaluate((e) => getComputedStyle(e).opacity)).toBe('1')
    // Above the fold: never hidden.
    expect(await page.locator('.page-header').getAttribute('style')).toBeNull()
  })

  test('reduced motion: nothing is hidden or animated', async ({ browser }) => {
    const ctx = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 375, height: 640 },
    })
    const page = await ctx.newPage()
    await page.goto('/en/training/security-awareness')
    await page.waitForLoadState('networkidle')
    expect(await page.locator('[style*="opacity"]').count()).toBe(0)
    await ctx.close()
  })
})

test('templates: one h1, no horizontal overflow at 320/768/1440 px in both languages', async ({
  browser,
}) => {
  test.setTimeout(180_000)
  for (const width of [320, 768, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    for (const path of PAGES) {
      const r = await page.goto(path)
      expect(r?.status(), path).toBe(200)
      await expect(page.locator('h1'), `${path} @${width}`).toHaveCount(1)
      expect(await noOverflow(page), `${path} @${width}`).toBe(true)
    }
    await ctx.close()
  }
})

test('detail and listing pages stay within the client JavaScript budget', async ({ browser }) => {
  for (const path of ['/en/services', '/en/training/security-awareness', '/en/terms-e2e']) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const bytes = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter(
          (e) =>
            (e as PerformanceResourceTiming).initiatorType === 'script' ||
            /\.js(\?|$)/.test(e.name),
        )
        .reduce((n, e) => n + (e as PerformanceResourceTiming).transferSize, 0),
    )
    expect(bytes, path).toBeGreaterThan(0)
    expect(bytes, path).toBeLessThanOrEqual(150 * 1024)
    await ctx.close()
  }
})
