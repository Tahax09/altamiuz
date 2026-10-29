// T100 (FR-005, FR-006): every interface string exists in both languages; one documented numeral
// convention per locale (docs/i18n/numerals.md): Western digits in both, symbols and phone numbers
// isolated left-to-right so "95%" never renders as "%95" inside Arabic.
import { describe, expect, it } from 'vitest'
import { formatDate, formatNumber, formatPercent, formatPhone, messages, t } from '@/modules/i18n'

describe('messages', () => {
  it('Arabic and English have exactly the same keys, all non-empty', () => {
    const keys = (o: object) => Object.keys(o).sort()
    expect(keys(messages.ar)).toEqual(keys(messages.en))
    for (const locale of ['ar', 'en'] as const)
      for (const [k, v] of Object.entries(messages[locale])) {
        expect(typeof v === 'string' && v.trim().length > 0, `${locale}.${k}`).toBe(true)
        expect(v).not.toMatch(/TODO|FIXME|lorem/i)
      }
  })
  it('Arabic strings are Arabic, English strings are not', () => {
    for (const v of Object.values(messages.ar)) expect(v, v).toMatch(/[؀-ۿ]/)
    for (const v of Object.values(messages.en)) expect(v, v).not.toMatch(/[؀-ۿ]/)
  })
  it('t() interpolates named values and escapes nothing itself (React escapes at render)', () => {
    expect(t('en', 'switchLanguage')).toBe(messages.en.switchLanguage)
    expect(t('en', 'translationMissing', { language: 'العربية' })).toContain('العربية')
  })
})

describe('formatters (one convention per locale)', () => {
  it('numbers use Western digits in both locales', () => {
    expect(formatNumber('ar', 1234.5)).toBe('1.234,5') // ICU ar-LY separators
    expect(formatNumber('ar', 1234.5)).not.toMatch(/[٠-٩]/)
    expect(formatNumber('en', 1234.5)).toBe('1,234.5')
  })
  it('percentages and phone numbers are wrapped for left-to-right display', () => {
    expect(formatPercent('ar', 0.95)).toEqual({ text: expect.stringMatching(/95/), dir: 'ltr' })
    expect(formatPhone('+218910000000')).toEqual({ text: '+218 91 000 0000', dir: 'ltr' })
    expect(formatPhone('not a phone')).toBeNull()
  })
  it('dates use the Gregorian calendar with Western digits', () => {
    const d = new Date('2026-10-17T12:00:00Z')
    expect(formatDate('en', d)).toBe('17 October 2026')
    const ar = formatDate('ar', d)
    expect(ar).toMatch(/17/)
    expect(ar).toMatch(/2026/)
    expect(ar).toMatch(/[؀-ۿ]/)
  })
})
