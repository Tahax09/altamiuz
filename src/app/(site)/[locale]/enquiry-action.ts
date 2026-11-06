'use server'
// Contact form server action (D-15; contracts/http-surface.md "Contact submission": server
// action). Works without JavaScript (progressive enhancement). Returns only the contract's
// outcomes; on validation errors the visitor's input comes back so nothing is lost.
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { FIELDS, submitEnquiry, type ErrorCode } from '@/modules/enquiries'

export type EnquiryState = {
  status: 'idle' | 'sent' | 'invalid' | 'rejected' | 'limited' | 'unavailable'
  errors?: Partial<Record<(typeof FIELDS)[number], ErrorCode>>
  values?: Record<string, string>
  /** Changes on every answer, so the form remounts with fresh values and a fresh challenge. */
  round: number
}

const TEXT_FIELDS = ['name', 'email', 'phone', 'organization', 'topic', 'message'] as const

export async function sendEnquiry(prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  const raw: Record<string, unknown> = {}
  for (const k of [...FIELDS, 'locale', 'turnstileToken', 'cf-turnstile-response']) {
    const v = form.get(k)
    if (typeof v === 'string') raw[k] = v
  }
  raw.turnstileToken = raw.turnstileToken || raw['cf-turnstile-response']
  const round = (prev?.round ?? 0) + 1
  let result
  try {
    result = await submitEnquiry(await getPayload({ config }), raw, await headers())
  } catch {
    return { status: 'unavailable', round, values: keep(raw) }
  }
  switch (result.status) {
    case 200:
      return { status: 'sent', round }
    case 400:
      return { status: 'invalid', errors: result.errors, values: keep(raw), round }
    case 429:
      return { status: 'limited', values: keep(raw), round }
    case 503:
      return { status: 'unavailable', values: keep(raw), round }
    default:
      return { status: 'rejected', values: keep(raw), round }
  }
}

function keep(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of TEXT_FIELDS)
    if (typeof raw[k] === 'string') out[k] = (raw[k] as string).slice(0, 5000)
  return out
}
