// T108 (FR-051, FR-052, FR-056) over real HTTP against the production build: the T107 fixtures
// through the same multipart endpoint the admin uses. The admin UI is English-only in v1 (D-23), so
// "localized message" means the fixed English upload message per reason (UPLOAD_MESSAGES).
import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import sharp from 'sharp'
import { fixtures, validJpeg, type Fixture } from '../fixtures/uploads/generate'
import { UPLOAD_MESSAGES } from '../../src/modules/media/validate'
import { BASE, contextFor, fixturesFile, ORIGIN, signIn, sql } from '../support/e2e-session'

const MEDIA_DIR = process.env.MEDIA_DIR!
test.describe.configure({ mode: 'serial' })

let editor: BrowserContext
let publisher: BrowserContext
let all: Fixture[]
test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  await sql('delete from rate_limit_buckets')
  editor = await contextFor(browser, 'uploadEditor')
  publisher = await contextFor(browser, 'uploadPublisher')
  all = await fixtures()
})
test.afterAll(async () => {
  await editor?.close()
  await publisher?.close()
})

const upload = (
  request: APIRequestContext,
  f: { name: string; type: string; data: Buffer },
  alt = 'x',
) =>
  request.post('/api/media?locale=en', {
    headers: ORIGIN(),
    multipart: {
      file: { name: f.name, mimeType: f.type, buffer: f.data },
      _payload: JSON.stringify({ alt }),
    },
  })
const files = () => (fs.existsSync(MEDIA_DIR) ? fs.readdirSync(MEDIA_DIR).sort() : [])
const count = async () =>
  Number((await sql<{ n: number }>('select count(*)::int as n from media'))[0]!.n)

test('every malicious fixture is rejected with its message; nothing stored', async () => {
  for (const f of all.filter((x) => x.expect.outcome === 'reject')) {
    const reason = (f.expect as { reason: keyof typeof UPLOAD_MESSAGES }).reason
    const before = { n: await count(), files: files() }
    const r = await upload(editor.request, f)
    const text = await r.text()
    // Over 20 MB is refused by the proxy (413) before Payload parses the body.
    expect(r.status(), `${f.name}: ${text.slice(0, 200)}`).toBe(reason === 'tooLarge' ? 413 : 400)
    expect(JSON.parse(text).errors[0].message, f.name).toBe(UPLOAD_MESSAGES[reason])
    expect(text, f.name).not.toContain(f.name)
    expect(await count(), f.name).toBe(before.n)
    expect(files(), f.name).toEqual(before.files)
  }
})

test('unauthenticated and password-only uploads are refused', async ({ playwright }) => {
  const jpeg = { name: 'a.jpg', type: 'image/jpeg', data: await validJpeg(400, 300) }
  const anon = await playwright.request.newContext({ baseURL: BASE() })
  expect((await upload(anon, jpeg)).status()).toBe(403)
  await anon.dispose()
  const pwOnly = await playwright.request.newContext({ baseURL: BASE() })
  await signIn(pwOnly, fixturesFile().passwordOnly!, false)
  expect((await upload(pwOnly, jpeg)).status()).toBe(403)
  await pwOnly.dispose()
})

test('accepted images: EXIF gone from master and variants, random 128-bit names', async () => {
  const gps = all.find((f) => f.name === 'gps.jpg')!
  const r = await upload(editor.request, { ...gps, name: 'holiday-at-home.jpg' })
  expect(r.status()).toBe(201)
  const doc = (await r.json()).doc as {
    id: number
    filename: string
    sizes: Record<string, { filename: string | null }>
  }
  expect(doc.filename).toMatch(/^[0-9a-f]{32}\.jpg$/)
  const names = [
    ...new Set([doc.filename, ...Object.values(doc.sizes).map((s) => s.filename)]),
  ].filter((x): x is string => !!x)
  expect(names.length).toBeGreaterThan(5)
  for (const n of names) {
    expect(n).toMatch(/^[0-9a-f]{32}(-\d+x\d+)?\.(jpg|webp|avif)$/)
    const res = await editor.request.get(`/api/media/file/${n}`, { headers: ORIGIN() })
    expect(res.status(), n).toBe(200)
    const buf = await res.body()
    expect((await sharp(buf).metadata()).exif, n).toBeUndefined()
    expect(buf.toString('latin1'), n).not.toContain('EXIF-OWNER-MARKER')
  }
})

