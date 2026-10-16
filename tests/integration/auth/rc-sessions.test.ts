// T038 / R-C spike: what Payload 3.91.0's built-in auth (shipped placeholder config: useSessions
// default, tokenExpiration default, maxLoginAttempts default) actually provides. Facts we will
// rely on are asserted; gaps are asserted as GAP so a Payload change is noticed. See ADR-005.
import fs from 'node:fs'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'

let t: TestPayload
const EMAIL = 'rc-spike@example.invalid'
const PASSWORD = 'correct horse battery staple 42' // gitleaks:allow (synthetic test fixture)
const findings: Record<string, unknown> = {}

beforeAll(async () => {
  t = await bootPayload()
  await t.payload.create({
    collection: 'users',
    data: { email: EMAIL, password: PASSWORD } as never,
    overrideAccess: true,
  })
}, 180_000)
afterEach(() => vi.useRealTimers())
afterAll(async () => {
  fs.mkdirSync('test-results', { recursive: true })
  fs.writeFileSync('test-results/rc-sessions-findings.json', JSON.stringify(findings, null, 2))
  await t?.close()
})

const login = (email = EMAIL, password = PASSWORD) =>
  t.payload.login({ collection: 'users', data: { email, password } as never })
const authed = async (token: string) =>
  (await t.payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })).user
const jwtPayload = (token: string) =>
  JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString())

describe('sessions (useSessions)', () => {
  it('each login creates a distinct server-side session bound into the token', async () => {
    const a = await login()
    const b = await login()
    const sa = jwtPayload(a.token!).sid
    const sb = jwtPayload(b.token!).sid
    expect(sa).toBeTruthy()
    expect(sa).not.toBe(sb)
    const rows = await t.sql.query('select id from users_sessions')
    expect(rows.rows.map((r) => r.id)).toEqual(expect.arrayContaining([sa, sb]))
    findings.sessionPerLogin = true
  })

  it('removing the session row revokes the token immediately (revocation primitive)', async () => {
    const { token } = await login()
    expect(await authed(token!)).toBeTruthy()
    await t.sql.query('delete from users_sessions where id = $1', [jwtPayload(token!).sid])
    expect(await authed(token!)).toBeNull()
    findings.revocationBySessionDelete = true
  })

  it('absolute expiry: token and session stop working after tokenExpiration', async () => {
    const { token, exp } = await login()
    const lifetimeSec = exp! - Math.floor(Date.now() / 1000)
    findings.defaultTokenExpirationSeconds = lifetimeSec
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + (lifetimeSec + 60) * 1000 })
    expect(await authed(token!)).toBeNull()
  })

  it('GAP: no idle timeout — a token unused for 31 minutes is still accepted', async () => {
    const { token } = await login()
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 31 * 60 * 1000 })
    const user = await authed(token!)
    findings.idleTimeoutBuiltIn = user === null
    expect(user).toBeTruthy() // built-in has no idle expiry → project must add it (T062)
  })
})

describe('lockout and enumeration', () => {
  const attempt = async (email: string, password: string) => {
    const started = performance.now()
    try {
      await login(email, password)
      return { ok: true, ms: performance.now() - started }
    } catch (e) {
      const err = e as { name?: string; message?: string; status?: number }
      return {
        ok: false,
        name: err.name,
        message: err.message,
        status: err.status,
        ms: performance.now() - started,
      }
    }
  }

  it('wrong password and unknown account currently return the same error', async () => {
    const wrong = await attempt(EMAIL, 'wrong password value 1')
    const unknown = await attempt('nobody-here@example.invalid', 'wrong password value 1')
    findings.wrongPassword = { name: wrong.name, status: wrong.status }
    findings.unknownAccount = { name: unknown.name, status: unknown.status }
    expect(wrong.ok).toBe(false)
    expect(unknown.ok).toBe(false)
    expect(wrong.name).toBe(unknown.name)
    expect(wrong.message).toBe(unknown.message)
  })

  it('locks the account after repeated failures; correct password then refused', async () => {
    const lockEmail = 'rc-lock@example.invalid'
    await t.payload.create({
      collection: 'users',
      data: { email: lockEmail, password: PASSWORD } as never,
      overrideAccess: true,
    })
    let attempts = 0
    let locked: Awaited<ReturnType<typeof attempt>> | undefined
    for (; attempts < 10; attempts++) {
      const r = await attempt(lockEmail, `wrong-${attempts}`)
      if (r.name && /lock/i.test(r.name + r.message)) {
        locked = r
        break
      }
    }
    const afterLock = await attempt(lockEmail, PASSWORD)
    findings.lockout = {
      failuresBeforeLockedResponse: attempts,
      lockedError: locked?.name,
      correctPasswordAfterLock: afterLock.ok,
    }
    expect(afterLock.ok).toBe(false)
  })

  it('GAP: a locked account answers differently from an unknown one (enumeration)', async () => {
    const lockedRes = await attempt('rc-lock@example.invalid', 'whatever')
    const unknownRes = await attempt('never-existed@example.invalid', 'whatever')
    findings.lockedVsUnknown = { locked: lockedRes.name, unknown: unknownRes.name }
    expect(lockedRes.name === unknownRes.name && lockedRes.message === unknownRes.message).toBe(
      false,
    )
  })

  it('GAP (informational): timing differs between unknown accounts and wrong passwords', async () => {
    const sample = async (email: string) => {
      const ms: number[] = []
      for (let i = 0; i < 5; i++) ms.push((await attempt(email, `nope-${i}-${Math.random()}`)).ms)
      return ms.sort((a, b) => a - b)[2]!
    }
    const t2 = 'rc-timing@example.invalid'
    await t.payload.create({
      collection: 'users',
      data: { email: t2, password: PASSWORD } as never,
      overrideAccess: true,
    })
    const existing = await sample(t2)
    const unknown = await sample('rc-timing-unknown@example.invalid')
    findings.medianLoginMs = {
      existingWrongPassword: Math.round(existing),
      unknownAccount: Math.round(unknown),
    }
    expect(existing).toBeGreaterThan(0)
    expect(unknown).toBeGreaterThan(0)
  })
})
