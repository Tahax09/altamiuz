// Staff notification for an enquiry (T125, FR-073, FR-074, FR-075, D-15). Runs as a Payload job
// task, never in the visitor's request: the enquiry is already stored. Retries with exponential
// backoff; the attempt count, an error code and the status live on the enquiry, so a persistent
// failure is visible in the inbox. After the last attempt the job raises an operator alert (an
// error-level log entry `alert: enquiry.delivery_failed`, content-free) and stops.
// The email is plain text. Submitted values never reach a header except the validated reply-to;
// the subject is fixed.
import type { Payload, TaskConfig } from 'payload'
import { createEmailAdapter, getConfig, type EmailAdapter } from '../platform'
import { ENQUIRIES, SYSTEM_CONTEXT } from './collection'

export const SEND_ENQUIRY_TASK = 'sendEnquiryEmail'
export const MAX_ATTEMPTS = 5
/** First retry after 1 minute, doubling (1, 2, 4, 8 minutes). */
export const RETRY_DELAY_MS = 60_000
export const SUBJECT = 'New website enquiry'

type Enquiry = {
  id: number
  name: string
  email: string
  phone?: string | null
  organization?: string | null
  topic: string
  message: string
  locale: string
  createdAt: string
  delivery?: { status?: string; attempts?: number | null }
}

let mailer: EmailAdapter | undefined
export function enquiryMailer(): EmailAdapter {
  if (!mailer) {
    const cfg = getConfig()
    mailer = createEmailAdapter({
      driver: cfg.email.driver,
      from: cfg.email.from,
      smtpUrl: cfg.email.smtpUrl ?? '',
    } as never)
  }
  return mailer
}
/** Test hook: replace the mailer (e.g. one that fails, to simulate an outage). */
export function setEnquiryMailerForTests(m: EmailAdapter | undefined) {
  mailer = m
}

/** Recipients configured by Administrators in site settings (published version). */
export async function enquiryRecipients(payload: Payload): Promise<string[]> {
  const s = (await payload.findGlobal({
    slug: 'site-settings' as never,
    depth: 0,
    overrideAccess: true,
    draft: false,
  })) as { enquiryRecipients?: { email?: unknown }[] | null }
  return (s.enquiryRecipients ?? [])
    .map((r) => (typeof r?.email === 'string' ? r.email.trim() : ''))
    .filter(Boolean)
}

export function enquiryEmailText(e: Enquiry, adminUrl: string): string {
  const line = (label: string, v: unknown) => (typeof v === 'string' && v ? `${label}: ${v}\n` : '')
  return (
    `A visitor sent an enquiry through the website contact form.\n\n` +
    `Reference: ${e.id}\n` +
    `Received: ${e.createdAt}\n` +
    `Language: ${e.locale}\n` +
    line('Topic', e.topic) +
    line('Name', e.name) +
    line('Email', e.email) +
    line('Phone', e.phone) +
    line('Organization', e.organization) +
    `\nMessage:\n${e.message}\n\n` +
    `Open it in the CMS: ${adminUrl}/admin/collections/enquiries/${e.id}\n` +
    `Reply to this email to answer the visitor.\n`
  )
}

async function setDelivery(payload: Payload, id: number, delivery: Record<string, unknown>) {
  await payload.update({
    collection: ENQUIRIES as never,
    id,
    data: { delivery } as never,
    overrideAccess: true,
    context: SYSTEM_CONTEXT,
  })
}

/** One delivery attempt. Throws to ask the job queue for a retry. */
export async function deliverEnquiry(
  payload: Payload,
  id: number,
): Promise<'sent' | 'failed' | 'skipped'> {
  const e = (await payload
    .findByID({
      collection: ENQUIRIES as never,
      id,
      depth: 0,
      overrideAccess: true,
      context: SYSTEM_CONTEXT,
    })
    .catch(() => null)) as unknown as Enquiry | null
  if (!e) return 'skipped' // deleted before delivery
  if (e.delivery?.status === 'sent' || e.delivery?.status === 'failed') return 'skipped'
  const attempts = (e.delivery?.attempts ?? 0) + 1
  let code: string | null = null
  try {
    const to = await enquiryRecipients(payload)
    if (!to.length) code = 'no_recipients'
    else
      await enquiryMailer().send({
        to,
        subject: SUBJECT,
        text: enquiryEmailText(e, getConfig().siteUrl),
        replyTo: e.email,
      })
  } catch (err) {
    code = (err as Error)?.name === 'EmailValidationError' ? 'invalid_message' : 'transport'
  }
  if (!code) {
    await setDelivery(payload, id, {
      status: 'sent',
      attempts,
      lastError: null,
      sentAt: new Date().toISOString(),
    })
    return 'sent'
  }
  if (attempts >= MAX_ATTEMPTS || code === 'invalid_message') {
    await setDelivery(payload, id, { status: 'failed', attempts, lastError: code })
    payload.logger.error(
      { alert: 'enquiry.delivery_failed', enquiry: id, attempts, code },
      'enquiry notification failed permanently; staff must check the inbox',
    )
    return 'failed'
  }
  await setDelivery(payload, id, { status: 'retrying', attempts, lastError: code })
  throw new Error(`enquiry delivery attempt ${attempts} failed: ${code}`)
}

export const sendEnquiryTask: TaskConfig = {
  slug: SEND_ENQUIRY_TASK,
  label: 'Send enquiry notification',
  inputSchema: [{ name: 'enquiryId', type: 'number', required: true }],
  retries: {
    attempts: MAX_ATTEMPTS - 1,
    backoff: { type: 'exponential', delay: RETRY_DELAY_MS },
  },
  handler: async ({ input, req }) => {
    await deliverEnquiry(req.payload, Number((input as { enquiryId: unknown }).enquiryId))
    return { output: {} }
  },
}
