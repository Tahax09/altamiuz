// Localized "not found" page (T104, FR-008): no internal details, links home in the same language.
import { headers } from 'next/headers'
import { href, LOCALES, t, type Locale } from '@/modules/i18n'

export const metadata = { robots: { index: false, follow: false } }

export default async function NotFound() {
  const raw = (await headers()).get('x-altamiuz-locale') ?? 'ar'
  const locale: Locale = (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'ar'
  return (
    <section className="status-page">
      <h1>{t(locale, 'notFoundTitle')}</h1>
      <p>{t(locale, 'notFoundBody')}</p>
      <p>
        <a href={href('home', locale)}>{t(locale, 'backHome')}</a>
      </p>
    </section>
  )
}
