// Contact page (CD-10, FR-079): in both languages and at every width, the consent checkbox links
// to the published privacy notice of the same language, which opens in a new tab and resolves.
// Read-only against the e2e seed; submissions are covered by tests/e2e/us5-enquiry.spec.ts.
import { expect, test } from '@playwright/test'

const PAGES = [
  { locale: 'en', path: '/en/contact', dir: 'ltr', link: 'Read the privacy notice' },
  {
    locale: 'ar',
    path: `/ar/${encodeURIComponent('تواصل')}`,
    dir: 'rtl',
    link: 'اقرأ إشعار الخصوصية',
  },
] as const

for (const p of PAGES)
  test(`${p.locale}: the consent checkbox is followed by a link to the privacy notice in the same language`, async ({
    page,
    request,
  }) => {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect((await page.goto(p.path))?.status()).toBe(200)
      await expect(page.locator('article')).toHaveAttribute('dir', p.dir)
      const consent = page.locator('label[for="enq-consent"]')
      const link = page.locator('.field--check a.enquiry__privacy')
      await expect(link).toHaveCount(1)
      await expect(link).toContainText(p.link)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/)
      const href = (await link.getAttribute('href'))!
      expect(href.startsWith(`/${p.locale}/`), href).toBe(true)
      const target = await request.get(href)
      expect(target.status(), href).toBe(200)
      expect(await target.text()).toContain(
        p.locale === 'en' ? 'Privacy notice E2E' : 'إشعار الخصوصية',
      )
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${p.locale} ${width}px`).toBeLessThanOrEqual(0)
      // The checkbox keeps its short name and stays operable through its label.
      await expect(consent).not.toContainText(p.link)
      await consent.click()
      await expect(page.locator('#enq-consent')).toBeChecked()
    }
  })
