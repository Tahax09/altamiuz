// T040 (FR-080a, SC-019, D-25): admin accessibility regression suite. Measures every admin view
// that can render, compares with tests/a11y/admin/baseline.json, and fails on any serious or
// critical finding not in the baseline. Regenerate the baseline deliberately with
// A11Y_UPDATE_BASELINE=1 (review the diff; never to hide a regression).
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import pg from 'pg'

const BASELINE = 'tests/a11y/admin/baseline.json'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const UPDATE = process.env.A11Y_UPDATE_BASELINE === '1'

type Finding = { rule: string; impact: string; nodes: number }
type Baseline = Record<string, Finding[]>

const load = (): Baseline =>
  fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {}

// With zero users Payload redirects to the blocked first-user screen; a hash-less probe row lets
// the login view render (nobody can sign in with it). Removed afterwards.
const PROBE = 'a11y-probe@localhost.invalid'
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

const measured: Baseline = {}

test('login view: no new serious/critical findings', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.locator('#field-email')).toBeVisible()
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const findings: Finding[] = r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ rule: v.id, impact: v.impact!, nodes: v.nodes.length }))
    .sort((a, b) => a.rule.localeCompare(b.rule))
  measured.login = findings
  const base = load().login ?? []
  const known = new Set(base.map((f) => f.rule))
  const fresh = findings.filter((f) => !known.has(f.rule))
  if (!UPDATE) expect(fresh, `new serious/critical findings: ${JSON.stringify(fresh)}`).toEqual([])
})

// Authenticated views, measured with the seeded MFA-verified owner (tests/support/e2e-seed.ts).
type Acct = { email: string; password: string; secret: string; enrolledAt: number; id: number }
const owner = (): Acct =>
  JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')).owner

async function analyse(page: import('@playwright/test').Page, key: string) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const findings: Finding[] = r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ rule: v.id, impact: v.impact!, nodes: v.nodes.length }))
    .sort((a, b) => a.rule.localeCompare(b.rule))
  measured[key] = findings
  const known = new Set((load()[key] ?? []).map((f) => f.rule))
  const fresh = findings.filter((f) => !known.has(f.rule))
  if (!UPDATE)
    expect(fresh, `new serious/critical findings on ${key}: ${JSON.stringify(fresh)}`).toEqual([])
}

test('authenticated admin views: no new serious/critical findings', async ({ page }) => {
  test.setTimeout(120_000)
  const { generate } = await import('otplib')
  const o = owner()
  const origin = { origin: process.env.SITE_URL! }
  expect(
    (
      await page.request.post('/api/users/login', {
        data: { email: o.email, password: o.password },
        headers: origin,
      })
    ).status(),
  ).toBe(200)
  while (Math.floor(Date.now() / 30_000) <= Math.floor(o.enrolledAt / 30_000) + 1)
    await page.waitForTimeout(500)
  const v = await page.request.post('/api/users/mfa/verify', {
    data: { code: await generate({ secret: o.secret }) },
    headers: origin,
  })
  expect(v.status(), await v.text()).toBe(200)
  for (const [key, path] of [
    ['dashboard', '/admin'],
    ['list:users', '/admin/collections/users'],
    ['edit:users', `/admin/collections/users/${o.id}`],
    ['list:audit-events', '/admin/collections/audit-events'],
    ['list:invitations', '/admin/collections/invitations'],
    ['create:invitations', '/admin/collections/invitations/create'],
    ['list:pages', '/admin/collections/pages'],
    [
      'edit:pages',
      `/admin/collections/pages/${JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')).content.pageId}`,
    ],
    ['create:pages', '/admin/collections/pages/create'],
    ['list:redirects', '/admin/collections/redirects'],
  ] as const) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await analyse(page, key)
  }
})

// Project-built account pages must have zero serious/critical findings (FR-080), not a baseline.
for (const path of [
  '/account/recover',
  '/account/accept-invite',
  '/account/mfa',
  '/account/security',
]) {
  test(`project page ${path}: zero serious/critical findings`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(bad.map((v) => `${v.id}(${v.nodes.length})`)).toEqual([])
  })
}

test.afterAll(() => {
  if (UPDATE) fs.writeFileSync(BASELINE, `${JSON.stringify({ ...load(), ...measured }, null, 2)}\n`)
})
