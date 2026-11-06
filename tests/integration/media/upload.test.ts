// T108/T110–T112 (FR-050–FR-057, D-12) through Payload's real REST router and Local API: content
// validation of every upload, metadata stripping, variants, random names, RBAC, public delivery
// only for published uses, usage, replace, focal point, alt gate, deletion audit and file cleanup.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { createUser, routeLogin, userFor, verifiedSession, type Session } from '../../support/auth'
import { pageData } from '../../support/content'
import {
  deleteMedia,
  filesOf,
  getFile,
  listDir,
  mediaDoc,
  mediaRest,
  readStored,
  uploadMedia,
} from '../../support/media'
import {
  exifGpsJpeg,
  fixtures,
  validJpeg,
  validPng,
  type Fixture,
} from '../../fixtures/uploads/generate'
// Pure modules only: importing the media collection would read the configuration before
// bootPayload points DATABASE_URL at the migrated test database.
import { findMediaUsage } from '../../../src/modules/media/usage'
import { UPLOAD_MESSAGES } from '../../../src/modules/media/validate'
import { MEDIA_FORMATS, MEDIA_WIDTHS, variantName } from '../../../src/modules/media/variants'

let t: TestPayload
let ed: Session
let pub: Session
let all: Fixture[]
const user = async (s: Session) => (await userFor(t.payload, s.token)) as never

beforeAll(async () => {
  t = await bootPayload()
  ed = await verifiedSession(t.payload, 'editor')
  pub = await verifiedSession(t.payload, 'publisher')
  all = await fixtures()
}, 240_000)
afterAll(async () => t?.close())

const jpegFile = async (w = 2000, h = 1200, name = 'photo.jpg') => ({
  name,
  type: 'image/jpeg',
  data: await validJpeg(w, h),
})

async function uploaded(data: Record<string, unknown> = { alt: 'Alt EN' }, w = 2000, h = 1200) {
  const r = await uploadMedia({ token: ed.token, file: await jpegFile(w, h), data, locale: 'en' })
  expect(r.status, r.raw.toString().slice(0, 300)).toBe(201)
  return mediaDoc(t.payload, (r.body.doc as { id: number }).id)
}

const mediaCount = async () =>
  Number((await t.sql.query('select count(*)::int as n from media')).rows[0].n)

let n = 0
const slug = () => `media-${Date.now()}-${n++}`

/** A draft page whose hero shows `mediaId`, optionally in a hidden section. */
async function pageWith(mediaId: number, opts: { hidden?: boolean } = {}) {
  return (await t.payload.create({
    collection: 'pages',
    locale: 'en',
    draft: true,
    data: pageData(slug(), 'Media page', {
      sections: [{ blockType: 'hero', heading: 'Hero', media: mediaId, hidden: !!opts.hidden }],
    }) as never,
    user: await user(ed),
    overrideAccess: false,
  })) as unknown as { id: number }
}

/** Arabic content for the same draft (sections are shared; their text is per locale). */
async function arabicDraft(id: number) {
  const doc = (await t.payload.findByID({
    collection: 'pages',
    id,
    draft: true,
    depth: 0,
    overrideAccess: true,
  })) as unknown as { sections: Record<string, unknown>[] }
  await t.payload.update({
    collection: 'pages',
    id,
    locale: 'ar',
    draft: true,
    data: pageData(slug(), 'صفحة', {
      sections: doc.sections.map((sct) => ({ ...sct, heading: 'عنوان' })),
    }) as never,
    user: await user(ed),
    overrideAccess: false,
  })
}

const publish = async (id: number, locale: 'ar' | 'en' = 'en') =>
  t.payload.update({
    collection: 'pages',
    id,
    locale,
    data: { _status: 'published' } as never,
    user: await user(pub),
    overrideAccess: false,
  })

const unpublish = async (id: number, locale: 'ar' | 'en' = 'en') =>
  t.payload.update({
    collection: 'pages',
    id,
    locale,
    data: { _status: 'draft' } as never,
    user: await user(pub),
    overrideAccess: false,
  })

