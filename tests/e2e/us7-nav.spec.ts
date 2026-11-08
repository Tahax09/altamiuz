// T130a (FR-014, FR-036, FR-045): navigation and banner in the admin UI, against a production
// build. contracts/access-matrix.md: navigation/banner drafts for Publisher+, publish/unpublish for
// Administrator/Owner, Editor read-only; every CMS session needs completed MFA. Server-side rules
// (Local API, REST, audit) are in tests/integration/content/globals.test.ts; this spec checks what
// the admin actually sends and shows. The seeded globals are restored afterwards, because the
// `public` projects read them.
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'
import pg from 'pg'

type Acct = { id: number; email: string; password: string; secret: string; enrolledAt: number }
type Fixtures = Record<string, Acct> & {
  content: { pageId: number }
  public: { serviceId: number }
}
const F = () => JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as Fixtures
const BASE = process.env.SITE_URL!
const ORIGIN = { origin: BASE }
type Role = 'navOwner' | 'navAdministrator' | 'navPublisher' | 'navEditor'

test.describe.configure({ mode: 'serial' })

async function sql<T = Record<string, unknown>>(text: string, values: unknown[] = []) {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  try {
    return (await c.query(text, values)).rows as T[]
  } finally {
    await c.end()
  }
}
// Payload locks a global while it is open; another user would get the "currently editing" modal.
test.beforeEach(() => sql('delete from payload_locked_documents'))
// Every project signs in from 127.0.0.1, and MFA verification allows 30 attempts per IP per 15
// minutes (src/modules/auth/mfa.ts). In a full run the earlier projects use most of that budget,
// so this file starts with empty buckets in its disposable database. The limits themselves are
// covered by tests/integration/platform/ratelimit.test.ts and the auth suites.
test.beforeAll(() => sql('delete from rate_limit_buckets'))

/** Last TOTP step used per account: a code is accepted once (replay protection). */
const usedStep = new Map<string, number>()
/** Password sign-in, then TOTP in a step after the seed's enrolment and any earlier sign-in. */
async function signIn(request: APIRequestContext, a: Acct, mfa = true) {
  const login = await request.post('/api/users/login', {
    data: { email: a.email, password: a.password },
    headers: ORIGIN,
  })
  expect(login.status(), await login.text()).toBe(200)
  if (!mfa) return
  const after = Math.max(Math.floor(a.enrolledAt / 30_000) + 1, usedStep.get(a.email) ?? 0)
  while (Math.floor(Date.now() / 30_000) <= after) await new Promise((r) => setTimeout(r, 500))
  usedStep.set(a.email, Math.floor(Date.now() / 30_000))
  const v = await request.post('/api/users/mfa/verify', {
    data: { code: await generate({ secret: a.secret }) },
    headers: ORIGIN,
  })
  expect(v.status(), await v.text()).toBe(200)
}

// One MFA-verified browser session per role for the whole file (per-account login limits).
const states = new Map<Role, string>()
// Every context a test opens is closed after it: an admin edit page left open keeps sending
// form-state requests, and Payload re-creates the document lock on each one when none exists
// (handleFormStateLocking), so a lingering page from one test could lock a global for the next
// ("Document locked" dialog), depending only on server timing.
const open: BrowserContext[] = []
test.afterEach(async () => {
  await Promise.all(open.splice(0).map((c) => c.close()))
  await sql('delete from payload_locked_documents')
})
async function as(browser: Browser, role: Role): Promise<Page> {
  if (!states.has(role)) {
    const ctx = await browser.newContext({ baseURL: BASE })
    await signIn(ctx.request, F()[role]!)
    const file = `test-results/us7-${role}.json`
    await ctx.storageState({ path: file })
    await ctx.close()
    states.set(role, file)
  }
  const ctx = await browser.newContext({ baseURL: BASE, storageState: states.get(role) })
  open.push(ctx)
  return ctx.newPage()
}

