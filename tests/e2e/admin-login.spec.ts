// Sign-in through the real /admin/login page (FR-030, FR-033). The page's form posts multipart
// `_payload`, which the project's login route rejected until 2026-10-29, so nobody could sign in
// from the admin; every earlier test signed in through the JSON API. Covers an enrolled account
// (password → TOTP → dashboard), a first sign-in that enrols the second factor, and a wrong
// password, all in the browser.
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'
import pg from 'pg'

type Acct = { email: string; password: string; secret?: string; enrolledAt?: number }
const F = () =>
  JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as Record<string, Acct>

test.describe.configure({ mode: 'serial' })
// Every project signs in from 127.0.0.1; earlier projects use most of the per-IP sign-in and MFA
// budgets (see tests/e2e/us7-nav.spec.ts). This file starts with empty buckets in its disposable
// database; the limits themselves are covered by the auth suites.
test.beforeAll(async () => {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  await c.query('delete from rate_limit_buckets')
  await c.end()
})

async function submitLogin(page: import('@playwright/test').Page, a: Acct, password = a.password) {
  await page.goto('/admin/login')
  await page.locator('#field-email').fill(a.email)
  await page.locator('#field-password').fill(password)
  await page.waitForLoadState('networkidle') // the form does nothing until hydrated
  await page.getByRole('button', { name: /^log ?in$/i }).click()
}

/** A TOTP code in a step after the given time (codes are single-use). */
async function freshCode(secret: string, after = Date.now()) {
  while (Math.floor(Date.now() / 30_000) <= Math.floor(after / 30_000))
    await new Promise((r) => setTimeout(r, 500))
  return generate({ secret })
}

test('an enrolled user signs in on the admin login page, then with the second factor', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const a = F().loginOwner!
  await submitLogin(page, a)
  await expect(page).toHaveURL(/\/account\/mfa/, { timeout: 15_000 })
  await page
    .getByLabel('6-digit code from your authenticator app')
    .fill(await freshCode(a.secret!, a.enrolledAt))
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 15_000 })
  await expect(page.getByText('Header navigation').first()).toBeVisible({ timeout: 30_000 })
})

test('a new user signs in on the admin login page and enrols the second factor', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const a = F().loginNew!
  await submitLogin(page, a)
  await expect(page).toHaveURL(/\/account\/mfa/, { timeout: 15_000 })
  await page.getByRole('button', { name: /Set up two-factor authentication/ }).click()
  const secret = (await page.locator('#secret').textContent())!.trim()
  expect(secret).toMatch(/^[A-Z2-7]{16,}$/)
  await page.getByLabel('6-digit code', { exact: true }).fill(await freshCode(secret))
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByRole('button', { name: 'Continue to the CMS' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to the CMS' }).click()
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 15_000 })
  await expect(page.getByText('Header navigation').first()).toBeVisible({ timeout: 30_000 })
})

test('a wrong password on the admin login page is refused with the uniform message', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await submitLogin(page, F().loginOwner!, 'not the right password 1')
  await expect(
    page.getByText('Sign-in failed. Check your details or try again later.'),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/login/)
})
