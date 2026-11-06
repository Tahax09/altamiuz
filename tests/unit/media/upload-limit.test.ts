// A-7 request-size gate in the proxy (Payload turns its own 413 into a 500; see upload-limit.ts).
import { describe, expect, it } from 'vitest'
import { MAX_UPLOAD_BYTES, MULTIPART_OVERHEAD_BYTES, uploadSizeRefusal } from '@/modules/security'

const h = (len: string | null, type = 'multipart/form-data; boundary=x') => {
  const headers = new Headers({ 'content-type': type })
  if (len !== null) headers.set('content-length', len)
  return headers
}
const limit = MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES

describe('uploadSizeRefusal', () => {
  it('lets uploads up to 20 MB plus multipart overhead through', () => {
    expect(uploadSizeRefusal('POST', '/api/media', h(String(limit)))).toBeNull()
    expect(uploadSizeRefusal('PATCH', '/api/media/12', h('1000'))).toBeNull()
  })
  it('refuses larger bodies with 413 and bodies of unknown size with 411', () => {
    expect(uploadSizeRefusal('POST', '/api/media', h(String(limit + 1)))?.status).toBe(413)
    expect(uploadSizeRefusal('PATCH', '/api/media/3/', h('999999999999'))?.status).toBe(413)
    expect(uploadSizeRefusal('POST', '/api/media', h(null))?.status).toBe(411)
    expect(uploadSizeRefusal('POST', '/api/media', h('-1'))?.status).toBe(411)
  })
  it('ignores other routes, methods and non-multipart bodies', () => {
    expect(uploadSizeRefusal('POST', '/api/pages', h(String(limit + 1)))).toBeNull()
    expect(uploadSizeRefusal('GET', '/api/media', h(String(limit + 1)))).toBeNull()
    expect(uploadSizeRefusal('POST', '/api/media/file/x.jpg/y', h(String(limit + 1)))).toBeNull()
    expect(uploadSizeRefusal('PATCH', '/api/media/1', h(null, 'application/json'))).toBeNull()
  })
})
