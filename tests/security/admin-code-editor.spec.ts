// E-1 (docs/security/dependency-exceptions.md): how the admin code editor (Monaco, used by
// Payload for JSON/code fields) actually loads on an audit event's document view, against the
// production build and the shipped admin CSP. Payload's CodeEditor uses @monaco-editor/react with
// the default loader, which fetches Monaco from cdn.jsdelivr.net; 'strict-dynamic' lets the
// injected loader's scripts run. Finding F-1 (2026-11-06): third-party JavaScript runs in the
// authenticated admin. The CSP is not weakened here; the intended rule is pinned as an expected
// failure until F-1 is fixed, and the current footprint is pinned so any change is noticed.
import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'
import pg from 'pg'

type Acct = { id: number; email: string; password: string; secret: string; enrolledAt: number }
const BASE = process.env.SITE_URL!
const ORIGIN = { origin: BASE }
/** The only third-party origin observed (2026-11-06): Monaco 0.55.1 from jsDelivr. */
const CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/'

type Observed = {
  status: number
  csp: string
  requests: { url: string; type: string }[]
  violations: { directive: string; blocked: string }[]
  failed: string[]
  editorVisible: boolean
  monacoMounted: number
}

test.describe.configure({ mode: 'serial' })

let ctx: BrowserContext
let seen: Observed

async function signIn(browser: Browser) {
  const a = (
    JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as Record<string, Acct>
  ).monacoOwner!
  const c = await browser.newContext({ baseURL: BASE })
  const login = await c.request.post('/api/users/login', {
    data: { email: a.email, password: a.password },
    headers: ORIGIN,
  })
  expect(login.status()).toBe(200)
  while (Math.floor(Date.now() / 30_000) <= Math.floor(a.enrolledAt / 30_000))
    await new Promise((r) => setTimeout(r, 500))
  const v = await c.request.post('/api/users/mfa/verify', {
    data: { code: await generate({ secret: a.secret }) },
    headers: ORIGIN,
  })
  expect(v.status(), await v.text()).toBe(200)
  return c
}

async function auditEventWithMeta() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  try {
    const row = (
      await c.query('select id from audit_events where meta is not null order by id desc limit 1')
    ).rows[0] as { id: number } | undefined
    expect(row, 'seeded runs record audit events with meta').toBeTruthy()
    return row!.id
  } finally {
    await c.end()
  }
}

async function observe(page: Page, id: number): Promise<Observed> {
  const requests: Observed['requests'] = []
  const failed: string[] = []
  page.on('request', (r) => requests.push({ url: r.url(), type: r.resourceType() }))
  page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`))
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: { directive: string; blocked: string }[] }
    w.__csp = []
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push({ directive: e.effectiveDirective, blocked: e.blockedURI }),
    )
  })
  const res = await page.goto(`/admin/collections/audit-events/${id}`)
  const editor = page.locator('.field-type.json-field .code-editor')
  await expect(editor).toBeVisible()
  // Monaco mounts asynchronously after the loader resolves.
  await expect(page.locator('.code-editor .monaco-editor')).toHaveCount(1, { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  return {
    status: res!.status(),
    csp: res!.headers()['content-security-policy'] ?? '',
    requests,
    violations: await page.evaluate(
      () => (window as unknown as { __csp: Observed['violations'] }).__csp,
    ),
    failed,
    editorVisible: await editor.isVisible(),
    monacoMounted: await page.locator('.code-editor .monaco-editor').count(),
  }
}

const crossOrigin = (o: Observed) =>
  o.requests.filter(
    (r) => !r.url.startsWith(BASE) && !r.url.startsWith('blob:') && !r.url.startsWith('data:'),
  )

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000)
  ctx = await signIn(browser)
  const page = await ctx.newPage()
  seen = await observe(page, await auditEventWithMeta())
})
test.afterAll(async () => ctx?.close())

test('audit event view: the shipped admin CSP is served unchanged', () => {
  expect(seen.status).toBe(200)
  // Same policy as buildCsp('admin') (ADR-004); no CDN host has been added to make Monaco work.
  expect(seen.csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'(;|$)/)
  expect(seen.csp).toContain("style-src 'self' 'unsafe-inline'")
  expect(seen.csp).toContain("connect-src 'self'")
  expect(seen.csp).toContain("worker-src 'self' blob:")
  expect(seen.csp).toContain("object-src 'none'")
  expect(seen.csp).not.toMatch(/jsdelivr|https:\/\/|\*/)
})

test('audit event view: the CSP blocks the CDN stylesheet and nothing else', () => {
  // Proves the policy is enforced on this view: the only violation is Monaco's CDN stylesheet.
  expect(seen.violations).toEqual([
    { directive: 'style-src-elem', blocked: `${CDN}editor/editor.main.css` },
  ])
  expect(seen.failed).toEqual([`${CDN}editor/editor.main.css csp`])
})

test('audit event view: third-party requests are limited to the known Monaco CDN path (F-1)', () => {
  const external = crossOrigin(seen)
  test.info().annotations.push({
    type: 'F-1 third-party requests',
    description: external.map((r) => `${r.type} ${r.url}`).join('\n'),
  })
  // Pins the current footprint: a new host, a new Monaco version or a non-script/style type fails.
  expect(external.length).toBeGreaterThan(0)
  for (const r of external) {
    expect(r.url.startsWith(CDN), r.url).toBe(true)
    expect(['script', 'stylesheet', 'other'], `${r.type} ${r.url}`).toContain(r.type)
  }
  // The JSON field still renders read-only.
  expect(seen.editorVisible).toBe(true)
  expect(seen.monacoMounted).toBe(1)
})

test('audit event view: the admin runs no third-party script (intended rule; F-1 open)', () => {
  // Expected to fail until F-1 is fixed (self-host Monaco or replace the field's editor). When the
  // fix lands this test passes, Playwright reports the unexpected pass, and `test.fail` goes.
  test.fail(
    true,
    'F-1: Monaco loads from cdn.jsdelivr.net (docs/security/dependency-exceptions.md E-1)',
  )
  const scripts = crossOrigin(seen).filter((r) => r.type === 'script')
  expect(scripts.map((r) => r.url)).toEqual([])
})
