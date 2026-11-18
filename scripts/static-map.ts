// Office map for the contact page (owner request 2026-11-18). Fetches ONE static map image from
// the Mapbox Static Images API on the server, with the office pin, and stores it in the media
// library through the upload pipeline. Visitors load the stored image from this site: no Mapbox
// script, no third-party request, no cookie, no CSP change, and the token never reaches a browser.
// The image keeps Mapbox's attribution (required by its terms), and the section text credits
// Mapbox and OpenStreetMap. Writes only the contact page DRAFT; never publishes.
import type { Payload } from 'payload'
import sharp, { type OverlayOptions } from 'sharp'
import { contactDetails } from '../content/catalogue/copy'
import { contactPage } from '../content/contact/copy'

type Obj = Record<string, unknown>
type Locale = 'en' | 'ar'
export class StaticMapError extends Error {}

const BLOCK_NAME = 'Location map'
const CREDITS = {
  mapbox: { en: 'Map © Mapbox © OpenStreetMap', ar: 'الخريطة © Mapbox © OpenStreetMap' },
  osm: { en: 'Map © OpenStreetMap contributors', ar: 'الخريطة © المساهمون في OpenStreetMap' },
}
type Credit = (typeof CREDITS)[keyof typeof CREDITS]

const copy = {
  heading: { en: 'Find us', ar: 'موقعنا' },
  alt: {
    en: 'Map of Al-Sabaa, Tripoli, with a pin on the Altamiuz office',
    ar: 'خريطة منطقة السبعة في طرابلس، مع علامة على مقر شركة التميز',
  },
}

