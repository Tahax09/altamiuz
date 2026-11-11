// Localized "not found" content (T104, FR-008, L-5): the same view for client-side navigations
// (the [locale] not-found boundary) and for document requests (the proxy serves /{locale}/~404
// with status 404). No internal details; ways back into the site in the same language.
import { href, t, type Locale } from '@/modules/i18n'
import { StatusView } from '../page/StatusView'
import { Icon } from '../primitives/Icon'

export function NotFoundView({ locale }: { locale: Locale }) {
  return (
    <StatusView
      code="404"
      title={t(locale, 'notFoundTitle')}
      body={<p>{t(locale, 'notFoundBody')}</p>}
      actions={
        <a className="button" href={href('home', locale)}>
          {t(locale, 'backHome')}
        </a>
      }
    >
      <nav className="status-page__links" aria-label={t(locale, 'notFoundLinks')}>
        <ul className="card-grid">
          {(['services', 'training'] as const).map((key) => (
            <li key={key} className="card card--link">
              <h2>
                <a href={href(key, locale)}>{t(locale, key)}</a>
              </h2>
              <Icon name="arrow" className="card__arrow" />
            </li>
          ))}
        </ul>
      </nav>
    </StatusView>
  )
}
