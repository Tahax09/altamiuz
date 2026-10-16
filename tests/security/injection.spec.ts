// T033 against a real production server: anonymous abuse of REST query parameters and bodies
// must yield 4xx with no internals, never 500.
import { expect, test } from '@playwright/test'

const LEAK = /syntax error|relation "|drizzle|postgres|node_modules|\bat .+:\d+:\d+|stack/i

const queries = [
  "where[actor][equals]=' OR '1'='1",
  'where[actor][like]=%',
  'where[actor; drop table users--][equals]=x',
  'where[or][0][actor][equals]=x&where[or][1][__proto__][polluted]=1',
  'sort=actor;drop table users',
  'select[pg_catalog]=true',
  'depth=999999',
  'limit=-1',
  'limit=99999999999999999999',
  'page=NaN',
]

for (const collection of ['users', 'audit-events']) {
  for (const q of queries) {
    test(`GET /api/${collection}?${q} → 4xx without internals`, async ({ request }) => {
      const res = await request.get(`/api/${collection}?${q}`)
      expect(res.status(), await res.text()).toBeGreaterThanOrEqual(400)
      expect(res.status()).toBeLessThan(500)
      expect(await res.text()).not.toMatch(LEAK)
    })
  }
}

test('oversized JSON body is refused without a 500', async ({ request }) => {
  const res = await request.post('/api/users/login', {
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify({ email: 'a@b.ly', password: 'x'.repeat(5 * 1024 * 1024) }),
  })
  expect(res.status()).toBeGreaterThanOrEqual(400)
  expect(res.status()).toBeLessThan(500)
})

test('prototype-pollution body does not break the server', async ({ request }) => {
  const res = await request.post('/api/users/login', {
    headers: { 'content-type': 'application/json' },
    data: '{"email":"a@b.ly","password":"x","__proto__":{"isAdmin":true},"constructor":{"prototype":{"polluted":true}}}',
  })
  expect(res.status()).toBeLessThan(500)
  expect(await res.text()).not.toMatch(LEAK)
  expect((await request.get('/api/health')).status()).toBe(200)
})