describe('content validation (D-12 checks 1–3, FR-051)', () => {
  it('every malicious fixture is rejected with its message, and nothing is stored', async () => {
    for (const f of all.filter((x) => x.expect.outcome === 'reject')) {
      const reason = (f.expect as { reason: keyof typeof UPLOAD_MESSAGES }).reason
      const before = { docs: await mediaCount(), files: listDir(t.mediaDir) }
      const r = await uploadMedia({ token: ed.token, file: f, data: { alt: 'x' }, locale: 'en' })
      const err = (
        r.body.errors as { message: string; data?: { reason?: string } }[] | undefined
      )?.[0]
      // 20 MB+ is cut off by the multipart parser (413) before the hook sees it.
      if (reason === 'tooLarge') expect([400, 413], f.name).toContain(r.status)
      else {
        expect(r.status, `${f.name}: ${r.raw.toString().slice(0, 200)}`).toBe(400)
        expect(err?.message, f.name).toBe(UPLOAD_MESSAGES[reason])
        expect(err?.data?.reason, f.name).toBe(`upload.${reason}`)
      }
      expect(r.raw.toString(), f.name).not.toContain(f.name) // no echo of the client file name
      expect(await mediaCount(), f.name).toBe(before.docs)
      expect(listDir(t.mediaDir), f.name).toEqual(before.files)
    }
  })

  it('EXIF (incl. GPS and owner) is removed from the master and every variant', async () => {
    const input = await exifGpsJpeg()
    const inMeta = await sharp(input).metadata()
    expect(inMeta.exif?.length ?? 0).toBeGreaterThan(0) // the fixture really carries EXIF
    expect(input.toString('latin1')).toContain('EXIF-OWNER-MARKER')
    const r = await uploadMedia({
      token: ed.token,
      file: { name: 'gps.jpg', type: 'image/jpeg', data: input },
      data: { alt: 'x' },
      locale: 'en',
    })
    expect(r.status).toBe(201)
    const m = await mediaDoc(t.payload, (r.body.doc as { id: number }).id)
    const names = filesOf(m)
    expect(names.length).toBeGreaterThan(1)
    for (const name of names) {
      const buf = readStored(t.mediaDir, name)
      const meta = await sharp(buf).metadata()
      expect(meta.exif, name).toBeUndefined()
      expect(meta.xmp, name).toBeUndefined()
      expect(buf.toString('latin1'), name).not.toMatch(
        /EXIF-OWNER-MARKER|EXIF-COPYRIGHT-MARKER|FixtureCam/,
      )
    }
  })

  it('declared type and extension are ignored: a PNG sent as image/jpeg is stored as PNG', async () => {
    const r = await uploadMedia({
      token: ed.token,
      file: { name: 'really-a-png.jpg', type: 'image/jpeg', data: await validPng(640, 480) },
      data: { alt: 'x' },
      locale: 'en',
    })
    expect(r.status).toBe(201)
    const m = await mediaDoc(t.payload, (r.body.doc as { id: number }).id)
    expect(m.mimeType).toBe('image/png')
    expect(m.filename).toMatch(/^[0-9a-f]{32}\.png$/)
  })

  it('names are random 128-bit ids; the multipart file name and client-supplied file keys are ignored', async () => {
    const before = listDir(t.mediaDir)
    const r = await uploadMedia({
      token: ed.token,
      file: { ...(await jpegFile(800, 600)), name: '../../../etc/evil.php.jpg' },
      data: { alt: 'x', url: 'http://169.254.169.254/latest/meta-data/', mimeType: 'text/html' },
      locale: 'en',
    })
    expect(r.status, r.raw.toString().slice(0, 400)).toBe(201)
    const m = await mediaDoc(t.payload, (r.body.doc as { id: number }).id)
    expect(m.filename).toMatch(/^[0-9a-f]{32}\.jpg$/)
    expect(m.mimeType).toBe('image/jpeg')
    for (const name of filesOf(m))
      expect(name).toMatch(/^[0-9a-f]{32}(-\d+x\d+)?\.(jpg|webp|avif)$/)
    const added = listDir(t.mediaDir).filter((f) => !before.includes(f))
    expect(added.sort()).toEqual(filesOf(m).sort())
    expect(
      fs.readdirSync(path.resolve(t.mediaDir, '..')).filter((f) => f.includes('evil')),
    ).toEqual([])
    // Two uploads of the same bytes get different names.
    const again = await uploadMedia({
      token: ed.token,
      file: await jpegFile(800, 600),
      data: { alt: 'x' },
    })
    expect((again.body.doc as { filename: string }).filename).not.toBe(m.filename)
  })

  it('a path in a client-supplied filename is refused outright (Payload), nothing stored', async () => {
    const before = { docs: await mediaCount(), files: listDir(t.mediaDir) }
    for (const filename of ['../../escape.jpg', '/etc/passwd', '..\\..\\x.jpg']) {
      const r = await uploadMedia({
        token: ed.token,
        file: await jpegFile(400, 300),
        data: { alt: 'x', filename },
      })
      expect(r.status, filename).toBe(400)
    }
    expect(await mediaCount()).toBe(before.docs)
    expect(listDir(t.mediaDir)).toEqual(before.files)
  })

  it('a create without a file is rejected even when it names a URL to fetch (no paste-from-URL)', async () => {
    const before = await mediaCount()
    const r = await mediaRest('POST', '/api/media', {
      token: ed.token,
      body: JSON.stringify({ alt: 'x', filename: 'x.jpg', url: 'http://127.0.0.1:1/x.jpg' }),
      headers: { 'content-type': 'application/json' },
    })
    expect(r.status).toBe(400)
    expect(await mediaCount()).toBe(before)
  })
})

