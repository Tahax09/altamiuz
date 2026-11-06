'use client'
// Contact form (US5, FR-070, FR-071, FR-078; WCAG 2.2 AA). Works without JavaScript through the
// server action; with JavaScript it keeps the page and moves focus to the result. Every field has
// a visible label; errors are linked with aria-describedby and summarised in an alert. Input is
// kept on errors. The server is authoritative for every check.
import { useActionState, useEffect, useRef } from 'react'
import type { Locale } from '@/modules/i18n'
import type { EnquiryMessages } from './messages'
import { sendEnquiry, type EnquiryState } from '../../app/(site)/[locale]/enquiry-action'

export type CaptchaProps = { driver: 'test' | 'turnstile'; siteKey?: string; testToken?: string }

const LIMITS = { name: 100, email: 254, phone: 20, organization: 150, message: 5000 }
const ERR: Record<string, Record<string, keyof EnquiryMessages>> = {
  default: {
    required: 'enquiryErrRequired',
    tooLong: 'enquiryErrTooLong',
    invalid: 'enquiryErrInvalid',
    consent: 'enquiryErrConsent',
  },
  email: { invalid: 'enquiryErrEmail' },
  phone: { invalid: 'enquiryErrPhone' },
  topic: { invalid: 'enquiryErrTopic' },
}

const STATUS: Partial<Record<EnquiryState['status'], keyof EnquiryMessages>> = {
  sent: 'enquirySent',
  invalid: 'enquiryErrorsSummary',
  rejected: 'enquiryRejected',
  limited: 'enquiryRateLimited',
  unavailable: 'enquiryUnavailable',
}

export function EnquiryForm({
  locale,
  topics,
  captcha,
  messages,
}: {
  locale: Locale
  topics: string[]
  captcha: CaptchaProps
  messages: EnquiryMessages
}) {
  const t = (_l: Locale, key: keyof EnquiryMessages) => messages[key]
  const errText = (_l: Locale, field: string, code?: string) =>
    code ? messages[ERR[field]?.[code] ?? ERR.default![code] ?? 'enquiryErrInvalid'] : ''
  const [state, action, pending] = useActionState(sendEnquiry, { status: 'idle', round: 0 })
  const notice = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (state.round > 0) notice.current?.focus()
  }, [state.round])
  const v = state.status === 'sent' ? {} : (state.values ?? {})
  const e = state.errors ?? {}
  const msg = STATUS[state.status]
  const field = (
    name: 'name' | 'email' | 'phone' | 'organization',
    label: keyof EnquiryMessages,
    opts: { required?: boolean; type?: string; autoComplete?: string },
  ) => (
    <div className="field">
      <label htmlFor={`enq-${name}`}>
        {t(locale, label)}
        {opts.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={`enq-${name}`}
        name={name}
        type={opts.type ?? 'text'}
        autoComplete={opts.autoComplete}
        required={opts.required}
        maxLength={LIMITS[name]}
        defaultValue={v[name] ?? ''}
        aria-invalid={e[name] ? true : undefined}
        aria-describedby={e[name] ? `enq-${name}-err` : undefined}
        dir={name === 'email' || name === 'phone' ? 'ltr' : undefined}
      />
      {e[name] ? (
        <p id={`enq-${name}-err`} className="field__error">
          {errText(locale, name, e[name])}
        </p>
      ) : null}
    </div>
  )
  if (!topics.length) return <p className="enquiry__note">{t(locale, 'enquiryNotConfigured')}</p>
  return (
    <form
      action={action}
      className="enquiry"
      noValidate
      key={state.round}
      data-testid="enquiry-form"
    >
      <p
        ref={notice}
        tabIndex={-1}
        role={state.status === 'sent' ? 'status' : msg ? 'alert' : undefined}
        className={msg ? `enquiry__notice enquiry__notice--${state.status}` : 'sr-only'}
        data-testid="enquiry-notice"
        data-status={state.status}
      >
        {msg ? t(locale, msg) : ''}
      </p>
      {state.status === 'sent' ? null : (
        <>
          <p className="enquiry__note">{t(locale, 'enquirySensitive')}</p>
          <p className="enquiry__note">{t(locale, 'enquiryRequired')}</p>
          <input type="hidden" name="locale" value={locale} />
          {field('name', 'enquiryName', { required: true, autoComplete: 'name' })}
          {field('email', 'enquiryEmail', { required: true, type: 'email', autoComplete: 'email' })}
          {field('phone', 'enquiryPhone', { type: 'tel', autoComplete: 'tel' })}
          {field('organization', 'enquiryOrganization', { autoComplete: 'organization' })}
          <fieldset
            className="field field--choices"
            aria-invalid={e.topic ? true : undefined}
            aria-describedby={e.topic ? 'enq-topic-err' : undefined}
          >
            <legend>
              {t(locale, 'enquiryTopic')}
              <span aria-hidden="true"> *</span>
            </legend>
            {topics.map((tp, i) => (
              <div className="choice" key={tp}>
                <input
                  id={`enq-topic-${i}`}
                  type="radio"
                  name="topic"
                  value={tp}
                  required
                  defaultChecked={v.topic === tp}
                />
                <label htmlFor={`enq-topic-${i}`}>{tp}</label>
              </div>
            ))}
            {e.topic ? (
              <p id="enq-topic-err" className="field__error">
                {errText(locale, 'topic', e.topic)}
              </p>
            ) : null}
          </fieldset>
          <div className="field">
            <label htmlFor="enq-message">
              {t(locale, 'enquiryMessage')}
              <span aria-hidden="true"> *</span>
            </label>
            <textarea
              id="enq-message"
              name="message"
              required
              rows={8}
              maxLength={LIMITS.message}
              defaultValue={v.message ?? ''}
              aria-invalid={e.message ? true : undefined}
              aria-describedby={e.message ? 'enq-message-err' : undefined}
            />
            {e.message ? (
              <p id="enq-message-err" className="field__error">
                {errText(locale, 'message', e.message)}
              </p>
            ) : null}
          </div>
          <div className="field field--check">
            <input
              id="enq-consent"
              name="consent"
              type="checkbox"
              value="true"
              required
              aria-invalid={e.consent ? true : undefined}
              aria-describedby={e.consent ? 'enq-consent-err' : undefined}
            />
            <label htmlFor="enq-consent">
              {t(locale, 'enquiryConsent')}
              <span aria-hidden="true"> *</span>
            </label>
            {e.consent ? (
              <p id="enq-consent-err" className="field__error">
                {errText(locale, 'consent', e.consent)}
              </p>
            ) : null}
          </div>
          {captcha.driver === 'turnstile' ? (
            <div
              className="cf-turnstile"
              data-sitekey={captcha.siteKey}
              data-action="enquiry"
              data-response-field-name="turnstileToken"
              data-language={locale}
              aria-label={t(locale, 'enquiryBotCheck')}
            />
          ) : (
            <input
              type="hidden"
              name="turnstileToken"
              value={`${captcha.testToken ?? 'test'}-${state.round}`}
            />
          )}
          <button type="submit" className="button" disabled={pending}>
            {t(locale, 'enquirySubmit')}
          </button>
        </>
      )}
    </form>
  )
}
