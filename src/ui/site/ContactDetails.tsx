// Contact details from PUBLISHED site settings (CD-02), shared by the footer and the contact
// section. Only values the CMS holds are shown; the address only exists publicly once its evidence
// is verified (publish gate). Returns null when there is nothing to show.
import { formatPhone, type Locale } from '@/modules/i18n'
import { safeHref } from '@/modules/content'
import { Icon } from '../primitives/Icon'

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function hasContactDetails(settings: Record<string, unknown> | null | undefined): boolean {
  return ['email', 'phone', 'address', 'hours'].some((k) => !!str(settings?.[k]))
}

export function ContactDetails({
  settings,
  className,
  iconClassName,
}: {
  settings: Record<string, unknown> | null | undefined
  locale: Locale
  className: string
  iconClassName: string
}) {
  const email = str(settings?.email)
  const mail = email ? safeHref(`mailto:${email}`) : null
  const rawPhone = str(settings?.phone)
  const phone = formatPhone(rawPhone)
  const tel = phone ? safeHref(`tel:${rawPhone}`) : null
  const address = str(settings?.address)
  const hours = str(settings?.hours)
  if (!mail && !tel && !address && !hours) return null
  const row = 'flex items-start gap-3'
  return (
    <address className={className}>
      {mail ? (
        <a href={mail} className={row}>
          <Icon name="mail" className={iconClassName} />
          <bdi dir="ltr">{email}</bdi>
        </a>
      ) : null}
      {tel && phone ? (
        <a href={tel} className={row}>
          <Icon name="phone" className={iconClassName} />
          <bdi dir={phone.dir}>{phone.text}</bdi>
        </a>
      ) : null}
      {address ? (
        <p className={row}>
          <Icon name="pin" className={iconClassName} />
          <span className="whitespace-pre-line">{address}</span>
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