describe('variants (D-12, FR-052)', () => {
  it('one upload produces 5 widths × AVIF/WebP/JPEG, each really in its format', async () => {
    const m = await uploaded({ alt: 'x' }, 2000, 1200)
    expect(m.width).toBe(2000)
    expect(m.filename).toMatch(/^[0-9a-f]{32}\.jpg$/)
    for (const w of MEDIA_WIDTHS)
      for (const f of MEDIA_FORMATS) {
        const s = m.sizes[variantName(w, f)]
        expect(s?.filename, `${w} ${f}`).toBeTruthy()
        expect(s?.width).toBe(w)
        const meta = await sharp(readStored(t.mediaDir, s!.filename!)).metadata()
        expect(meta.format === 'heif' ? 'avif' : meta.format, `${w} ${f}`).toBe(f)
        expect(meta.width).toBe(w)
      }
  })

  it('images narrower than a variant are not enlarged', async () => {
    const m = await uploaded({ alt: 'x' }, 600, 400)
    expect(m.sizes[variantName(480, 'webp')]?.width).toBe(480)
    for (const w of [768, 1024, 1440, 1920])
      expect(m.sizes[variantName(w, 'jpeg')]?.width ?? 600, String(w)).toBeLessThanOrEqual(600)
  })
})

describe('permissions (contracts/access-matrix.md: media)', () => {
  it('anonymous and password-only (no second factor) uploads are refused; nothing stored', async () => {
    const before = { docs: await mediaCount(), files: listDir(t.mediaDir) }
    expect((await uploadMedia({ file: await jpegFile(400, 300) })).status).toBe(403)
    const u = await createUser(t.payload, 'owner', { status: 'active' })
    const login = await routeLogin(u.email, u.password)
    expect(login.status).toBe(200)
    expect((await uploadMedia({ token: login.token, file: await jpegFile(400, 300) })).status).toBe(
      403,
    )
    expect(await mediaCount()).toBe(before.docs)
    expect(listDir(t.mediaDir)).toEqual(before.files)
  })

  it('Editors upload and edit; only Publisher and above delete; deletion is audited and removes every file', async () => {
    const m = await uploaded()
    const edit = await mediaRest('PATCH', `/api/media/${m.id}?locale=en`, {
      token: ed.token,
      body: JSON.stringify({ alt: 'Edited by an Editor' }),
      headers: { 'content-type': 'application/json' },
    })
    expect(edit.status).toBe(200)
    expect((await deleteMedia(m.id, ed.token)).status).toBe(403)
    for (const f of filesOf(m)) expect(fs.existsSync(path.join(t.mediaDir, f)), f).toBe(true)
    const del = await deleteMedia(m.id, pub.token)
    expect(del.status).toBe(200)
    for (const f of filesOf(m)) expect(fs.existsSync(path.join(t.mediaDir, f)), f).toBe(false)
    const audit = await t.sql.query(
      `select actor, outcome from audit_events where action = 'media.delete' and target_id = $1`,
      [String(m.id)],
    )
    expect(audit.rows).toEqual([{ actor: `user:${pub.userId}`, outcome: 'success' }])
  })
})

