// A-8 regression (FR-016, SC-016, L-1): evidence must cover the content that is actually published,
// in every language. A per-language publish (`publishSpecificLocale`) publishes a merge: the
// publishing language from the draft and every other language from the previous published
// version. The backstop used to check only the draft, so a claim could go public in a language the
// verification never covered.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { pageData, rest } from '../../support/content'
import { bootPayload, type TestPayload } from '../../support/payload'

let t: TestPayload
const S = {} as Record<Role, Session>
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never
type Mod = typeof import('../../../src/modules/content')
let m: Mod

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ['editor', 'publisher', 'owner'] as Role[])
    S[r] = await verifiedSession(t.payload, r)
  m = await import('../../../src/modules/content')
}, 240_000)
afterAll(async () => t?.close())

type Sec = Record<string, unknown> & { id: string; blockType: string }
type Item = { id?: string; value: string; label: string }
let n = 0
const slug = () => `a8-${Date.now()}-${n++}`
const REF = 'Signed engagement register 2026-03'
const verified = { status: 'verified', reference: REF }

const create = async (label: string) =>
  (
    (await t.payload.create({
      collection: 'pages',
      locale: 'en',
      draft: true,
      data: pageData(slug(), 'Claims', {
        sections: [{ blockType: 'stats', items: [{ value: '10', label }], evidence: verified }],
      }) as never,
      user: await u('owner'),
      overrideAccess: false,
    })) as unknown as { id: number }
  ).id

const draft = async (id: number, locale: 'ar' | 'en') =>
  (await t.payload.findByID({
    collection: 'pages',
    id,
    locale,
    draft: true,
    depth: 0,
    overrideAccess: true,
  })) as unknown as { title?: string; sections: Sec[] }

/** Writes the stats block in one language as `role`; keeps row ids unless `newRows`. */
async function editStats(
  id: number,
  locale: 'ar' | 'en',
  role: Role,
  items: Item[] | ((rows: Item[]) => Item[]),
  evidence?: Record<string, unknown>,
) {
  const d = await draft(id, locale)
  const sections = d.sections.map((s) => {
    if (s.blockType !== 'stats') return s
    const rows = s.items as Item[]
    return {
      ...s,
      items: typeof items === 'function' ? items(rows) : items,
      ...(evidence ? { evidence } : {}),
    }
  })
  const arBasics =
    locale === 'ar' && !(d as { title?: string }).title
      ? {
          title: 'مطالبات',
          slug: `ar-${id}-${n++}`,
          seo: { title: 'مطالبات', description: 'وصف الصفحة' },
        }
      : {}
  return t.payload.update({
    collection: 'pages',
    id,
    locale,
    draft: true,
    data: { ...arBasics, sections } as never,
    user: await u(role),
    overrideAccess: false,
  })
}

const publish = async (id: number, locale?: 'ar' | 'en') =>
  t.payload.update({
    collection: 'pages',
    id,
    locale: locale ?? 'en',
    data: { _status: 'published' } as never,
    ...(locale ? { publishSpecificLocale: locale } : {}),
    user: await u('owner'),
    overrideAccess: false,
  })

const live = async (id: number) =>
  (await t.payload.findByID({
    collection: 'pages',
    id,
    locale: 'all' as never,
    draft: false,
    depth: 0,
    overrideAccess: true,
  })) as unknown as {
    _status: Record<string, string>
    sections: { items: { label: Record<string, string> }[] }[]
  }

/** Register problems for one document (`pages/<id>` or `site-settings`). */
const problems = async (source: string) =>
  (await m.evidenceRegister(t.payload)).problems.filter((p) => p.startsWith(`${source} `))

/** Published in English with a verified claim. */
async function publishedEn(label = 'Engagements') {
  const id = await create(label)
  await publish(id, 'en')
  return id
}

