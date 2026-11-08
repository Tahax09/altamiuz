// T040 (FR-080a, SC-019, D-25): admin accessibility regression suite. Measures every admin view
// that can render, compares with tests/a11y/admin/baseline.json, and fails on any serious or
// critical finding not in the baseline. Regenerate the baseline deliberately with
// A11Y_UPDATE_BASELINE=1 (review the diff; never to hide a regression).
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import pg from 'pg'
import { validPng } from '../../fixtures/uploads/generate'

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
  JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')).a11yOwner

async function analyse(page: import('@playwright/test').Page, key: string) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const findings: Finding[] = r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ rule: v.id, impact: v.impact!, nodes: v.nodes.length }))
    .sort((a, b) => a.rule.localeCompare(b.rule))
  measured[key] = findings
  // Node targets for triage (core vs project origin), never compared: test-results only.
  fs.mkdirSync('test-results/a11y', { recursive: true })
  const nodesFile = 'test-results/a11y/admin-nodes.json'
  const all = fs.existsSync(nodesFile) ? JSON.parse(fs.readFileSync(nodesFile, 'utf8')) : {}
  all[key] = r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ rule: v.id, targets: v.nodes.map((n) => String(n.target[0])) }))
  fs.writeFileSync(nodesFile, JSON.stringify(all, null, 2))
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
  // Every list is measured with rows in it, as in use: an empty list has no row checkboxes or
  // sort controls, so its findings depended on what earlier suites had left in the shared
  // database. One media item through the real upload path:
  const upload = await page.request.post('/api/media?locale=en', {
    headers: origin,
    multipart: {
      file: { name: 'a11y.png', mimeType: 'image/png', buffer: await validPng(64, 48) },
      _payload: JSON.stringify({ alt: 'Accessibility baseline sample' }),
    },
  })
  expect(upload.status(), await upload.text()).toBe(201)
  // Likewise one enquiry and one invitation, which the seed does not create but other suites may.
  const c = db()
  await c.connect()
  await c.query(
    `insert into enquiries (name, email, topic, message, locale, delete_after)
     values ('A11y baseline', 'a11y-enquiry@example.invalid', 'general', 'Baseline row', 'en', now() + interval '1 day')`,
  )
  await c.query(
    `insert into invitations (email, role, expires_at)
     values ('a11y-invite@example.invalid', 'editor', now() + interval '1 day')`,
  )
  await c.end()
  for (const [key, path] of [
    ['dashboard', '/admin'],
    ['list:users', '/admin/collections/users'],
    ['edit:users', `/admin/collections/users/${o.id}`],
    ['list:audit-events', '/admin/collections/audit-events'],
    ['list:invitations', '/admin/collections/invitations'],
    ['create:invitations', '/admin/collections/invitations/create'],
    // Two rows per page, so the pagination controls are always measured (A-13), whatever number
    // of pages earlier suites created in the shared e2e database.
    ['list:pages', '/admin/collections/pages?limit=2'],
    [
      'edit:pages',
      `/admin/collections/pages/${JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')).content.pageId}`,
    ],
    ['create:pages', '/admin/collections/pages/create'],
    ['list:redirects', '/admin/collections/redirects'],
    // T138: views added after the WS8/WS9 baselines (US4 media, US5 enquiries, US7 globals,
    // versions). Findings here are recorded in docs/accessibility/admin-findings.md.
    ['list:media', '/admin/collections/media'],
    ['create:media', '/admin/collections/media/create'],
    ['list:enquiries', '/admin/collections/enquiries'],
    [
      'versions:pages',
      `/admin/collections/pages/${JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')).content.pageId}/versions`,
    ],
    ['global:site-settings', '/admin/globals/site-settings'],
    ['global:header-nav', '/admin/globals/header-nav'],
  ] as const) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    if (key === 'list:pages') {
      // A-13: the previous/next controls exist and carry names (PaginationLabels provider).
      await expect(page.locator('button.clickable-arrow--left')).toHaveAttribute(
        'aria-label',
        'Previous page',
      )
      await expect(page.locator('button.clickable-arrow--right')).toHaveAttribute(
        'aria-label',
        'Next page',
      )
    }
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
