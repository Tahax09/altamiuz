// Public site chrome (T102/T103, FR-001, FR-003, FR-010, FR-014, FR-036): skip link, header and
// footer navigation from published globals, language switcher, banner. Server components; every
// href comes from the typed route map or safeHref.
import { safeHref } from '@/modules/content'
import { formatPhone, href, LANGUAGE_NAMES, LOCALES, t, type Locale } from '@/modules/i18n'
import { internalHrefFor } from '../sections/Sections'
import { BannerDismiss } from './BannerDismiss'

type Link = {
  linkType?: string
  url?: string
  email?: string
  tel?: string
  label?: string
  newTab?: boolean
  doc?: { relationTo?: string; value?: unknown } | null
}
type MenuItem = { link?: Link; children?: MenuItem[] }

function linkHref(link: Link | undefined, locale: Locale): string | null {
  if (!link) return null
  if (link.linkType === 'internal')
    return link.doc?.relationTo
      ? internalHrefFor(locale)(link.doc.relationTo, link.doc.value)
      : null
  if (link.linkType === 'email') return safeHref(`mailto:${link.email ?? ''}`)
  if (link.linkType === 'tel') return safeHref(`tel:${link.tel ?? ''}`)
  return safeHref(link.url)
}

function MenuLink({ link, locale }: { link?: Link; locale: Locale }) {
  const label = link?.label
  if (!label) return null
  const target = linkHref(link, locale)
  if (!target) return null // unsafe or unpublished target: omitted from public menus
  const newTab = link?.newTab === true && /^https?:/.test(target)
  return (
    <a href={target} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {label}
    </a>
  )
}

function Menu({ items, locale, label }: { items: unknown; locale: Locale; label: string }) {
  const list = Array.isArray(items) ? (items as MenuItem[]) : []
  if (!list.length) return null
  return (
    <nav aria-label={label}>
      <ul>
        {list.map((item, i) => (
          <li key={i}>
            <MenuLink link={item.link} locale={locale} />
            {Array.isArray(item.children) && item.children.length ? (
              <ul>
                {item.children.map((c, j) => (
                  <li key={j}>
                    <MenuLink link={c.link} locale={locale} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** FR-003: links to the same document in the other language, or explains it is unavailable. */
export function LanguageSwitcher({
  locale,
  alternates,
}: {
  locale: Locale
  alternates: Partial<Record<Locale, string | null>>
}) {
  return (
    <ul className="language-switcher" aria-label={t(locale, 'switchLanguage')}>
      {LOCALES.filter((l) => l !== locale).map((l) => {
        const path = alternates[l]
        const dir = l === 'ar' ? 'rtl' : 'ltr'
        // Only the language name is in the other language; the note is in the page's language.
        return (
          <li key={l}>
            {path ? (
              <a href={path} hrefLang={l} lang={l} dir={dir}>
                {LANGUAGE_NAMES[l]}
              </a>
            ) : (
              <span aria-disabled="true" className="language-switcher__unavailable">
                <span lang={l} dir={dir}>
                  {LANGUAGE_NAMES[l]}
                </span>
                <span className="language-switcher__note">
                  {' '}
                  ({t(locale, 'languageUnavailable', { language: LANGUAGE_NAMES[l] })})
                </span>
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function SiteHeader({
  locale,
  nav,
  siteName,
  alternates,
}: {
  locale: Locale
  nav: Record<string, unknown> | null
  siteName?: string
  alternates: Partial<Record<Locale, string | null>>
}) {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        {t(locale, 'skipToContent')}
      </a>
      <a className="site-header__home" href={href('home', locale)}>
        {siteName || t(locale, 'home')}
      </a>
      <Menu items={nav?.items} locale={locale} label={t(locale, 'mainNavigation')} />
      <LanguageSwitcher locale={locale} alternates={alternates} />
    </header>
  )
}

export function SiteFooter({
  locale,
  nav,
  settings,
}: {
  locale: Locale
  nav: Record<string, unknown> | null
  settings: Record<string, unknown> | null
}) {
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  // Only published site-settings values; nothing is shown that the CMS does not hold.
  const name = str(settings?.companyName)
  const email = str(settings?.email)
  const mail = email ? safeHref(`mailto:${email}`) : null
  const phone = formatPhone(str(settings?.phone))
  const tel = phone ? safeHref(`tel:${str(settings?.phone)}`) : null
  return (
    <footer className="site-footer">
      <div>
        {name ? <p className="site-footer__name">{name}</p> : null}
        <Menu items={nav?.items} locale={locale} label={t(locale, 'footerNavigation')} />
      </div>
      {mail || tel ? (
        <address className="site-footer__contact">
          {mail ? (
            <a href={mail}>
              <bdi dir="ltr">{email}</bdi>
            </a>
          ) : null}
          {tel && phone ? (
            <a href={tel}>
              <bdi dir={phone.dir}>{phone.text}</bdi>
            </a>
          ) : null}
        </address>
      ) : null}
    </footer>
  )
}

/** Banner: shown when enabled and inside its schedule; dismissal is remembered per visitor. */
export function SiteBanner({
  locale,
  banner,
  now = new Date(),
}: {
  locale: Locale
  banner: Record<string, unknown> | null
  now?: Date
}) {
  if (!banner?.enabled || typeof banner.message !== 'string' || !banner.message.trim()) return null
  const starts = banner.startsAt ? Date.parse(String(banner.startsAt)) : -Infinity
  const ends = banner.endsAt ? Date.parse(String(banner.endsAt)) : Infinity
  if (now.getTime() < starts || now.getTime() >= ends) return null
  const key = typeof banner.dismissKey === 'string' ? banner.dismissKey : ''
  return (
    <aside
      className="site-banner"
      role="region"
      aria-label={t(locale, 'announcement')}
      data-dismiss-key={key}
    >
      <p>
        {banner.message} <MenuLink link={banner.link as Link} locale={locale} />
      </p>
      {key ? <BannerDismiss dismissKey={key} label={t(locale, 'dismissBanner')} /> : null}
    </aside>
  )
}
