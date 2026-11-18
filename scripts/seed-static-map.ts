// `pnpm map:static`: stores the office map image and adds the "Find us" section to the contact
// page draft (scripts/static-map.ts). Needs MAPBOX_TOKEN (a public "pk." token) in .env.local;
// it is used on the server only and never shipped to the browser. Never publishes.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { loadStaticMap, StaticMapError } from './static-map'

const payload = await getPayload({ config })
try {
  const token = process.env.MAPBOX_TOKEN ?? ''
  if (!token) throw new StaticMapError('Set MAPBOX_TOKEN (a public "pk." token) in .env.local.')
  const r = await loadStaticMap(payload, token)
  payload.logger.info(
    `Map image stored (media #${r.media}); "Find us" section saved to the contact page draft (page #${r.page}). Not published.`,
  )
  process.exit(0)
} catch (e) {
  payload.logger.error(e instanceof StaticMapError ? e.message : e)
  process.exit(1)
}