const link = (label: string, url: string) => ({ link: { linkType: 'external', url, label } })
const internal = (label: string, relationTo: string, value: number) => ({
  link: { linkType: 'internal', doc: { relationTo, value }, label },
})

/** A global write through a signed-in browser session (cookie, same origin). */
async function post(page: Page, path: string, data: Record<string, unknown>, origin = BASE) {
  return page.request.post(path, { data, headers: { origin } })
}
/** An API read the way the admin makes it (same-origin, so the session cookie is honoured). */
const get = (page: Page, path: string) => page.request.get(path, { headers: ORIGIN })
const draftOf = async (page: Page, slug: string) =>
  (await (await get(page, `/api/globals/${slug}?draft=true&locale=en&depth=0`)).json()) as {
    items?: { link: { label: string; url?: string }; targetUnpublished?: boolean }[]
    message?: string
  }
const publicHome = async () => (await fetch(`${BASE}/en`)).text()

/** Waits for the admin's save request for a global and returns its status. */
async function clickSave(page: Page, slug: string, button: '#action-save-draft' | '#action-save') {
  const res = page.waitForResponse(
    (r) => r.url().includes(`/api/globals/${slug}`) && r.request().method() === 'POST',
  )
  await page.locator(button).click()
  return (await res).status()
}
const toast = (page: Page, text: RegExp) =>
  page.locator('[data-sonner-toast]').filter({ hasText: text })

