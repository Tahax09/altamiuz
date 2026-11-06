// Redirect path normalisation (D-13, FR-064, FR-065): percent-decoded, NFC, no trailing slash
// (except "/"), no query or fragment. Stored `from` values and incoming request paths go through
// the same function, so `/about/`, `/about` and `/%D8%A7` style legacy URLs match one entry.
// Anything that is not a single-`/` site path after decoding is refused (null).

const MAX = 512

export function normaliseSitePath(input: unknown): string | null {
  if (typeof input !== 'string' || !input || input.length > MAX * 3) return null
  let p = input.trim()
  const cut = p.search(/[?#]/)
  if (cut >= 0) p = p.slice(0, cut)
  let decoded: string
  try {
    decoded = decodeURIComponent(p)
  } catch {
    return null // malformed percent-encoding
  }
  decoded = decoded.normalize('NFC')
  // Single leading slash; no backslashes (browsers treat `/\host` as `//host`), whitespace,
  // control characters or dot segments.
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  if (/[\\\s\u0000-\u001f\u007f]/.test(decoded)) return null
  if (decoded.split('/').some((s) => s === '.' || s === '..')) return null
  if (/\/{2,}/.test(decoded)) return null
  const out = decoded.length > 1 ? decoded.replace(/\/+$/, '') : decoded
  return out.length <= MAX ? out : null
}
