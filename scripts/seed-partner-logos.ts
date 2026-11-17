// `pnpm seed:partners`: uploads the supplied partner logos to the media library (scripts/
// partner-logos.ts). Media only; no page or credentials block is created or published.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { loadPartnerLogos } from './partner-logos'

const payload = await getPayload({ config })
try {
  const r = await loadPartnerLogos(payload)
  payload.logger.info(
    `Partner logos in the media library: ${r.map((l) => `${l.name} #${l.id} (${l.created ? 'uploaded' : 'already there'})`).join(', ')}. Not placed on any page: a credentials block needs verified evidence before it can be published (CD-05).`,
  )
  process.exit(0)
} catch (e) {
  payload.logger.error(e)
  process.exit(1)
}
