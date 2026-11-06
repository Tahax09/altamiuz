// Enquiry input (FR-070, FR-071, FR-078, data-model `enquiries`). One schema for the server
// check and the form; the server result is authoritative. Error codes are stable identifiers,
// localized only when shown (form.tsx). Only the FR-070 fields are accepted: unknown keys are
// dropped, not stored.

export const LIMITS = {
  name: 100,
  email: 254,
  phone: 20,
  organization: 150,
  topic: 120,
  message: 5000,
} as const
export const FIELDS = [
  'name',
  'email',
  'phone',
  'organization',
  'topic',
  'message',
  'consent',
] as const
export type EnquiryField = (typeof FIELDS)[number]
export type ErrorCode = 'required' | 'tooLong' | 'invalid' | 'consent'

export type EnquiryInput = {
  name: string
  email: string
  phone?: string
  organization?: string
  topic: string
  message: string
  consent: true
  locale: 'ar' | 'en'
}

// No control characters except tab and newline (message only); no bidi overrides in one-line
// fields (they can disguise what staff read).
const CONTROL_LINE = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/
const CONTROL_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
const EMAIL =
  /^[^\s@<>()[\],;:"\\]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i
const PHONE = /^\+?[0-9][0-9 ()-]{4,19}$/

const str = (v: unknown) => (typeof v === 'string' ? v.normalize('NFC').trim() : '')

export type Validation =
  | { ok: true; value: EnquiryInput }
  | { ok: false; errors: Partial<Record<EnquiryField, ErrorCode>> }

/** `topics` are the configured topic labels for the submission's locale (site settings). */
export function validateEnquiry(raw: Record<string, unknown>, topics: string[]): Validation {
  const errors: Partial<Record<EnquiryField, ErrorCode>> = {}
  const locale = raw.locale === 'en' ? 'en' : 'ar'
  const line = (k: 'name' | 'organization' | 'topic' | 'phone' | 'email', required: boolean) => {
    const v = str(raw[k])
    if (!v) {
      if (required) errors[k] = 'required'
      return undefined
    }
    if (v.length > LIMITS[k]) errors[k] = 'tooLong'
    else if (CONTROL_LINE.test(v)) errors[k] = 'invalid'
    return v
  }
  const name = line('name', true)
  const email = line('email', true)
  if (email && !errors.email && !EMAIL.test(email)) errors.email = 'invalid'
  const phone = line('phone', false)
  if (phone && !errors.phone && !PHONE.test(phone)) errors.phone = 'invalid'
  const organization = line('organization', false)
  const topic = line('topic', true)
  if (topic && !errors.topic && !topics.includes(topic)) errors.topic = 'invalid'
  const message = str(raw.message).replace(/\r\n?/g, '\n')
  if (!message) errors.message = 'required'
  else if (message.length > LIMITS.message) errors.message = 'tooLong'
  else if (CONTROL_TEXT.test(message)) errors.message = 'invalid'
  const consent = raw.consent === true || raw.consent === 'true' || raw.consent === 'on'
  if (!consent) errors.consent = 'consent'
  if (Object.keys(errors).length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      name: name!,
      email: email!.toLowerCase(),
      ...(phone ? { phone } : {}),
      ...(organization ? { organization } : {}),
      topic: topic!,
      message,
      consent: true,
      locale,
    },
  }
}
