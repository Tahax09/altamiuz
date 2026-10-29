// Home (T103): the published `home`-template page of the locale, else the service and training
// entry points. Never shows drafts.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { href, LOCALES, t, type Locale } from '@/modules/i18n'
import { DocumentView } from '@/ui'
import { cachedGlobal, cachedHome, listingsFor } from '../data'

const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const [home, settings] = await Promise.all([
    cachedHome(locale),
    cachedGlobal('site-settings', locale),
  ])
  const seo = (home?.seo ?? settings?.defaultSeo ?? {}) as {
    title?: string
    description?: string
    noindex?: boolean
  }
  return {
    title: seo.title || undefined,
    description: seo.description || undefined,
    robots: seo.noindex ? { index: false, follow: true } : undefined,
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const home = await cachedHome(locale)
  if (home)
    return (
      <DocumentView
        doc={home}
        locale={locale}
        ctx={{ listings: await listingsFor(home, locale) }}
      />
    )
  return (
    <nav aria-label={t(locale, 'mainNavigation')}>
      <ul>
        <li>
          <a href={href('services', locale)}>{t(locale, 'services')}</a>
        </li>
        <li>
          <a href={href('training', locale)}>{t(locale, 'training')}</a>
        </li>
      </ul>
    </nav>
  )
}
