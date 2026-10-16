// Seeds e2e accounts through the real services (sign-in → MFA enrolment). Run via `payload run`.
import fs from 'node:fs'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import { confirmEnrolment, signIn, startEnrolment } from '../../src/modules/auth'

const payload = await getPayload({ config })
const { generate } = await import('otplib')
const out: Record<string, unknown> = {}
const pw = (r: string) => `e2e ${r} pass phrase ${Math.random().toString(36).slice(2)} 7` // gitleaks:allow (synthetic)

for (const role of ['owner', 'administrator', 'publisher', 'editor', 'passwordOnly'] as const) {
  const email = `e2e-${role.toLowerCase()}@example.invalid`
  const password = pw(role)
  const user = (await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      name: `E2E ${role}`,
      role: role === 'passwordOnly' ? 'editor' : role,
      status: 'active',
    } as never,
    overrideAccess: true,
    context: { authSystem: true },
  })) as unknown as { id: number }
  const entry: Record<string, unknown> = { id: user.id, email, password }
  if (role !== 'passwordOnly') {
    const login = await signIn(payload, { email, password, ip: '127.0.0.1' })
    if (!login.ok) throw new Error(`seed login failed for ${role}`)
    const ctx = { payload, userId: user.id, email, sid: login.sid }
    const { secret } = await startEnrolment(ctx)
    await confirmEnrolment(ctx, await generate({ secret }))
    entry.secret = secret
    entry.enrolledAt = Date.now()
  }
  out[role] = entry
}
// US2 content: one bilingual draft page with three sections (reorder, preview, locking tests).
const rt = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        children: [{ type: 'text', version: 1, text, format: 0 }],
      },
    ],
  },
})
const page = (await payload.create({
  collection: 'pages',
  locale: 'en',
  draft: true,
  data: {
    title: 'E2E draft page',
    slug: 'e2e-draft',
    template: 'default',
    sections: [
      { blockType: 'richText', blockName: 'First section', content: rt('Draft-only English body') },
      { blockType: 'cta', blockName: 'Second section', heading: 'Talk to us' },
      { blockType: 'richText', blockName: 'Third section', content: rt('Closing words') },
    ],
  } as never,
  overrideAccess: true,
})) as unknown as { id: number; sections: { id: string }[] }
await payload.update({
  collection: 'pages',
  id: page.id,
  locale: 'ar',
  draft: true,
  data: {
    title: 'صفحة تجريبية',
    slug: 'مسودة-تجريبية',
    sections: page.sections.map((s, i) =>
      i === 0 ? { id: s.id, content: rt('نص عربي مع ISO 27001 داخل الجملة') } : { id: s.id },
    ),
  } as never,
  overrideAccess: true,
})
out.content = { pageId: page.id }
fs.mkdirSync('test-results', { recursive: true })
fs.writeFileSync('test-results/e2e-fixtures.json', JSON.stringify(out))
process.exit(0)
