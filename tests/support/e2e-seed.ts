// Seeds e2e accounts through the real services (sign-in → MFA enrolment). Run via `payload run`.
import fs from 'node:fs'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import { confirmEnrolment, signIn, startEnrolment } from '../../src/modules/auth'

const payload = await getPayload({ config })
const { generate } = await import('otplib')
const out: Record<string, unknown> = {}
const pw = (r: string) => `e2e ${r} pass phrase ${Math.random().toString(36).slice(2)} 7` // gitleaks:allow (synthetic)

for (const role of ['owner', 'administrator', 'editor', 'passwordOnly'] as const) {
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
fs.mkdirSync('test-results', { recursive: true })
fs.writeFileSync('test-results/e2e-fixtures.json', JSON.stringify(out))
process.exit(0)