test('draft-only and unused media are not anonymously retrievable; responses are not cacheable', async ({
  playwright,
}) => {
  const r = await upload(editor.request, {
    name: 'p.jpg',
    type: 'image/jpeg',
    data: await validJpeg(800, 600),
  })
  const doc = (await r.json()).doc as { id: number; filename: string }
  // Used by a draft page only.
  const page = await editor.request.post('/api/pages?draft=true&locale=en', {
    headers: ORIGIN(),
    data: {
      title: 'Draft with image',
      slug: `draft-image-${Date.now()}`,
      template: 'default',
      sections: [{ blockType: 'hero', heading: 'Hero', media: doc.id }],
    },
  })
  expect(page.status(), await page.text()).toBe(201)
  const anon = await playwright.request.newContext({ baseURL: BASE() })
  expect((await anon.get(`/api/media/file/${doc.filename}`)).status()).toBe(403)
  expect((await anon.get(`/api/media/${doc.id}`)).status()).toBe(403)
  expect((await anon.get('/api/media')).status()).toBe(403)
  await anon.dispose()
  const own = await editor.request.get(`/api/media/file/${doc.filename}`, { headers: ORIGIN() })
  expect(own.status()).toBe(200)
  expect(own.headers()['cache-control']).toBe('private, no-cache')
  expect(own.headers()['x-content-type-options']).toBe('nosniff')
})

test('Editors cannot delete media; Publishers can, and every file goes', async () => {
  const r = await upload(editor.request, {
    name: 'd.jpg',
    type: 'image/jpeg',
    data: await validJpeg(1000, 700),
  })
  const doc = (await r.json()).doc as {
    id: number
    filename: string
    sizes: Record<string, { filename: string | null }>
  }
  const names = [doc.filename, ...Object.values(doc.sizes).map((s) => s.filename)].filter(
    (x): x is string => !!x,
  )
  expect(
    (await editor.request.delete(`/api/media/${doc.id}`, { headers: ORIGIN() })).status(),
  ).toBe(403)
  for (const n of names) expect(fs.existsSync(path.join(MEDIA_DIR, n)), n).toBe(true)
  expect(
    (await publisher.request.delete(`/api/media/${doc.id}`, { headers: ORIGIN() })).status(),
  ).toBe(200)
  for (const n of names) expect(fs.existsSync(path.join(MEDIA_DIR, n)), n).toBe(false)
  const audit = await sql('select outcome from audit_events where action = $1 and target_id = $2', [
    'media.delete',
    String(doc.id),
  ])
  expect(audit).toEqual([{ outcome: 'success' }])
})

test('an interrupted upload leaves no asset', async () => {
  const before = { n: await count(), files: files() }
  const state = JSON.parse(fs.readFileSync('test-results/state-uploadEditor.json', 'utf8')) as {
    cookies: { name: string; value: string }[]
  }
  const cookie = state.cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  const jpeg = await validJpeg(1600, 1200)
  const boundary = '----altamiuz-interrupted'
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="cut.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
  )
  const url = new URL(BASE())
  await new Promise<void>((resolve) => {
    const s = net.connect(Number(url.port), url.hostname, () => {
      s.write(
        `POST /api/media HTTP/1.1\r\nHost: ${url.host}\r\nOrigin: ${BASE()}\r\nCookie: ${cookie}\r\n` +
          `Content-Type: multipart/form-data; boundary=${boundary}\r\nContent-Length: ${head.length + jpeg.length + 64}\r\n\r\n`,
      )
      s.write(head)
      s.write(jpeg.subarray(0, Math.floor(jpeg.length / 2)))
      setTimeout(() => {
        s.destroy() // client disappears mid-body
        resolve()
      }, 300)
    })
    s.on('error', () => resolve())
  })
  await new Promise((r) => setTimeout(r, 1500))
  expect(await count()).toBe(before.n)
  expect(files()).toEqual(before.files)
})
