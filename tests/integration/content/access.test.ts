// SC-003 / contracts/access-matrix.md for the US2 resources: every role × action cell on pages,
// services, courses and redirects, allowed and denied, through the Local API (overrideAccess:false)
// and over REST. Plus password-only (MFA-pending) sessions, anonymous requests and IDOR probes.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import {
  routeLogin,
  createUser,
  userFor,
  verifiedSession,
  type Role,
  type Session,
} from '../../support/auth'
import { pageData, rest, rt } from '../../support/content'

let t: TestPayload
const S = {} as Record<Role, Session>
let passwordOnly: string
const ROLES: Role[] = ['editor', 'publisher', 'administrator', 'owner']
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never
const COLLECTIONS = ['pages', 'services', 'courses'] as const

// contracts/access-matrix.md
const ALLOWED: Record<string, Role[]> = {
  read: ROLES,
  create: ROLES,
  updateDraft: ROLES,
  publish: ['publisher', 'administrator', 'owner'],
  unpublish: ['publisher', 'administrator', 'owner'],
  restore: ['publisher', 'administrator', 'owner'],
  delete: ['administrator', 'owner'],
}
const REDIRECT_WRITE: Role[] = ['administrator', 'owner']

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ROLES) S[r] = await verifiedSession(t.payload, r)
  const po = await createUser(t.payload, 'owner', { status: 'active' })
  passwordOnly = (await routeLogin(po.email, po.password)).token
}, 240_000)
afterAll(async () => t?.close())

let n = 0
const slug = () => `acc-${Date.now()}-${n++}`
const dataFor = (c: (typeof COLLECTIONS)[number]) =>
  c === 'pages'
    ? pageData(slug())
    : {
        title: 'T',
        slug: slug(),
        summary: 's',
        sections: [{ blockType: 'richText', content: rt('x') }],
      }

async function seed(c: (typeof COLLECTIONS)[number], publish = false) {
  const d = (await t.payload.create({
    collection: c,
    data: dataFor(c) as never,
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })) as unknown as { id: number }
  if (publish)
    await t.payload.update({
      collection: c,
      id: d.id,
      locale: 'en',
      data: { _status: 'published' } as never,
      overrideAccess: true,
    })
  return d.id
}

const outcome = (p: Promise<unknown>) =>
  p.then(
    () => true,
    () => false,
  )

async function attempt(c: (typeof COLLECTIONS)[number], action: string, role: Role) {
  const user = await u(role)
  const base = { collection: c, user, overrideAccess: false, locale: 'en' } as const
  switch (action) {
    case 'read':
      return outcome(t.payload.findByID({ ...base, id: await seed(c), draft: true }))
    case 'create':
      return outcome(t.payload.create({ ...base, data: dataFor(c) as never, draft: true }))
    case 'updateDraft':
      return outcome(
        t.payload.update({
          ...base,
          id: await seed(c),
          data: { title: 'E' } as never,
          draft: true,
        }),
      )
    case 'publish':
      return outcome(
        t.payload.update({ ...base, id: await seed(c), data: { _status: 'published' } as never }),
      )
    case 'unpublish':
      return outcome(
        t.payload.update({ ...base, id: await seed(c, true), data: { _status: 'draft' } as never }),
      )
    case 'restore': {
      const id = await seed(c, true)
      const v = (
        await t.payload.findVersions({
          collection: c,
          where: { parent: { equals: id } },
          overrideAccess: true,
        })
      ).docs[0]!
      const { createLocalReq } = await import('payload')
      const { restoreAsDraft } = await import('@/modules/content')
      return outcome(restoreAsDraft(await createLocalReq({ user }, t.payload), c, v.id))
    }
    case 'delete':
      return outcome(t.payload.delete({ ...base, id: await seed(c) }))
  }
  throw new Error(action)
}

