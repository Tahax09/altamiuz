// FR-073 over real SMTP: the notification reaches Mailpit (docker-compose.dev.yml) with the fixed
// subject, the configured recipient, the visitor only as Reply-To, no injected headers and a
// plain-text body. Requires the local Mailpit (SMTP 1025, API 8025); fails if it is not running.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { createEmail } from '../../../src/modules/platform/adapters/email'
import { createTestCaptcha } from '../../../src/modules/platform/adapters/captcha'

const SMTP = 'smtp://127.0.0.1:1025'
const API = 'http://127.0.0.1:8025/api/v1'
let t: TestPayload
let m: typeof import('../../../src/modules/enquiries')

beforeAll(async () => {
  t = await bootPayload()
  m = await import('../../../src/modules/enquiries')
  m.setEnquiryMailerForTests(
    createEmail({ driver: 'smtp', from: 'no-reply@example.org', smtpUrl: SMTP }),
  )
  m.setCaptchaForTests(createTestCaptcha('1x0000000000000000000000000000000AA'))
  await t.payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      defaultSeo: { title: 'Site', description: 'Site description' },
      enquiryRecipients: [{ email: 'staff-mailpit@example.org' }],
      enquiryTopics: [{ label: 'Training' }],
      _status: 'published',
    } as never,
    publishSpecificLocale: 'en',
    overrideAccess: true,
  })
}, 240_000)
afterAll(async () => {
  m?.setEnquiryMailerForTests(undefined)
  m?.setCaptchaForTests(undefined)
  await t?.close()
})

describe('notification email in Mailpit', () => {
  it('arrives as plain text with safe headers', async () => {
    const marker = `mailpit-${Date.now()}`
    const r = await m.submitEnquiry(
      t.payload,
      {
        name: 'Mail Test',
        email: `visitor+${marker}@example.org`,
        topic: 'Training',
        message: `<script>alert(1)</script> ${marker}\nBcc: victim@example.org`,
        consent: 'true',
        locale: 'en',
        turnstileToken: marker,
      },
      new Headers({ origin: 'http://localhost:3000', 'x-forwarded-for': '198.51.100.77' }),
    )
    expect(r.status).toBe(200)
    await t.payload.jobs.run({ overrideAccess: true, silent: true })
    let msg: { ID: string } | undefined
    for (let i = 0; i < 20 && !msg; i++) {
      const s = (await (
        await fetch(`${API}/search?query=${encodeURIComponent(marker)}`)
      ).json()) as {
        messages: { ID: string }[]
      }
      msg = s.messages[0]
      if (!msg) await new Promise((res) => setTimeout(res, 250))
    }
    expect(msg, 'message delivered to Mailpit').toBeDefined()
    const full = (await (await fetch(`${API}/message/${msg!.ID}`)).json()) as {
      To: { Address: string }[]
      Bcc: unknown[] | null
      Cc: unknown[] | null
      ReplyTo: { Address: string }[]
      Subject: string
      Text: string
      HTML: string
    }
    expect(full.To.map((x) => x.Address)).toEqual(['staff-mailpit@example.org'])
    expect(full.ReplyTo.map((x) => x.Address)).toEqual([`visitor+${marker}@example.org`])
    expect(full.Subject).toBe(m.SUBJECT)
    expect(full.Bcc ?? []).toEqual([])
    expect(full.Cc ?? []).toEqual([])
    expect(full.HTML).toBe('')
    expect(full.Text.replace(/\r\n/g, '\n')).toContain(
      `<script>alert(1)</script> ${marker}\nBcc: victim@example.org`,
    )
    const raw = await (await fetch(`${API}/message/${msg!.ID}/headers`)).json()
    expect(JSON.stringify(raw)).not.toMatch(/victim@example\.org/)
  })
})
