// Course facts (FR-017, W-1): audience, duration, format and provider as a definition list in the
// course header; the accreditation statement only appears on a published course, which requires
// verified evidence (FR-016).
import { t, type Locale } from '@/modules/i18n'

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const UNIT = { hours: 'unitHours', days: 'unitDays', weeks: 'unitWeeks' } as const
const FORMAT = {
  'in-person': 'formatInPerson',
  online: 'formatOnline',
  hybrid: 'formatHybrid',
} as const

export function courseFactRows(doc: Record<string, unknown>, locale: Locale): [string, string][] {
  const duration = doc.duration as { value?: number; unit?: string } | undefined
  const rows: [string, string][] = []
  if (doc.audience) rows.push([t(locale, 'audience'), str(doc.audience)])
  if (duration?.value && duration.unit && duration.unit in UNIT)
    rows.push([
      t(locale, 'duration'),
      `${duration.value} ${t(locale, UNIT[duration.unit as keyof typeof UNIT])}`,
    ])
  if (typeof doc.deliveryFormat === 'string' && doc.deliveryFormat in FORMAT)
    rows.push([
      t(locale, 'deliveryFormat'),
      t(locale, FORMAT[doc.deliveryFormat as keyof typeof FORMAT]),
    ])
  if (doc.provider) rows.push([t(locale, 'provider'), str(doc.provider)])
  return rows
}

export function CourseFacts({ doc, locale }: { doc: Record<string, unknown>; locale: Locale }) {
  const rows = courseFactRows(doc, locale)
  if (!rows.length && !doc.accreditationStatement) return null
  return (
    <div className="course-facts">
      <h2 className="sr-only">{t(locale, 'courseDetails')}</h2>
      {rows.length ? (
        <dl>
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {doc.accreditationStatement ? (
        <p className="course-facts__note">{str(doc.accreditationStatement)}</p>
      ) : null}
    </div>
  )
}
