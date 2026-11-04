// The styled 404 document (L-5, FR-008, FR-082). The proxy answers a missing public path by
// fetching this page from the configured site origin and returning it with status 404, so the
// visitor gets the real site chrome, styles and fonts without JavaScript. `~` can never appear in
// a content slug, so this path never shadows content; requested directly, it is itself a 404.
import type { Metadata } from 'next'
import { LOCALES, t, type Locale } from '@/modules/i18n'
import { NotFoundView } from '@/ui'

type Params = Promise<{ locale: string }>
const localeOf = (raw: string): Locale =>
  (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'ar'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = localeOf((await params).locale)
  return { title: t(locale, 'notFoundTitle'), robots: { index: false, follow: false } }
}

export default async function NotFoundDocumentPage({ params }: { params: Params }) {
  return <NotFoundView locale={localeOf((await params).locale)} />
}
