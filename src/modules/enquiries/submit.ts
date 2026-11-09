// Public enquiry submission (T123, FR-070–FR-074, FR-078, contracts/http-surface.md "Contact
// submission", D-15). Check order: origin → rate limit (5 per source per 10 minutes) → bot
// challenge (fail closed) → schema → persist → enqueue notification. The visitor sees the
// confirmation only after the enquiry is stored. Responses reveal no more than the contract's
// codes; enquiry content is never logged.
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'
import { clientIp, getLimiter, sameOrigin } from '../auth'
import {
  createCaptchaVerifier,
  emitSignal,
  getConfig,
  limitKey,
  type CaptchaVerifier,
} from '../platform'
import { deleteAfterFor, ENQUIRIES } from './collection'
import { SEND_ENQUIRY_TASK } from './delivery'
import { validateEnquiry, type EnquiryField, type ErrorCode } from './schema'

export const ENQUIRY_LIMIT = { limit: 5, windowMs: 10 * 60_000 }
export const CAPTCHA_ACTION = 'enquiry'

export type SubmitResult =
  | { status: 200; id: number }
  | { status: 400; errors: Partial<Record<EnquiryField, ErrorCode>> }
  | { status: 403; reason: 'origin' | 'captcha' }
  | { status: 429; retryAfterSeconds: number }
  | { status: 503 }

let verifier: CaptchaVerifier | undefined
function captcha(): CaptchaVerifier {
  if (!verifier) {
    const c = getConfig().captcha
    verifier = createCaptchaVerifier({ driver: c.driver, secretKey: c.secretKey })
  }
  return verifier
}
/** Test hook: replace the bot-challenge verifier. */
export function setCaptchaForTests(v: CaptchaVerifier | undefined) {
  verifier = v
}

/** Topic labels an enquiry may name, from site settings (published), for the visitor's locale. */
export async function enquiryTopics(payload: Payload, locale: 'ar' | 'en'): Promise<string[]> {
  const s = (await payload.findGlobal({
    slug: 'site-settings' as never,
    locale,
    fallbackLocale: false as never,
    depth: 0,
    draft: false,
    overrideAccess: true,
  })) as { enquiryTopics?: { label?: unknown }[] | null }
  return (s.enquiryTopics ?? [])
    .map((t) => (typeof t?.label === 'string' ? t.label.trim() : ''))
    .filter(Boolean)
}

/**
 * The published privacy notice for this language (CD-10, FR-079): the page that site settings
 * name as `privacyNotice`, read through the public, published-only path. Null when unset or not
 * published in this language; the contact form is then neither shown nor accepted.
 */
export async function privacyNoticeFor(
  payload: Payload,
  locale: 'ar' | 'en',
): Promise<{ id: number; slug: string } | null> {
  const s = (await payload.findGlobal({
    slug: 'site-settings' as never,
    locale,
    fallbackLocale: false as never,
    depth: 0,
    draft: false,
    overrideAccess: true,
  })) as { privacyNotice?: unknown }
  const id =
    typeof s.privacyNotice === 'number'
      ? s.privacyNotice
      : (s.privacyNotice as { id?: unknown } | null)?.id
  if (typeof id !== 'number') return null
  const res = await payload.find({
    collection: 'pages',
    where: { and: [{ id: { equals: id } }, { template: { equals: 'legal' } }] },
    locale,
    fallbackLocale: false,
    draft: false,
    depth: 0,
    limit: 1,
    overrideAccess: false,
    context: { publicSite: true },
  })
  const doc = res.docs[0] as { id: number; slug?: unknown } | undefined
  return doc && typeof doc.slug === 'string' ? { id: doc.id, slug: doc.slug } : null
}

export async function submitEnquiry(
  payload: Payload,
  raw: Record<string, unknown>,
  headers: Headers,
): Promise<SubmitResult> {
  // 1. Origin (FR-091): server actions also check it; this keeps the rule explicit.
  if (!sameOrigin(headers) || !headers.get('origin')) return { status: 403, reason: 'origin' }
  // 2. Rate limit per source. A limiter failure denies (fail closed).
  const ip = clientIp(headers)
  const hit = await getLimiter(payload).hit(limitKey('enquiry', ip), ENQUIRY_LIMIT)
  if (!hit.allowed)
    return { status: 429, retryAfterSeconds: Math.max(1, Math.ceil(hit.retryAfterMs / 1000)) }
  // 3. Bot challenge: single use, unexpired, this hostname and action; unavailable → 503.
  const token = typeof raw.turnstileToken === 'string' ? raw.turnstileToken : ''
  const result = await captcha().verify(token, {
    remoteIp: ip === 'unidentified' || ip === 'invalid' ? undefined : ip,
    expectedAction: CAPTCHA_ACTION,
    expectedHostname: new URL(getConfig().siteUrl).hostname,
  })
  if (result.unavailable) {
    emitSignal('captcha.unavailable', { scope: 'enquiry' })
    return { status: 503 }
  }
  if (!result.success) {
    emitSignal('captcha.failure', { scope: 'enquiry' })
    return { status: 403, reason: 'captcha' }
  }
  // 4. Schema (FR-071): only FR-070 fields, configured topics, server-side limits.
  const locale = raw.locale === 'en' ? 'en' : 'ar'
  // CD-10: no enquiry is accepted in a language without a published privacy notice (fail closed,
  // also for direct posts that never saw the form).
  if (!(await privacyNoticeFor(payload, locale))) return { status: 503 }
  const v = validateEnquiry(raw, await enquiryTopics(payload, locale))
  if (!v.ok) return { status: 400, errors: v.errors }
  // 5. Persist (before any confirmation) and 6. enqueue the staff notification in one
  // transaction: a stored enquiry always has its delivery job, and a failure stores neither.
  const req = await createLocalReq({}, payload)
  const own = await initTransaction(req)
  let created: { id: number }
  try {
    created = (await payload.create({
      collection: ENQUIRIES as never,
      data: {
        ...v.value,
        delivery: { status: 'pending', attempts: 0 },
        deleteAfter: deleteAfterFor(new Date()),
      } as never,
      overrideAccess: true,
      context: { enquirySystem: true },
      req,
    })) as unknown as { id: number }
    await payload.jobs.queue({
      task: SEND_ENQUIRY_TASK as never,
      input: { enquiryId: created.id } as never,
      overrideAccess: true,
      req,
    })
    if (own) await commitTransaction(req)
  } catch (e) {
    if (own) await killTransaction(req)
    throw e
  }
  return { status: 200, id: created.id }
}
