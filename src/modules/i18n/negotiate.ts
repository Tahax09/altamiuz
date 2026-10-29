// Root-address language choice (A-3, FR-003): remembered choice, else the browser's preferred
// language if Arabic or English, else Arabic. Crawlers get the default alternate. Pure, so the
// proxy (edge) and tests share it.
import { DEFAULT_LOCALE, LOCALES, type Locale } from './routes'

export const LOCALE_COOKIE = 'altamiuz-locale'
const CRAWLER = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|whatsapp|telegram/i

const isLocale = (v: unknown): v is Locale => (LOCALES as readonly unknown[]).includes(v)

function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null
  const prefs = header
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const weight = q ? Number(q.slice(2)) : 1
      return {
        lang: (tag ?? '').toLowerCase().split('-')[0],
        weight: Number.isFinite(weight) ? weight : 0,
        i,
      }
    })
    .filter((p) => p.weight > 0 && isLocale(p.lang))
    .sort((a, b) => b.weight - a.weight || a.i - b.i)
  return (prefs[0]?.lang as Locale | undefined) ?? null
}

export function negotiateLocale(input: {
  cookie?: string | null
  acceptLanguage?: string | null
  userAgent?: string | null
}): Locale {
  if (input.userAgent && CRAWLER.test(input.userAgent)) return DEFAULT_LOCALE
  if (isLocale(input.cookie)) return input.cookie
  return fromAcceptLanguage(input.acceptLanguage ?? null) ?? DEFAULT_LOCALE
}

/** The locale a public path belongs to, if any (`/ar`, `/en/...`). */
export function localeOfPath(pathname: string): Locale | null {
  const first = pathname.split('/')[1]
  return isLocale(first) ? first : null
}
