// `pnpm map:static`: stores the office map image and adds the "Find us" section to the contact
// page draft (scripts/static-map.ts). Uses Mapbox when MAPBOX_TOKEN (a public "pk." token with the
// styles:tiles scope) works, otherwise OpenStreetMap (no key). Server-side only; never publishes.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { loadOsmMap, loadStaticMap, StaticMapError } from './static-map'

const payload = await getPayload({ config })
try {
  const token = process.env.MAPBOX_TOKEN ?? ''
  let r: { media: number; page: number } | undefined
  if (token)
    try {
      r = await loadStaticMap(payload, token)
      payload.logger.info('Map image from Mapbox.')
    } catch (e) {
      if (!(e instanceof StaticMapError)) throw e
      payload.logger.warn(`${e.message} Using OpenStreetMap instead.`)
    }
  if (!r) {
    r = await loadOsmMap(payload)
    payload.logger.info('Map image from OpenStreetMap (no key needed).')
  }
  payload.logger.info(
    `Map image stored (media #${r.media}); "Find us" section saved to the contact page draft (page #${r.page}). Not published.`,
  )
  process.exit(0)
} catch (e) {
  payload.logger.error(e instanceof StaticMapError ? e.message : e)
  process.exit(1)
}
