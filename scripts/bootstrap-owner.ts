// One-time first-owner procedure (FR-030, T057). Refuses once any owner exists. Sends the
// invitation link by e-mail only; nothing secret is printed. Run: pnpm bootstrap:owner
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { bootstrapOwner, BootstrapError } from '../src/modules/auth'

const payload = await getPayload({ config })
try {
  await bootstrapOwner(payload, process.env.BOOTSTRAP_OWNER_EMAIL)
  payload.logger.info(
    'Owner invitation e-mailed (valid 72 hours). Remove BOOTSTRAP_OWNER_EMAIL now.',
  )
  process.exit(0)
} catch (e) {
  payload.logger.error(e instanceof BootstrapError ? e.message : 'bootstrap failed')
  process.exit(1)
}
