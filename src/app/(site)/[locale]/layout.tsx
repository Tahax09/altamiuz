// Public site root layout (T103, FR-001, FR-003, FR-007, FR-010): <html lang dir> per locale,
// header/footer navigation and banner from published globals, language switcher for the current
// document. Invalid locales render with the default locale's chrome; the page itself 404s.
import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { DEFAULT_LOCALE, href, LOCALES, matchRoute, type Locale } from '@/modules/i18n'
import { SiteBanner, SiteFooter, SiteHeader } from '@/ui'
import { fontVariables } from '@/ui/fonts'
import { cachedAlternates, cachedGlobal, cachedPublished } from '../data'
import '../site.css'

const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)

/** Same-document paths in each locale for the current URL (null where unavailable). */
async function alternatesFor(path: string): Promise<Partial<Record<Locale, string | null>>> {
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s)
      } catch {
        return ''
      }
    })
  const m = matchRoute(segments)
  if (m.key === 'notFound') return {}
  if (m.key === 'home' || m.key === 'services' || m.key === 'training')
    return Object.fromEntries(LOCALES.map((l) => [l, href(m.key as 'home', l)]))
  if (!('slug' in m)) return {}
  const collection = m.key === 'page' ? 'pages' : m.key === 'service' ? 'services' : 'courses'
  const doc = await cachedPublished(collection, m.locale, m.slug)
  if (!doc) return {}
  const slugs = await cachedAlternates(collection, doc.id)
  return Object.fromEntries(
    LOCALES.map((l) => [l, slugs[l] ? href(m.key as 'page', l, { slug: slugs[l]! }) : null]),
  )
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const path = (await headers()).get('x-altamiuz-path') ?? `/${locale}`
  const [settings, headerNav, footerNav, banner, alternates] = await Promise.all([
    cachedGlobal('site-settings', locale),
    cachedGlobal('header-nav', locale),
    cachedGlobal('footer-nav', locale),
    cachedGlobal('banner', locale),
    isLocale(raw) ? alternatesFor(path) : Promise.resolve({}),
  ])
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={fontVariables}>
      <body>
        <SiteBanner locale={locale} banner={banner} />
        <SiteHeader
          locale={locale}
          nav={headerNav}
          siteName={typeof settings?.companyName === 'string' ? settings.companyName : undefined}
          alternates={alternates}
        />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale={locale} nav={footerNav} settings={settings} />
      </body>
    </html>
  )
}
