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
  await c.query('insert into users (email) values ($1) on conflict do nothing', [PROBE])
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

// Views that need an authenticated, MFA-verified administrator. They cannot render until the
// users collection and MFA gate exist (T056, T061); they are measured from Gate 2 onwards.
for (const view of ['dashboard', 'list:audit-events', 'edit:audit-events', 'versions', 'media']) {
  test.fixme(`${view} view (blocked until T056/T061 provide an admin session)`, async () => {})
}

test.afterAll(() => {
  if (UPDATE) fs.writeFileSync(BASELINE, `${JSON.stringify({ ...load(), ...measured }, null, 2)}\n`)
})
