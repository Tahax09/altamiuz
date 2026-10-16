// US2 over real HTTP against a production build. T077: preview is session-gated (anonymous,
// password-only and unknown → 404), never indexed or cached, and there is no shareable preview
// endpoint. T073: preview markup equals the shared renderer's output. T076: document locking.
// Also: drafts never leak to anonymous REST/GraphQL, and responses carry no cacheable draft data.
import { expect, request as pwRequest, test, type APIRequestContext } from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'

type Acct = { id: number; email: string; password: string; secret?: string; enrolledAt?: number }
type Fixtures = Record<string, Acct> & { content: { pageId: number } }
const F = () => JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as Fixtures
const BASE = process.env.SITE_URL!
const ORIGIN = { origin: BASE }
test.describe.configure({ mode: 'serial' })

const used = new Map<string, number>()
async function freshCode(a: Acct) {
  const step = () => Math.floor(Date.now() / 30_000)
  // Other spec files may have used this account's current step, so treat it as used on first use.
  if (!used.has(a.email)) used.set(a.email, step())
  while (step() <= Math.floor((a.enrolledAt ?? 0) / 30_000) || used.get(a.email)! >= step())
    await new Promise((r) => setTimeout(r, 500))
  used.set(a.email, step())
  return generate({ secret: a.secret! })
}

// One sign-in per account and mode: the per-account login limit (5 / 15 min) is shared with the
// other security specs in the same run.
const sessions = new Map<string, Promise<APIRequestContext>>()
function signedIn(a: Acct, verify: boolean): Promise<APIRequestContext> {
  const key = `${a.email}:${verify}`
  if (!sessions.has(key)) sessions.set(key, signIn(a, verify))
  return sessions.get(key)!
}

async function signIn(a: Acct, verify: boolean): Promise<APIRequestContext> {
  const ctx = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: ORIGIN })
  expect(
    (
      await ctx.post('/api/users/login', { data: { email: a.email, password: a.password } })
    ).status(),
  ).toBe(200)
  if (verify) {
    const v = await ctx.post('/api/users/mfa/verify', { data: { code: await freshCode(a) } })
    expect(v.status(), await v.text()).toBe(200)
  }
  return ctx
}

const previewPath = (locale = 'en') => `/preview/pages/${F().content.pageId}?locale=${locale}`

test('T077 anonymous, password-only and malformed preview requests get 404 with no draft text', async ({
  request,
}) => {
  for (const p of [
    previewPath(),
    previewPath('ar'),
    '/preview/users/1',
    '/preview/audit-events/1',
    '/preview/pages/abc',
    `/preview/pages/${F().content.pageId}%20OR%201=1`,
  ]) {
    const r = await request.get(p)
    expect(r.status(), p).toBe(404)
    expect(await r.text()).not.toContain('Draft-only English body')
  }
  const po = await signedIn(F().passwordOnly!, false)
  const r = await po.get(previewPath())
  expect(r.status()).toBe(404)
  expect(await r.text()).not.toContain('Draft-only English body')
})

test('T077 preview for an MFA-verified user renders the draft with noindex and no-store', async () => {
  const ctx = await signedIn(F().editor!, true)
  const r = await ctx.get(previewPath())
  expect(r.status()).toBe(200)
  const html = await r.text()
  expect(html).toContain('Draft-only English body')
  expect(r.headers()['x-robots-tag']).toContain('noindex')
  expect(r.headers()['cache-control']).toMatch(/no-store/)
  expect(r.headers()['cache-control']).not.toMatch(/public|s-maxage/)
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/)
  // Arabic preview is the Arabic draft, right-to-left, without English fallback.
  const ar = await (await ctx.get(previewPath('ar'))).text()
  expect(ar).toContain('dir="rtl"')
  expect(ar).toContain('<bdi>ISO 27001</bdi>')
  expect(ar).not.toContain('Draft-only English body')
})

test('T073 preview markup equals the shared renderer output for the same document', async () => {
  const ctx = await signedIn(F().publisher!, true)
  const html = await (await ctx.get(previewPath())).text()
  const article = /<article[\s\S]*<\/article>/.exec(html)?.[0]
  expect(article).toBeTruthy()
  const doc = await (
    await ctx.get(
      `/api/pages/${F().content.pageId}?draft=true&locale=en&depth=1&fallback-locale=none`,
    )
  ).json()
  const { execFileSync } = await import('node:child_process')
  const rendered = execFileSync('pnpm', ['-s', 'exec', 'tsx', 'tests/support/render-doc.tsx'], {
    input: JSON.stringify({ doc, locale: 'en' }),
    encoding: 'utf8',
  })
  expect(article).toBe(rendered)
})

test('no shareable preview link exists: tokens, query secrets and Payload preview routes do nothing', async ({
  request,
}) => {
  for (const p of [
    `${previewPath()}&token=anything`,
    `${previewPath()}&secret=x&draft=true`,
    `/api/preview?slug=e2e-draft`,
    `/api/draft?secret=x`,
    `/next/preview?slug=e2e-draft`,
  ]) {
    const r = await request.get(p, { maxRedirects: 0 })
    expect(r.status(), p).toBeGreaterThanOrEqual(400)
    expect(await r.text()).not.toContain('Draft-only English body')
  }
})

