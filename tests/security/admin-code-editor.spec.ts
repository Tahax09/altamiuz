// F-1 closed (docs/security/dependency-exceptions.md E-1): the admin loads no third-party code.
// Payload's JSON field mounted Monaco from cdn.jsdelivr.net; audit-events.meta (the only JSON/code
// field) now uses a read-only viewer. Against the production build with the shipped admin CSP:
// the audit event view shows the metadata as escaped text, and a sweep of admin views records
// every request and every CSP violation: no request leaves the site's origin, no violation occurs.
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { contextFor, fixturesFile, sql } from '../support/e2e-session'

const BASE = () => process.env.SITE_URL!
type Seen = {
  requests: { url: string; type: string }[]
  violations: { directive: string; blocked: string }[]
}

test.describe.configure({ mode: 'serial' })
let ctx: BrowserContext
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000)
  ctx = await contextFor(browser, 'monacoOwner')
})
test.afterAll(async () => ctx?.close())

async function visit(page: Page, path: string, ready?: (p: Page) => Promise<void>): Promise<Seen> {
  const requests: Seen['requests'] = []
  const onReq = (r: { url: () => string; resourceType: () => string }) =>
    requests.push({ url: r.url(), type: r.resourceType() })
  page.on('request', onReq)
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: { directive: string; blocked: string }[] }
    w.__csp = []
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push({ directive: e.effectiveDirective, blocked: e.blockedURI }),
    )
  })
  const res = await page.goto(path)
  expect(res?.status(), path).toBe(200)
  expect(res?.headers()['content-security-policy'], path).toMatch(
    /script-src 'self' 'nonce-[^';]+'(;|$)/, // no 'strict-dynamic': third-party scripts refused
  )
  if (ready) await ready(page)
  await page.waitForLoadState('networkidle')
  const violations = await page.evaluate(
    () => (window as unknown as { __csp: Seen['violations'] }).__csp,
  )
  page.off('request', onReq)
  return { requests, violations }
}

const external = (s: Seen) =>
  s.requests.filter(
    (r) => !r.url.startsWith(BASE()) && !r.url.startsWith('blob:') && !r.url.startsWith('data:'),
  )

test('audit event view: metadata renders as read-only text, no editor, nothing third-party', async () => {
  const marker = `<img src=x onerror="window.__xss=1">"quoted" & </pre><script>window.__xss=2</script>`
  const [row] = await sql<{ id: number }>(
    `insert into audit_events (at, actor, action, outcome, meta)
     values (now(), 'system', 'settings.change', 'success', $1::jsonb) returning id`,
    [JSON.stringify({ global: marker, count: 3, nested: { ok: true } })],
  )
  const page = await ctx.newPage()
  const seen = await visit(page, `/admin/collections/audit-events/${row!.id}`, async (p) => {
    await expect(p.getByTestId('json-viewer')).toBeVisible({ timeout: 30_000 })
  })
  const viewer = page.getByTestId('json-viewer')
  const text = await viewer.textContent()
  expect(JSON.parse(text!)).toEqual({ global: marker, count: 3, nested: { ok: true } })
  await expect(viewer).toHaveAttribute('aria-readonly', 'true')
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  await expect(page.locator('.monaco-editor, .code-editor')).toHaveCount(0)
  expect(external(seen)).toEqual([])
  expect(seen.violations).toEqual([])
  // Keyboard users can reach and scroll the viewer.
  await viewer.focus()
  await expect(viewer).toBeFocused()
  await page.close()
})

test('admin sweep: no third-party request and no CSP violation on any main view', async () => {
  test.setTimeout(240_000)
  const f = fixturesFile()
  const [media] = await sql<{ id: number }>('select id from media order by id limit 1')
  const [audit] = await sql<{ id: number }>('select id from audit_events order by id desc limit 1')
  const paths = [
    '/admin',
    '/admin/collections/users',
    `/admin/collections/users/${f.monacoOwner!.id}`,
    '/admin/collections/audit-events',
    `/admin/collections/audit-events/${audit!.id}`,
    '/admin/collections/pages',
    `/admin/collections/pages/${f.content.pageId}`,
    '/admin/collections/pages/create',
    '/admin/collections/services',
    '/admin/collections/courses',
    '/admin/collections/media',
    '/admin/collections/media/create',
    ...(media ? [`/admin/collections/media/${media.id}`] : []),
    '/admin/collections/redirects',
    '/admin/globals/site-settings',
    '/admin/globals/header-nav',
    '/admin/globals/banner',
  ]
  const report: Record<string, { external: string[]; violations: Seen['violations'] }> = {}
  for (const p of paths) {
    await sql('delete from payload_locked_documents')
    const page = await ctx.newPage()
    const seen = await visit(page, p)
    report[p] = {
      external: external(seen).map((r) => `${r.type} ${r.url}`),
      violations: seen.violations,
    }
    await page.close()
  }
  test
    .info()
    .annotations.push({ type: 'admin sweep', description: JSON.stringify(report, null, 1) })
  for (const [p, r] of Object.entries(report)) {
    expect(r.external, `third-party requests on ${p}`).toEqual([])
    expect(r.violations, `CSP violations on ${p}`).toEqual([])
  }
})

test('the admin CSP refuses a third-party script even when page code injects it', async () => {
  const page = await ctx.newPage()
  const cdn = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js'
  const responses: string[] = []
  const failures: string[] = []
  page.on('response', (r) => {
    if (r.url().startsWith('https://cdn.jsdelivr.net')) responses.push(r.url())
  })
  page.on('requestfailed', (r) => {
    if (r.url().startsWith('https://cdn.jsdelivr.net')) failures.push(r.failure()?.errorText ?? '')
  })
  await visit(page, '/admin')
  const result = await page.evaluate(
    (src) =>
      new Promise<{ loaded: boolean; violation: string | null }>((resolve) => {
        let violation: string | null = null
        document.addEventListener('securitypolicyviolation', (e) => {
          if (e.blockedURI.startsWith('https://cdn.jsdelivr.net')) violation = e.effectiveDirective
        })
        const s = document.createElement('script')
        s.src = src
        s.onload = () => resolve({ loaded: true, violation })
        s.onerror = () => setTimeout(() => resolve({ loaded: false, violation }), 100)
        document.head.appendChild(s)
      }),
    cdn,
  )
  expect(result).toEqual({ loaded: false, violation: 'script-src-elem' })
  // The browser cancels the request itself (no response ever arrives from the CDN).
  expect(responses).toEqual([])
  expect(failures).toEqual(['csp'])
  await page.close()
})
