// Builds the contact form for documents that contain a visible contact section (US5). Topics come
// from published site settings per locale; the bot challenge follows CAPTCHA_DRIVER. Turnstile's
// script is loaded with the request's CSP nonce, only on pages that show the form.
import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { enquiryTopics, privacyNoticeFor } from '@/modules/enquiries'
import { href, t, type Locale } from '@/modules/i18n'
import { getConfig } from '@/modules/platform'
import { EnquiryForm } from '@/ui/enquiry/EnquiryForm'
import { ENQUIRY_MESSAGE_KEYS, type EnquiryMessages } from '@/ui/enquiry/messages'

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

export async function contactFormFor(doc: Record<string, unknown> | null, locale: Locale) {
  const sections = Array.isArray(doc?.sections)
    ? (doc!.sections as { blockType?: string; hidden?: boolean }[])
    : []
  if (!sections.some((s) => s?.blockType === 'contactBlock' && !s.hidden)) return undefined
  const payload = await getPayload({ config })
  // CD-10 / FR-079: without a published privacy notice in this language the form never launches.
  const notice = await privacyNoticeFor(payload, locale)
  if (!notice) return <p className="enquiry__note">{t(locale, 'enquiryNotConfigured')}</p>
  const topics = await enquiryTopics(payload, locale)
  const c = getConfig().captcha
  const turnstile = c.driver === 'turnstile'
  const nonce = turnstile ? ((await headers()).get('x-nonce') ?? undefined) : undefined
  return (
    <>
      <EnquiryForm
        locale={locale}
        topics={topics}
        privacyHref={href('page', locale, { slug: notice.slug })}
        messages={
          Object.fromEntries(ENQUIRY_MESSAGE_KEYS.map((k) => [k, t(locale, k)])) as EnquiryMessages
        }
        captcha={
          turnstile
            ? { driver: 'turnstile', siteKey: c.siteKey }
            : { driver: 'test', testToken: `test-${randomUUID()}` }
        }
      />
      {turnstile && topics.length ? (
        <script src={TURNSTILE_SCRIPT} async defer nonce={nonce} />
      ) : null}
    </>
  )
}
