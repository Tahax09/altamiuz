// T130 (server side) / T131 (FR-010, FR-014, FR-016, FR-036, FR-045, FR-075): site-settings,
// header-nav, footer-nav and banner globals with drafts and per-locale publishing.
// Permissions per contracts/access-matrix.md (WS8 owner decisions): navigation and banner — all
// roles read, Publisher+ drafts, Administrator/Owner publish and unpublish; site-settings — all
// roles read, Administrator/Owner update and publish. No restore for globals (not granted).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import {
  createUser,
  routeLogin,
  userFor,
  verifiedSession,
  type Role,
  type Session,
} from '../../support/auth'
import { pageData, rest } from '../../support/content'

let t: TestPayload
const S = {} as Record<Role, Session>
let passwordOnly: string
const ROLES: Role[] = ['editor', 'publisher', 'administrator', 'owner']
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never
type G = 'header-nav' | 'footer-nav' | 'banner' | 'site-settings'

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ROLES) S[r] = await verifiedSession(t.payload, r)
  const po = await createUser(t.payload, 'owner', { status: 'active' })
  passwordOnly = (await routeLogin(po.email, po.password)).token
}, 240_000)
afterAll(async () => t?.close())

const navItem = (label: string, url = 'https://example.org/') => ({
  link: { linkType: 'external', url, label },
})
const sample: Record<G, Record<string, unknown>> = {
  'header-nav': { items: [navItem('Contact')] },
  'footer-nav': { items: [navItem('Privacy')] },
  banner: { enabled: true, message: 'Office closed on Friday' },
  'site-settings': {
    email: 'info@example.org',
    defaultSeo: { title: 'Site', description: 'Site description' },
  },
}

const save = async (
  g: G,
  role: Role,
  data: Record<string, unknown>,
  opts: { draft?: boolean; locale?: 'ar' | 'en' } = {},
) =>
  t.payload.updateGlobal({
    slug: g,
    data: data as never,
    draft: opts.draft ?? true,
    locale: opts.locale ?? 'en',
    user: await u(role),
    overrideAccess: false,
  })
const ok = (p: Promise<unknown>) =>
  p.then(
    () => true,
    () => false,
  )
const publicRead = (g: G, locale: 'ar' | 'en' = 'en') =>
  t.payload.findGlobal({
    slug: g,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    context: { publicSite: true },
  }) as unknown as Promise<Record<string, unknown>>
const auditCount = async (action: string) =>
  Number(
    (await t.sql.query('select count(*) from audit_events where action = $1', [action])).rows[0]
      .count,
  )

