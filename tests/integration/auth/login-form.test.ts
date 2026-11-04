// The admin login page (Payload's <Form>, @payloadcms/ui) posts multipart/form-data with the fields
// JSON-encoded in a `_payload` part, not a JSON body. The project's login route only read JSON, so
// every sign-in from /admin/login failed as "unknown account" (2026-10-29). Same route handler as
// production; responses stay uniform for anything that is not a valid sign-in.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { createUser } from '../../support/auth'

const ORIGIN = 'http://localhost:3000'
let t: TestPayload
beforeAll(async () => {
  t = await bootPayload()
}, 180_000)
afterAll(async () => t?.close())

let ip = 20
async function post(body: BodyInit, headers: Record<string, string> = {}) {
  const { POST } = await import('../../../src/app/(payload)/api/users/login/route')
  const res = await POST(
    new Request(`${ORIGIN}/api/users/login`, {
      method: 'POST',
      headers: { origin: ORIGIN, 'x-forwarded-for': `198.51.100.${ip++}`, ...headers },
      body,
    }),
  )
  return { status: res.status, body: await res.json(), cookie: res.headers.get('set-cookie') }
}
const adminForm = (data: Record<string, unknown>) => {
  const f = new FormData()
  f.append('_payload', JSON.stringify(data))
  return f
}

describe('sign-in from the admin login form', () => {
  it('accepts the multipart `_payload` body the admin form sends', async () => {
    const u = await createUser(t.payload, 'owner')
    const r = await post(adminForm({ email: u.email, password: u.password }))
    expect(r.status, JSON.stringify(r.body)).toBe(200)
    expect(r.body).toMatchObject({ mfaRequired: true, user: { id: u.id } })
    expect(r.cookie).toMatch(/altamiuz-token=/)
    // Case and whitespace are normalised exactly as for JSON sign-in.
    const again = await post(
      adminForm({ email: ` ${u.email.toUpperCase()} `, password: u.password }),
    )
    expect(again.status).toBe(200)
  })

  it('still accepts JSON (the account pages and API clients)', async () => {
    const u = await createUser(t.payload, 'editor')
    const r = await post(JSON.stringify({ email: u.email, password: u.password }), {
      'content-type': 'application/json',
    })
    expect(r.status).toBe(200)
  })

  it('wrong passwords and malformed bodies fail with the same uniform response', async () => {
    const u = await createUser(t.payload, 'editor')
    const failed = {
      errors: [{ message: 'Sign-in failed. Check your details or try again later.' }],
    }
    const bad = new FormData()
    bad.append('_payload', '{not json')
    const plain = new FormData()
    plain.append('email', u.email) // only `_payload` is read; loose fields are ignored
    plain.append('password', u.password)
    for (const body of [
      adminForm({ email: u.email, password: 'wrong password value 1' }),
      adminForm({ email: [u.email], password: { $ne: '' } }),
      bad,
      plain,
      new URLSearchParams({ email: u.email, password: u.password }),
    ]) {
      const r = await post(body)
      expect(r.status).toBe(401)
      expect(r.body).toEqual(failed)
      expect(r.cookie).toBeNull()
    }
  })

  it('a cross-origin form post is refused before any credential check', async () => {
    const u = await createUser(t.payload, 'editor')
    const r = await post(adminForm({ email: u.email, password: u.password }), {
      origin: 'https://evil.example',
    })
    expect(r.status).toBe(403)
    expect(r.cookie).toBeNull()
  })
})
