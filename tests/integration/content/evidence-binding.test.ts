// L-1: a verification covers exactly the claim it verified, in every language; changing the claim
// (any language, any write path) removes it, and a publish can never carry an unverified or
// mismatched claim. L-2: the admin "copy to locale" action (Payload's real handler, run inside
// the admin server-function scope) always produces a draft in the target language.
import { createLocalReq, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runServerFunction } from '@/modules/content'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { pageData, rest, rt } from '../../support/content'

// Payload's own copy-to-locale handler (what handleServerFunctions runs for the admin action),
// imported by file: the package's `rsc` entry also loads SCSS, which the test runner cannot.
const { copyDataFromLocaleHandler } =
  (await import('../../../node_modules/@payloadcms/ui/dist/utilities/copyDataFromLocale.js')) as {
    copyDataFromLocaleHandler: (args: unknown) => Promise<unknown>
  }

let t: TestPayload
const S = {} as Record<Role, Session>
const ROLES: Role[] = ['editor', 'publisher', 'administrator', 'owner']
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ROLES) S[r] = await verifiedSession(t.payload, r)
}, 240_000)
afterAll(async () => t?.close())

let n = 0
const slug = () => `ev-${Date.now()}-${n++}`
type Ev = { status: string; reference?: string; verifiedBy?: unknown; claimDigest?: string | null }

async function course(role: Role = 'administrator', evidence: Partial<Ev> = {}) {
  const c = (await t.payload.create({
    collection: 'courses',
    draft: true,
    locale: 'en',
    data: {
      title: 'Course',
      slug: slug(),
      summary: 'Summary',
      accreditationStatement: 'Accredited by Example Body',
      accreditationEvidence: { status: 'verified', reference: 'Certificate 42', ...evidence },
      sections: [{ blockType: 'richText', content: rt('x') }],
      seo: { title: 'Course | SEO', description: 'Search description' },
    } as never,
    user: await u(role),
    overrideAccess: false,
  })) as unknown as { id: number }
  return c.id
}
const courseEv = async (id: number) =>
  (
    (await t.payload.findByID({
      collection: 'courses',
      id,
      draft: true,
      depth: 0,
      overrideAccess: true,
    })) as unknown as { accreditationEvidence: Ev }
  ).accreditationEvidence
const update = async (
  role: Role,
  collection: 'courses' | 'pages',
  id: number,
  locale: 'ar' | 'en',
  data: Record<string, unknown>,
  draft = true,
) =>
  t.payload.update({
    collection,
    id,
    locale,
    draft,
    data: data as never,
    user: await u(role),
    overrideAccess: false,
  })
const publicCourse = async (id: number, locale: 'ar' | 'en' = 'en') =>
  (
    await t.payload.find({
      collection: 'courses',
      where: { id: { equals: id } },
      locale,
      fallbackLocale: false,
      overrideAccess: false,
      context: { publicSite: true },
    })
  ).docs

