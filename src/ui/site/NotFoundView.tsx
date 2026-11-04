// Localized "not found" content (T104, FR-008, L-5): the same view for client-side navigations
// (the [locale] not-found boundary) and for document requests (the proxy serves /{locale}/~404
// with status 404). No internal details; ways back into the site in the same language.
import { href, t, type Locale } from '@/modules/i18n'

export function NotFoundView({ locale }: { locale: Locale }) {
  return (
    <>
      <header className="page-header status-page">
        <p className="meta">404</p>
        <h1>{t(locale, 'notFoundTitle')}</h1>
        <p className="lead">{t(locale, 'notFoundBody')}</p>
        <p className="actions">
          <a className="button" href={href('home', locale)}>
            {t(locale, 'backHome')}
          </a>
        </p>
      </header>
      <nav className="section" aria-label={t(locale, 'mainNavigation')}>
        <ul className="card-grid">
          {(['services', 'training'] as const).map((key) => (
            <li key={key} className="card card--link">
              <h2>
                <a href={href(key, locale)}>{t(locale, key)}</a>
              </h2>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
