// Public site chrome (T102/T103, W-1, FR-001, FR-003, FR-010, FR-014, FR-036, FR-082): skip link,
// sticky header with the main navigation, language switcher and contact action, banner, footer.
// Server components: menus are native <details> disclosures, so they open and close without
// JavaScript; Enhancements.tsx only adds Escape and click-outside closing. Every href comes from
// the typed route map or safeHref (lib/links.ts).
import { href, LANGUAGE_NAMES, LOCALES, t, type Locale } from '@/modules/i18n'
import { cn } from '../lib/cn'
import { linkTarget, newTabProps, samePath, type CmsLink } from '../lib/links'
import { Picture, type PublicMedia } from '../media/Picture'
import { buttonVariants } from '../primitives/button'
import { Icon } from '../primitives/Icon'
import { internalHrefFor } from '../sections/Sections'
import { BannerDismiss } from './BannerDismiss'
import { ContactDetails, hasContactDetails } from './ContactDetails'

type MenuItem = { id?: string; link?: CmsLink; children?: MenuItem[] }
type Resolved = { label: string; href: string; link: CmsLink }

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

function resolveItem(link: CmsLink | undefined, locale: Locale): Resolved | null {
  const label = str(link?.label)
  if (!link || !label) return null
  const target = linkTarget(link, locale, internalHrefFor(locale))
  return target ? { label, href: target, link } : null // unsafe or unpublished: omitted
}

type MenuGroup = { label: string; href: string | null; link: CmsLink; children: Resolved[] }

/** Menu rows with their resolvable links; a parent with no target keeps its visible children. */
function resolveMenu(items: unknown, locale: Locale): MenuGroup[] {
  const list = Array.isArray(items) ? (items as MenuItem[]) : []
  const out: MenuGroup[] = []
  for (const item of list) {
    const self = resolveItem(item.link, locale)
    const children = (Array.isArray(item.children) ? item.children : [])
      .map((c) => resolveItem(c.link, locale))
      .filter((c): c is Resolved => !!c)
    if (self) out.push({ ...self, children })
    else if (children.length)
      out.push({ label: str(item.link?.label), href: null, link: {}, children })
  }
  return out.filter((g) => g.label)
}

function MenuAnchor({
  item,
  current,
  className,
}: {
  item: Resolved
  current: string
  className?: string
}) {
  const active = samePath(item.href, current)
  return (
    <a
      href={item.href}
      className={className}
      aria-current={active ? 'page' : undefined}
      {...newTabProps(item.link, item.href)}
    >
      {item.label}
    </a>
  )
}

