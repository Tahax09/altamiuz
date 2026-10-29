// T130 (FR-014): the site banner is shown only when enabled, non-empty and inside its schedule
// window [startsAt, endsAt). Save-time ordering of the window is in globals.test.ts.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SiteBanner } from '@/ui'

const at = (iso: string) => new Date(iso)
const html = (banner: Record<string, unknown> | null, now: Date) =>
  renderToStaticMarkup(createElement(SiteBanner, { locale: 'en', banner, now }))
const banner = {
  enabled: true,
  message: 'Office closed on Friday',
  startsAt: '2026-11-01T00:00:00.000Z',
  endsAt: '2026-11-02T00:00:00.000Z',
}

describe('banner schedule window', () => {
  it('is hidden before the window, shown inside it, and hidden from its end', () => {
    expect(html(banner, at('2026-10-31T23:59:59.999Z'))).toBe('')
    expect(html(banner, at('2026-11-01T00:00:00.000Z'))).toContain('Office closed on Friday')
    expect(html(banner, at('2026-11-01T23:59:59.999Z'))).toContain('Office closed on Friday')
    expect(html(banner, at('2026-11-02T00:00:00.000Z'))).toBe('')
  })

  it('an open-ended window has no start or no end', () => {
    const now = at('2030-01-01T00:00:00.000Z')
    expect(html({ ...banner, startsAt: null, endsAt: null }, now)).toContain('Office closed')
    expect(html({ ...banner, endsAt: null }, now)).toContain('Office closed')
    expect(html({ ...banner, startsAt: null }, now)).toBe('')
  })

  it('disabled, empty or missing banners render nothing', () => {
    const now = at('2026-11-01T12:00:00.000Z')
    expect(html({ ...banner, enabled: false }, now)).toBe('')
    expect(html({ ...banner, message: '   ' }, now)).toBe('')
    expect(html(null, now)).toBe('')
  })
})
