// FR-100: liveness reveals nothing; readiness needs a token and checks the database.
import { describe, expect, it } from 'vitest'
import { livenessResponse, readinessResponse } from '@/modules/platform/health'

const TOKEN = 'f3a9c1e7b5d2f8a4c6e0b9d1' // gitleaks:allow (synthetic test fixture)
const req = (auth?: string) =>
  new Request('http://localhost/api/health/ready', { headers: auth ? { authorization: auth } : {} })

describe('liveness', () => {
  it('returns only {status:"ok"}, uncached', async () => {
    const res = livenessResponse()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})

describe('readiness', () => {
  const opts = { token: TOKEN, databaseUrl: process.env.DATABASE_URL! }

  it.each([
    undefined,
    'Bearer wrong-token-value-xx',
    `Basic ${TOKEN}`,
    `Bearer ${TOKEN}x`,
    'Bearer ',
  ])('rejects authorization %j with 401 and no details', async (auth) => {
    const res = await readinessResponse(req(auth), opts)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ status: 'unauthorized' })
  })

  it('reports ready when the database answers', async () => {
    const res = await readinessResponse(req(`Bearer ${TOKEN}`), opts)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ready', checks: { database: 'ok' } })
  })

  it('reports 503 without leaking connection details when the database is unreachable', async () => {
    const res = await readinessResponse(req(`Bearer ${TOKEN}`), {
      token: TOKEN,
      databaseUrl: 'postgres://nobody:secretpw@127.0.0.1:1/none',
    })
    expect(res.status).toBe(503)
    const text = await res.text()
    expect(text).toBe(JSON.stringify({ status: 'unavailable', checks: { database: 'fail' } }))
    expect(text).not.toContain('secretpw')
  })
})