describe('role × action on globals (Local API, overrideAccess:false)', () => {
  const DRAFT: Record<G, Role[]> = {
    'header-nav': ['publisher', 'administrator', 'owner'],
    'footer-nav': ['publisher', 'administrator', 'owner'],
    banner: ['publisher', 'administrator', 'owner'],
    'site-settings': ['administrator', 'owner'],
  }
  const PUBLISH: Role[] = ['administrator', 'owner']
  for (const g of Object.keys(DRAFT) as G[])
    for (const role of ROLES) {
      it(`${g} by ${role}: read ✓, draft ${DRAFT[g].includes(role) ? '✓' : '✗'}, publish ${PUBLISH.includes(role) ? '✓' : '✗'}`, async () => {
        expect(
          await ok(
            t.payload.findGlobal({
              slug: g,
              draft: true,
              user: await u(role),
              overrideAccess: false,
            }),
          ),
        ).toBe(true)
        expect(await ok(save(g, role, sample[g]))).toBe(DRAFT[g].includes(role))
        expect(
          await ok(save(g, role, { ...sample[g], _status: 'published' }, { draft: false })),
        ).toBe(PUBLISH.includes(role))
      })
    }

  it('a Publisher cannot publish navigation by any route, and the denial is audited', async () => {
    const before = await auditCount('access.denied')
    for (const attempt of [
      () => save('header-nav', 'publisher', { _status: 'published' }, { draft: false }),
      () => save('header-nav', 'publisher', { _status: 'published' }, { draft: true }),
      () => save('header-nav', 'publisher', sample['header-nav'], { draft: false }),
    ])
      await expect(attempt()).rejects.toMatchObject({ status: 403 })
    expect(await auditCount('access.denied')).toBeGreaterThanOrEqual(before + 3)
  })

  it('over REST (what the admin sends), Publishers save nav/banner drafts but cannot publish or unpublish', async () => {
    const post = (g: G, role: Role, q: string, body: Record<string, unknown>) =>
      rest(t.payload, 'POST', `/api/globals/${g}?${q}`, { token: S[role].token, body })
    for (const g of ['header-nav', 'footer-nav', 'banner'] as const) {
      // Admin "Save draft"
      expect((await post(g, 'publisher', 'locale=en&draft=true', sample[g])).status, g).toBe(200)
      expect((await post(g, 'editor', 'locale=en&draft=true', sample[g])).status, g).toBe(403)
      // Admin "Publish" (and the publish-with-draft bypass)
      for (const [q, body] of [
        ['locale=en', { ...sample[g], _status: 'published' }],
        ['locale=en&draft=true', { ...sample[g], _status: 'published' }],
        ['locale=en', sample[g]], // a live write without _status
      ] as const)
        expect((await post(g, 'publisher', q, body)).status, `${g} ${q}`).toBe(403)
      // Admin "Unpublish" (this locale, and all locales) of a published global
      expect(
        (await post(g, 'administrator', 'locale=en', { ...sample[g], _status: 'published' }))
          .status,
      ).toBe(200)
      for (const q of ['locale=en', 'unpublishAllLocales=true'])
        expect((await post(g, 'publisher', q, { _status: 'draft' })).status, `${g} ${q}`).toBe(403)
      expect(await publicRead(g)).toMatchObject({ _status: 'published' })
    }
  })

  it('global version restore is not granted to any role (contracts/access-matrix.md)', async () => {
    await save('banner', 'owner', sample.banner)
    const v = (
      await t.payload.findGlobalVersions({ slug: 'banner', overrideAccess: true, limit: 1 })
    ).docs[0]!
    for (const role of ROLES) {
      const r = await rest(t.payload, 'POST', `/api/globals/banner/versions/${v.id}`, {
        token: S[role].token,
      })
      expect(r.status, role).toBe(403)
    }
    await expect(
      t.payload.restoreGlobalVersion({
        slug: 'banner',
        id: String(v.id),
        user: await u('owner'),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('public and anonymous access', () => {
  it('anonymous and password-only REST cannot read any global or its versions', async () => {
    for (const g of Object.keys(sample) as G[])
      for (const token of [undefined, passwordOnly]) {
        expect((await rest(t.payload, 'GET', `/api/globals/${g}`, { token })).status, g).toBe(403)
        expect(
          (await rest(t.payload, 'GET', `/api/globals/${g}/versions`, { token })).status,
          g,
        ).toBe(403)
      }
  })

  it('public reads return only the published locale; drafts and unpublished locales stay hidden', async () => {
    await save(
      'header-nav',
      'owner',
      { items: [navItem('Published link')], _status: 'published' },
      { draft: false },
    )
    await save('header-nav', 'publisher', { items: [navItem('Draft-only link')] })
    const en = await publicRead('header-nav', 'en')
    expect(JSON.stringify(en)).toContain('Published link')
    expect(JSON.stringify(en)).not.toContain('Draft-only link')
    const ar = await publicRead('header-nav', 'ar')
    expect(JSON.stringify(ar)).not.toContain('Published link') // no cross-locale fallback
  })

  it('CMS-only site-settings fields never reach public reads', async () => {
    await save(
      'site-settings',
      'owner',
      {
        ...sample['site-settings'],
        enquiryRecipients: [{ email: 'secret-inbox@example.org' }],
        _status: 'published',
      },
      { draft: false },
    )
    const pub = await publicRead('site-settings')
    expect(JSON.stringify(pub)).not.toContain('secret-inbox@example.org')
    // Editors and Publishers read settings but not the recipient list.
    const asEditor = await t.payload.findGlobal({
      slug: 'site-settings',
      user: await u('editor'),
      overrideAccess: false,
    })
    expect(JSON.stringify(asEditor)).not.toContain('secret-inbox@example.org')
    await expect(
      save('site-settings', 'administrator', {
        enquiryRecipients: [{ email: 'admin-set@example.org' }],
      }),
    ).resolves.toBeTruthy()
  })
})

describe('content rules', () => {
  it('menu links with disallowed schemes are rejected (FR-014)', async () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,x',
      '//evil.example',
      'http://evil.example',
    ])
      await expect(
        save('header-nav', 'owner', { items: [navItem('x', url)] }),
        url,
      ).rejects.toMatchObject({ status: 400 })
  })

  it('menus are two levels at most', async () => {
    await expect(
      save('header-nav', 'owner', {
        items: [
          {
            ...navItem('Top'),
            children: [{ ...navItem('Child'), children: [navItem('Grandchild')] }],
          },
        ],
      }),
    ).rejects.toThrow()
    await expect(
      save('header-nav', 'owner', { items: [{ ...navItem('Top'), children: [navItem('Child')] }] }),
    ).resolves.toBeTruthy()
  })

  it('internal menu targets that are not published in that locale are flagged on save', async () => {
    const page = (await t.payload.create({
      collection: 'pages',
      data: pageData(`nav-target-${Date.now()}`) as never,
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })) as unknown as { id: number }
    const saved = (await save('header-nav', 'owner', {
      items: [
        {
          link: {
            linkType: 'internal',
            doc: { relationTo: 'pages', value: page.id },
            label: 'Draft page',
          },
        },
      ],
    })) as unknown as { items: { targetUnpublished?: boolean }[] }
    expect(saved.items[0]!.targetUnpublished).toBe(true)
  })

  it('banner: the schedule must be ordered and dismissKey changes with the content', async () => {
    await expect(
      save('banner', 'owner', {
        ...sample.banner,
        startsAt: '2026-11-02T00:00:00.000Z',
        endsAt: '2026-11-01T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({ status: 400 })
    const a = (await save('banner', 'owner', {
      ...sample.banner,
      message: 'First message',
    })) as unknown as { dismissKey: string }
    const b = (await save('banner', 'owner', {
      ...sample.banner,
      message: 'First message',
    })) as unknown as { dismissKey: string }
    const c = (await save('banner', 'owner', {
      ...sample.banner,
      message: 'Second message',
    })) as unknown as { dismissKey: string }
    expect(a.dismissKey).toMatch(/^[0-9a-f]{16}$/)
    expect(b.dismissKey).toBe(a.dismissKey)
    expect(c.dismissKey).not.toBe(a.dismissKey)
    // Clients cannot choose the key.
    const d = (await save('banner', 'owner', {
      ...sample.banner,
      message: 'Second message',
      dismissKey: 'forged',
    })) as unknown as { dismissKey: string }
    expect(d.dismissKey).toBe(c.dismissKey)
  })

  it('banner message is plain text: markup is stored as text, never as HTML structure', async () => {
    const saved = (await save('banner', 'owner', {
      ...sample.banner,
      message: '<b>Bold</b>',
    })) as unknown as { message: string }
    expect(saved.message).toBe('<b>Bold</b>') // escaped at render, see render tests
  })

  it('company name and address need verified evidence before site-settings can be published (FR-016)', async () => {
    await expect(
      save(
        'site-settings',
        'owner',
        { ...sample['site-settings'], companyName: 'Example Co', _status: 'published' },
        { draft: false },
      ),
    ).rejects.toMatchObject({ status: 400 })
    await save('site-settings', 'owner', {
      ...sample['site-settings'],
      companyName: 'Example Co',
      companyNameEvidence: { status: 'verified', reference: 'Commercial register extract' },
      address: '',
    })
    await expect(
      save('site-settings', 'owner', { _status: 'published' }, { draft: false }),
    ).resolves.toBeTruthy()
  })

  it('publishing navigation and settings is audited', async () => {
    const nav = await auditCount('navigation.change')
    const settings = await auditCount('settings.change')
    await save(
      'footer-nav',
      'administrator',
      { ...sample['footer-nav'], _status: 'published' },
      { draft: false },
    )
    await save(
      'site-settings',
      'administrator',
      { ...sample['site-settings'], companyName: '', _status: 'published' },
      { draft: false },
    )
    expect(await auditCount('navigation.change')).toBe(nav + 1)
    expect(await auditCount('settings.change')).toBe(settings + 1)
  })
})
