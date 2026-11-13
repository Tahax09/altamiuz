// CD-03 team block (V-2): every member row (name, role, biography, photo) is a claim. A page with
// a team block cannot be published until an Administrator verifies it; changing a member's photo
// after verification removes the verification; an Editor cannot verify.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { userFor, verifiedSession, type Role, type Session } from '../../support/auth'
import { pageData } from '../../support/content'
import { uploadMedia } from '../../support/media'
import { validJpeg } from '../../fixtures/uploads/generate'

let t: TestPayload
const S = {} as Record<Role, Session>
const u = async (r: Role) => (await userFor(t.payload, S[r].token)) as never

beforeAll(async () => {
  t = await bootPayload()
  for (const r of ['editor', 'publisher', 'administrator'] as Role[])
    S[r] = await verifiedSession(t.payload, r)
}, 240_000)
afterAll(async () => t?.close())

type Ev = { status?: string; claimDigest?: string | null }
let n = 0
const slug = () => `team-${Date.now()}-${n++}`

async function photo(alt: string) {
  const r = await uploadMedia({
    token: S.editor.token,
    file: { name: 'p.jpg', type: 'image/jpeg', data: await validJpeg(800, 1000) },
    data: { alt },
    locale: 'en',
  })
  expect(r.status).toBe(201)
  return (r.body.doc as { id: number }).id
}

const teamPage = async (photoId: number, evidence?: Record<string, unknown>) =>
  (
    (await t.payload.create({
      collection: 'pages',
      locale: 'en',
      draft: true,
      data: pageData(slug(), 'Team page', {
        sections: [
          {
            blockType: 'team',
            heading: 'Fixture team',
            members: [{ name: 'Fixture Person', role: 'Fixture role', photo: photoId }],
            ...(evidence ? { evidence } : {}),
          },
        ],
      }) as never,
      user: await u('administrator'),
      overrideAccess: false,
    })) as unknown as { id: number }
  ).id

const evidenceOf = async (id: number) =>
  (
    (await t.payload.findByID({
      collection: 'pages',
      id,
      draft: true,
      depth: 0,
      overrideAccess: true,
    })) as unknown as { sections: { evidence: Ev; members: { id: string }[] }[] }
  ).sections[0]!

const publish = async (id: number, role: Role = 'publisher') =>
  t.payload.update({
    collection: 'pages',
    id,
    locale: 'en',
    data: { _status: 'published' } as never,
    publishSpecificLocale: 'en',
    user: await u(role),
    overrideAccess: false,
  })

describe('team block evidence gate (CD-03)', () => {
  it('cannot be published unverified; publishes once an Administrator verifies it', async () => {
    const id = await teamPage(await photo('Fixture portrait'))
    await expect(publish(id)).rejects.toMatchObject({ status: 400 })
    const b = await evidenceOf(id)
    await t.payload.update({
      collection: 'pages',
      id,
      locale: 'en',
      draft: true,
      data: {
        sections: [{ ...b, evidence: { status: 'verified', reference: 'Consent form 7' } }],
      } as never,
      user: await u('administrator'),
      overrideAccess: false,
    })
    expect((await evidenceOf(id)).evidence.status).toBe('verified')
    await expect(publish(id)).resolves.toBeTruthy()
  })

  it('changing a member photo after verification removes the verification', async () => {
    const id = await teamPage(await photo('First portrait'), {
      status: 'verified',
      reference: 'Consent form 8',
    })
    const before = await evidenceOf(id)
    expect(before.evidence.status).toBe('verified')
    const other = await photo('Second portrait')
    await t.payload.update({
      collection: 'pages',
      id,
      locale: 'en',
      draft: true,
      data: {
        sections: [
          {
            ...before,
            members: [{ ...before.members[0], photo: other }],
          },
        ],
      } as never,
      user: await u('publisher'),
      overrideAccess: false,
    })
    expect((await evidenceOf(id)).evidence.status).not.toBe('verified')
    await expect(publish(id)).rejects.toMatchObject({ status: 400 })
  })

  it('an Editor cannot mark a team verified', async () => {
    const id = await teamPage(await photo('Editor portrait'))
    const b = await evidenceOf(id)
    await t.payload
      .update({
        collection: 'pages',
        id,
        locale: 'en',
        draft: true,
        data: { sections: [{ ...b, evidence: { status: 'verified', reference: 'x' } }] } as never,
        user: await u('editor'),
        overrideAccess: false,
      })
      .catch(() => undefined)
    expect((await evidenceOf(id)).evidence?.status).not.toBe('verified')
  })
})
