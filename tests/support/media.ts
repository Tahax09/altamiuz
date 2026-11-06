// US4 test helpers: multipart uploads and file reads through Payload's real REST router (the same
// handleEndpoints the Next.js catch-all route calls), plus on-disk inspection of stored files.
import fs from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'

const ORIGIN = 'http://localhost:3000'

export type UploadFile = { name: string; type: string; data: Buffer }

async function call(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  urlPath: string,
  opts: { token?: string; body?: BodyInit; headers?: Record<string, string> } = {},
) {
  const { handleEndpoints } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const headers = new Headers({ origin: ORIGIN, ...(opts.headers ?? {}) })
  if (opts.token) headers.set('authorization', `JWT ${opts.token}`)
  const url = `${ORIGIN}${urlPath}`
  const res = await handleEndpoints({
    config,
    path: new URL(url).pathname,
    request: new Request(url, { method, headers, body: opts.body }),
  })
  const buf = Buffer.from(await res.arrayBuffer())
  let body: Record<string, unknown> = {}
  try {
    body = JSON.parse(buf.toString('utf8')) as Record<string, unknown>
  } catch {
    body = {}
  }
  return { status: res.status, body, raw: buf, headers: res.headers }
}

/** POST /api/media (create) or PATCH /api/media/:id (replace / edit) as multipart. */
export function uploadMedia(
  opts: {
    token?: string
    file?: UploadFile
    data?: Record<string, unknown>
    id?: number
    locale?: string
  } = {},
) {
  const form = new FormData()
  if (opts.file)
    form.append(
      'file',
      new Blob([new Uint8Array(opts.file.data)], { type: opts.file.type }),
      opts.file.name,
    )
  if (opts.data) form.append('_payload', JSON.stringify(opts.data))
  const q = opts.locale ? `?locale=${opts.locale}` : ''
  return opts.id
    ? call('PATCH', `/api/media/${opts.id}${q}`, { token: opts.token, body: form })
    : call('POST', `/api/media${q}`, { token: opts.token, body: form })
}

export const getFile = (filename: string, token?: string) =>
  call('GET', `/api/media/file/${encodeURIComponent(filename)}`, { token })

export const deleteMedia = (id: number, token?: string) =>
  call('DELETE', `/api/media/${id}`, { token })

export const mediaRest = call

export type StoredMedia = {
  id: number
  filename: string
  mimeType: string
  width: number
  height: number
  focalX?: number
  focalY?: number
  sizes: Record<string, { filename: string | null; width: number | null; mimeType: string | null }>
}

export const listDir = (dir: string) => (fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [])

/** Every distinct file a media document points to (master and variants; variants wider than the
 * original reuse the same file), as names. */
export const filesOf = (m: StoredMedia) => [
  ...new Set(
    [m.filename, ...Object.values(m.sizes ?? {}).map((s) => s.filename)].filter(
      (x): x is string => !!x,
    ),
  ),
]

export const readStored = (dir: string, name: string) => fs.readFileSync(path.join(dir, name))

export async function mediaDoc(payload: Payload, id: number): Promise<StoredMedia> {
  return (await payload.findByID({
    collection: 'media',
    id,
    depth: 0,
    overrideAccess: true,
  })) as unknown as StoredMedia
}