describe('public delivery only for published, visible uses (FR-056)', () => {
  it('draft-only media is private; publishing makes it public; unpublishing makes it private again', async () => {
    const m = await uploaded({ alt: 'Hero alt' })
    const variant = m.sizes[variantName(480, 'webp')]!.filename!
    // Unused, then used only by a draft: anonymous gets nothing, signed-in CMS users get the file.
    expect((await getFile(m.filename)).status).toBe(403)
    const page = await pageWith(m.id)
    expect((await getFile(m.filename)).status).toBe(403)
    expect((await getFile(variant)).status).toBe(403)
    const own = await getFile(m.filename, ed.token)
    expect(own.status).toBe(200)
    expect(own.headers.get('cache-control')).toBe('private, no-cache')
    expect(own.headers.get('x-content-type-options')).toBe('nosniff')
    await publish(page.id)
    const pubFile = await getFile(variant)
    expect(pubFile.status).toBe(200)
    expect(pubFile.headers.get('content-type')).toBe('image/webp')
    expect((await getFile(m.filename)).status).toBe(200)
    await unpublish(page.id)
    expect((await getFile(variant)).status).toBe(403)
    expect((await getFile(m.filename)).status).toBe(403)
  })

  it('an image in a hidden section of a published page stays private', async () => {
    const m = await uploaded({ alt: 'Hidden hero' })
    const page = await pageWith(m.id, { hidden: true })
    await publish(page.id)
    expect((await getFile(m.filename)).status).toBe(403)
  })

  it('anonymous REST cannot list or read media documents, even published ones', async () => {
    const m = await uploaded({ alt: 'Listed?' })
    await publish((await pageWith(m.id)).id)
    expect((await getFile(m.filename)).status).toBe(200)
    expect((await mediaRest('GET', '/api/media')).status).toBe(403)
    expect((await mediaRest('GET', `/api/media/${m.id}`)).status).toBe(403)
  })

  it('path traversal in the file route is refused', async () => {
    for (const name of [
      '../../../../etc/passwd',
      '..%2F..%2Fpackage.json',
      '..\\..\\package.json',
    ]) {
      const r = await mediaRest('GET', `/api/media/file/${name}`, { token: ed.token })
      expect([400, 403, 404], name).toContain(r.status)
      expect(r.raw.toString(), name).not.toMatch(/root:|"name": "altamiuz"/)
    }
  })
})

describe('alternative text gate (FR-054)', () => {
  it('a page cannot be published in a locale whose images have no alt text there, unless decorative', async () => {
    const imageAltError = expect.objectContaining({
      status: 400,
      data: expect.objectContaining({ reason: 'imageAlt' }),
    })
    const m = await uploaded({ alt: 'English only' })
    const page = await pageWith(m.id)
    await arabicDraft(page.id)
    await expect(publish(page.id, 'ar')).rejects.toEqual(imageAltError)
    await publish(page.id, 'en') // English alt exists
    await t.payload.update({
      collection: 'media',
      id: m.id,
      locale: 'ar',
      data: { alt: 'نص بديل' } as never,
      user: await user(ed),
      overrideAccess: false,
    })
    await publish(page.id, 'ar')
    // Decorative images need no alt text in any locale.
    const d = await uploaded({ alt: '', decorative: true })
    const decorative = await pageWith(d.id)
    await arabicDraft(decorative.id)
    await publish(decorative.id, 'ar')
    // Without alt and not decorative, English publish is refused too.
    const none = await uploaded({ alt: '' })
    await expect(publish((await pageWith(none.id)).id, 'en')).rejects.toEqual(imageAltError)
  })
})

