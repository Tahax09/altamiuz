// T074 (FR-016, FR-020–FR-025): per-locale publish/unpublish with localizeStatus, drafts never
// public, restore returns a draft, the evidence gate, and denied publication is audited.
// T075: pins the experimental localizeStatus behaviour to the installed Payload version.
import fs from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { pageData, rt } from '../../support/content'

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
const slug = () => `page-${Date.now()}-${n++}`

async function draftPage(
  role: Role = 'editor',
  locale: 'ar' | 'en' = 'en',
  data = pageData(slug()),
) {
  return (await t.payload.create({
    collection: 'pages',
    data: data as never,
    draft: true,
    locale,
    user: await u(role),
    overrideAccess: false,
  })) as unknown as { id: number; _status: string }
}

const publicFind = (locale: 'ar' | 'en', id: number) =>
  t.payload
    .find({
      collection: 'pages',
      where: { id: { equals: id } },
      locale,
      fallbackLocale: false,
      overrideAccess: false,
      context: { publicSite: true },
    })
    .then((r) => r.docs as unknown as Record<string, unknown>[])

const auditCount = async (action: string, outcome?: string) =>
  Number(
    (
      await t.sql.query(
        `select count(*) from audit_events where action = $1 ${outcome ? 'and outcome = $2' : ''}`,
        outcome ? [action, outcome] : [action],
      )
    ).rows[0].count,
  )

describe('T075 localizeStatus regression pin', () => {
  it('runs against Payload 3.91.0 with experimental localizeStatus enabled', async () => {
    const pkg = JSON.parse(fs.readFileSync('node_modules/payload/package.json', 'utf8'))
    expect(pkg.version).toBe('3.91.0')
    const cfg = t.payload.config
    expect(cfg.experimental?.localizeStatus).toBe(true)
    for (const c of ['pages', 'services', 'courses'] as const) {
      const drafts = t.payload.collections[c]!.config.versions?.drafts
      expect(drafts && typeof drafts === 'object' && drafts.localizeStatus).toBe(true)
    }
  })

  it('stores _status per locale (the experimental behaviour US2 relies on)', async () => {
    const res = await t.sql.query(
      `select column_name, table_name from information_schema.columns
       where column_name = '_status' and table_name in ('pages', 'pages_locales')`,
    )
    expect(res.rows.map((r) => r.table_name)).toEqual(['pages_locales'])
  })
})

describe('T074 drafts are never public', () => {
  it('a new draft is invisible to anonymous public reads in both locales', async () => {
    const p = await draftPage()
    expect(await publicFind('en', p.id)).toEqual([])
    expect(await publicFind('ar', p.id)).toEqual([])
  })

  it('anonymous reads without the public-site context are denied outright', async () => {
    const p = await draftPage()
    await expect(
      t.payload.findByID({ collection: 'pages', id: p.id, overrideAccess: false }),
    ).rejects.toThrow()
    const versions = await t.payload
      .findVersions({ collection: 'pages', overrideAccess: false })
      .catch((e: Error) => e)
    expect(versions).toBeInstanceOf(Error)
  })

  it('a public-site read that also carries a user is not widened to drafts', async () => {
    const p = await draftPage()
    const unverified = { ...(await userFor(t.payload, S.editor.token))!, mfaVerified: false }
    const r = await t.payload
      .find({
        collection: 'pages',
        where: { id: { equals: p.id } },
        user: unverified as never,
        overrideAccess: false,
        context: { publicSite: true },
      })
      .catch((e: Error) => e)
    expect(r instanceof Error || r.docs.length === 0).toBe(true)
  })
})

