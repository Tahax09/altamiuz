// T051 privilege escalation, T052 role × action through Local API (overrideAccess:false) with real
// verified sessions, and T046-style denial for anonymous and password-only sessions. Also: secrets
// cannot be retrieved through ordinary access.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import {
  createUser,
  reauth,
  routeLogin,
  userFor,
  verifiedSession,
  type Role,
  type Session,
} from '../../support/auth'

let t: TestPayload
const S = {} as Record<Role, Session>
const userOf = (r: Role) => userFor(t.payload, S[r].token)
const ROLES: Role[] = ['editor', 'publisher', 'administrator', 'owner']
const ADMIN_UP = new Set<Role>(['administrator', 'owner'])

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ROLES) {
    S[r] = await verifiedSession(t.payload, r)
    await reauth(t.payload, S[r])
  }
}, 240_000)
afterAll(async () => t?.close())

const ok = (p: Promise<unknown>) =>
  p.then(
    () => true,
    () => false,
  )

describe('T052 role × protected action (server-side, Local API with overrideAccess: false)', () => {
  for (const role of ROLES) {
    it(`${role}: users directory read ${ADMIN_UP.has(role) ? 'allowed' : 'denied'}`, async () => {
      expect(
        await ok(
          t.payload.find({
            collection: 'users',
            user: (await userOf(role)) as never,
            overrideAccess: false,
          }),
        ),
      ).toBe(ADMIN_UP.has(role))
    })
    it(`${role}: audit log read ${ADMIN_UP.has(role) ? 'allowed' : 'denied'}`, async () => {
      expect(
        await ok(
          t.payload.find({
            collection: 'audit-events',
            user: (await userOf(role)) as never,
            overrideAccess: false,
          }),
        ),
      ).toBe(ADMIN_UP.has(role))
    })
    it(`${role}: invitations read ${ADMIN_UP.has(role) ? 'allowed' : 'denied'}`, async () => {
      expect(
        await ok(
          t.payload.find({
            collection: 'invitations',
            user: (await userOf(role)) as never,
            overrideAccess: false,
          }),
        ),
      ).toBe(ADMIN_UP.has(role))
    })
    it(`${role}: security settings update ${role === 'owner' ? 'allowed' : 'denied'}`, async () => {
      expect(
        await ok(
          t.payload.updateGlobal({
            slug: 'security-settings',
            data: { idleMinutes: 30 } as never,
            user: (await userOf(role)) as never,
            overrideAccess: false,
          }),
        ),
      ).toBe(role === 'owner')
    })
    it(`${role}: create a user directly is denied (accounts come only from invitations)`, async () => {
      expect(
        await ok(
          t.payload.create({
            collection: 'users',
            data: {
              email: `d-${Date.now()}@example.invalid`,
              password: 'long password value 77',
              name: 'x',
              role: 'editor',
            } as never,
            user: (await userOf(role)) as never,
            overrideAccess: false,
          }),
        ),
      ).toBe(false)
    })
    it(`${role}: audit events can never be modified`, async () => {
      const [ev] = (
        await t.payload.find({ collection: 'audit-events', limit: 1, overrideAccess: true })
      ).docs
      expect(
        await ok(
          t.payload.update({
            collection: 'audit-events',
            id: ev!.id,
            data: { actor: 'x' } as never,
            user: (await userOf(role)) as never,
            overrideAccess: false,
          }),
        ),
      ).toBe(false)
    })
  }

  it('anonymous and password-only sessions are denied every protected read', async () => {
    const pre = await routeLogin(S.owner.email, S.owner.password)
    const preUser = await userFor(t.payload, pre.token)
    expect(preUser?.mfaVerified).toBe(false)
    for (const collection of ['users', 'audit-events', 'invitations'] as const) {
      expect(await ok(t.payload.find({ collection, overrideAccess: false }))).toBe(false)
      expect(
        await ok(t.payload.find({ collection, user: preUser as never, overrideAccess: false })),
      ).toBe(false)
    }
    expect(
      await ok(
        t.payload.findGlobal({
          slug: 'security-settings',
          user: preUser as never,
          overrideAccess: false,
        }),
      ),
    ).toBe(false)
  })
})