async function openGlobal(page: Page, slug: string) {
  await page.goto(`/admin/globals/${slug}?locale=en`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
}

/** Restores what tests/support/e2e-seed.ts published (both locales), as an Administrator. */
async function restoreSeed(page: Page) {
  const svc = F().public.serviceId
  for (const locale of ['en', 'ar'] as const) {
    const nav = await post(
      page,
      `/api/globals/header-nav?locale=${locale}&publishSpecificLocale=${locale}`,
      {
        items: [
          internal(locale === 'ar' ? 'اختبار الاختراق' : 'Penetration testing', 'services', svc),
          ...(locale === 'en' ? [link('External', 'https://example.org/')] : []),
        ],
        _status: 'published',
      },
    )
    expect(nav.status(), await nav.text()).toBe(200)
    const banner = await post(
      page,
      `/api/globals/banner?locale=${locale}&publishSpecificLocale=${locale}`,
      {
        enabled: true,
        message: locale === 'ar' ? 'إعلان تجريبي' : 'E2E banner notice',
        startsAt: null,
        endsAt: null,
        _status: 'published',
      },
    )
    expect(banner.status(), await banner.text()).toBe(200)
  }
}

test.afterAll(async ({ browser }) => {
  await sql('delete from payload_locked_documents')
  await restoreSeed(await as(browser, 'navAdministrator'))
  await Promise.all(open.splice(0).map((c) => c.close()))
  await sql('delete from payload_locked_documents')
  const home = await publicHome()
  expect(home).toContain('Penetration testing')
  expect(home).toContain('E2E banner notice')
})

test('anonymous and password-only sessions never reach the navigation editor or its API', async ({
  browser,
}) => {
  test.setTimeout(120_000)
  const anon = await (await browser.newContext({ baseURL: BASE })).newPage()
  await anon.goto('/admin/globals/header-nav')
  await expect(anon).toHaveURL(/\/admin\/login/)
  for (const slug of ['header-nav', 'banner']) {
    expect((await get(anon, `/api/globals/${slug}?draft=true`)).status()).toBe(403)
    expect((await post(anon, `/api/globals/${slug}?draft=true`, { message: 'x' })).status()).toBe(
      403,
    )
  }

  // Password accepted, MFA not completed (FR-033): sent to the MFA screen, API refused.
  const ctx = await browser.newContext({ baseURL: BASE })
  await signIn(ctx.request, F().navPasswordOnly!, false)
  const page = await ctx.newPage()
  await page.goto('/admin/globals/header-nav')
  await expect(page).toHaveURL(/\/account\/mfa/)
  await expect(page.getByRole('heading', { name: 'Header navigation' })).toHaveCount(0)
  for (const slug of ['header-nav', 'banner']) {
    expect((await get(page, `/api/globals/${slug}?draft=true`)).status()).toBe(403)
    const w = await post(page, `/api/globals/${slug}?locale=en&draft=true`, { message: 'x' })
    expect(w.status()).toBe(403)
  }
})

test('an Editor sees navigation and banner read-only and cannot save', async ({ browser }) => {
  test.setTimeout(180_000)
  // Two rows, so the reorder controls would be usable if the form were editable.
  const admin = await as(browser, 'navAdministrator')
  const setup = await post(admin, '/api/globals/header-nav?locale=en&draft=true', {
    items: [
      link('Contact', 'https://example.org/contact'),
      internal('Penetration testing', 'services', F().public.serviceId),
    ],
  })
  expect(setup.status(), await setup.text()).toBe(200)

  const page = await as(browser, 'navEditor')
  await openGlobal(page, 'header-nav')
  await expect(page.locator('input[name="items.0.link.label"]')).toBeDisabled()
  await expect(page.locator('#reorder-items-0-down')).toBeDisabled()
  await expect(page.locator('#reorder-items-1-up')).toBeDisabled()
  await expect(page.locator('#action-save-draft')).toHaveCount(0)
  await expect(page.locator('#action-save')).toHaveCount(0)
  await openGlobal(page, 'banner')
  await expect(page.locator('textarea[name="message"]')).toBeDisabled()
  await expect(page.locator('#action-save-draft')).toHaveCount(0)
  await expect(page.locator('#action-save')).toHaveCount(0)
  // The same session, straight at the API.
  for (const slug of ['header-nav', 'banner'])
    expect(
      (await post(page, `/api/globals/${slug}?locale=en&draft=true`, { message: 'x' })).status(),
    ).toBe(403)
  expect((await draftOf(admin, 'header-nav')).items?.[0]?.link.label).toBe('Contact')
})

test('a Publisher saves a menu draft in the admin; the live menu is unchanged', async ({
  browser,
}) => {
  test.setTimeout(120_000)
  const page = await as(browser, 'navPublisher')
  await openGlobal(page, 'header-nav')
  await page.locator('input[name="items.0.link.label"]').fill('Draft only label')
  expect(await clickSave(page, 'header-nav', '#action-save-draft')).toBe(200)
  await expect(toast(page, /saved|draft/i)).toBeVisible()
  expect((await draftOf(page, 'header-nav')).items?.[0]?.link.label).toBe('Draft only label')
  expect(await publicHome()).not.toContain('Draft only label')
})

test('a Publisher cannot publish or unpublish from the admin; the refusal is shown', async ({
  browser,
}) => {
  test.setTimeout(120_000)
  const before = await publicHome()
  for (const slug of ['header-nav', 'banner'] as const) {
    const page = await as(browser, 'navPublisher')
    await openGlobal(page, slug)
    if (slug === 'header-nav')
      await page.locator('input[name="items.0.link.label"]').fill('Publisher tried to publish')
    else await page.locator('textarea[name="message"]').fill('Publisher tried to publish')
    // "Publish changes" (all locales, as the admin sends it) is refused cleanly, not a 500.
    expect(await clickSave(page, slug, '#action-save')).toBe(403)
    await expect(toast(page, /forbidden|not allowed/i)).toBeVisible()
    // The admin "Unpublish" request (UnpublishButton: all locales, `{ _status: 'draft' }`).
    const un = await post(
      page,
      `/api/globals/${slug}?depth=0&fallback-locale=null&unpublishAllLocales=true`,
      {
        _status: 'draft',
      },
    )
    expect(un.status()).toBe(403)
    await page.context().close()
  }
  const after = await publicHome()
  expect(after).not.toContain('Publisher tried to publish')
  expect(after).toContain('Penetration testing')
  expect(after).toContain('E2E banner notice')
  expect(before).toContain('E2E banner notice')
})

test('menu items reorder with the keyboard and the order is saved', async ({ browser }) => {
  test.setTimeout(120_000)
  const admin = await as(browser, 'navAdministrator')
  const setup = await post(admin, '/api/globals/header-nav?locale=en&draft=true', {
    items: [
      link('First item', 'https://example.org/first'),
      link('Second item', 'https://example.org/second'),
    ],
  })
  expect(setup.status(), await setup.text()).toBe(200)

  const page = await as(browser, 'navPublisher')
  await openGlobal(page, 'header-nav')
  const down = page.locator('#reorder-items-0-down')
  await expect(page.locator('#reorder-items-0-up')).toBeDisabled()
  await down.focus()
  await page.keyboard.press('Enter')
  // The moved row is now last, where "Move down" is disabled: focus stays on its "Move up".
  await expect(page.locator('#reorder-items-1-up')).toBeFocused()
  await expect(page.locator('#reorder-items-1-down')).toBeDisabled()
  await expect(
    page.getByRole('status').filter({ hasText: /Moved .* to position 2 of 2/ }),
  ).toHaveCount(1)
  const res = page.waitForResponse(
    (r) => r.url().includes('/api/globals/header-nav') && r.request().method() === 'POST',
  )
  await page.locator('#action-save-draft').focus()
  await page.keyboard.press('Enter')
  expect((await res).status()).toBe(200)
  expect((await draftOf(page, 'header-nav')).items?.map((i) => i.link.label)).toEqual([
    'Second item',
    'First item',
  ])
})

test('a menu link to an unpublished page is flagged, and Editors see the flag', async ({
  browser,
}) => {
  test.setTimeout(120_000)
  const publisher = await as(browser, 'navPublisher')
  const saved = await post(publisher, '/api/globals/header-nav?locale=en&draft=true', {
    items: [
      internal('Unpublished page', 'pages', F().content.pageId),
      internal('Published service', 'services', F().public.serviceId),
    ],
  })
  expect(saved.status(), await saved.text()).toBe(200)

  const page = await as(browser, 'navEditor')
  await openGlobal(page, 'header-nav')
  await expect(page.locator('input[name="items.0.targetUnpublished"]')).toBeChecked()
  await expect(page.locator('input[name="items.1.targetUnpublished"]')).not.toBeChecked()
  await expect(
    page.getByText('Set on save: the linked page is not published in this language.').first(),
  ).toBeVisible()
})

test('invalid menu and banner input is refused with a visible error and nothing is saved', async ({
  browser,
}) => {
  test.setTimeout(180_000)
  const admin = await as(browser, 'navAdministrator')
  const setup = await post(admin, '/api/globals/header-nav?locale=en&draft=true', {
    items: [link('Contact', 'https://example.org/contact')],
  })
  expect(setup.status(), await setup.text()).toBe(200)

  const page = await as(browser, 'navPublisher')
  await openGlobal(page, 'header-nav')
  const url = page.locator('input[name="items.0.link.url"]')
  for (const bad of ['javascript:alert(1)', '//evil.example/x', 'data:text/html,x']) {
    await url.fill(bad)
    expect(await clickSave(page, 'header-nav', '#action-save-draft'), bad).toBe(400)
    await expect(url).toHaveAttribute('aria-invalid', 'true')
  }
  expect((await draftOf(page, 'header-nav')).items?.[0]?.link.url).toBe(
    'https://example.org/contact',
  )
  await page.locator('input[name="items.0.link.label"]').fill('')
  expect(await clickSave(page, 'header-nav', '#action-save-draft')).toBe(400)

  await openGlobal(page, 'banner')
  const before = (await draftOf(page, 'banner')).message
  await page.locator('textarea[name="message"]').fill('x'.repeat(281))
  expect(await clickSave(page, 'banner', '#action-save-draft')).toBe(400)
  await expect(page.locator('textarea[name="message"]')).toHaveAttribute('aria-invalid', 'true')
  expect((await draftOf(page, 'banner')).message).toBe(before)
})

test('Administrators and Owners publish navigation and the banner from the admin', async ({
  browser,
}) => {
  test.setTimeout(180_000)
  const admin = await as(browser, 'navAdministrator')
  await openGlobal(admin, 'header-nav')
  await admin.locator('input[name="items.0.link.label"]').fill('Admin published label')
  expect(await clickSave(admin, 'header-nav', '#action-save')).toBe(200)
  await expect.poll(publicHome).toContain('Admin published label')

  const owner = await as(browser, 'navOwner')
  await openGlobal(owner, 'banner')
  await owner.locator('textarea[name="message"]').fill('Owner published banner')
  expect(await clickSave(owner, 'banner', '#action-save')).toBe(200)
  await expect.poll(publicHome).toContain('Owner published banner')
  // Publishing is audited.
  const audit = await sql<{ n: string }>(
    "select count(*) as n from audit_events where action = 'navigation.change' and actor in ($1, $2)",
    [`user:${F().navAdministrator!.id}`, `user:${F().navOwner!.id}`],
  )
  expect(Number(audit[0]!.n)).toBeGreaterThanOrEqual(2)
})

test('the banner schedule window decides what the public site shows', async ({ browser }) => {
  test.setTimeout(120_000)
  const admin = await as(browser, 'navAdministrator')
  const hour = 3_600_000
  const at = (ms: number) => new Date(Date.now() + ms).toISOString()
  const publish = (window: { startsAt: string | null; endsAt: string | null }) =>
    post(admin, '/api/globals/banner?locale=en&publishSpecificLocale=en', {
      enabled: true,
      message: 'Scheduled banner',
      ...window,
      _status: 'published',
    })
  for (const [window, shown] of [
    [{ startsAt: at(-hour), endsAt: at(hour) }, true], // inside
    [{ startsAt: at(hour), endsAt: at(2 * hour) }, false], // not started
    [{ startsAt: at(-2 * hour), endsAt: at(-hour) }, false], // ended
    [{ startsAt: null, endsAt: at(hour) }, true], // open start
    [{ startsAt: at(-hour), endsAt: null }, true], // open end
  ] as const) {
    const r = await publish(window)
    expect(r.status(), await r.text()).toBe(200)
    expect(await publicHome(), JSON.stringify(window)).toEqual(
      shown
        ? expect.stringContaining('Scheduled banner')
        : expect.not.stringContaining('Scheduled banner'),
    )
  }
  // An empty or inverted window is refused and the live banner is unchanged.
  const t = at(hour)
  for (const window of [
    { startsAt: t, endsAt: t },
    { startsAt: at(2 * hour), endsAt: at(hour) },
  ]) {
    const r = await publish(window)
    expect(r.status()).toBe(400)
    expect(await r.text()).toContain('The banner must end after it starts')
  }
  expect(await publicHome()).toContain('Scheduled banner')
})

test('a write after sign-out, or from another origin, is refused', async ({ browser }) => {
  test.setTimeout(120_000)
  // Cross-site request with a valid Administrator session cookie (csrf allow-list is SITE_URL).
  const admin = await as(browser, 'navAdministrator')
  const before = (await draftOf(admin, 'banner')).message
  const forged = await post(
    admin,
    '/api/globals/banner?locale=en&draft=true',
    { message: 'Forged from another site' },
    'https://evil.example',
  )
  expect(forged.status()).toBe(403)
  expect((await draftOf(admin, 'banner')).message).toBe(before)

  // A Publisher signs out in another tab, then saves the form that is still open. Last test:
  // signing out ends the shared Publisher session.
  const page = await as(browser, 'navPublisher')
  await openGlobal(page, 'banner')
  expect((await page.request.post('/api/users/logout', { headers: ORIGIN })).status()).toBe(200)
  await page.locator('textarea[name="message"]').fill('Saved after sign-out')
  const status = await clickSave(page, 'banner', '#action-save-draft')
  expect([401, 403]).toContain(status)
  expect((await draftOf(admin, 'banner')).message).not.toBe('Saved after sign-out')
})
