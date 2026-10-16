// Email port (D-14, D-15). Mailpit SMTP / in-memory locally; Resend (proposed) in production.
import nodemailer from 'nodemailer'

export type EmailMessage = {
  to: string[]
  subject: string
  text: string
  html?: string
  replyTo?: string
}

export type SentEmail = EmailMessage & { from: string }

export interface EmailAdapter {
  send(message: EmailMessage): Promise<void>
  /** Only present on the memory driver (tests). */
  readonly outbox?: SentEmail[]
}

export class EmailValidationError extends Error {
  constructor(field: string) {
    super(`Invalid email field: ${field}`)
    this.name = 'EmailValidationError'
  }
}

const ADDRESS = /^[^\s@<>,;"]+@[^\s@<>,;"]+$/
const CONTROL = /[\r\n\0]/

/** Rejects header injection and malformed addresses before any transport sees the message. */
export function validateMessage(m: EmailMessage): void {
  if (!m.to.length || m.to.length > 20) throw new EmailValidationError('to')
  for (const addr of m.to)
    if (CONTROL.test(addr) || !ADDRESS.test(addr)) throw new EmailValidationError('to')
  if (m.replyTo !== undefined && (CONTROL.test(m.replyTo) || !ADDRESS.test(m.replyTo)))
    throw new EmailValidationError('replyTo')
  if (CONTROL.test(m.subject) || m.subject.length > 200) throw new EmailValidationError('subject')
}

export type EmailConfig =
  { driver: 'memory'; from: string } | { driver: 'smtp'; from: string; smtpUrl: string }

export function createEmail(config: EmailConfig): EmailAdapter {
  if (config.driver === 'memory') {
    const outbox: SentEmail[] = []
    return {
      outbox,
      async send(m) {
        validateMessage(m)
        outbox.push({ ...m, from: config.from })
      },
    }
  }
  const transport = nodemailer.createTransport(config.smtpUrl)
  return {
    async send(m) {
      validateMessage(m)
      await transport.sendMail({
        from: config.from,
        to: m.to,
        subject: m.subject,
        text: m.text,
        html: m.html,
        replyTo: m.replyTo,
      })
    },
  }
}
