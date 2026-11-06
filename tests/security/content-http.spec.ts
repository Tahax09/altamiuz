// US2 over real HTTP against a production build. T077: preview is session-gated (anonymous,
// password-only and unknown → 404), never indexed or cached, and there is no shareable preview
// endpoint. T073: preview markup equals the shared renderer's output. T076: document locking.
// Also: drafts never leak to anonymous REST/GraphQL, and responses carry no cacheable draft data.
import { expect, request as pwRequest, test, type APIRequestContext } from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'
import { sql } from '../support/e2e-session'

type Acct = { id: number; email: string; password: string; secret?: string; enrolledAt?: number }
type Fixtures = Record<string, Acct> & { content: { pageId: number } }
const F = () => JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as Fixtures
const BASE = process.env.SITE_URL!
const ORIGIN = { origin: BASE }
test.describe.configure({ mode: 'serial' })
// Every project signs in from 127.0.0.1, and MFA verification allows 30 attempts per IP per 15
// minutes; earlier specs in a full run use most of that budget (as in tests/e2e/us7-nav.spec.ts).
// The limits themselves are tested in tests/security/auth-http.spec.ts.
test.beforeAll(() => sql('delete from rate_limit_buckets'))

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
  test.setTimeout(120_000) // includes a TOTP step wait and a tsx render process
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
  // Only this test's page (the seed deliberately stores a poisoned page elsewhere).
  const rows = await c.query(
    `select l.content::text as c from _pages_v_blocks_rich_text_locales l
       join _pages_v_blocks_rich_text b on b.id = l._parent_id
       join _pages_v v on v.id = b._parent_id where v.parent_id = $1
     union all
     select l.content::text from pages_blocks_rich_text_locales l
       join pages_blocks_rich_text b on b.id = l._parent_id where b._parent_id = $1`,
    [pasteId],
  )
  await c.end()
  const stored = rows.rows.map((r) => r.c as string).join('\n')
  expect(stored).not.toMatch(/javascript:|data:text|onerror|background:url/i)
})

