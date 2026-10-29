// FR-025/FR-065 runtime redirect lookup: exact path match, site-path targets only.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'

let t: TestPayload
beforeAll(async () => {
  t = await bootPayload()
}, 240_000)
afterAll(async () => t?.close())

describe('findRedirect', () => {
  it('returns stored redirects and refuses unsafe or self targets', async () => {
    const { findRedirect } = await import('@/modules/seo')
    await t.payload.create({
      collection: 'redirects',
      data: { from: '/en/old-about', to: '/en/about', type: '301', source: 'manual' } as never,
      overrideAccess: true,
    })
    await t.payload.create({
      collection: 'redirects',
      data: { from: '/en/temp', to: '/en/about', type: '302', source: 'manual' } as never,
      overrideAccess: true,
    })
    expect(await findRedirect(t.payload, '/en/old-about')).toEqual({
      to: '/en/about',
      permanent: true,
    })
    expect(await findRedirect(t.payload, '/en/temp')).toEqual({ to: '/en/about', permanent: false })
    expect(await findRedirect(t.payload, '/en/OLD-ABOUT')).toBeNull()
    expect(await findRedirect(t.payload, '//evil.example')).toBeNull()
    // A target that somehow became off-site is never followed.
    await t.sql.query(`update redirects set "to" = '//evil.example' where "from" = '/en/temp'`)
    expect(await findRedirect(t.payload, '/en/temp')).toBeNull()
  })
})
