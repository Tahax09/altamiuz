// T121 (FR-070, FR-071, FR-074, FR-076, SC-010 partial): the visitor's path in both languages on
// the production build. The enquiry is stored before the confirmation is shown; delivery runs as a
// job (`POST /api/jobs/run`, signed). Email content, retries and the operator alert are covered in
// tests/integration/enquiries/access-retention.test.ts (the browser suites use the in-memory mail
// driver); real SMTP delivery to Mailpit in tests/integration/enquiries/mailpit.test.ts.
import { expect, test, type Page } from '@playwright/test'
import { contextFor, ORIGIN, sql } from '../support/e2e-session'

test.describe.configure({ mode: 'serial' })
test.beforeEach(() => sql('delete from rate_limit_buckets'))

const latest = async () =>
  (
    await sql<{ id: number; name: string; locale: string; topic: string; delivery_status: string }>(
      'select id, name, locale, topic, delivery_status from enquiries order by id desc limit 1',
    )
  )[0]

test('English: a valid enquiry is stored before the confirmation, then delivered by the job runner', async ({
  page,
  request,
}) => {
  await page.goto('/en/contact')
  await page.getByLabel('Name').fill('Visitor One')
  await page.getByLabel('Email address').fill('visitor.one@example.org')
  await page.getByLabel('Organization (optional)').fill('Example Co')
  await page.getByLabel('Training').check()
  await page.getByLabel('Message').fill('Please send details of the awareness course.')
  await page.getByLabel('I have read the privacy notice.').check()
  await page.getByRole('button', { name: 'Send enquiry' }).click()
  const notice = page.getByTestId('enquiry-notice')
  await expect(notice).toHaveText('Thank you. Your enquiry has been received.')
  await expect(notice).toHaveAttribute('role', 'status')
  await expect(notice).toBeFocused()
  const row = (await latest())!
  expect([row.name, row.locale, row.topic, row.delivery_status]).toEqual([
    'Visitor One',
    'en',
    'Training',
    'pending',
  ])
  const run = await request.post('/api/jobs/run', {
    headers: { authorization: `Bearer ${process.env.JOBS_SIGNING_SECRET}` },
  })
  expect(run.status()).toBe(200)
  expect(
    (
      await sql<{ s: string }>('select delivery_status s from enquiries where id = $1', [row.id])
    )[0]!.s,
  ).toBe('sent')
})

test('Arabic: localized, accessible field errors; input is kept; consent is required', async ({
  page,
}) => {
  await page.goto(`/ar/${encodeURIComponent('تواصل')}`)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.getByLabel('الاسم').fill('زائر')
  await page.getByLabel('البريد الإلكتروني').fill('ليس-بريدا')
  await page.getByLabel('الرسالة').fill('نص الرسالة')
  await page.getByRole('button', { name: 'إرسال الاستفسار' }).click()
  const notice = page.getByTestId('enquiry-notice')
  await expect(notice).toHaveText('يُرجى تصحيح الحقول المُشار إليها.')
  await expect(notice).toHaveAttribute('role', 'alert')
  const email = page.getByLabel('البريد الإلكتروني')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAccessibleDescription('أدخل عنوان بريد إلكتروني صحيحًا.')
  await expect(page.getByText('يُرجى تأكيد اطّلاعك على إشعار الخصوصية.')).toBeVisible()
  await expect(
    page.getByText('اختر موضوعًا من القائمة.').or(page.getByText('هذا الحقل مطلوب.')).first(),
  ).toBeVisible()
  await expect(page.getByLabel('الاسم')).toHaveValue('زائر')
  await expect(page.getByLabel('الرسالة')).toHaveValue('نص الرسالة')
  // Fix and resend with an Arabic topic.
  await email.fill('zaer@example.org')
  await page.getByLabel('اختبار الاختراق').check()
  await page.getByLabel('اطّلعتُ على إشعار الخصوصية.').check()
  await page.getByRole('button', { name: 'إرسال الاستفسار' }).click()
  await expect(notice).toHaveText('شكرًا لك. تم استلام استفسارك.')
  const row = (await latest())!
  expect([row.name, row.locale, row.topic]).toEqual(['زائر', 'ar', 'اختبار الاختراق'])
})

test('works without JavaScript (progressive enhancement)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL: process.env.SITE_URL })
  const page: Page = await ctx.newPage()
  await page.goto('/en/contact')
  await page.getByLabel('Name').fill('No Script')
  await page.getByLabel('Email address').fill('noscript@example.org')
  await page.getByLabel('Penetration testing').check()
  await page.getByLabel('Message').fill('Sent without JavaScript.')
  await page.getByLabel('I have read the privacy notice.').check()
  await page.getByRole('button', { name: 'Send enquiry' }).click()
  await expect(page.getByTestId('enquiry-notice')).toHaveText(
    'Thank you. Your enquiry has been received.',
  )
  expect((await latest())!.name).toBe('No Script')
  await ctx.close()
})

test('the inbox: Owners see enquiries (audited); Editors are denied in the admin and by direct request', async ({
  browser,
}) => {
  const row = (await latest())!
  const owner = await contextFor(browser, 'enquiryInboxOwner')
  const p = await owner.newPage()
  await p.goto(`/admin/collections/enquiries/${row.id}`)
  await expect(p.locator('input[name="name"]')).toHaveValue(row.name)
  const views = await sql('select 1 from audit_events where action = $1 and target_id = $2', [
    'enquiry.view',
    String(row.id),
  ])
  expect(views.length).toBeGreaterThan(0)
  await owner.close()
  const editor = await contextFor(browser, 'enquiryEditor')
  const e = await editor.newPage()
  const api = await editor.request.get(`/api/enquiries/${row.id}`, { headers: ORIGIN() })
  expect(api.status()).toBe(403)
  await e.goto('/admin/collections/enquiries')
  await expect(e.getByText(row.name)).toHaveCount(0)
  await editor.close()
})
