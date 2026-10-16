// Bot-challenge port (D-15, FR-072). The `test` driver reproduces Cloudflare Turnstile's
// documented test secrets without any network call. Real verification arrives in T124.
export type CaptchaResult = { success: boolean; errorCodes: string[] }

export interface CaptchaVerifier {
  verify(
    token: string,
    context?: { remoteIp?: string; expectedAction?: string },
  ): Promise<CaptchaResult>
}

const TEST_SECRETS: Record<string, CaptchaResult> = {
  '1x0000000000000000000000000000000AA': { success: true, errorCodes: [] },
  '2x0000000000000000000000000000000AA': { success: false, errorCodes: ['invalid-input-response'] },
  '3x0000000000000000000000000000000AA': { success: false, errorCodes: ['timeout-or-duplicate'] },
}

export function createTestCaptcha(secretKey: string | undefined): CaptchaVerifier {
  return {
    async verify(token) {
      if (!token) return { success: false, errorCodes: ['missing-input-response'] }
      return (
        TEST_SECRETS[secretKey ?? ''] ?? { success: false, errorCodes: ['invalid-input-secret'] }
      )
    },
  }
}
