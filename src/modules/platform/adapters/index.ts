// Adapter factories: each port selects its implementation from validated configuration.
// Production adapters (s3, resend, postgres/upstash limiter, Payload/QStash jobs, Turnstile,
// analytics provider) are added in the phases that first need them.
import path from 'node:path'
import { noAnalytics, type Analytics } from './analytics'
import { createTestCaptcha, type CaptchaVerifier } from './captcha'
import { createEmail, type EmailAdapter, type EmailConfig } from './email'
import { createMemoryJobQueue, type JobQueue } from './jobs'
import { createMemoryRateLimiter, type RateLimiter } from './ratelimit'
import { createLocalStorage, type StorageAdapter } from './storage'

export { EmailValidationError } from './email'
export { StorageKeyError } from './storage'
export type { Analytics, CaptchaVerifier, EmailAdapter, JobQueue, RateLimiter, StorageAdapter }

class NotYetImplemented extends Error {
  constructor(port: string, driver: string) {
    super(`${port} driver "${driver}" is not implemented yet`)
  }
}

export function createStorage(
  cfg: { driver: string },
  opts: { root?: string } = {},
): StorageAdapter {
  if (cfg.driver === 'local') return createLocalStorage(opts.root ?? path.resolve('media'))
  throw new NotYetImplemented('storage', cfg.driver)
}

export function createEmailAdapter(
  cfg: EmailConfig | { driver: string; from: string },
): EmailAdapter {
  if (cfg.driver === 'memory' || cfg.driver === 'smtp') return createEmail(cfg as EmailConfig)
  throw new NotYetImplemented('email', cfg.driver)
}

export function createRateLimiter(
  cfg: { driver: string },
  opts: { now?: () => number } = {},
): RateLimiter {
  if (cfg.driver === 'memory') return createMemoryRateLimiter(opts.now)
  throw new NotYetImplemented('rate limit', cfg.driver)
}

export function createJobQueue(cfg: { trigger: string }): JobQueue {
  if (cfg.trigger === 'memory') return createMemoryJobQueue()
  throw new NotYetImplemented('jobs', cfg.trigger)
}

export function createCaptchaVerifier(cfg: {
  driver: string
  secretKey?: string
}): CaptchaVerifier {
  if (cfg.driver === 'test') return createTestCaptcha(cfg.secretKey)
  throw new NotYetImplemented('captcha', cfg.driver)
}

export function createAnalytics(cfg: { driver: string }): Analytics {
  if (cfg.driver === 'none') return noAnalytics
  throw new NotYetImplemented('analytics', cfg.driver)
}
