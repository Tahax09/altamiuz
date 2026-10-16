// Structured JSON logging with redaction (FR-101, D-19). Secrets, session identifiers and
// enquiry content never reach log output.
import pino, { type DestinationStream, type Level, type Logger } from 'pino'

export const REDACTED = '[REDACTED]'

const SENSITIVE_KEYS = [
  'password',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'totp',
  'otp',
  'code',
  'recoveryCode',
  'recoveryCodes',
  'sessionId',
  'session',
]

const paths = [
  ...SENSITIVE_KEYS,
  ...SENSITIVE_KEYS.map((k) => `*.${k}`),
  ...SENSITIVE_KEYS.map((k) => `*.*.${k}`),
  'headers.authorization',
  'headers.cookie',
  'headers["set-cookie"]',
  '*.headers.authorization',
  '*.headers.cookie',
  '*.headers["set-cookie"]',
  'enquiry.message',
  'enquiry.email',
  'enquiry.phone',
  'enquiry.name',
  'enquiry.organization',
]

export type CreateLoggerOptions = {
  level?: Level
  destination?: DestinationStream
}

export function createLogger({ level = 'info', destination }: CreateLoggerOptions = {}): Logger {
  return pino(
    {
      level,
      redact: { paths, censor: REDACTED },
      formatters: { level: (label) => ({ level: label }) },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: undefined,
    },
    destination,
  )
}

export type { Logger }
