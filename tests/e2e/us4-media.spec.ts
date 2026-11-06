// T109 (FR-050, FR-053, FR-054, FR-055, FR-057) in the admin UI against the production build:
// upload through the admin form (variants generated), focal point through the numeric inputs with
// the keyboard, alt text gate on publish, usage panel and delete warning, delete permission,
// replacement updating every use, and keyboard reorder of a gallery through ReorderControl.
// Server rules are covered in tests/integration/media/upload.test.ts.
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { validJpeg, validPng } from '../fixtures/uploads/generate'
import { contextFor, ORIGIN, sql } from '../support/e2e-session'

test.describe.configure({ mode: 'serial' })
let ed: BrowserContext
let pub: BrowserContext
test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  await sql('delete from rate_limit_buckets')
  ed = await contextFor(browser, 'mediaEditor')
  pub = await contextFor(browser, 'mediaPublisher')
})
test.beforeEach(() => sql('delete from payload_locked_documents'))
test.afterAll(async () => {
  await ed?.close()
  await pub?.close()
})

type Doc = {
  id: number
  filename: string
  sizes: Record<string, { filename: string | null; width: number | null }>
}
async function apiUpload(ctx: BrowserContext, alt: string, w = 1600, h = 1000): Promise<Doc> {
  const r = await ctx.request.post('/api/media?locale=en', {
    headers: ORIGIN(),
    multipart: {
      file: { name: 'x.jpg', mimeType: 'image/jpeg', buffer: await validJpeg(w, h) },
      _payload: JSON.stringify({ alt }),
    },
  })
  expect(r.status(), await r.text()).toBe(201)
  return (await r.json()).doc as Doc
}
async function apiPage(ctx: BrowserContext, sections: unknown[]) {
  const r = await ctx.request.post('/api/pages?draft=true&locale=en', {
    headers: ORIGIN(),
    data: {
      title: 'Gallery page',
      slug: `gallery-${Date.now()}`,
      template: 'default',
      seo: { title: 'Gallery', description: 'Gallery page' },
      sections,
    },
  })
  expect(r.status(), await r.text()).toBe(201)
  return (await r.json()).doc as { id: number; slug: string }
}
const open = async (ctx: BrowserContext, path: string): Promise<Page> => {
  const page = await ctx.newPage()
  await page.goto(path)
  return page
}

test('an Editor uploads through the admin form; responsive variants are generated', async () => {
  const page = await open(ed, '/admin/collections/media/create?locale=en')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'office.png',
    mimeType: 'image/png',
    buffer: await validPng(1300, 900),
  })
  await page.locator('#field-alt').fill('Office meeting room')
  const saved = page.waitForResponse(
    (r) => r.url().includes('/api/media') && r.request().method() === 'POST',
  )
  await page.locator('#action-save').click()
  const res = await saved
  expect(res.status()).toBe(201)
  const doc = (await res.json()).doc as Doc & { mimeType: string; alt: string }
  expect(doc.filename).toMatch(/^[0-9a-f]{32}\.png$/)
  expect(doc.alt).toBe('Office meeting room')
  for (const name of ['w480_avif', 'w768_webp', 'w1024_jpeg'])
    expect(doc.sizes[name]?.filename, name).toBeTruthy()
  await page.close()
})

test('a rejected file shows the upload message and creates nothing', async () => {
  const before = (await sql<{ n: number }>('select count(*)::int as n from media'))[0]!.n
  const page = await open(ed, '/admin/collections/media/create?locale=en')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'fake.png',
    mimeType: 'image/png',
    buffer: Buffer.from('%PDF-1.4 not an image at all, padded to be long enough'),
  })
  await page.locator('#field-alt').fill('x')
  await page.locator('#action-save').click()
  await expect(
    page.getByText('Only JPEG, PNG, WebP and AVIF images can be uploaded.').first(),
  ).toBeVisible()
  expect((await sql<{ n: number }>('select count(*)::int as n from media'))[0]!.n).toBe(before)
  await page.close()
})

test('focal point is set with the keyboard through the numeric inputs', async () => {
  const m = await apiUpload(ed, 'Focal test')
  const page = await open(ed, `/admin/collections/media/${m.id}?locale=en`)
  const x = page.locator('#field-focalX')
  await x.focus()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('15')
  await page.keyboard.press('Tab') // into focalY
  await expect(page.locator('#field-focalY')).toBeFocused()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('85')
  const saved = page.waitForResponse(
    (r) => r.url().includes(`/api/media/${m.id}`) && r.request().method() === 'PATCH',
  )
  await page.locator('#action-save').click()
  expect((await saved).status()).toBe(200)
  const row = (
    await sql<{ focal_x: number; focal_y: number }>(
      'select focal_x, focal_y from media where id = $1',
      [m.id],
    )
  )[0]!
  expect([Number(row.focal_x), Number(row.focal_y)]).toEqual([15, 85])
  await page.close()
})