/** Desktop navigation: top-level links; a row with children opens a click/keyboard disclosure. */
function DesktopNav({
  groups,
  locale,
  current,
}: {
  groups: MenuGroup[]
  locale: Locale
  current: string
}) {
  return (
    <nav aria-label={t(locale, 'mainNavigation')} className="site-nav site-nav--desktop">
      <ul className="site-nav__list">
        {groups.map((g, i) => (
          <li key={`${i}-${g.label}`} className="site-nav__item">
            {g.children.length ? (
              <details className="site-nav__group" data-disclosure="">
                <summary
                  className={cn(
                    'site-nav__link',
                    [g.href, ...g.children.map((c) => c.href)].some(
                      (h) => h && samePath(h, current),
                    ) && 'is-active',
                  )}
                >
                  {g.label}
                  <Icon name="chevronDown" className="site-nav__caret" />
                </summary>
                <ul className="site-nav__panel">
                  {g.href ? (
                    <li>
                      <MenuAnchor
                        item={{ label: g.label, href: g.href, link: g.link }}
                        current={current}
                        className="site-nav__sublink"
                      />
                    </li>
                  ) : null}
                  {g.children.map((c, j) => (
                    <li key={`${j}-${c.href}`}>
                      <MenuAnchor item={c} current={current} className="site-nav__sublink" />
                    </li>
                  ))}
                </ul>
              </details>
            ) : g.href ? (
              <MenuAnchor
                item={{ label: g.label, href: g.href, link: g.link }}
                current={current}
                className="site-nav__link"
              />
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Small screens: one disclosure holding the whole menu (works without JavaScript). */
function MobileMenu({
  groups,
  locale,
  current,
  contact,
}: {
  groups: MenuGroup[]
  locale: Locale
  current: string
  contact: Resolved | null
}) {
  if (!groups.length && !contact) return null
  return (
    <details className="site-menu" data-disclosure="">
      <summary className="site-menu__toggle">
        <Icon name="menu" className="site-menu__icon site-menu__icon--open" />
        <Icon name="close" className="site-menu__icon site-menu__icon--close" />
        <span>{t(locale, 'menu')}</span>
      </summary>
      <div className="site-menu__panel">
        {groups.length ? (
          <nav aria-label={t(locale, 'mainNavigation')}>
            <ul className="site-menu__list">
              {groups.map((g, i) => (
                <li key={`${i}-${g.label}`}>
                  {g.href ? (
                    <MenuAnchor
                      item={{ label: g.label, href: g.href, link: g.link }}
                      current={current}
                      className="site-menu__link"
                    />
                  ) : (
                    <span className="site-menu__heading">{g.label}</span>
                  )}
                  {g.children.length ? (
                    <ul className="site-menu__sublist">
                      {g.children.map((c, j) => (
                        <li key={`${j}-${c.href}`}>
                          <MenuAnchor item={c} current={current} className="site-menu__sublink" />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {contact ? (
          <a href={contact.href} className={cn(buttonVariants({ arrow: true }), 'w-full')}>
            {contact.label}
            <Icon name="arrow" />
          </a>
        ) : null}
      </div>
    </details>
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

/** First focusable element of every page (WCAG 2.4.1): before the banner and the header. */
export function SkipLink({ locale }: { locale: Locale }) {
  return (
    <a className="skip-link" href="#main">
      {t(locale, 'skipToContent')}
    </a>
  )
}

const hasPublicImage = (m: unknown) => !!m && typeof m === 'object' && !!(m as PublicMedia).filename

/**
 * Brand mark (CD-09): the logo from published site settings when one is chosen for this language,
 * otherwise the company name as text. A logo whose alt text is empty (decorative) still gives the
 * link an accessible name through the hidden company name.
 */
export function BrandMark({
  logo,
  name,
  className,
  eager = false,
}: {
  logo: unknown
  name: string
  className: string
  eager?: boolean
}) {
  const m = logo && typeof logo === 'object' ? (logo as PublicMedia) : null
  if (!m?.filename) return <>{name}</>
  const named = typeof m.alt === 'string' && m.alt.trim() !== '' && m.decorative !== true
  return (
    <>
      <Picture
        media={m}
        crop={false}
        fallback="webp"
        sizes="14rem"
        eager={eager}
        className={className}
      />
      {named ? null : <span className="sr-only">{name}</span>}
    </>
  )
}

/** The contact page from published site settings, if it is published in this language. */
export function contactLink(
  settings: Record<string, unknown> | null,
  locale: Locale,
): Resolved | null {
  const page = settings?.contactPage as { title?: unknown } | null | undefined
  const target = page ? internalHrefFor(locale)('pages', page) : null
  if (!target) return null
  return { label: str(page?.title) || t(locale, 'primaryAction'), href: target, link: {} }
}

export function SiteHeader({
  locale,
  nav,
  siteName,
  logo = null,
  alternates,
  currentPath = '',
  contact = null,
}: {
  locale: Locale
  nav: Record<string, unknown> | null
  siteName?: string
  /** `brand.logo` from published site settings (populated media), if any. */
  logo?: unknown
  alternates: Partial<Record<Locale, string | null>>
  currentPath?: string
  contact?: Resolved | null
}) {
  const groups = resolveMenu(nav?.items, locale)
  const contactActive = contact ? samePath(contact.href, currentPath) : false
  return (
    <header className="site-header">
      <div className="site-header__bar">
        <a className="site-header__home" href={href('home', locale)}>
          {hasPublicImage(logo) ? (
            <BrandMark
              logo={logo}
              name={siteName || t(locale, 'home')}
              className="site-header__logo"
              eager
            />
          ) : (
            // No logo published yet: the owner-supplied emblem (src/app/icon.svg, CD-09) marks
            // the home link, with the company name beside it once published, or for screen
            // readers only until then.
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- static same-origin SVG; next/image would add client JS (153,600 B budget) and nothing else with images.unoptimized */}
              <img
                src="/icon.svg"
                alt=""
                width={40}
                height={40}
                className="site-header__emblem"
                decoding="async"
              />
              {siteName ? (
                <span>{siteName}</span>
              ) : (
                <span className="sr-only">{t(locale, 'home')}</span>
              )}
            </>
          )}
        </a>
        {groups.length ? (
          <DesktopNav groups={groups} locale={locale} current={currentPath} />
        ) : null}
        <div className="site-header__tools">
          <LanguageSwitcher locale={locale} alternates={alternates} />
          {contact ? (
            <a
              href={contact.href}
              aria-current={contactActive ? 'page' : undefined}
              className={cn(buttonVariants({ size: 'sm' }), 'site-header__cta')}
            >
              {contact.label}
            </a>
          ) : null}
          <MobileMenu groups={groups} locale={locale} current={currentPath} contact={contact} />
        </div>
      </div>
    </header>
  )
}

function ContactLines({
  settings,
  locale,
}: {
  settings: Record<string, unknown> | null
  locale: Locale
}) {
  if (!hasContactDetails(settings)) return null
  return (
    <div>
      <h2 className="site-footer__heading">{t(locale, 'footerContact')}</h2>
      <ContactDetails
        settings={settings}
        locale={locale}
        className="site-footer__contact"
        iconClassName="site-footer__icon"
      />
    </div>
  )
}

const hasRows = (items: unknown, locale: Locale) =>
  (Array.isArray(items) ? (items as { link?: CmsLink }[]) : []).some((r) =>
    resolveItem(r.link, locale),
  )

function LinkRow({ items, locale, label }: { items: unknown; locale: Locale; label: string }) {
  const rows = (Array.isArray(items) ? (items as { link?: CmsLink }[]) : [])
    .map((r) => resolveItem(r.link, locale))
    .filter((r): r is Resolved => !!r)
  if (!rows.length) return null
  return (
    <nav aria-label={label}>
      <ul className="site-footer__inline">
        {rows.map((r, i) => (
          <li key={`${i}-${r.href}`}>
            <a href={r.href} {...newTabProps(r.link, r.href)}>
              {r.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function SiteFooter({
  locale,
  nav,
  settings,
  year = new Date().getFullYear(),
}: {
  locale: Locale
  nav: Record<string, unknown> | null
  settings: Record<string, unknown> | null
  year?: number
}) {
  const name = str(settings?.companyName)
  // The copyright line always shows: the published company name, else the brand name.
  const holder = name || t(locale, 'brandName')
  const about = str((settings?.defaultSeo as { description?: unknown } | undefined)?.description)
  const logo = (settings?.brand as { logoInverse?: unknown } | undefined)?.logoInverse
  const hasLogo = !!logo && typeof logo === 'object' && !!(logo as PublicMedia).filename
  const groups = resolveMenu(nav?.items, locale)
  const flat = groups.filter((g) => !g.children.length && g.href)
  const columns = groups.filter((g) => g.children.length)
  const base = [
    <p key="copyright">
      © <bdi>{year}</bdi> <bdi>{holder}</bdi>. {t(locale, 'allRightsReserved')}
    </p>,
    hasRows(settings?.legalLinks, locale) ? (
      <LinkRow
        key="legal"
        items={settings?.legalLinks}
        locale={locale}
        label={t(locale, 'footerLegal')}
      />
    ) : null,
    hasRows(settings?.socialLinks, locale) ? (
      <LinkRow
        key="social"
        items={settings?.socialLinks}
        locale={locale}
        label={t(locale, 'socialLinks')}
      />
    ) : null,
  ]
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        {hasLogo || name || about ? (
          <div className="site-footer__brand">
            {hasLogo ? (
              <p className="site-footer__name">
                <BrandMark
                  logo={logo}
                  name={name || t(locale, 'home')}
                  className="site-footer__logo"
                />
              </p>
            ) : name ? (
              <p className="site-footer__name">{name}</p>
            ) : null}
            {about ? <p className="site-footer__about">{about}</p> : null}
          </div>
        ) : null}
        {groups.length ? (
          <nav aria-label={t(locale, 'footerNavigation')} className="site-footer__nav">
            {flat.length ? (
              <ul className="site-footer__list">
                {flat.map((g, i) => (
                  <li key={`${i}-${g.href}`}>
                    <a href={g.href!} {...newTabProps(g.link, g.href!)}>
                      {g.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {columns.map((g, i) => (
              <div key={`${i}-${g.label}`}>
                <h2 className="site-footer__heading">
                  {g.href ? <a href={g.href}>{g.label}</a> : g.label}
                </h2>
                <ul className="site-footer__list">
                  {g.children.map((c, j) => (
                    <li key={`${j}-${c.href}`}>
                      <a href={c.href} {...newTabProps(c.link, c.href)}>
                        {c.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        ) : null}
        <ContactLines settings={settings} locale={locale} />
      </div>
      {base.some(Boolean) ? <div className="site-footer__base">{base}</div> : null}
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
  const link = resolveItem(banner.link as CmsLink, locale)
  return (
    <aside
      className="site-banner"
      role="region"
      aria-label={t(locale, 'announcement')}
      data-dismiss-key={key}
    >
      <p>
        {banner.message}{' '}
        {link ? (
          <a href={link.href} {...newTabProps(link.link, link.href)}>
            {link.label}
          </a>
        ) : null}
      </p>
      {key ? <BannerDismiss dismissKey={key} label={t(locale, 'dismissBanner')} /> : null}
    </aside>
  )
}
