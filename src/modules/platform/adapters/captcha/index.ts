// Bot-challenge port (D-15, FR-072). `test` reproduces Cloudflare Turnstile's documented test
// secrets offline; `turnstile` calls Cloudflare's siteverify (turnstile.ts).
export type CaptchaResult = {
  success: boolean
  errorCodes: string[]
  /** The challenge service could not be reached or answered abnormally: fail closed (503). */
  unavailable?: boolean
}

export type CaptchaContext = {
  remoteIp?: string
  /** Must equal the widget's `action` (Turnstile returns it with the result). */
  expectedAction?: string
  /** Must equal the hostname the widget ran on. */
  expectedHostname?: string
}

export interface CaptchaVerifier {
  verify(token: string, context?: CaptchaContext): Promise<CaptchaResult>
}

const TEST_SECRETS: Record<string, CaptchaResult> = {
  '1x0000000000000000000000000000000AA': { success: true, errorCodes: [] },
  '2x0000000000000000000000000000000AA': { success: false, errorCodes: ['invalid-input-response'] },
  '3x0000000000000000000000000000000AA': { success: false, errorCodes: ['timeout-or-duplicate'] },
}

/**
 * Test driver. The secret selects Cloudflare's documented behaviour (always pass / always fail /
 * always duplicate). With the always-pass secret, test tokens can request the other outcomes, so
 * one running server can exercise every path: `test-fail…` (failed challenge), `test-expired…`
 * (timeout-or-duplicate), `test-unavailable…` (service down). Any token is single use, as with
 * Turnstile. Production refuses the test secrets (configuration).
 */
export function createTestCaptcha(secretKey: string | undefined): CaptchaVerifier {
  const used = new Set<string>()
  return {
    async verify(token) {
      if (!token) return { success: false, errorCodes: ['missing-input-response'] }
      const base = TEST_SECRETS[secretKey ?? ''] ?? {
        success: false,
        errorCodes: ['invalid-input-secret'],
      }
      if (!base.success) return base
      if (token.startsWith('test-unavailable'))
        return { success: false, errorCodes: ['internal-error'], unavailable: true }
      if (token.startsWith('test-fail'))
        return { success: false, errorCodes: ['invalid-input-response'] }
      if (token.startsWith('test-expired') || used.has(token))
        return { success: false, errorCodes: ['timeout-or-duplicate'] }
      used.add(token)
      return base
    },
  }
}
