// T018 / ADR-004 measurement: the admin login renders under the shipped CSP with zero
// violations, and a stricter candidate (no style 'unsafe-inline') is measured for comparison.
import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import pg from 'pg'

// With zero users Payload redirects to the (blocked) first-user screen, so the login view only
// renders once a users row exists. The probe row has no password hash: nobody can sign in with
// it. It is removed after the run.
const PROBE = 'csp-probe@localhost.invalid'
const db = () => new pg.Client({ connectionString: process.env.DATABASE_URL })

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  const c = db()
  await c.connect()
  await c.query('insert into users (email, name) values ($1, $2) on conflict do nothing', [
    PROBE,
    'probe',
  ])
  await c.end()
})

test.afterAll(async () => {
  const c = db()
  await c.connect()
  await c.query('delete from users where email = $1', [PROBE])
  await c.end()
})

async function violations(page: Page) {
  return page.evaluate(() => (window as unknown as { __csp: string[] }).__csp ?? [])
}

async function prepare(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] }
    w.__csp = []
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push(`${e.effectiveDirective} ${e.blockedURI || 'inline'}`),
    )
  })
}

test('admin login renders with zero CSP violations under the shipped policy', async ({
  page,
  browserName,
}) => {
  await prepare(page)
  await page.goto('/admin/login')
  await expect(page.locator('#field-email')).toBeVisible()
  const v = await violations(page)
  fs.mkdirSync('test-results', { recursive: true })
  fs.writeFileSync(`test-results/csp-shipped-${browserName}.json`, JSON.stringify(v, null, 2))
  expect(v).toEqual([])
})

test('stricter candidate without style unsafe-inline (measurement only)', async ({
  page,
  browserName,
}) => {
  await prepare(page)
  await page.route('**/admin/login', async (route) => {
    const res = await route.fetch()
    const csp = (res.headers()['content-security-policy'] ?? '').replace(
      "style-src 'self' 'unsafe-inline'",
      "style-src 'self'",
    )
    await route.fulfill({
      response: res,
      headers: { ...res.headers(), 'content-security-policy': csp },
    })
  })
  await page.goto('/admin/login')
  await page.waitForTimeout(1500)
  const v = await violations(page)
  fs.writeFileSync(
    `test-results/csp-strict-candidate-${browserName}.json`,
    JSON.stringify(v, null, 2),
  )
  test.info().annotations.push({ type: 'violations', description: String(v.length) })
})
