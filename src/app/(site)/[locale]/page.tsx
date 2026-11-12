// Home (T103): the published `home`-template page of the locale, else the service and training
// entry points. Never shows drafts.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { href, LOCALES, t, type Locale } from '@/modules/i18n'
import { contactFormFor } from '../contact-form'
import { docMetadata, JsonLd, staticMetadata } from '../seo'
import { DocumentView } from '@/ui'
import { PageHeader } from '@/ui/page/PageHeader'
import { Icon } from '@/ui/primitives/Icon'
import { cachedHome, listingsFor } from '../data'

const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const home = await cachedHome(locale)
  return home ? docMetadata(locale, 'pages', home) : staticMetadata(locale, 'home')
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const home = await cachedHome(locale)
  if (home)
    return (
      <>
        <JsonLd locale={locale} collection="pages" doc={home} />
        <DocumentView
          doc={home}
          locale={locale}
          ctx={{
            listings: await listingsFor(home, locale),
            contactForm: await contactFormFor(home, locale),
          }}
        />
      </>
    )
  // No published home page in this language: the two entry points, as cards.
  return (
    <>
      <JsonLd locale={locale} />
      <PageHeader locale={locale} title={t(locale, 'home')} />
      <section className="section">
        <ul className="ledger">
          {(['services', 'training'] as const).map((key) => (
            <li key={key} className="ledger__row">
              <h2 className="ledger__title">
                <a href={href(key, locale)}>{t(locale, key)}</a>
              </h2>
              <Icon name="arrow" className="ledger__arrow" />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