test('usage panel lists uses and warns before deletion; Editors cannot delete, Publishers can', async () => {
  const m = await apiUpload(ed, 'Used image')
  const unused = await apiUpload(ed, 'Unused image')
  const p = await apiPage(ed, [{ blockType: 'hero', heading: 'Hero', media: m.id }])
  const page = await open(ed, `/admin/collections/media/${m.id}`)
  const usage = page.getByTestId('media-usage')
  await expect(usage).toContainText('Where this image is used')
  await expect(usage.getByRole('link', { name: /Gallery page/ })).toHaveAttribute(
    'href',
    `/admin/collections/pages/${p.id}`,
  )
  await expect(page.getByTestId('media-delete-warning')).toContainText(
    'Deleting it removes the image',
  )
  await expect(page.locator('#action-delete')).toHaveCount(0) // Editors have no delete action
  await page.goto(`/admin/collections/media/${unused.id}`)
  await expect(page.getByTestId('media-usage')).toContainText('Not used')
  await expect(page.getByTestId('media-delete-warning')).toHaveCount(0)
  await page.close()

  const pp = await open(pub, `/admin/collections/media/${unused.id}`)
  await expect(pp.locator('#action-delete')).toHaveCount(1)
  const del = await pub.request.delete(`/api/media/${unused.id}`, { headers: ORIGIN() })
  expect(del.status()).toBe(200)
  await pp.close()
})

test('alt text is required to publish a page in each locale, unless the image is decorative', async () => {
  const noAlt = await apiUpload(ed, '')
  const p = await apiPage(ed, [{ blockType: 'hero', heading: 'Hero', media: noAlt.id }])
  const r = await pub.request.patch(`/api/pages/${p.id}?locale=en`, {
    headers: ORIGIN(),
    data: { _status: 'published' },
  })
  expect(r.status()).toBe(400)
  expect(await r.text()).toContain('alternative text')
  // Marking it decorative in the admin makes the page publishable.
  const page = await open(ed, `/admin/collections/media/${noAlt.id}?locale=en`)
  await page.locator('#field-decorative').check()
  const saved = page.waitForResponse(
    (x) => x.url().includes(`/api/media/${noAlt.id}`) && x.request().method() === 'PATCH',
  )
  await page.locator('#action-save').click()
  expect((await saved).status()).toBe(200)
  await page.close()
  const ok = await pub.request.patch(`/api/pages/${p.id}?locale=en`, {
    headers: ORIGIN(),
    data: { _status: 'published' },
  })
  expect(ok.status(), await ok.text()).toBe(200)
})

test('replacing the file in the admin updates the published page', async ({ playwright }) => {
  const m = await apiUpload(ed, 'Replace me', 1400, 900)
  const p = await apiPage(ed, [{ blockType: 'hero', heading: 'Hero', media: m.id }])
  const pubRes = await pub.request.patch(`/api/pages/${p.id}?locale=en`, {
    headers: ORIGIN(),
    data: { _status: 'published' },
  })
  expect(pubRes.status(), await pubRes.text()).toBe(200)
  const anon = await playwright.request.newContext({ baseURL: process.env.SITE_URL })
  const before = await (await anon.get(`/en/${encodeURIComponent(p.slug)}`)).text()
  expect(before).toContain(m.filename.replace('.jpg', ''))
  const r = await ed.request.patch(`/api/media/${m.id}`, {
    headers: ORIGIN(),
    multipart: {
      file: { name: 'new.jpg', mimeType: 'image/jpeg', buffer: await validJpeg(1800, 1000) },
    },
  })
  expect(r.status(), await r.text()).toBe(200)
  const after = (await r.json()).doc as Doc
  expect(after.filename).not.toBe(m.filename)
  await expect
    .poll(async () => (await anon.get(`/en/${encodeURIComponent(p.slug)}`)).text(), {
      timeout: 70_000,
    })
    .toContain(after.filename.replace('.jpg', ''))
  expect((await anon.get(`/api/media/file/${m.filename}`)).status()).not.toBe(200)
  expect((await anon.get(`/api/media/file/${after.filename}`)).status()).toBe(200)
  await anon.dispose()
})

test('gallery items reorder with the keyboard and the order persists', async () => {
  const a = await apiUpload(ed, 'First image', 800, 600)
  const b = await apiUpload(ed, 'Second image', 800, 600)
  const p = await apiPage(ed, [
    {
      blockType: 'mediaGallery',
      heading: 'Gallery',
      items: [
        { media: a.id, caption: 'A' },
        { media: b.id, caption: 'B' },
      ],
    },
  ])
  const page = await open(ed, `/admin/collections/pages/${p.id}?locale=en`)
  const down = page.locator('#reorder-sections-0-items-0-down')
  await expect(down).toBeVisible({ timeout: 30_000 })
  await down.focus()
  await page.keyboard.press('Enter')
  // Now last: its "Move down" is disabled, so focus lands on its "Move up".
  await expect(page.locator('#reorder-sections-0-items-1-up')).toBeFocused()
  await expect(
    page.getByRole('status').filter({ hasText: /Moved .* to position 2 of 2/ }),
  ).toHaveCount(1)
  const order = async () =>
    (
      await sql<{ media_id: number }>(
        `select i.media_id from _pages_v_blocks_media_gallery_items i
           join _pages_v_blocks_media_gallery g on g.id = i._parent_id
           join _pages_v v on v.id = g._parent_id
         where v.parent_id = $1 and v.latest = true order by i._order`,
        [p.id],
      )
    ).map((r) => r.media_id)
  expect(await order()).toEqual([a.id, b.id])
  await page.getByRole('button', { name: /save draft/i }).click()
  await expect.poll(order, { timeout: 15_000 }).toEqual([b.id, a.id])
  await page.close()
})