test('anonymous REST and GraphQL never return draft or published content', async ({ request }) => {
  const id = F().content.pageId
  for (const p of [
    '/api/pages',
    `/api/pages/${id}`,
    `/api/pages/${id}?draft=true`,
    '/api/pages/versions',
    '/api/services',
    '/api/courses',
    `/api/pages?where[slug][equals]=e2e-draft`,
  ]) {
    const r = await request.get(p, { headers: ORIGIN })
    expect(r.status(), p).toBe(403)
    expect(await r.text()).not.toContain('Draft-only English body')
  }
  const g = await request.post('/api/graphql', {
    headers: ORIGIN,
    data: { query: '{ Pages(draft: true) { docs { title } } }' },
  })
  expect(await g.text()).not.toContain('E2E draft page')
})

test('authenticated content API responses are not cacheable by shared caches', async () => {
  const ctx = await signedIn(F().editor!, true)
  const r = await ctx.get(`/api/pages/${F().content.pageId}?draft=true`)
  expect(r.status()).toBe(200)
  expect(r.headers()['cache-control'] ?? '').not.toMatch(/public|s-maxage/)
})

test('an Editor cannot publish over HTTP; a Publisher can, per locale', async () => {
  const ed = await signedIn(F().editor!, true)
  const id = F().content.pageId
  const denied = await ed.patch(`/api/pages/${id}?locale=en`, { data: { _status: 'published' } })
  expect(denied.status()).toBe(403)
  const viaDraftFlag = await ed.patch(`/api/pages/${id}?locale=en&draft=true`, {
    data: { _status: 'published' },
  })
  expect(viaDraftFlag.status()).toBe(403)
  const restore = await ed.post(`/api/pages/versions/1`)
  expect([403, 404]).toContain(restore.status())
})

test('T076 a document open in one session is shown as locked to another user', async ({
  browser,
}) => {
  const id = F().content.pageId
  const open = async (a: Acct) => {
    const context = await browser.newContext({ baseURL: BASE })
    const page = await context.newPage()
    const login = await page.request.post('/api/users/login', {
      data: { email: a.email, password: a.password },
      headers: ORIGIN,
    })
    expect(login.status()).toBe(200)
    const v = await page.request.post('/api/users/mfa/verify', {
      data: { code: await freshCode(a) },
      headers: ORIGIN,
    })
    expect(v.status()).toBe(200)
    return page
  }
  const first = await open(F().editor!)
  await first.goto(`/admin/collections/pages/${id}`)
  await expect(first.locator('#field-title')).toBeVisible({ timeout: 30_000 })
  // Payload 3.91.0 takes the lock when the user starts editing, not when the view opens.
  await first.locator('#field-title').fill('Being edited by the first user')
  await first.waitForTimeout(3_000)

  const second = await open(F().owner!)
  await second.goto(`/admin/collections/pages/${id}`)
  await expect(second.getByText(/currently editing/i).first()).toBeVisible({ timeout: 30_000 })
  // The lock is enforced by the server too: a plain REST update from the second user is refused.
  const r = await second.request.patch(`/api/pages/${id}?draft=true&locale=ar`, {
    data: { title: 'Overwrite attempt' },
    headers: ORIGIN,
  })
  expect(r.status()).toBe(423)
})

test('T071 pasting hostile HTML into the admin rich-text editor never persists unsafe content', async ({
  browser,
}) => {
  test.setTimeout(120_000)
  const context = await browser.newContext({ baseURL: BASE })
  const page = await context.newPage()
  const a = F().administrator!
  await page.request.post('/api/users/login', {
    data: { email: a.email, password: a.password },
    headers: ORIGIN,
  })
  const v = await page.request.post('/api/users/mfa/verify', {
    data: { code: await freshCode(a) },
    headers: ORIGIN,
  })
  expect(v.status()).toBe(200)
  // A page of its own: the seeded page is still locked by the T076 session.
  const created = await page.request.post('/api/pages?draft=true&locale=en', {
    headers: ORIGIN,
    data: {
      title: 'Paste target',
      slug: `paste-${Date.now()}`,
      sections: [
        {
          blockType: 'richText',
          content: {
            root: {
              type: 'root',
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  version: 1,
                  children: [{ type: 'text', version: 1, text: 'start', format: 0 }],
                },
              ],
            },
          },
        },
      ],
    },
  })
  expect(created.status(), await created.text()).toBe(201)
  const pasteId = ((await created.json()) as { doc: { id: number } }).doc.id
  await page.goto(`/admin/collections/pages/${pasteId}?locale=en`)
  await page.waitForLoadState('networkidle')
  const editor = page.locator('[contenteditable="true"]').first()
  await editor.click()
  await editor.evaluate((el) => {
    const dt = new DataTransfer()
    dt.setData(
      'text/html',
      '<p>pasted <a href="javascript:alert(1)">bad link</a> <img src=x onerror="alert(2)"> ' +
        '<span style="background:url(javascript:alert(3))">styled</span> <a href="data:text/html,x">d</a></p>',
    )
    dt.setData('text/plain', 'pasted bad link')
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    )
  })
  await expect(editor).toContainText('pasted')
  const save = page.getByRole('button', { name: /save draft/i })
  await save.click()
  await page.waitForTimeout(3_000)
  const pg = (await import('pg')).default
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  const rows = await c.query(
    `select content::text as c from _pages_v_blocks_rich_text_locales
     union all select content::text from pages_blocks_rich_text_locales`,
  )
  await c.end()
  const stored = rows.rows.map((r) => r.c as string).join('\n')
  expect(stored).not.toMatch(/javascript:|data:text|onerror|background:url/i)
})