describe('usage, replacement and focal point (FR-053, FR-057)', () => {
  it('usage lists draft and published uses', async () => {
    const m = await uploaded({ alt: 'Used' })
    expect(await findMediaUsage(t.payload, m.id)).toEqual([])
    const a = await pageWith(m.id)
    const b = await pageWith(m.id)
    await publish(b.id)
    const uses = await findMediaUsage(t.payload, m.id)
    expect(uses.map((u) => [u.collection, u.id, u.published, u.draft])).toEqual([
      ['pages', a.id, false, true],
      ['pages', b.id, true, true],
    ])
  })

  it('replacing the file keeps the id (every use updates), removes the old files and re-validates', async () => {
    const m = await uploaded({ alt: 'Before' })
    const page = await pageWith(m.id)
    await publish(page.id)
    const bad = all.find((f) => f.name === 'polyglot.jpg')!
    expect((await uploadMedia({ token: ed.token, id: m.id, file: bad })).status).toBe(400)
    expect((await mediaDoc(t.payload, m.id)).filename).toBe(m.filename) // unchanged after a rejected replace
    const r = await uploadMedia({
      token: ed.token,
      id: m.id,
      file: await jpegFile(1500, 1000, 'new.jpg'),
    })
    expect(r.status, r.raw.toString().slice(0, 300)).toBe(200)
    const after = await mediaDoc(t.payload, m.id)
    expect(after.id).toBe(m.id)
    expect(after.filename).not.toBe(m.filename)
    expect(after.width).toBe(1500)
    for (const f of filesOf(m))
      expect(fs.existsSync(path.join(t.mediaDir, f)), `old ${f}`).toBe(false)
    for (const f of filesOf(after))
      expect(fs.existsSync(path.join(t.mediaDir, f)), `new ${f}`).toBe(true)
    expect((await getFile(after.filename)).status).toBe(200) // the published page shows the new file
    expect((await getFile(m.filename)).status).not.toBe(200)
  })

  it('focal point accepts 0–100 and rejects anything else', async () => {
    const m = await uploaded()
    const ok = await mediaRest('PATCH', `/api/media/${m.id}`, {
      token: ed.token,
      body: JSON.stringify({ focalX: 20, focalY: 80 }),
      headers: { 'content-type': 'application/json' },
    })
    expect(ok.status, ok.raw.toString().slice(0, 300)).toBe(200)
    const d = await mediaDoc(t.payload, m.id)
    expect([d.focalX, d.focalY]).toEqual([20, 80])
    const bad = await mediaRest('PATCH', `/api/media/${m.id}`, {
      token: ed.token,
      body: JSON.stringify({ focalX: 150 }),
      headers: { 'content-type': 'application/json' },
    })
    expect(bad.status).toBe(400)
  })
})

describe('storage failures leave no orphans', () => {
  it('an unwritable media directory fails the upload without a document or stray files', async () => {
    const before = await mediaCount()
    const files = listDir(t.mediaDir)
    fs.chmodSync(t.mediaDir, 0o500)
    try {
      const r = await uploadMedia({
        token: ed.token,
        file: await jpegFile(800, 600),
        data: { alt: 'x' },
      })
      expect(r.status).toBeGreaterThanOrEqual(400)
      expect(r.raw.toString()).not.toContain(t.mediaDir) // no filesystem paths in the response
    } finally {
      fs.chmodSync(t.mediaDir, 0o755)
    }
    expect(await mediaCount()).toBe(before)
    expect(listDir(t.mediaDir)).toEqual(files)
  })
})