describe('T051 privilege escalation (FR-038, FR-092)', () => {
  const update = async (actor: Role, id: number, data: Record<string, unknown>) =>
    ok(
      t.payload.update({
        collection: 'users',
        id,
        data: data as never,
        user: (await userOf(actor)) as never,
        overrideAccess: false,
      }),
    )

  it.each(ROLES)('%s cannot change their own role', async (role) => {
    expect(await update(role, S[role].userId, { role: 'owner' })).toBe(false)
  })

  it('administrator cannot grant administrator/owner, or touch administrator/owner accounts', async () => {
    const ed = await createUser(t.payload, 'editor')
    expect(await update('administrator', ed.id, { role: 'administrator' })).toBe(false)
    expect(await update('administrator', ed.id, { role: 'owner' })).toBe(false)
    expect(await update('administrator', S.owner.userId, { status: 'suspended' })).toBe(false)
    const admin2 = await createUser(t.payload, 'administrator')
    expect(await update('administrator', admin2.id, { name: 'renamed' })).toBe(false)
    expect(await update('administrator', ed.id, { role: 'publisher' })).toBe(true)
  })

  it('editors and publishers cannot modify any account (IDOR)', async () => {
    const target = await createUser(t.payload, 'editor')
    for (const r of ['editor', 'publisher'] as Role[]) {
      expect(await update(r, target.id, { name: 'pwned' })).toBe(false)
      expect(
        await ok(
          t.payload.findByID({
            collection: 'users',
            id: target.id,
            user: (await userOf(r)) as never,
            overrideAccess: false,
          }),
        ),
      ).toBe(false)
      expect(
        await ok(
          t.payload.delete({
            collection: 'users',
            id: target.id,
            user: (await userOf(r)) as never,
            overrideAccess: false,
          }),
        ),
      ).toBe(false)
    }
  })

  it('password, hash and session fields cannot be set through ordinary updates (mass assignment)', async () => {
    const ed = await createUser(t.payload, 'editor')
    expect(await update('owner', ed.id, { password: 'attacker chosen password 1' })).toBe(false)
    expect(await update('owner', ed.id, { hash: 'x', salt: 'y' })).toBe(true) // ignored fields…
    expect((await routeLogin(ed.email, ed.password)).status).toBe(200) // …credentials unchanged
  })

  it('the last active owner cannot be demoted, suspended or deleted (hook and database)', async () => {
    const owners = Number(
      (await t.sql.query("select count(*) from users where role = 'owner' and status = 'active'"))
        .rows[0].count,
    )
    expect(owners).toBe(1)
    expect(await update('owner', S.owner.userId, { role: 'administrator' })).toBe(false)
    expect(await update('owner', S.owner.userId, { status: 'suspended' })).toBe(false)
    await expect(
      t.sql.query("update users set role = 'editor' where id = $1", [S.owner.userId]),
    ).rejects.toThrow(/last active owner/)
    await expect(t.sql.query('delete from users where id = $1', [S.owner.userId])).rejects.toThrow(
      /last active owner/,
    )
  })

  it('denied privilege operations are audited as access.denied', async () => {
    await update('administrator', S.owner.userId, { name: 'x' })
    expect(
      Number(
        (await t.sql.query("select count(*) from audit_events where action = 'access.denied'"))
          .rows[0].count,
      ),
    ).toBeGreaterThan(0)
  })
})

describe('authentication secrets are not retrievable', () => {
  it('owner reads of users never include hashes, salts, sessions, tokens or MFA material', async () => {
    const u = await userOf('owner')
    const res = await t.payload.find({
      collection: 'users',
      user: u as never,
      overrideAccess: false,
      depth: 3,
      select: { hash: true, salt: true, sessions: true, resetPasswordToken: true } as never,
    })
    const dump = JSON.stringify(res)
    for (const k of [
      '"hash"',
      '"salt"',
      '"sessions"',
      '"resetPasswordToken"',
      'secret_enc',
      'code_hash',
    ])
      expect(dump).not.toContain(k)
    for (const s of Object.values(S)) expect(dump).not.toContain(s.secret!)
  })

  it('hidden fields cannot be used as a query oracle', async () => {
    const u = await userOf('owner')
    const res = await t.payload
      .find({
        collection: 'users',
        user: u as never,
        overrideAccess: false,
        where: { hash: { exists: true } } as never,
      })
      .catch((e: Error) => e)
    if (!(res instanceof Error))
      expect(
        res.totalDocs === 0 ||
          res.totalDocs ===
            (await t.payload.count({ collection: 'users', overrideAccess: true })).totalDocs,
      ).toBe(true)
  })

  it('the /api/users/me override returns no token', async () => {
    const { GET } = await import('../../../src/app/(payload)/api/users/me/route')
    const res = await GET(
      new Request('http://localhost:3000/api/users/me', {
        headers: { authorization: `JWT ${S.editor.token}` },
      }),
    )
    const text = await res.text()
    expect(text).not.toContain(S.editor.token)
    expect(text).not.toMatch(/"token"|"exp"|hash|salt/)
    expect(JSON.parse(text).user).toMatchObject({ role: 'editor', mfaVerified: true })
  })
})

describe('T067 audited CSV export of the audit log', () => {
  const exportAs = async (role: Role, query = '') => {
    const ep = (
      (t.payload.collections['audit-events']!.config.endpoints ||
        []) as import('payload').Endpoint[]
    ).find((e) => e.path === '/export')!
    const user = await userOf(role)
    const res = (await ep.handler({
      payload: t.payload,
      user,
      url: `http://localhost:3000/api/audit-events/export${query}`,
      headers: new Headers(),
    } as never)) as Response
    return { status: res.status, text: await res.text() }
  }

  it('administrators and owners export (after re-auth); editors and publishers cannot', async () => {
    for (const r of ROLES) await reauth(t.payload, S[r])
    expect((await exportAs('owner')).status).toBe(200)
    expect((await exportAs('administrator')).status).toBe(200)
    expect((await exportAs('editor')).status).toBe(403)
    expect((await exportAs('publisher')).status).toBe(403)
  })

  it('filters apply, formulas are neutralised, and the export is itself audited', async () => {
    await reauth(t.payload, S.owner)
    await t.sql.query(
      "insert into audit_events (actor, action, outcome, at, user_agent) values ('=HYPERLINK(\"x\")', 'settings.change', 'success', now(), '@evil')",
    )
    const { status, text } = await exportAs('owner', '?action=settings.change')
    expect(status).toBe(200)
    expect(text.split('\r\n')[0]).toBe(
      'at,actor,action,targetType,targetId,outcome,ip,userAgent,meta',
    )
    expect(text).toContain('"\'=HYPERLINK(""x"")"')
    expect(text).toContain('"\'@evil"')
    expect(text).not.toMatch(/auth\.login\.success/)
    expect(
      Number(
        (await t.sql.query("select count(*) from audit_events where action = 'audit.export'"))
          .rows[0].count,
      ),
    ).toBeGreaterThan(0)
  })

  it('export requires recent re-authentication', async () => {
    await t.sql.query('update auth_sessions set reauth_at = null where user_id = $1', [
      S.owner.userId,
    ])
    expect((await exportAs('owner')).status).toBe(403)
  })
})