test.describe('WS10 document locks and concurrency', () => {
  const db = async () => {
    const pg = (await import('pg')).default
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
    await c.connect()
    return c
  }
  const lockFor = async (userId: number) => {
    const c = await db()
    await c.query('delete from payload_locked_documents')
    const lock = await c.query(
      `insert into payload_locked_documents (updated_at, created_at) values (now(), now()) returning id`,
    )
    const id = lock.rows[0].id as number
    await c.query(
      `insert into payload_locked_documents_rels (parent_id, path, pages_id) values ($1, 'document', $2)`,
      [id, F().content.pageId],
    )
    await c.query(
      `insert into payload_locked_documents_rels (parent_id, path, users_id) values ($1, 'user', $2)`,
      [id, userId],
    )
    await c.end()
    return id
  }
  const lockExists = async (id: number) => {
    const c = await db()
    const r = await c.query('select 1 from payload_locked_documents where id = $1', [id])
    await c.end()
    return r.rowCount === 1
  }
  const listPath = () =>
    `/api/payload-locked-documents?where[document.relationTo][equals]=pages&where[document.value][equals]=${F().content.pageId}`

  test('password-only and anonymous sessions cannot read, create, change or delete locks', async ({
    request,
  }) => {
    const lockId = await lockFor(F().editor!.id)
    const po = await signedIn(F().passwordOnly!, false)
    for (const ctx of [po, request]) {
      expect((await ctx.get(listPath(), { headers: ORIGIN })).status()).toBe(403)
      expect(
        (await ctx.delete(`/api/payload-locked-documents/${lockId}`, { headers: ORIGIN })).status(),
      ).toBe(403)
      expect(
        (
          await ctx.patch(`/api/payload-locked-documents/${lockId}`, {
            headers: ORIGIN,
            data: { user: { relationTo: 'users', value: F().passwordOnly!.id } },
          })
        ).status(),
      ).toBe(403)
      expect(
        (await ctx.post('/api/payload-locked-documents', { headers: ORIGIN, data: {} })).status(),
      ).toBe(403)
    }
    expect(await lockExists(lockId)).toBe(true)
  })

  test("verified users cannot delete someone else's lock or assign it to another user", async () => {
    const lockId = await lockFor(F().editor!.id)
    const pub = await signedIn(F().publisher!, true)
    expect((await pub.delete(`/api/payload-locked-documents/${lockId}`)).status()).toBe(403)
    expect(
      (
        await pub.patch(`/api/payload-locked-documents/${lockId}`, {
          data: { user: { relationTo: 'users', value: F().owner!.id } },
        })
      ).status(),
    ).toBe(403)
    expect(
      (
        await pub.post('/api/payload-locked-documents', {
          data: { document: { relationTo: 'pages', value: 1 } },
        })
      ).status(),
    ).toBe(403)
    expect(await lockExists(lockId)).toBe(true)
    // Take-over (after Payload's warning dialog) assigns the lock to the requester only.
    const take = await pub.patch(`/api/payload-locked-documents/${lockId}`, {
      data: { user: { relationTo: 'users', value: F().publisher!.id } },
    })
    expect(take.status()).toBe(200)
    // The owner of a lock can release it.
    expect((await pub.delete(`/api/payload-locked-documents/${lockId}`)).status()).toBe(200)
    expect(await lockExists(lockId)).toBe(false)
  })

  test('lock listings carry only what the lock dialog needs', async () => {
    await lockFor(F().editor!.id)
    const owner = await signedIn(F().owner!, true)
    const ownerView = await (await owner.get(listPath())).json()
    expect(ownerView.docs[0].user.value).toEqual({
      id: F().editor!.id,
      email: F().editor!.email,
      collection: 'users',
    })
    const pub = await signedIn(F().publisher!, true)
    const pubView = await (await pub.get(listPath())).text()
    expect(JSON.parse(pubView).docs[0].user.value).toBe(F().editor!.id) // no directory access
    for (const text of [JSON.stringify(ownerView), pubView])
      expect(text).not.toMatch(/"role"|"status"|"name"|sessions|_sid|mfa|reauth/i)
    const unfiltered = await (await owner.get('/api/payload-locked-documents?depth=2')).json()
    expect(unfiltered.docs).toEqual([])
  })

  test('admin pages embed no session list, no other session ids and no session metadata', async () => {
    const owner = await signedIn(F().owner!, true)
    const html = await (await owner.get(`/admin/collections/pages/${F().content.pageId}`)).text()
    const c = await db()
    const rows = (await c.query('select id, _parent_id from users_sessions')).rows as {
      id: string
      _parent_id: number
    }[]
    await c.end()
    const leaked = rows.filter((r) => html.includes(r.id))
    // Accepted residual (Payload core, initReq → applyUserReadAccess): the viewer's own current
    // session id is included. No other session (other users, other devices) ever is.
    expect(leaked.length).toBeLessThanOrEqual(1)
    for (const r of leaked) expect(r._parent_id).toBe(F().owner!.id)
    expect(rows.filter((r) => r._parent_id === F().owner!.id).length).toBeGreaterThan(1)
    expect(html).not.toMatch(/reauthAt|mfaVerified|"sessions"/)
    // A lock holder's details reach a viewer only within the users-directory permission.
    await lockFor(F().owner!.id)
    const ed = await signedIn(F().editor!, true)
    const edHtml = await (await ed.get(`/admin/collections/pages/${F().content.pageId}`)).text()
    expect(edHtml).not.toContain(F().owner!.email)
  })

  test('FR-015 a stale save from the admin is refused and keeps the newer draft', async ({
    browser,
  }) => {
    test.setTimeout(120_000)
    const c0 = await db()
    await c0.query('delete from payload_locked_documents')
    await c0.end()
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
    await page.goto(`/admin/collections/pages/${F().content.pageId}?locale=ar`)
    await page.waitForLoadState('networkidle')
    // Meanwhile a Publisher saves a newer draft over REST.
    const pub = await signedIn(F().publisher!, true)
    const fresh = await (
      await pub.get(`/api/pages/${F().content.pageId}?draft=true&locale=ar`)
    ).json()
    const newer = await pub.patch(`/api/pages/${F().content.pageId}?draft=true&locale=ar`, {
      data: { title: 'Newer draft from publisher', updatedAt: fresh.updatedAt },
    })
    expect(newer.status(), await newer.text()).toBe(200)
    // The administrator's form is now stale.
    // Payload remembers each user's admin locale; Arabic is the default, so use it throughout.
    await expect(page.locator('label[for="field-title"]')).toContainText('Arabic')
    await page.locator('#field-title').fill('Stale admin edit')
    await expect(page.locator('#field-title')).toHaveValue('Stale admin edit')
    const saved = page.waitForResponse(
      (r) =>
        r.request().method() === 'PATCH' && r.url().includes(`/api/pages/${F().content.pageId}`),
    )
    // Payload's toast auto-dismisses, so start waiting for it before saving. Either our 409 message
    // or Payload's own stale-view notice tells the editor; the server outcome is asserted below.
    const toast = page
      .getByText(/changed by someone else/i)
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
    await page.getByRole('button', { name: /save draft/i }).click()
    const res = await saved
    expect(res.status()).toBe(409)
    await toast
    const now = await (
      await pub.get(`/api/pages/${F().content.pageId}?draft=true&locale=ar`)
    ).json()
    expect(now.title).toBe('Newer draft from publisher')
  })
})
