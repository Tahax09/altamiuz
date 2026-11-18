// Office map for the contact page (owner request 2026-11-18). Fetches ONE static map image from
// the Mapbox Static Images API on the server, with the office pin, and stores it in the media
// library through the upload pipeline. Visitors load the stored image from this site: no Mapbox
// script, no third-party request, no cookie, no CSP change, and the token never reaches a browser.
// The image keeps Mapbox's attribution (required by its terms), and the section text credits
// Mapbox and OpenStreetMap. Writes only the contact page DRAFT; never publishes.
import type { Payload } from 'payload'
import { contactDetails } from '../content/catalogue/copy'
import { contactPage } from '../content/contact/copy'

type Obj = Record<string, unknown>
type Locale = 'en' | 'ar'
export class StaticMapError extends Error {}

const BLOCK_NAME = 'Location map'
const copy = {
  heading: { en: 'Find us', ar: 'موقعنا' },
  credit: { en: 'Map © Mapbox © OpenStreetMap', ar: 'الخريطة © Mapbox © OpenStreetMap' },
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
const body = (l: Locale) => ({
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: [paragraph(contactDetails.address[l]), paragraph(copy.credit[l])],
  },
})

const block = (l: Locale, media: number, id?: unknown) => ({
  ...(id ? { id } : {}),
  blockType: 'textMedia',
  blockName: BLOCK_NAME,
  hidden: false,
  heading: copy.heading[l],
  body: body(l),
  media,
  mediaPosition: 'end',
})

export async function loadStaticMap(
  payload: Payload,
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<{ media: number; page: number }> {
  const url = staticMapUrl(token)
  const res = await fetcher(url, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok)
    throw new StaticMapError(
      `Mapbox refused the request (HTTP ${res.status}). Check the token's scopes and URL restrictions.`,
    )
  if (!/^image\/png\b/.test(res.headers.get('content-type') ?? ''))
    throw new StaticMapError('Mapbox did not return a PNG image.')
  const data = Buffer.from(await res.arrayBuffer())
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
    if (i >= 0) return stored.map((b, j) => (j === i ? block(l, media, b.id) : b))
    const form = stored.findIndex((b) => b.blockType === 'contactBlock')
    const at = form >= 0 ? form + 1 : stored.length
    return [...stored.slice(0, at), block(l, media), ...stored.slice(at)]
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
