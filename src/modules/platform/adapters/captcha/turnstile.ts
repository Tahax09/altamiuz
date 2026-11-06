// Cloudflare Turnstile server verification (T124, FR-072, D-15). Every check fails closed:
// a missing, failed, expired or reused token, a result for another hostname or action, and any
// network error, timeout or malformed answer. The secret and the token never reach logs.
import type { CaptchaContext, CaptchaResult, CaptchaVerifier } from './index'

export const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 5_000

type Siteverify = {
  success?: unknown
  'error-codes'?: unknown
  hostname?: unknown
  action?: unknown
}

export function createTurnstile(
  secretKey: string,
  opts: { fetch?: typeof fetch; timeoutMs?: number } = {},
): CaptchaVerifier {
  const doFetch = opts.fetch ?? fetch
  return {
    async verify(token: string, ctx: CaptchaContext = {}): Promise<CaptchaResult> {
      if (!token) return { success: false, errorCodes: ['missing-input-response'] }
      if (token.length > 2048) return { success: false, errorCodes: ['invalid-input-response'] }
      const body = new URLSearchParams({ secret: secretKey, response: token })
      if (ctx.remoteIp) body.set('remoteip', ctx.remoteIp)
      let data: Siteverify
      try {
        const res = await doFetch(SITEVERIFY_URL, {
          method: 'POST',
          body,
          signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS),
          redirect: 'error',
        })
        if (!res.ok)
          return { success: false, errorCodes: ['http-' + res.status], unavailable: true }
        data = (await res.json()) as Siteverify
      } catch {
        return { success: false, errorCodes: ['network'], unavailable: true }
      }
      if (!data || typeof data !== 'object' || typeof data.success !== 'boolean')
        return { success: false, errorCodes: ['malformed'], unavailable: true }
      const codes = Array.isArray(data['error-codes'])
        ? data['error-codes'].filter((c): c is string => typeof c === 'string').slice(0, 5)
        : []
      if (codes.includes('internal-error'))
        return { success: false, errorCodes: codes, unavailable: true }
      if (!data.success) return { success: false, errorCodes: codes }
      if (ctx.expectedHostname && data.hostname !== ctx.expectedHostname)
        return { success: false, errorCodes: ['hostname-mismatch'] }
      if (ctx.expectedAction && data.action !== ctx.expectedAction)
        return { success: false, errorCodes: ['action-mismatch'] }
      return { success: true, errorCodes: [] }
    },
  }
}
