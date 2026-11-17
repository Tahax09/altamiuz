// Payload Admin branding (CD-09): the supplied emblem replaces Payload's graphics through the
// supported `admin.components.graphics` extension points. The emblem is the owner's artwork,
// served unchanged from `src/app/icon.svg` (same origin, allowed by the admin CSP `img-src 'self'`).
// No English lockup has been supplied, so the login page pairs the emblem with plain text; the
// English treatment of the name stays an owner decision (CD-01, CD-09). The admin UI is English
// only (D-23).

const EMBLEM = '/icon.svg'

/** Login, account-recovery and MFA pages (`graphics.Logo`). */
export function AdminLogo() {
  return (
    <span className="altamiuz-brand">
      {/* Decorative: the visible text carries the name. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static same-origin SVG in the admin; next/image adds nothing for it */}
      <img className="altamiuz-brand__mark" src={EMBLEM} alt="" width={56} height={56} />
      <span className="altamiuz-brand__text">
        <span className="altamiuz-brand__name">Altamiuz</span>
        <span className="altamiuz-brand__label">Content management</span>
      </span>
    </span>
  )
}

/** Navigation and breadcrumb home link (`graphics.Icon`). Payload wraps it in the dashboard link,
 *  so the alternative text is that link's name. */
export function AdminIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static same-origin SVG in the admin
    <img className="altamiuz-brand__icon" src={EMBLEM} alt="Dashboard" width={18} height={18} />
  )
}