/** Mapbox Static Images URL: light style, brand-blue pin, zoom 15, 1280×800 at 2× density. */
export function staticMapUrl(token: string, { lat, lng } = contactDetails.location): string {
  if (!/^pk\.[\w.-]+$/.test(token))
    throw new StaticMapError('MAPBOX_TOKEN must be a public Mapbox token (it starts with "pk.").')
  const at = `${lng},${lat}`
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+2563eb(${at})/${at},15,0/1280x800@2x?access_token=${encodeURIComponent(token)}`
}

const txt = (text: string) => ({
  type: 'text',
  version: 1,
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
})
const paragraph = (text: string) => ({
  type: 'paragraph',
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  textFormat: 0,
  children: [txt(text)],
})
const body = (l: Locale, credit: Credit) => ({
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: [paragraph(contactDetails.address[l]), paragraph(credit[l])],
  },
})

const block = (l: Locale, media: number, credit: Credit, id?: unknown) => ({
  ...(id ? { id } : {}),
  blockType: 'textMedia',
  blockName: BLOCK_NAME,
  hidden: false,
  heading: copy.heading[l],
  body: body(l, credit),
  media,
  mediaPosition: 'end',
  // Interactive map on the contact page (OfficeMap); the image is its preview.
  location: {
    latitude: contactDetails.location.lat,
    longitude: contactDetails.location.lng,
    zoom: 16,
  },
})

export async function loadStaticMap(
  payload: Payload,
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<{ media: number; page: number }> {
  const url = staticMapUrl(token)
  const res = await fetcher(url, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new StaticMapError(
      `Mapbox refused the request (HTTP ${res.status})${/styles:tiles/.test(detail) ? ': the token needs the styles:tiles scope' : ''}.`,
    )
  }
  if (!/^image\/png\b/.test(res.headers.get('content-type') ?? ''))
    throw new StaticMapError('Mapbox did not return a PNG image.')
  return storeMap(payload, Buffer.from(await res.arrayBuffer()), CREDITS.mapbox)
}

// OpenStreetMap fallback, no key: a one-off composite of standard tiles (about 20 at zoom 16),
// fetched from the server with an identifying User-Agent as the OSM tile policy asks, and
// credited "© OpenStreetMap contributors". Visitors never fetch tiles.
const TILE = 256
const osmTile = (z: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
const USER_AGENT = 'AltamiuzWebsite/1.0 (one-off static office map)'

/** World pixel position of a coordinate at a zoom level (Web Mercator, 256 px tiles). */
export function worldPixel(lat: number, lng: number, z: number) {
  const n = TILE * 2 ** z
  const r = (lat * Math.PI) / 180
  return {
    x: ((lng + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n,
  }
}

const PIN = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" viewBox="0 0 48 64"><path d="M24 2C12 2 3 11 3 23c0 16 21 39 21 39s21-23 21-39C45 11 36 2 24 2z" fill="#2563eb" stroke="#fff" stroke-width="3"/><circle cx="24" cy="23" r="8" fill="#fff"/></svg>',
)

/** One tile, retried twice on a timeout or network error (a single slow tile should not fail
 *  the whole map). */
async function fetchTile(fetcher: typeof fetch, url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++)
    try {
      return await fetcher(url, {
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(15_000),
      })
    } catch (e) {
      if (attempt >= 3)
        throw new StaticMapError(`OpenStreetMap did not answer (${(e as Error).name}).`)
    }
}

export async function loadOsmMap(
  payload: Payload,
  fetcher: typeof fetch = fetch,
  { lat, lng }: { lat: number; lng: number } = contactDetails.location,
  { width = 1280, height = 800, zoom = 16 } = {},
): Promise<{ media: number; page: number }> {
  const c = worldPixel(lat, lng, zoom)
  const left = c.x - width / 2
  const top = c.y - height / 2
  const pad = TILE // tiles overhang the edges: draw on a larger canvas, then crop
  const layers: OverlayOptions[] = []
  for (let tx = Math.floor(left / TILE); tx * TILE < left + width; tx++)
    for (let ty = Math.floor(top / TILE); ty * TILE < top + height; ty++) {
      const res = await fetchTile(fetcher, osmTile(zoom, tx, ty))
      if (!res.ok || !/^image\//.test(res.headers.get('content-type') ?? ''))
        throw new StaticMapError(`OpenStreetMap tile request failed (HTTP ${res.status}).`)
      layers.push({
        input: Buffer.from(await res.arrayBuffer()),
        left: pad + Math.round(tx * TILE - left),
        top: pad + Math.round(ty * TILE - top),
      })
    }
  const pin = {
    input: PIN,
    left: Math.round(width / 2 - 24),
    top: Math.round(height / 2 - 62),
  }
  const full = await sharp({
    create: {
      width: width + 2 * pad,
      height: height + 2 * pad,
      channels: 3,
      background: '#f2efe9',
    },
  })
    .composite(layers)
    .png()
    .toBuffer()
  // sharp applies extract before composite within one pipeline: crop and tone first (soft
  // blue-grey, like the interactive map's palette), then draw the pin on top.
  const toned = await sharp(full)
    .extract({ left: pad, top: pad, width, height })
    .greyscale()
    .linear(0.55, 112)
    .tint('#dce7fe')
    .png()
    .toBuffer()
  const data = await sharp(toned).composite([pin]).png({ compressionLevel: 9 }).toBuffer()
  return storeMap(payload, data, CREDITS.osm)
}

async function storeMap(
  payload: Payload,
  data: Buffer,
  credit: Credit,
): Promise<{ media: number; page: number }> {
  const media = (
    (await payload.create({
      collection: 'media',
      locale: 'en',
      data: { alt: copy.alt.en } as never,
      file: { data, mimetype: 'image/png', name: 'office-map.png', size: data.length },
      overrideAccess: true,
    })) as unknown as { id: number }
  ).id
  await payload.update({
    collection: 'media',
    id: media,
    locale: 'ar',
    data: { alt: copy.alt.ar } as never,
    overrideAccess: true,
  })

  const found = await payload.find({
    collection: 'pages',
    where: { slug: { equals: contactPage.slug.en } },
    draft: true,
    locale: 'en',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const page = (found.docs[0] as { id?: number } | undefined)?.id
  if (!page) throw new StaticMapError('No contact page yet: run "pnpm seed:contact" first.')
  const sectionsOf = async (l: Locale) =>
    (
      (await payload.findByID({
        collection: 'pages',
        id: page,
        draft: true,
        locale: l,
        depth: 0,
        overrideAccess: true,
      })) as unknown as { sections?: Obj[] }
    ).sections ?? []
  // Replace the map section if it exists; otherwise add it right after the enquiry form.
  const place = (stored: Obj[], l: Locale) => {
    const i = stored.findIndex((b) => b.blockName === BLOCK_NAME)
    if (i >= 0) return stored.map((b, j) => (j === i ? block(l, media, credit, b.id) : b))
    const form = stored.findIndex((b) => b.blockType === 'contactBlock')
    const at = form >= 0 ? form + 1 : stored.length
    return [...stored.slice(0, at), block(l, media, credit), ...stored.slice(at)]
  }
  for (const l of ['en', 'ar'] as const)
    await payload.update({
      collection: 'pages',
      id: page,
      locale: l,
      draft: true,
      data: { sections: place(await sectionsOf(l), l) } as never,
      overrideAccess: true,
    })
  return { media, page }
}
