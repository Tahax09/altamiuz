// T120 (FR-071, FR-072, FR-073, FR-094, SC-011) through the real contact form on the production
// build. The server runs the Turnstile test driver with the always-pass secret; test tokens ask
// for the other outcomes (`test-fail…`, `test-expired…`, `test-unavailable…`), and any token is
// single use. The always-fail and always-duplicate secrets are covered in
// tests/integration/enquiries/access-retention.test.ts (one server cannot switch secrets).
import { expect, test, type Page } from '@playwright/test'
import { contextFor, sql } from '../support/e2e-session'

test.describe.configure({ mode: 'serial' })
test.beforeEach(() => sql('delete from rate_limit_buckets'))

const count = async () =>
  Number((await sql<{ n: number }>('select count(*)::int as n from enquiries'))[0]!.n)

async function fill(page: Page, over: Partial<Record<'name' | 'email' | 'message', string>> = {}) {
  await page.goto('/en/contact')
  await page.getByLabel('Name').fill(over.name ?? 'Abuse Test')
  await page.getByLabel('Email address').fill(over.email ?? 'abuse@example.org')
  await page.getByLabel('Penetration testing').check()
  await page.getByLabel('Message').fill(over.message ?? 'Hello')
  await page.getByLabel('I have read the privacy notice.').check()
}
const setToken = (page: Page, value: string | null) =>
  page.evaluate((v) => {
    const input = document.querySelector<HTMLInputElement>('input[name="turnstileToken"]')!
    if (v === null) input.remove()
    else input.value = v
  }, value)
const submit = async (page: Page) => {
  await page.getByRole('button', { name: 'Send enquiry' }).click()
  const notice = page.getByTestId('enquiry-notice')
  await expect(notice).not.toHaveAttribute('data-status', 'idle')
  return notice
}

test('bot challenge: missing, failed, expired and reused tokens are rejected; nothing stored', async ({
  page,
}) => {
  const before = await count()
  for (const token of [null, 'test-fail-abc', 'test-expired-abc']) {
    await fill(page)
    await setToken(page, token)
    const n = await submit(page)
    await expect(n, String(token)).toHaveAttribute('data-status', 'rejected')
    await expect(n).toHaveText(
      'Your enquiry could not be sent. Please reload the page and try again.',
    )
  }
  // Reuse: the first submission with a token succeeds, the second with the same token fails.
  await fill(page)
  const used = `reused-${Date.now()}`
  await setToken(page, used)
  await expect(await submit(page)).toHaveAttribute('data-status', 'sent')
  await fill(page)
  await setToken(page, used)
  await expect(await submit(page)).toHaveAttribute('data-status', 'rejected')
  expect(await count()).toBe(before + 1)
})

test('challenge service unavailable → the form fails closed (503 outcome), nothing stored', async ({
  page,
}) => {
  const before = await count()
  await fill(page)
  await setToken(page, 'test-unavailable-x')
  const n = await submit(page)
  await expect(n).toHaveAttribute('data-status', 'unavailable')
  await expect(n).toHaveText('The form is temporarily unavailable. Please try again later.')
  expect(await count()).toBe(before)
  // Input is kept.
  await expect(page.getByLabel('Message')).toHaveValue('Hello')
})

test('the 6th submission from one source within 10 minutes is refused with a localized message', async ({
  page,
}) => {
  const statuses: string[] = []
  for (let i = 0; i < 6; i++) {
    await fill(page, { message: `Rate ${i}` })
    statuses.push((await (await submit(page)).getAttribute('data-status'))!)
  }
  expect(statuses).toEqual(['sent', 'sent', 'sent', 'sent', 'sent', 'limited'])
  await expect(page.getByTestId('enquiry-notice')).toHaveText(
    'Too many enquiries were sent from your connection. Please try again in a few minutes.',
  )
})

test('markup and header-injection sequences stay inert text in the stored enquiry and the admin', async ({
  browser,
  page,
}) => {
  const marker = `<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>`
  await fill(page, { name: 'Eve <b>Bold</b>', message: `${marker}\nBcc: victim@example.org` })
  await expect(await submit(page)).toHaveAttribute('data-status', 'sent')
  const [row] = await sql<{ id: number; name: string; message: string }>(
    'select id, name, message from enquiries order by id desc limit 1',
  )
  expect(row!.name).toBe('Eve <b>Bold</b>')
  expect(row!.message).toBe(`${marker}\nBcc: victim@example.org`)
  const ctx = await contextFor(browser, 'enquiryOwner')
  const admin = await ctx.newPage()
  let dialogs = 0
  admin.on('dialog', async (d) => {
    dialogs++
    await d.dismiss()
  })
  await admin.goto(`/admin/collections/enquiries/${row!.id}`)
  await expect(admin.locator('textarea[name="message"]')).toHaveValue(
    `${marker}\nBcc: victim@example.org`,
  )
  expect(
    await admin.evaluate(() => (window as unknown as { __xss?: number }).__xss),
  ).toBeUndefined()
  expect(dialogs).toBe(0)
  await ctx.close()
})

test('a cross-site form post is refused (origin check)', async ({ page, request }) => {
  await page.goto('/en/contact')
  // Server actions need the action id; take it from the rendered form and post from elsewhere.
  const before = await count()
  const r = await request.post('/en/contact', {
    headers: {
      origin: 'https://evil.example',
      'content-type': 'application/x-www-form-urlencoded',
    },
    data: 'name=x&email=x%40example.org&topic=Training&message=x&consent=true&locale=en',
    maxRedirects: 0,
  })
  expect(r.status()).toBeLessThan(500)
  expect(await count()).toBe(before)
})