describe('A-8: evidence is checked against the published document', () => {
  it('the seed sequence (Arabic rows replaced, re-verified, Arabic-only publish) is refused', async () => {
    const id = await publishedEn()
    // Arabic edit sends new rows (no ids): the English label is not in the draft any more.
    await editStats(id, 'ar', 'editor', [{ value: '10', label: 'مشروع' }])
    await editStats(id, 'ar', 'owner', (rows) => rows, verified) // re-verify the draft
    await expect(publish(id, 'ar')).rejects.toMatchObject({ status: 400 })
    const after = await live(id)
    expect(after._status.ar).not.toBe('published')
    expect(after.sections[0]!.items[0]!.label).toEqual({ en: 'Engagements' })
    expect(await problems(`pages/${id}`)).toEqual([])
  })

  it('the same edit keeping row ids publishes, and the register stays clean', async () => {
    const id = await publishedEn()
    await editStats(id, 'ar', 'editor', (rows) => rows.map((r) => ({ ...r, label: 'مشروع' })))
    await editStats(id, 'ar', 'owner', (rows) => rows, verified)
    await publish(id, 'ar')
    const after = await live(id)
    expect(after._status).toEqual({ en: 'published', ar: 'published' })
    expect(after.sections[0]!.items[0]!.label).toEqual({ en: 'Engagements', ar: 'مشروع' })
    expect(await problems(`pages/${id}`)).toEqual([])
  })

  it('non-localized claim change, re-verified: an Arabic-only publish matches the verification and is allowed', async () => {
    const id = await publishedEn()
    await editStats(id, 'ar', 'editor', (rows) => rows.map((r) => ({ ...r, label: 'مشروع' })))
    await editStats(id, 'ar', 'owner', (rows) => rows, verified)
    await publish(id, 'ar')
    // English draft changes the claim; an administrator verifies the new draft.
    await editStats(id, 'en', 'editor', (rows) => rows.map((r) => ({ ...r, value: '25' })))
    await editStats(id, 'en', 'owner', (rows) => rows, verified)
    // `value` is not localized: an Arabic-only publish carries the new value for every language,
    // so the published document matches the verification exactly and is allowed.
    await publish(id, 'ar')
    expect(await problems(`pages/${id}`)).toEqual([])
    // Publishing every language together always matches the verified draft.
    await publish(id)
    expect(await problems(`pages/${id}`)).toEqual([])
  })

  it('a localized label changed in English draft and re-verified cannot be published via Arabic only', async () => {
    const id = await publishedEn('Engagements')
    await editStats(id, 'ar', 'editor', (rows) => rows.map((r) => ({ ...r, label: 'مشروع' })))
    await editStats(id, 'ar', 'owner', (rows) => rows, verified)
    await publish(id, 'ar')
    await editStats(id, 'en', 'editor', (rows) => rows.map((r) => ({ ...r, label: 'Audits' })))
    await editStats(id, 'en', 'owner', (rows) => rows, verified)
    // Arabic-only publish would keep "Engagements" public under a verification of "Audits".
    await expect(publish(id, 'ar')).rejects.toMatchObject({ status: 400 })
    expect((await live(id)).sections[0]!.items[0]!.label.en).toBe('Engagements')
    await publish(id, 'en')
    expect((await live(id)).sections[0]!.items[0]!.label).toEqual({ en: 'Audits', ar: 'مشروع' })
    expect(await problems(`pages/${id}`)).toEqual([])
  })

  it('stale evidence: a claim changed after verification cannot be published in any language', async () => {
    const id = await publishedEn()
    await editStats(id, 'ar', 'editor', (rows) => rows.map((r) => ({ ...r, label: 'مشروع' })))
    for (const locale of ['ar', 'en'] as const)
      await expect(publish(id, locale)).rejects.toMatchObject({ status: 400 })
    await expect(publish(id)).rejects.toMatchObject({ status: 400 })
  })

  it('mismatched translation: verifying one language does not cover a later change in the other', async () => {
    const id = await publishedEn()
    await editStats(id, 'ar', 'editor', (rows) => rows.map((r) => ({ ...r, label: 'مشروع' })))
    await editStats(id, 'ar', 'owner', (rows) => rows, verified)
    await editStats(id, 'ar', 'editor', (rows) =>
      rows.map((r) => ({ ...r, label: 'عشرون مشروعاً' })),
    )
    expect((await draft(id, 'ar')).sections[0]!.evidence).toMatchObject({ status: 'unverified' })
    await expect(publish(id, 'ar')).rejects.toMatchObject({ status: 400 })
  })

  it('a duplicate starts unverified and cannot be published until verified', async () => {
    const id = await publishedEn()
    const copy = (await t.payload.duplicate({
      collection: 'pages',
      id,
      locale: 'en',
      draft: true,
      data: { slug: slug() } as never,
      user: await u('owner'),
      overrideAccess: false,
    })) as unknown as { id: number }
    expect((await draft(copy.id, 'en')).sections[0]!.evidence).toMatchObject({
      status: 'unverified',
      claimDigest: null,
      verifiedBy: null,
    })
    await expect(publish(copy.id, 'en')).rejects.toMatchObject({ status: 400 })
  })

  it('pasting a verified block: Editors are refused; forged digest and verifier are ignored', async () => {
    const forged = {
      status: 'verified',
      reference: REF,
      claimDigest: '0'.repeat(64),
      verifiedBy: 1,
      verifiedAt: '2020-01-01T00:00:00.000Z',
    }
    const block = {
      blockType: 'stats',
      items: [{ value: '99', label: 'Pasted' }],
      evidence: forged,
    }
    await expect(
      t.payload.create({
        collection: 'pages',
        locale: 'en',
        draft: true,
        data: pageData(slug(), 'Paste', { sections: [block] }) as never,
        user: await u('editor'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    const p = (await t.payload.create({
      collection: 'pages',
      locale: 'en',
      draft: true,
      data: pageData(slug(), 'Paste', { sections: [block] }) as never,
      user: await u('owner'),
      overrideAccess: false,
    })) as unknown as { id: number }
    const ev = (await draft(p.id, 'en')).sections[0]!.evidence as Record<string, unknown>
    expect(ev.claimDigest).not.toBe(forged.claimDigest)
    expect(ev.verifiedAt).not.toBe(forged.verifiedAt)
    await publish(p.id, 'en')
    expect(await problems(`pages/${p.id}`)).toEqual([])
  })

  it('direct REST publishing of the A-8 sequence is refused', async () => {
    const id = await publishedEn()
    await editStats(id, 'ar', 'editor', [{ value: '10', label: 'مشروع' }])
    await editStats(id, 'ar', 'owner', (rows) => rows, verified)
    const r = await rest(
      t.payload,
      'PATCH',
      `/api/pages/${id}?locale=ar&publishSpecificLocale=ar&draft=false`,
      { token: S.owner.token, body: { _status: 'published' } },
    )
    expect(r.status).toBe(400)
    expect((await live(id))._status.ar).not.toBe('published')
  })
})

describe('A-8 for globals (site-settings company name)', () => {
  const settings = async (
    locale: 'ar' | 'en',
    data: Record<string, unknown>,
    publishLocale?: 'ar' | 'en',
  ) =>
    t.payload.updateGlobal({
      slug: 'site-settings',
      locale,
      data: data as never,
      ...(publishLocale ? { publishSpecificLocale: publishLocale } : { draft: true }),
      user: await u('owner'),
      overrideAccess: false,
    })
  const base = {
    defaultSeo: { title: 'Site', description: 'Site description' },
  }

  it('a re-verified English draft cannot be published through an Arabic-only publish', async () => {
    await settings('en', { ...base, companyName: 'Altamiuz Ltd', companyNameEvidence: verified })
    await settings('en', { _status: 'published' }, 'en')
    await settings('ar', {
      defaultSeo: { title: 'الموقع', description: 'وصف' },
      companyName: 'التميز',
    })
    await settings('ar', { companyNameEvidence: verified })
    await settings('ar', { _status: 'published' }, 'ar')
    // English draft changes the legal name; an administrator verifies the draft.
    await settings('en', { companyName: 'Altamiuz Holdings' })
    await settings('en', { companyNameEvidence: verified })
    await expect(settings('ar', { _status: 'published' }, 'ar')).rejects.toMatchObject({
      status: 400,
    })
    const pub = (await t.payload.findGlobal({
      slug: 'site-settings',
      locale: 'all' as never,
      draft: false,
      depth: 0,
      overrideAccess: true,
    })) as unknown as { companyName: Record<string, string> }
    expect(pub.companyName.en).toBe('Altamiuz Ltd')
    await settings('en', { _status: 'published' }, 'en')
    expect(await problems('site-settings')).toEqual([])
  })
})
