// Shared service singletons for the auth module: mailer and rate limiter.
import type { Payload } from 'payload'
import {
  createEmailAdapter,
  createPostgresRateLimiter,
  getConfig,
  type EmailAdapter,
  type RateLimiter,
} from '../platform'
import { deriveKey } from './crypto'
import { poolOf } from './db'

let mailer: EmailAdapter | undefined
export function getMailer(): EmailAdapter {
  if (!mailer) {
    const cfg = getConfig()
    mailer = createEmailAdapter({
      driver: cfg.email.driver,
      from: cfg.email.from,
      smtpUrl: cfg.email.smtpUrl ?? '',
    } as never)
  }
  return mailer
}

let limiter: RateLimiter | undefined
export function getLimiter(payload: Payload): RateLimiter {
  if (!limiter) {
    const cfg = getConfig()
    limiter = createPostgresRateLimiter({
      pool: poolOf(payload),
      hashSecret: deriveKey(cfg.secrets.payload, 'rate-limit-v1').toString('hex'),
      onError: (e) =>
        payload.logger.error({ err: e.name }, 'rate limiter failure (request denied)'),
    })
  }
  return limiter
}

/** Test hook: replace the limiter (e.g. to simulate a database failure). */
export function setLimiterForTests(l: RateLimiter | undefined) {
  limiter = l
}