describe('T074 per-locale publish and unpublish', () => {
  it('publishing English leaves Arabic unpublished, then Arabic can be published separately', async () => {
    const p = await draftPage('editor', 'en')
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'ar',
      draft: true,
      data: {
        title: 'عنوان',
        slug: `ar-${p.id}`,
        seo: { title: 'عنوان', description: 'وصف' },
      } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      publishSpecificLocale: 'en',
      user: await u('publisher'),
      overrideAccess: false,
    })
    const en = await publicFind('en', p.id)
    expect(en).toHaveLength(1)
    expect(en[0]!.title).toBe('Title')
    expect(await publicFind('ar', p.id)).toEqual([])

    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'ar',
      data: { _status: 'published' } as never,
      publishSpecificLocale: 'ar',
      user: await u('publisher'),
      overrideAccess: false,
    })
    const ar = await publicFind('ar', p.id)
    expect(ar).toHaveLength(1)
    expect(ar[0]!.title).toBe('عنوان')
    expect(await publicFind('en', p.id)).toHaveLength(1)
    expect(await auditCount('content.publish', 'success')).toBeGreaterThanOrEqual(2)
  })

  it('later draft edits do not change the published version until published again', async () => {
    const p = await draftPage('editor', 'en')
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      draft: true,
      data: { title: 'Unreleased edit' } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    const pub = await publicFind('en', p.id)
    expect(pub[0]!.title).toBe('Title')
  })

  it('unpublishing one locale removes only that locale from public reads', async () => {
    const p = await draftPage('editor', 'en')
    for (const locale of ['en', 'ar'] as const) {
      if (locale === 'ar')
        await t.payload.update({
          collection: 'pages',
          id: p.id,
          locale,
          draft: true,
          data: {
            title: 'عنوان',
            slug: `ar-un-${p.id}`,
            seo: { title: 'عنوان', description: 'وصف' },
          } as never,
          user: await u('editor'),
          overrideAccess: false,
        })
      await t.payload.update({
        collection: 'pages',
        id: p.id,
        locale,
        data: { _status: 'published' } as never,
        publishSpecificLocale: locale,
        user: await u('publisher'),
        overrideAccess: false,
      })
    }
    const before = await auditCount('content.unpublish', 'success')
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'ar',
      data: { _status: 'draft' } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    expect(await publicFind('ar', p.id)).toEqual([])
    expect(await publicFind('en', p.id)).toHaveLength(1)
    expect(await auditCount('content.unpublish', 'success')).toBe(before + 1)
  })
})

describe('T074 publishing requires complete locale fields', () => {
  it('publishing Arabic is refused while the Arabic title and slug are empty; English is unaffected', async () => {
    const p = await draftPage('editor', 'en')
    await expect(
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'ar',
        data: { _status: 'published' } as never,
        publishSpecificLocale: 'ar',
        user: await u('publisher'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 400 })
    expect(await publicFind('ar', p.id)).toEqual([])
    expect(await publicFind('en', p.id)).toEqual([])
  })
})

describe('T074 SEO title and description are required to publish (data-model seo group)', () => {
  it('publishing a locale without SEO title or description is refused; drafts may omit them', async () => {
    for (const seo of [{ title: '', description: 'd' }, { title: 't', description: '' }, {}]) {
      const p = await draftPage('editor', 'en', pageData(slug(), 'No SEO', { seo }))
      await expect(
        t.payload.update({
          collection: 'pages',
          id: p.id,
          locale: 'en',
          data: { _status: 'published' } as never,
          user: await u('publisher'),
          overrideAccess: false,
        }),
        JSON.stringify(seo),
      ).rejects.toMatchObject({ status: 400 })
      expect(await publicFind('en', p.id)).toEqual([])
    }
  })
})

