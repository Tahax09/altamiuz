// Contact details from PUBLISHED site settings (CD-02), shared by the footer and the contact
// section. Only values the CMS holds are shown; the address only exists publicly once its evidence
// is verified (publish gate). No external map link (owner 2026-11-18): the office map is on the
// contact page. Returns null when there is nothing to show.
import { formatPhone, type Locale } from '@/modules/i18n'
import { safeHref } from '@/modules/content'
import { Icon } from '../primitives/Icon'

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** The main number first, then the additional numbers in their CMS order; invalid and repeated
 * numbers are dropped. */
export function phonesOf(settings: Record<string, unknown> | null | undefined): string[] {
  const extra = Array.isArray(settings?.additionalPhones) ? settings.additionalPhones : []
  const all = [
    str(settings?.phone),
    ...extra.map((r) => str((r as { number?: unknown } | null)?.number)),
  ]
  return [...new Set(all.filter((p) => formatPhone(p)))]
}

export function hasContactDetails(settings: Record<string, unknown> | null | undefined): boolean {
  return (
    ['email', 'address', 'hours'].some((k) => !!str(settings?.[k])) || phonesOf(settings).length > 0
  )
}

export function ContactDetails({
  settings,
  className,
  iconClassName,
}: {
  settings: Record<string, unknown> | null | undefined
  /** Kept for callers; the details themselves are language-neutral. */
  locale?: Locale
  className: string
  iconClassName: string
}) {
  const email = str(settings?.email)
  const mail = email ? safeHref(`mailto:${email}`) : null
  const phones = phonesOf(settings).flatMap((raw) => {
    const phone = formatPhone(raw)
    const tel = phone ? safeHref(`tel:${raw}`) : null
    return phone && tel ? [{ raw, tel, ...phone }] : []
  })
  const address = str(settings?.address)
  const hours = str(settings?.hours)
  if (!mail && !phones.length && !address && !hours) return null
  const row = 'flex items-start gap-3'
  return (
    <address className={className}>
      {mail ? (
        <a href={mail} className={row}>
          <Icon name="mail" className={iconClassName} />
          <bdi dir="ltr">{email}</bdi>
        </a>
      ) : null}
      {phones.length ? (
        <p className={row}>
          <Icon name="phone" className={iconClassName} />
          <span className="contact-details__phones">
            {phones.map((p) => (
              <a key={p.raw} href={p.tel}>
                <bdi dir={p.dir}>{p.text}</bdi>
              </a>
            ))}
          </span>
        </p>
      ) : null}
      {address ? (
        <p className={row}>
          <Icon name="pin" className={iconClassName} />
          <span>
            <span className="whitespace-pre-line">{address}</span>
          </span>
        </p>
      ) : null}
      {hours ? (
        <p className={row}>
          <Icon name="clock" className={iconClassName} />
          <span>{hours}</span>
        </p>
      ) : null}
    </address>
  )
}
