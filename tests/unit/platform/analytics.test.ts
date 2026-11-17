// T127 (ADR-007, FR-084–FR-087): what counts as a page view, and the public-site hooks. Disabled,
// the hooks read no request data and schedule nothing; enabled, they pass the language only.
// No browser code can reach analytics (no script, beacon, cookie or storage).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  enabled: false,
  scheduled: [] as (() => Promise<void>)[],
  headersRead: 0,
  requestHeaders: new Headers(),
  tracked: [] as unknown[][],
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: async () => ({}) }))
vi.mock('next/server', () => ({ after: (fn: () => Promise<void>) => state.scheduled.push(fn) }))
vi.mock('next/headers', () => ({
  headers: async () => {
    state.headersRead++
    return state.requestHeaders
  },
}))
vi.mock('@/modules/platform', async (orig) => {
  const real = await orig<typeof import('@/modules/platform')>()
  return {
    ...real,
    analyticsEnabled: () => state.enabled,
    getAnalytics: () => ({
      enabled: true,
      track: async (...args: unknown[]) => void state.tracked.push(args),
    }),
  }
})

const { countsAsPageView } = await import('@/modules/platform')
const { countEnquiryConversion, countPageView } = await import('../../../src/app/(site)/analytics')

const BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'

beforeEach(() => {
  state.enabled = false
  state.scheduled = []
  state.headersRead = 0
  state.tracked = []
  state.requestHeaders = new Headers({ 'user-agent': BROWSER })
})

const flush = async () => {
  for (const fn of state.scheduled) await fn()
}

describe('countsAsPageView', () => {
  it('counts a browser navigation, including a client-side one', () => {
    expect(countsAsPageView(new Headers({ 'user-agent': BROWSER }))).toBe(true)
    expect(countsAsPageView(new Headers({ 'user-agent': BROWSER, rsc: '1' }))).toBe(true)
  })

  it('does not count prefetches, speculative loads or automated agents', () => {
    for (const h of <Record<string, string>[]>[
      { 'user-agent': BROWSER, 'next-router-prefetch': '1' },
      { 'user-agent': BROWSER, 'next-router-segment-prefetch': '/_tree' },
      { 'user-agent': BROWSER, 'sec-purpose': 'prefetch;prerender' },
      { 'user-agent': BROWSER, purpose: 'prefetch' },
      { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/140.0 Safari/537.36' },
      { 'user-agent': 'curl/8.7.1' },
    ])
      expect(countsAsPageView(new Headers(h)), JSON.stringify(h)).toBe(false)
  })
})

describe('public-site hooks, analytics disabled (default)', () => {
  it('read no request data and schedule nothing', async () => {
    await countPageView('ar')
    countEnquiryConversion('en')
    expect(state.headersRead).toBe(0)
    expect(state.scheduled).toHaveLength(0)
  })
})

describe('public-site hooks, analytics enabled', () => {
  beforeEach(() => {
    state.enabled = true
  })

  it('count a page view after the response, with the language only', async () => {
    await countPageView('en')
    expect(state.tracked).toHaveLength(0) // nothing happens before the response is sent
    await flush()
    expect(state.tracked).toEqual([['page_view', { locale: 'en' }]])
  })

  it('skip prefetches and automated agents', async () => {
    state.requestHeaders = new Headers({ 'user-agent': BROWSER, 'next-router-prefetch': '1' })
    await countPageView('ar')
    expect(state.scheduled).toHaveLength(0)
  })

  it('count an enquiry conversion by language only, ignoring anything else', async () => {
    countEnquiryConversion('ar')
    countEnquiryConversion('fr')
    countEnquiryConversion({ email: 'person@example.org' })
    await flush()
    expect(state.tracked).toEqual([['enquiry_conversion', { locale: 'ar' }]])
  })
})

describe('no analytics code in the browser', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f)
      return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) ? [p] : []
    })

  it('no client component imports the analytics modules', () => {
    const offenders = files(path.join(process.cwd(), 'src')).filter((f) => {
      const s = readFileSync(f, 'utf8')
      return /^\s*['"]use client['"]/.test(s) && /analytics/i.test(s)
    })
    expect(offenders).toEqual([])
  })

  it('the site hooks are server-only and set no cookie or storage', () => {
    const src = readFileSync(path.join(process.cwd(), 'src/app/(site)/analytics.ts'), 'utf8')
    expect(src).not.toMatch(/use client|cookies\(|set-cookie|localStorage|sendBeacon|<script/i)
  })
})
