// UI strings and locale formatters (T100, FR-005, FR-006). Numeral convention:
// docs/i18n/numerals.md.
import type { Locale } from '../routes'
import { ar } from './ar'
import { en } from './en'

export type MessageKey = keyof typeof en
export const messages: Record<Locale, Record<MessageKey, string>> = { ar, en }

/** Each language's own name, shown by the language switcher. */
export const LANGUAGE_NAMES: Record<Locale, string> = { ar: 'العربية', en: 'English' }

export function t(locale: Locale, key: MessageKey, values: Record<string, string> = {}): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (m, name: string) => values[name] ?? m)
}

// One convention per locale: Gregorian calendar, Western digits, Libya time zone.
const INTL: Record<Locale, string> = { ar: 'ar-LY-u-nu-latn-ca-gregory', en: 'en-GB' }
export const intlLocale = (locale: Locale) => INTL[locale]

export const formatNumber = (locale: Locale, n: number) =>
  new Intl.NumberFormat(INTL[locale]).format(n)

/** Percentages are isolated LTR when rendered (R-B: "95%" otherwise shows as "%95"). */
export const formatPercent = (locale: Locale, ratio: number) => ({
  text: new Intl.NumberFormat(INTL[locale], { style: 'percent', maximumFractionDigits: 1 }).format(
    ratio,
  ),
  dir: 'ltr' as const,
})

export const formatDate = (locale: Locale, d: Date) =>
  new Intl.DateTimeFormat(INTL[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Tripoli',
  }).format(d)

/** E.164 numbers, always rendered LTR. Libyan numbers are grouped +218 XX XXX XXXX. */
export function formatPhone(e164: string): { text: string; dir: 'ltr' } | null {
  if (!/^\+[0-9]{6,15}$/.test(e164)) return null
  const ly = /^\+218([0-9]{2})([0-9]{3})([0-9]{4})$/.exec(e164)
  return { text: ly ? `+218 ${ly[1]} ${ly[2]} ${ly[3]}` : e164, dir: 'ltr' }
}
