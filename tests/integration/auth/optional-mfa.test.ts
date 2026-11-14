// Optional MFA (owner decision 2026-11-14): by default an account without an authenticator signs
// in with its password alone and gets full role access; an invited account becomes active at that
// first sign-in. An account that set up an authenticator is always asked for the code. When the
// owner turns "Require two-factor authentication" on, password-only sessions lose access again.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { callEndpoint, createUser, routeLogin, totp, userFor } from '../../support/auth'
import { isMfaVerified } from '../../../src/modules/access'
import { resetSecuritySettingsCache } from '../../../src/modules/auth/settings'

let t: TestPayload

beforeAll(async () => {
  t = await bootPayload({ optionalMfa: true })
}, 120_000)
afterAll(async () => t?.close())

const setRequired = async (requireMfa: boolean) => {
  await t.payload.updateGlobal({
    slug: 'security-settings',
    data: { requireMfa } as never,
    overrideAccess: true,
  })
  resetSecuritySettingsCache()
}

describe('optional two-factor authentication', () => {
  it('is off by default: password-only sign-in gets role access and activates the account', async () => {
    const u = await createUser(t.payload, 'administrator', { status: 'invited' })
    const login = await routeLogin(u.email, u.password)
    expect(login.status).toBe(200)
    const user = await userFor(t.payload, login.token)
    expect(isMfaVerified(user)).toBe(true)
    const status = await callEndpoint(t.payload, 'users', '/mfa/status', 'get', {
      token: login.token,
    })
    expect(status.body).toMatchObject({ authenticated: true, mfaVerified: true, enrolled: false })
    const stored = (await t.payload.findByID({
      collection: 'users',
      id: u.id,
      overrideAccess: true,
    })) as unknown as { status: string }
    expect(stored.status).toBe('active')
    // Role access works without MFA (site settings are read by administrators).
    await expect(
      t.payload.findGlobal({ slug: 'site-settings', user: user as never, overrideAccess: false }),
    ).resolves.toBeTruthy()
  })

  it('an account with an authenticator is always asked for the code', async () => {
    const u = await createUser(t.payload, 'editor')
    const first = await routeLogin(u.email, u.password)
    // A completed sign-in adds an authenticator app only after re-authentication (FR-039).
    const noReauth = await callEndpoint(t.payload, 'users', '/mfa/enrol/start', 'post', {
      token: first.token,
    })
    expect(noReauth.status).toBe(403)
    expect(noReauth.body.error).toBe('reauth_required')
    await callEndpoint(t.payload, 'users', '/reauth', 'post', {
      token: first.token,
      body: { password: u.password },
    })
    const start = await callEndpoint(t.payload, 'users', '/mfa/enrol/start', 'post', {
      token: first.token,
    })
    const confirm = await callEndpoint(t.payload, 'users', '/mfa/enrol/confirm', 'post', {
      token: first.token,
      body: { code: await totp(start.body.secret as string) },
    })
    expect(confirm.status).toBe(200)
    const again = await routeLogin(u.email, u.password)
    expect(isMfaVerified(await userFor(t.payload, again.token))).toBe(false)
  })

  it('when the owner requires MFA, password-only sessions lose access', async () => {
    const u = await createUser(t.payload, 'publisher')
    const login = await routeLogin(u.email, u.password)
    expect(isMfaVerified(await userFor(t.payload, login.token))).toBe(true)
    await setRequired(true)
    try {
      const user = await userFor(t.payload, login.token)
      expect(isMfaVerified(user)).toBe(false)
      const status = await callEndpoint(t.payload, 'users', '/mfa/status', 'get', {
        token: login.token,
      })
      expect(status.body).toMatchObject({ mfaVerified: false, enrolled: false })
    } finally {
      await setRequired(false)
    }
  })
})
