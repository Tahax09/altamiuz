// Request-size gate for media uploads (A-7, FR-051), applied in the proxy before Payload parses
// the body. Payload's multipart parser stops at 20 MB, but re-throws its 413 as a status-less
// APIError, which reaches the client as a 500 (Payload 3.92.1, addDataAndFileToRequest). Refusing
// here gives a clean 413 with the fixed upload message and keeps large bodies out of the server.
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
/** Room for multipart boundaries, part headers and the small `_payload` JSON field. */
export const MULTIPART_OVERHEAD_BYTES = 64 * 1024
export const UPLOAD_TOO_LARGE_MESSAGE = 'This file is larger than 20 MB. Upload a smaller image.'

const MEDIA_WRITE = /^\/api\/media(\/[^/]+)?\/?$/

/** null when the request may proceed; otherwise the refusal (413 too large, 411 no length). */
export function uploadSizeRefusal(
  method: string,
  pathname: string,
  headers: Headers,
): { status: 411 | 413; message: string } | null {
  if ((method !== 'POST' && method !== 'PATCH') || !MEDIA_WRITE.test(pathname)) return null
  if (!(headers.get('content-type') ?? '').toLowerCase().startsWith('multipart/')) return null
  const raw = headers.get('content-length')
  // Browsers always send a length for FormData; a streamed upload of unknown size is refused.
  if (raw === null || !/^\d{1,12}$/.test(raw))
    return { status: 411, message: 'Uploads must declare their size.' }
  if (Number(raw) > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES)
    return { status: 413, message: UPLOAD_TOO_LARGE_MESSAGE }
  return null
}
