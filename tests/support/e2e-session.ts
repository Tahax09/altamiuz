// Browser-suite sessions for seeded e2e accounts (tests/support/e2e-seed.ts): password sign-in,
// then TOTP in a step after the seed's enrolment and after any code this process already used.
import { expect, type APIRequestContext, type Browser, type BrowserContext } from '@playwright/test'
import fs from 'node:fs'
import { generate } from 'otplib'
import pg from 'pg'

export type Acct = {
  id: number
  email: string
  password: string
  secret: string
  enrolledAt: number
}
export const fixturesFile = () =>
  JSON.parse(fs.readFileSync('test-results/e2e-fixtures.json', 'utf8')) as Record<string, Acct> & {
    content: { pageId: number }
  }
export const BASE = () => process.env.SITE_URL!
export const ORIGIN = () => ({ origin: BASE() })

const usedStep = new Map<string, number>()
export async function signIn(request: APIRequestContext, a: Acct, mfa = true) {
  const login = await request.post('/api/users/login', {
    data: { email: a.email, password: a.password },
    headers: ORIGIN(),
  })
  expect(login.status(), await login.text()).toBe(200)
  if (!mfa) return
  const after = Math.max(Math.floor(a.enrolledAt / 30_000) + 1, usedStep.get(a.email) ?? 0)
  while (Math.floor(Date.now() / 30_000) <= after) await new Promise((r) => setTimeout(r, 500))
  usedStep.set(a.email, Math.floor(Date.now() / 30_000))
  const v = await request.post('/api/users/mfa/verify', {
    data: { code: await generate({ secret: a.secret }) },
    headers: ORIGIN(),
  })
  expect(v.status(), await v.text()).toBe(200)
}

/** One MFA-verified browser context per account for the whole file (per-account login limits). */
const states = new Map<string, string>()
export async function contextFor(browser: Browser, account: string): Promise<BrowserContext> {
  if (!states.has(account)) {
    const ctx = await browser.newContext({ baseURL: BASE() })
    await signIn(ctx.request, fixturesFile()[account]!)
    const file = `test-results/state-${account}.json`
    await ctx.storageState({ path: file })
    await ctx.close()
    states.set(account, file)
  }
  return browser.newContext({ baseURL: BASE(), storageState: states.get(account) })
}

export async function sql<T = Record<string, unknown>>(text: string, values: unknown[] = []) {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  try {
    return (await c.query(text, values)).rows as T[]
  } finally {
    await c.end()
  }
}