describe('T074 workflow permissions (publish/unpublish/restore are not draft editing)', () => {
  it('an Editor cannot publish; the attempt is denied and audited', async () => {
    const p = await draftPage()
    const before = await auditCount('access.denied', 'denied')
    await expect(
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        data: { _status: 'published' } as never,
        user: await u('editor'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(await publicFind('en', p.id)).toEqual([])
    expect(await auditCount('access.denied', 'denied')).toBe(before + 1)
  })

  it('an Editor cannot publish by creating a document as published', async () => {
    const data = { ...pageData(slug()), _status: 'published' }
    await expect(
      t.payload.create({
        collection: 'pages',
        data: data as never,
        locale: 'en',
        user: await u('editor'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('an Editor cannot unpublish a published page', async () => {
    const p = await draftPage()
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    await expect(
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        data: { _status: 'draft' } as never,
        user: await u('editor'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(await publicFind('en', p.id)).toHaveLength(1)
  })

  it('an Editor may still save drafts of a published page without unpublishing it', async () => {
    const p = await draftPage()
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      draft: true,
      data: { title: 'Draft only' } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    expect((await publicFind('en', p.id))[0]!.title).toBe('Title')
  })
})

async function restore(role: Role, versionId: number) {
  const { createLocalReq } = await import('payload')
  const { restoreAsDraft } = await import('@/modules/content')
  const req = await createLocalReq({ user: await u(role) }, t.payload)
  return restoreAsDraft(req, 'pages', versionId)
}

describe('T074 unauthorized publication paths', () => {
  async function published() {
    const p = await draftPage()
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    return p
  }

  it('an Editor cannot edit the live document with a non-draft update (no _status sent)', async () => {
    const p = await published()
    await expect(
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        data: { title: 'Sneaky live edit' } as never,
        user: await u('editor'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect((await publicFind('en', p.id))[0]!.title).toBe('Title')
  })

  it('an Editor cannot publish by sending _status=published with draft=true', async () => {
    const p = await draftPage()
    await expect(
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        draft: true,
        data: { _status: 'published' } as never,
        user: await u('editor'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(await publicFind('en', p.id)).toEqual([])
  })

  it('an Editor cannot unpublish every locale through a draft save with unpublishAllLocales', async () => {
    const p = await published()
    await expect(
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        draft: true,
        unpublishAllLocales: true,
        data: { title: 'x' } as never,
        user: await u('editor'),
        overrideAccess: false,
      } as never),
    ).rejects.toMatchObject({ status: 403 })
    expect(await publicFind('en', p.id)).toHaveLength(1)
  })

  it('over REST, an Editor PATCH with ?draft=true&_status=published is refused', async () => {
    const { rest } = await import('../../support/content')
    const p = await draftPage()
    const r = await rest(t.payload, 'PATCH', `/api/pages/${p.id}?draft=true&locale=en`, {
      token: S.editor.token,
      body: { _status: 'published' },
    })
    expect(r.status).toBe(403)
    const bulk = await rest(t.payload, 'PATCH', `/api/pages?where[id][equals]=${p.id}&locale=en`, {
      token: S.editor.token,
      body: { _status: 'published' },
    })
    expect(bulk.status === 403 || (bulk.body.errors as unknown[] | undefined)?.length).toBeTruthy()
    expect(await publicFind('en', p.id)).toEqual([])
  })

  it('publishing all locales needs every locale complete (FR-004)', async () => {
    const p = await draftPage()
    const all = async () =>
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        data: { _status: 'published' } as never,
        publishAllLocales: true,
        user: await u('publisher'),
        overrideAccess: false,
      } as never)
    // Arabic is empty: refused, nothing published (WS10 finding: it used to publish an empty locale).
    await expect(all()).rejects.toMatchObject({ status: 400 })
    expect(await publicFind('en', p.id)).toEqual([])
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'ar',
      draft: true,
      data: {
        title: 'عنوان',
        slug: `ar-all-${p.id}`,
        seo: { title: 'عنوان', description: 'وصف' },
      } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    await all()
    expect(await publicFind('en', p.id)).toHaveLength(1)
    expect(await publicFind('ar', p.id)).toHaveLength(1)
  })
})

describe('T074 versions and restore', () => {
  async function versionsOf(id: number) {
    return (
      await t.payload.findVersions({
        collection: 'pages',
        where: { parent: { equals: id } },
        sort: 'createdAt',
        overrideAccess: true,
        locale: 'en',
      })
    ).docs as unknown as { id: number; version: Record<string, unknown> }[]
  }

  it('restoring a published version returns a draft and is audited; Editors cannot restore', async () => {
    const p = await draftPage()
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { title: 'Published v1', _status: 'published' } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      draft: true,
      data: { title: 'Draft v2' } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    const v1 = (await versionsOf(p.id)).find((v) => v.version.title === 'Published v1')!
    expect(v1).toBeTruthy()

    await expect(restore('editor', v1.id)).rejects.toMatchObject({ status: 403 })

    // Payload's non-draft restore would overwrite the live document; it is refused.
    await expect(
      t.payload.restoreVersion({
        collection: 'pages',
        id: String(v1.id),
        user: await u('publisher'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 400 })

    const before = await auditCount('content.restore', 'success')
    await restore('publisher', v1.id)
    expect(await auditCount('content.restore', 'success')).toBe(before + 1)
    // The live (published) document is untouched by the restore.
    expect((await publicFind('en', p.id))[0]!.title).toBe('Published v1')
    const all = await versionsOf(p.id)
    // Payload copies the source version's createdAt into the restored version, so use `latest`.
    const latest = all.find((v) => (v as unknown as { latest?: boolean }).latest)!
    expect(latest.version.title).toBe('Published v1')
    expect(latest.version._status).toBe('draft')
    // History is kept, not rewritten.
    expect((await versionsOf(p.id)).some((v) => v.version.title === 'Draft v2')).toBe(true)
  })
})

describe('T074 restore validates every restored locale in one transaction (D-22, ADR-006)', () => {
  const versionWhere = async (id: number, title: string) =>
    (
      await t.payload.findVersions({
        collection: 'pages',
        where: { and: [{ parent: { equals: id } }, { 'version.title': { equals: title } }] },
        overrideAccess: true,
        locale: 'en',
      })
    ).docs[0]!.id as unknown as number
  const draftOf = async (id: number, locale: 'ar' | 'en') =>
    (await t.payload.findByID({
      collection: 'pages',
      id,
      locale,
      fallbackLocale: false,
      draft: true,
      overrideAccess: true,
    })) as unknown as { title?: string | null; slug?: string | null; _status?: string }

  it('an English-only version restores (Arabic is not required) and the audit names the locales', async () => {
    const p = await draftPage('editor', 'en', pageData(slug(), 'English v1'))
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      draft: true,
      data: { title: 'English v2' } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    await restore('publisher', await versionWhere(p.id, 'English v1'))
    expect((await draftOf(p.id, 'en')).title).toBe('English v1')
    const audit = await t.sql.query(
      `select meta from audit_events where action = 'content.restore' and target_id = $1`,
      [String(p.id)],
    )
    expect(audit.rows.at(-1)!.meta).toMatchObject({ collection: 'pages', locales: 'en' })
  })

  it('locales the version has no content for keep their current draft', async () => {
    const p = await draftPage('editor', 'en', pageData(slug(), 'Only English'))
    const v1 = await versionWhere(p.id, 'Only English')
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'ar',
      draft: true,
      data: { title: 'عربي لاحق', slug: `ar-later-${p.id}` } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    await restore('publisher', v1)
    expect((await draftOf(p.id, 'ar')).title).toBe('عربي لاحق')
  })

  it('an invalid locale in the version (slug now taken) rejects the whole restore', async () => {
    const taken = slug()
    const p = await draftPage('editor', 'en', pageData(taken, 'Has slug'))
    const v1 = await versionWhere(p.id, 'Has slug')
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      draft: true,
      data: { title: 'Renamed', slug: `${taken}-moved` } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    await draftPage('editor', 'en', pageData(taken, 'Squatter')) // another page takes the old slug
    const versionsBefore = Number(
      (await t.sql.query('select count(*) from _pages_v where parent_id = $1', [p.id])).rows[0]
        .count,
    )
    await expect(restore('publisher', v1)).rejects.toMatchObject({ status: 400 })
    const versionsAfter = Number(
      (await t.sql.query('select count(*) from _pages_v where parent_id = $1', [p.id])).rows[0]
        .count,
    )
    expect(versionsAfter).toBe(versionsBefore)
    expect((await draftOf(p.id, 'en')).title).toBe('Renamed')
  })

  it('a version id from another collection or that does not exist is not restorable', async () => {
    await expect(restore('publisher', 999_999)).rejects.toMatchObject({ status: 404 })
  })

  it('denied restores are audited and change nothing', async () => {
    const p = await draftPage('editor', 'en', pageData(slug(), 'Deny v1'))
    const before = await auditCount('access.denied', 'denied')
    await expect(restore('editor', await versionWhere(p.id, 'Deny v1'))).rejects.toMatchObject({
      status: 403,
    })
    expect(await auditCount('access.denied', 'denied')).toBe(before + 1)
  })
})

describe('T074 evidence gate (FR-016b)', () => {
  const stats = (status: 'verified' | 'unverified', reference = '') => ({
    blockType: 'stats',
    items: [{ value: '10', label: 'Engagements' }],
    evidence: { status, reference },
  })

  it('an unverified statistics block cannot be published', async () => {
    const p = await draftPage(
      'editor',
      'en',
      pageData(slug(), 'Stats', { sections: [stats('unverified')] }),
    )
    await expect(
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        data: { _status: 'published' } as never,
        user: await u('owner'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 400 })
    expect(await publicFind('en', p.id)).toEqual([])
  })

  it('only Administrators/Owners can mark evidence verified, and it then publishes', async () => {
    for (const r of ['editor', 'publisher'] as const)
      await expect(
        draftPage(r, 'en', pageData(slug(), 'S', { sections: [stats('verified', 'REF-1')] })),
      ).rejects.toMatchObject({ status: 403 })

    await expect(
      draftPage('administrator', 'en', pageData(slug(), 'S', { sections: [stats('verified')] })),
    ).rejects.toMatchObject({ status: 400 }) // a reference is required

    const p = await draftPage(
      'administrator',
      'en',
      pageData(slug(), 'S', { sections: [stats('verified', 'Signed engagement register 2026')] }),
    )
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    expect(await publicFind('en', p.id)).toHaveLength(1)
  })

  it('verification metadata cannot be forged or the reference swapped without verify rights', async () => {
    const adminUser = await u('administrator')
    const p = await draftPage(
      'administrator',
      'en',
      pageData(slug(), 'S', { sections: [stats('verified', 'Register 2026')] }),
    )
    const full = (await t.payload.findByID({
      collection: 'pages',
      id: p.id,
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })) as unknown as { sections: { id: string; evidence: Record<string, unknown> }[] }
    const block = full.sections[0]!
    expect(block.evidence.verifiedBy).toBeTruthy()
    const editorUser = (await u('editor')) as unknown as { id: number }
    const tamper = async (evidence: Record<string, unknown>) =>
      t.payload.update({
        collection: 'pages',
        id: p.id,
        locale: 'en',
        draft: true,
        data: { sections: [{ ...block, evidence: { ...block.evidence, ...evidence } }] } as never,
        user: await u('editor'),
        overrideAccess: false,
      })
    // Forged verifier/time are ignored: the stored values stay the administrator's.
    await tamper({ verifiedBy: editorUser.id, verifiedAt: '2000-01-01T00:00:00.000Z' }).catch(
      () => null,
    )
    const after = (await t.payload.findByID({
      collection: 'pages',
      id: p.id,
      draft: true,
      locale: 'en',
      overrideAccess: true,
      depth: 0,
    })) as unknown as { sections: { evidence: Record<string, unknown> }[] }
    expect(after.sections[0]!.evidence.verifiedBy).toBe((adminUser as unknown as { id: number }).id)
    expect(after.sections[0]!.evidence.verifiedAt).not.toBe('2000-01-01T00:00:00.000Z')
    // Swapping the evidence reference on verified evidence needs verify rights.
    await expect(tamper({ reference: 'Something else' })).rejects.toMatchObject({ status: 403 })
  })

  it('a course accreditation statement needs verified evidence before publishing', async () => {
    const c = (await t.payload.create({
      collection: 'courses',
      draft: true,
      locale: 'en',
      data: {
        title: 'Course',
        slug: slug(),
        summary: 'Summary',
        accreditationStatement: 'Accredited by an example body',
        sections: [{ blockType: 'richText', content: rt('x') }],
      } as never,
      user: await u('editor'),
      overrideAccess: false,
    })) as unknown as { id: number }
    await expect(
      t.payload.update({
        collection: 'courses',
        id: c.id,
        locale: 'en',
        data: { _status: 'published' } as never,
        user: await u('owner'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('T074 HTTP restore always creates a draft', () => {
  it('POST /api/pages/versions/:id without ?draft restores as a draft and keeps the live page', async () => {
    const { rest } = await import('../../support/content')
    const p = await draftPage()
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      data: { title: 'Live', _status: 'published' } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    await t.payload.update({
      collection: 'pages',
      id: p.id,
      locale: 'en',
      draft: true,
      data: { title: 'Later draft' } as never,
      user: await u('editor'),
      overrideAccess: false,
    })
    const live = (
      await t.payload.findVersions({
        collection: 'pages',
        where: { and: [{ parent: { equals: p.id } }, { 'version.title': { equals: 'Live' } }] },
        overrideAccess: true,
        locale: 'en',
      })
    ).docs[0]!
    const editor = await rest(t.payload, 'POST', `/api/pages/versions/${live.id}`, {
      token: S.editor.token,
    })
    expect(editor.status).toBe(403)
    const ok = await rest(t.payload, 'POST', `/api/pages/versions/${live.id}`, {
      token: S.publisher.token,
    })
    expect(ok.status, ok.raw).toBe(200)
    expect((await publicFind('en', p.id))[0]!.title).toBe('Live')
    const anon = await rest(t.payload, 'POST', `/api/pages/versions/${live.id}`)
    expect([401, 403]).toContain(anon.status)
  })
})