describe('role × action on pages/services/courses (Local API, overrideAccess:false)', () => {
  for (const c of COLLECTIONS)
    for (const action of Object.keys(ALLOWED))
      for (const role of ROLES) {
        const allowed = ALLOWED[action]!.includes(role)
        it(`${c} ${action} by ${role} → ${allowed ? 'allowed' : 'denied'}`, async () => {
          expect(await attempt(c, action, role)).toBe(allowed)
        })
      }
})

describe('role × action on pages over REST', () => {
  const call = (
    token: string | undefined,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ) => rest(t.payload, method, path, { token, body })

  for (const role of ROLES) {
    it(`${role}: REST cells match the matrix`, async () => {
      const tok = S[role].token
      const id = await seed('pages')
      expect((await call(tok, 'GET', `/api/pages/${id}?draft=true`)).status).toBe(200)
      expect(
        (await call(tok, 'POST', '/api/pages?draft=true&locale=en', pageData(slug()))).status,
      ).toBe(201)
      expect(
        (await call(tok, 'PATCH', `/api/pages/${id}?draft=true&locale=en`, { title: 'R' })).status,
      ).toBe(200)
      const pubStatus = (
        await call(tok, 'PATCH', `/api/pages/${id}?locale=en`, { _status: 'published' })
      ).status
      expect(pubStatus).toBe(ALLOWED.publish!.includes(role) ? 200 : 403)
      const del = (await call(tok, 'DELETE', `/api/pages/${await seed('pages')}`)).status
      expect(del).toBe(ALLOWED.delete!.includes(role) ? 200 : 403)
    })
  }
})

describe('redirects', () => {
  for (const role of ROLES) {
    const may = REDIRECT_WRITE.includes(role)
    it(`${role}: read allowed; create/update/delete ${may ? 'allowed' : 'denied'}`, async () => {
      const user = await u(role)
      expect(
        await outcome(t.payload.find({ collection: 'redirects', user, overrideAccess: false })),
      ).toBe(true)
      const r = (await t.payload.create({
        collection: 'redirects',
        data: { from: `/en/old-${slug()}`, to: '/en/new', type: '301', source: 'manual' } as never,
        overrideAccess: true,
      })) as unknown as { id: number }
      expect(
        await outcome(
          t.payload.create({
            collection: 'redirects',
            data: { from: `/en/x-${slug()}`, to: '/en/y', type: '301', source: 'manual' } as never,
            user,
            overrideAccess: false,
          }),
        ),
      ).toBe(may)
      expect(
        await outcome(
          t.payload.update({
            collection: 'redirects',
            id: r.id,
            data: { to: '/en/z' } as never,
            user,
            overrideAccess: false,
          }),
        ),
      ).toBe(may)
      expect(
        await outcome(
          t.payload.delete({ collection: 'redirects', id: r.id, user, overrideAccess: false }),
        ),
      ).toBe(may)
    })
  }

  it('redirect targets cannot point off-site or to script URLs', async () => {
    for (const to of ['javascript:alert(1)', '//evil.example', 'https://evil.example/', 'data:x'])
      expect(
        await outcome(
          t.payload.create({
            collection: 'redirects',
            data: { from: `/en/t-${slug()}`, to, type: '301', source: 'manual' } as never,
            user: await u('owner'),
            overrideAccess: false,
          }),
        ),
        to,
      ).toBe(false)
  })
})