describe('L-1 evidence is bound to the exact claim', () => {
  it('an Administrator verification records a claim digest; non-claim edits keep it', async () => {
    const id = await course()
    const ev = await courseEv(id)
    expect(ev.status).toBe('verified')
    expect(ev.claimDigest).toMatch(/^[0-9a-f]{64}$/)
    await update('editor', 'courses', id, 'en', { summary: 'A different summary' })
    expect(await courseEv(id)).toMatchObject({ status: 'verified', claimDigest: ev.claimDigest })
    await update('publisher', 'courses', id, 'en', { _status: 'published' }, false)
    expect(await publicCourse(id)).toHaveLength(1)
  })

  for (const [label, locale, value] of [
    ['an English edit', 'en', 'Accredited by Another Body'],
    ['adding the Arabic claim', 'ar', 'معتمد من جهة أخرى'],
    ['whitespace only', 'en', 'Accredited by Example Body '],
  ] as const)
    it(`${label} removes the verification, and the course cannot be published`, async () => {
      const id = await course()
      // An Arabic draft also needs its own title and slug (drafts are validated, D-22).
      const ar = locale === 'ar' ? { title: 'دورة', slug: `ع-${slug()}` } : {}
      await update('editor', 'courses', id, locale, { ...ar, accreditationStatement: value })
      expect(await courseEv(id)).toMatchObject({
        status: 'unverified',
        verifiedBy: null,
        claimDigest: null,
      })
      await expect(
        update('owner', 'courses', id, 'en', { _status: 'published' }, false),
      ).rejects.toMatchObject({ status: 400 })
      expect(await publicCourse(id)).toEqual([])
    })

  it('a claim change and a publish in the same request are refused and rolled back', async () => {
    const id = await course()
    await update('publisher', 'courses', id, 'en', { _status: 'published' }, false)
    for (const role of ['publisher', 'administrator', 'owner'] as const)
      await expect(
        update(
          role,
          'courses',
          id,
          'en',
          { accreditationStatement: 'Accredited by Nobody', _status: 'published' },
          false,
        ),
      ).rejects.toMatchObject({ status: 400 })
    const live = await publicCourse(id)
    expect(live).toHaveLength(1)
    expect((live[0] as { accreditationStatement?: string }).accreditationStatement).toBe(
      'Accredited by Example Body',
    )
  })

  it('a forged digest, status or verifier in the request is ignored', async () => {
    const id = await course()
    const before = await courseEv(id)
    const editor = (await u('editor')) as unknown as { id: number }
    // Claim changed, evidence sent back as "verified" with a made-up digest and verifier.
    await update('editor', 'courses', id, 'en', {
      accreditationStatement: 'Accredited by a Forged Body',
      accreditationEvidence: {
        status: 'verified',
        reference: before.reference,
        verifiedBy: editor.id,
        claimDigest: 'f'.repeat(64),
      },
    })
    expect(await courseEv(id)).toMatchObject({ status: 'unverified', claimDigest: null })
    // Unchanged claim, forged digest: the stored digest stays the server's.
    const id2 = await course()
    const ev2 = await courseEv(id2)
    await update('editor', 'courses', id2, 'en', {
      accreditationEvidence: { ...ev2, verifiedBy: editor.id, claimDigest: '0'.repeat(64) },
    })
    expect(await courseEv(id2)).toMatchObject({ status: 'verified', claimDigest: ev2.claimDigest })
  })

  it('Editors and Publishers still cannot verify; an Administrator can re-verify a changed claim', async () => {
    const id = await course()
    await update('editor', 'courses', id, 'en', { accreditationStatement: 'Changed claim' })
    for (const role of ['editor', 'publisher'] as const)
      await expect(
        update(role, 'courses', id, 'en', {
          accreditationEvidence: { status: 'verified', reference: 'Certificate 42' },
        }),
      ).rejects.toMatchObject({ status: 403 })
    await update('administrator', 'courses', id, 'en', {
      accreditationEvidence: { status: 'verified', reference: 'Certificate 43' },
    })
    expect((await courseEv(id)).status).toBe('verified')
    await update('publisher', 'courses', id, 'en', { _status: 'published' }, false)
    expect(await publicCourse(id)).toHaveLength(1)
  })

  it('statistics and credentials blocks: changing an item removes the verification; re-saving does not', async () => {
    const page = (await t.payload.create({
      collection: 'pages',
      draft: true,
      locale: 'en',
      data: pageData(slug(), 'Claims', {
        sections: [
          {
            blockType: 'stats',
            items: [{ value: '10', label: 'Engagements' }],
            evidence: { status: 'verified', reference: 'Register 2026' },
          },
          {
            blockType: 'credentials',
            items: [
              { name: 'Example Certificate', issuer: 'Example Body', validUntil: '2027-06-30' },
            ],
            evidence: { status: 'verified', reference: 'Certificate file' },
          },
        ],
      }) as never,
      user: await u('administrator'),
      overrideAccess: false,
    })) as unknown as { id: number }
    const read = async () =>
      (
        (await t.payload.findByID({
          collection: 'pages',
          id: page.id,
          draft: true,
          locale: 'en',
          depth: 0,
          overrideAccess: true,
        })) as unknown as {
          sections: (Record<string, unknown> & {
            id: string
            evidence: Ev
            items: Record<string, unknown>[]
          })[]
        }
      ).sections
    // Re-saving exactly what is stored (the admin form does this) keeps both verifications,
    // including the date, which Payload stores in its own format.
    const stored = await read()
    await update('editor', 'pages', page.id, 'en', { sections: stored })
    expect((await read()).map((b) => b.evidence.status)).toEqual(['verified', 'verified'])

    for (const [i, change] of [
      [0, (b: Record<string, unknown>[]) => [{ ...b[0], value: '11' }]],
      [0, (b: Record<string, unknown>[]) => [...b, { value: '3', label: 'Offices' }]],
      [1, (b: Record<string, unknown>[]) => [{ ...b[0], validUntil: '2030-01-01' }]],
    ] as const) {
      const s = await read()
      if (s[i]!.evidence.status !== 'verified')
        await update('administrator', 'pages', page.id, 'en', {
          sections: s.map((b, j) =>
            j === i ? { ...b, evidence: { status: 'verified', reference: 'Again' } } : b,
          ),
        })
      const fresh = await read()
      expect(fresh[i]!.evidence.status).toBe('verified')
      await update('editor', 'pages', page.id, 'en', {
        sections: fresh.map((b, j) => (j === i ? { ...b, items: change(b.items) } : b)),
      })
      expect((await read())[i]!.evidence).toMatchObject({ status: 'unverified', claimDigest: null })
    }
    // An Arabic label edit on re-verified statistics also counts as a claim change.
    const s = await read()
    await update('administrator', 'pages', page.id, 'en', {
      sections: s.map((b, j) =>
        j === 0 ? { ...b, evidence: { status: 'verified', reference: 'Again' } } : b,
      ),
    })
    const v = await read()
    await update('editor', 'pages', page.id, 'ar', {
      title: 'ادعاءات',
      slug: `ع-${slug()}`,
      sections: v.map((b) => ({
        ...b,
        items: (b.items as Record<string, unknown>[]).map((it) =>
          b.blockType === 'stats' ? { ...it, label: 'مشروع' } : it,
        ),
      })),
    })
    expect((await read())[0]!.evidence.status).toBe('unverified')
  })

  it('site-settings: a changed company name loses its verification and cannot be published', async () => {
    const write = async (role: Role, data: Record<string, unknown>, draft = true) =>
      t.payload.updateGlobal({
        slug: 'site-settings',
        locale: 'en',
        draft,
        data: data as never,
        user: await u(role),
        overrideAccess: false,
      })
    await write('administrator', {
      companyName: 'Example Company',
      companyNameEvidence: { status: 'verified', reference: 'Registry extract' },
      defaultSeo: { title: 'Site', description: 'Site description' },
    })
    // The latest version (a first draft of a global has no main row yet).
    const ev = async () =>
      (
        (
          await t.payload.findGlobalVersions({
            slug: 'site-settings',
            sort: '-updatedAt',
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
        ).docs[0]!.version as unknown as { companyNameEvidence: Ev }
      ).companyNameEvidence
    expect((await ev()).status).toBe('verified')
    await write('administrator', { _status: 'published' }, false)
    await expect(
      write('owner', { companyName: 'Other Company', _status: 'published' }, false),
    ).rejects.toMatchObject({ status: 400 })
    await write('administrator', { companyName: 'Other Company' })
    expect((await ev()).status).toBe('unverified')
    await expect(write('owner', { _status: 'published' }, false)).rejects.toMatchObject({
      status: 400,
    })
  })

  it('a duplicate of a verified course starts unverified (Local API and REST)', async () => {
    const id = await course()
    const copy = (await t.payload.duplicate({
      collection: 'courses',
      id,
      locale: 'en',
      data: { slug: slug() } as never,
      user: await u('editor'),
      overrideAccess: false,
    } as never)) as unknown as { id: number }
    expect(await courseEv(copy.id)).toMatchObject({ status: 'unverified', claimDigest: null })
    const r = await rest(t.payload, 'POST', `/api/courses/${id}/duplicate?locale=en`, {
      token: S.publisher.token,
      body: { slug: slug(), _status: 'draft' },
    })
    expect(r.status, r.raw.slice(0, 200)).toBe(200)
    expect(await courseEv((r.body.doc as { id: number }).id)).toMatchObject({
      status: 'unverified',
    })
    expect((await courseEv(id)).status).toBe('verified') // the source is untouched
  })
})

describe('L-2 copy to locale always produces a draft', () => {
  async function copyAs(
    role: Role,
    target: { collectionSlug?: string; globalSlug?: string; docID?: number },
    scoped = true,
  ) {
    const req = (await createLocalReq({ user: await u(role) }, t.payload)) as PayloadRequest
    // overrideData: the drawer's "overwrite" option. Without it Payload copies only into fields
    // that already exist in the target language, so a new translation fails validation.
    const run = () =>
      copyDataFromLocaleHandler({
        ...target,
        fromLocale: 'en',
        toLocale: 'ar',
        overrideData: true,
        req,
      } as never)
    return scoped ? runServerFunction('copy-data-from-locale', run) : run()
  }
  const status = async (id: number): Promise<Record<string, string>> =>
    (
      await t.sql.query('select _locale, _status from pages_locales where _parent_id = $1', [id])
    ).rows.reduce(
      (a: Record<string, string>, r) => ({ ...a, [r._locale]: r._status }),
      {} as Record<string, string>,
    )
  const latestArStatus = async (id: number) =>
    (
      await t.sql.query(
        `select l.version__status as _status from _pages_v v join _pages_v_locales l on l._parent_id = v.id
         where v.parent_id = $1 and l._locale = 'ar' order by v.id desc limit 1`,
        [id],
      )
    ).rows[0]?._status
  const isPublic = async (id: number, locale: 'ar' | 'en') =>
    (
      await t.payload.find({
        collection: 'pages',
        where: { id: { equals: id } },
        locale,
        fallbackLocale: false,
        overrideAccess: false,
        context: { publicSite: true },
      })
    ).docs.length > 0

  async function publishedEnglishPage() {
    const p = (await t.payload.create({
      collection: 'pages',
      draft: true,
      locale: 'en',
      data: pageData(slug(), 'Copy source') as never,
      overrideAccess: true,
    })) as unknown as { id: number }
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      overrideAccess: true,
    })
    return p.id
  }

  for (const role of ROLES)
    it(`${role}: copying a published English page to Arabic saves an Arabic draft only`, async () => {
      const id = await publishedEnglishPage()
      await copyAs(role, { collectionSlug: 'pages', docID: id })
      expect(await latestArStatus(id)).toBe('draft')
      expect(await isPublic(id, 'ar')).toBe(false)
      expect(await isPublic(id, 'en')).toBe(true)
      expect((await status(id)).ar).not.toBe('published')
    })

  // Payload 3.91 copy-to-locale for globals reads `payload.globals[slug].config`, but
  // `payload.globals` is `{ config: [...] }`, so it throws before writing, for every role. The
  // copy scope still applies if that is fixed upstream; meanwhile nothing is ever published.
  it('navigation: the copy never publishes the target language (upstream copy fails before writing)', async () => {
    await t.payload.updateGlobal({
      slug: 'header-nav',
      locale: 'en',
      data: {
        items: [{ link: { linkType: 'external', url: 'https://example.org/', label: 'Copied' } }],
        _status: 'published',
      } as never,
      overrideAccess: true,
    })
    const arPublished = async () =>
      (
        await t.payload.findGlobal({
          slug: 'header-nav',
          locale: 'ar',
          fallbackLocale: false,
          overrideAccess: false,
          context: { publicSite: true },
        })
      )._status === 'published'
    const before = await arPublished()
    for (const role of ROLES) {
      await expect(copyAs(role, { globalSlug: 'header-nav' })).rejects.toBeTruthy()
      expect(await arPublished()).toBe(before)
    }
  })

  it('a copied claim needs its own verification', async () => {
    const id = await course()
    const req = (await createLocalReq({ user: await u('publisher') }, t.payload)) as PayloadRequest
    await runServerFunction('copy-data-from-locale', () =>
      copyDataFromLocaleHandler({
        collectionSlug: 'courses',
        docID: id,
        fromLocale: 'en',
        toLocale: 'ar',
        overrideData: true,
        req,
      } as never),
    )
    expect((await courseEv(id)).status).toBe('unverified')
  })

  it('only the copy-to-locale server function runs in the copy scope', async () => {
    const { isLocaleCopy } = await import('@/modules/content')
    expect(runServerFunction('copy-data-from-locale', () => isLocaleCopy())).toBe(true)
    for (const name of ['render-document', 'form-state', 'table-state', 'copy-data-from-locale '])
      expect(
        runServerFunction(name, () => isLocaleCopy()),
        name,
      ).toBe(false)
    expect(isLocaleCopy()).toBe(false)
  })
})
