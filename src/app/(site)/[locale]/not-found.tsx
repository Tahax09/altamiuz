// Localized "not found" page for client-side navigations (T104, FR-008). Document requests get the
// same view from /{locale}/~404 through the proxy, with status 404 (L-5).
import { headers } from 'next/headers'
import { LOCALES, type Locale } from '@/modules/i18n'
import { NotFoundView } from '@/ui'

export const metadata = { robots: { index: false, follow: false } }

export default async function NotFound() {
  const raw = (await headers()).get('x-altamiuz-locale') ?? 'ar'
  const locale: Locale = (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'ar'
  return <NotFoundView locale={locale} />
}