describe('sessions without completed MFA, anonymous requests, and IDOR', () => {
  it('a password-only Owner session can read and change nothing', async () => {
    const id = await seed('pages')
    expect(
      (await rest(t.payload, 'GET', `/api/pages/${id}?draft=true`, { token: passwordOnly })).status,
    ).toBe(403)
    expect((await rest(t.payload, 'GET', '/api/pages', { token: passwordOnly })).status).toBe(403)
    expect(
      (
        await rest(t.payload, 'POST', '/api/pages?draft=true', {
          token: passwordOnly,
          body: pageData(slug()),
        })
      ).status,
    ).toBe(403)
    expect(
      (await rest(t.payload, 'GET', '/api/pages/versions', { token: passwordOnly })).status,
    ).toBe(403)
  })

  it('anonymous REST cannot list, read, version-read or write content, even published', async () => {
    const id = await seed('pages', true)
    for (const c of COLLECTIONS) {
      expect((await rest(t.payload, 'GET', `/api/${c}`)).status, c).toBe(403)
      expect((await rest(t.payload, 'GET', `/api/${c}/versions`)).status, c).toBe(403)
    }
    expect((await rest(t.payload, 'GET', `/api/pages/${id}`)).status).toBe(403)
    expect((await rest(t.payload, 'GET', `/api/pages/${id}?draft=true`)).status).toBe(403)
    expect((await rest(t.payload, 'POST', '/api/pages', { body: pageData(slug()) })).status).toBe(
      403,
    )
    expect(
      (await rest(t.payload, 'PATCH', `/api/pages/${id}`, { body: { title: 'x' } })).status,
    ).toBe(403)
    expect((await rest(t.payload, 'DELETE', `/api/pages/${id}`)).status).toBe(403)
  })

  it('anonymous GraphQL is not an alternate read path', async () => {
    const r = await rest(t.payload, 'POST', '/api/graphql', {
      body: { query: '{ Pages(draft: true) { docs { id title } } }' },
    })
    expect(r.raw).not.toMatch(/"title"\s*:\s*"Title"/)
  })

  it('the publicSite context cannot be set from a request', async () => {
    await seed('pages')
    for (const q of [
      '?context[publicSite]=true',
      '?publicSite=true',
      '?draft=false&context=publicSite',
    ])
      expect((await rest(t.payload, 'GET', `/api/pages${q}`)).status, q).toBe(403)
  })

  it('IDOR: ids that do not exist, belong to another collection or are malformed reveal nothing', async () => {
    const tok = S.editor.token
    const pageId = await seed('pages')
    const missing = await rest(t.payload, 'GET', `/api/pages/999999?draft=true`, { token: tok })
    expect(missing.status).toBe(404)
    const crossCollection = await rest(t.payload, 'GET', `/api/services/${pageId}?draft=true`, {
      token: tok,
    })
    expect([404]).toContain(crossCollection.status)
    // Finding (WS9): Payload 3.91.0 coerces a numeric-prefixed id ("1 OR 1=1") to 1. The value is
    // still parameterised and access still applies, so at most that one readable document returns.
    const coerced = await rest(t.payload, 'GET', '/api/pages/1%20OR%201=1', { token: tok })
    expect(coerced.status === 404 || (coerced.body.id === 1 && !('docs' in coerced.body))).toBe(
      true,
    )
    for (const bad of ['-1', '1.5', '..%2Fusers', 'abc'])
      expect(
        (await rest(t.payload, 'GET', `/api/pages/${bad}`, { token: tok })).status,
        bad,
      ).toBeGreaterThanOrEqual(400)
    // Editors cannot reach the user directory or audit log through content relationships.
    const viaDepth = await rest(t.payload, 'GET', `/api/pages/${pageId}?depth=3&draft=true`, {
      token: tok,
    })
    expect(viaDepth.raw).not.toMatch(/"hash"|"salt"|mfaSecret|recoveryCodes/)
  })

  it('locale confusion: unknown or injected locale parameters do not expose other data', async () => {
    const id = await seed('pages')
    for (const loc of ['fr', 'all', 'ar,en', "en'--", '*']) {
      const r = await rest(t.payload, 'GET', `/api/pages/${id}?locale=${encodeURIComponent(loc)}`)
      expect(r.status, loc).toBe(403)
    }
    const editor = await rest(t.payload, 'GET', `/api/pages/${id}?draft=true&locale=fr`, {
      token: S.editor.token,
    })
    expect(editor.status).toBeLessThan(500)
  })
})
