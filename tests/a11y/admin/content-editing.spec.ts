// T078 (FR-012, FR-055): sections reorder with the keyboard alone, the move is announced, focus
// follows the moved item, and the new order persists. T079 (FR-080a): visible focus in the editor,
// keyboard-exit help text, and after a failed save the first invalid field is focused and marked
// aria-invalid with its message referenced by aria-describedby.
import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'
import pg from 'pg'

type Acct = { id: number; email: string; password: string; secret: string; enrolledAt: number }
const F = () =>
  JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as Record<string, Acct> & {
    content: { pageId: number }
  }
const ORIGIN = { origin: process.env.SITE_URL! }
test.describe.configure({ mode: 'serial' })

async function signIn(page: Page, a: Acct) {
  expect(
    (
      await page.request.post('/api/users/login', {
        data: { email: a.email, password: a.password },
        headers: ORIGIN,
      })
    ).status(),
  ).toBe(200)
  // a11y-admin may run right after another project used this account's current TOTP step.
  const step = Math.floor(Date.now() / 30_000)
  while (Math.floor(Date.now() / 30_000) <= Math.max(step, Math.floor(a.enrolledAt / 30_000) + 1))
    await page.waitForTimeout(500)
  const v = await page.request.post('/api/users/mfa/verify', {
    data: { code: await generate({ secret: a.secret }) },
    headers: ORIGIN,
  })
  expect(v.status(), await v.text()).toBe(200)
}

async function sectionOrder() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  const v = await c.query('select id from _pages_v where parent_id = $1 and latest = true', [
    F().content.pageId,
  ])
  const rows = await c.query(
    `select block_name from (
       select _order, block_name from _pages_v_blocks_rich_text where _parent_id = $1
       union all select _order, block_name from _pages_v_blocks_cta where _parent_id = $1
     ) s order by _order`,
    [v.rows[0].id],
  )
  await c.end()
  return rows.rows.map((r) => r.block_name as string)
}

test('T078 sections reorder by keyboard, announce the move, keep focus and persist', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await signIn(page, F().administrator!)
  await page.goto(`/admin/collections/pages/${F().content.pageId}`)
  const down = page.locator('#reorder-sections-0-down')
  await expect(down).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#reorder-sections-0-up')).toBeDisabled()
  await expect(page.locator('#reorder-sections-2-down')).toBeDisabled()

  // Keyboard only: focus the control and press Enter.
  await down.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#reorder-sections-1-down')).toBeFocused()
  await expect(
    page.getByRole('status').filter({ hasText: /Moved .* to position 2 of 3/ }),
  ).toHaveCount(1)
  // Space works too, on the moved row's "Move up".
  await page.locator('#reorder-sections-1-up').focus()
  await page.keyboard.press('Space')
  // At the top edge "Move up" is disabled, so focus stays on the row's "Move down".
  await expect(page.locator('#reorder-sections-0-down')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#reorder-sections-1-down')).toBeFocused()

  // Save the draft and confirm the stored order changed.
  const before = await sectionOrder()
  const save = page.getByRole('button', { name: /save draft/i })
  await save.focus()
  await page.keyboard.press('Enter')
  await expect.poll(sectionOrder, { timeout: 15_000 }).not.toEqual(before)
  expect((await sectionOrder())[0]).toBe('Second section')

  // Controls are at least 24×24 CSS px (WCAG 2.2 SC 2.5.8).
  const box = await page.locator('#reorder-sections-1-up').boundingBox()
  expect(box!.width).toBeGreaterThanOrEqual(24)
  expect(box!.height).toBeGreaterThanOrEqual(24)
})

test('T079 rich-text editor: visible focus and keyboard-exit help text', async ({ page }) => {
  test.setTimeout(120_000)
  await signIn(page, F().administrator!)
  await page.goto(`/admin/collections/pages/${F().content.pageId}`)
  const editor = page.locator('[contenteditable="true"]').first()
  await expect(editor).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/press Escape, then Tab/).first()).toBeVisible()
  await editor.focus()
  // The indicator is drawn on the editor container (see src/app/(payload)/custom.scss).
  const outline = await editor.evaluate((el) => {
    const s = getComputedStyle(el.closest('.editor-container') ?? el)
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
  })
  expect(outline.style).not.toBe('none')
  expect(outline.width).toBeGreaterThanOrEqual(2)
})

test('T079 failed save focuses the first invalid field with aria-invalid and a described error', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await signIn(page, F().publisher!)
  await page.goto('/admin/collections/pages/create')
  await expect(page.locator('#field-title')).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle') // the button does nothing until hydrated
  // Publishing validates required fields; leave title and slug empty.
  await page
    .getByRole('button', { name: /^publish/i })
    .first()
    .click()
  const title = page.locator('#field-title')
  await expect(title).toHaveAttribute('aria-invalid', 'true', { timeout: 15_000 })
  await expect(title).toBeFocused()
  const describedBy = await title.getAttribute('aria-describedby')
  expect(describedBy).toBeTruthy()
  // Either the inline message (role=alert) or Payload's error toast, which lists the fields.
  const message = page.locator(`[id="${describedBy}"]`)
  await expect(message).toBeVisible()
  expect(
    (await message.getAttribute('role')) === 'alert' ||
      (await message.textContent())?.includes('Title'),
  ).toBe(true)
  // Focus is not pulled back while the user moves on to fix another field.
  await page.locator('#field-slug').focus()
  await page.keyboard.type('x')
  await page.waitForTimeout(500)
  await expect(page.locator('#field-slug')).toBeFocused()
})
