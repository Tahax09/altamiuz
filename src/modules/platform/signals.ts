// Operational signals (FR-100, FR-101, T133): abuse and failure events as structured JSON log lines
// on stdout, where the host's log pipeline (Vercel log drain, ADR-009) picks them up for
// monitoring and alerting. Each signal has a fixed, allow-listed set of primitive fields, so no
// identifier, address, submitted value or secret can reach a signal line; the logger's redaction
// is a second layer. Emitting never throws: a broken log sink must not fail the request or job
// that raised the signal (the database-backed readiness checks remain the alert of last resort).
import type { DestinationStream, Level } from 'pino'
import { createLogger, type Logger } from './logger'

type Field = string | number | boolean | null

/** Signal name → allowed field names. */
export const OPS_SIGNALS = {
  'auth.login_failure': ['reason'],
  'auth.lockout': [],
  'ratelimit.hit': ['scope'],
  'upload.rejected': ['reason'],
  'captcha.failure': ['scope'],
  'captcha.unavailable': ['scope'],
  'enquiry.delivery_failed': ['enquiry', 'attempts', 'reason'],
} as const satisfies Record<string, readonly string[]>

export type OpsSignal = keyof typeof OPS_SIGNALS

/** Signals that need a person to act; they carry `alert: true` and log at error level. */
const ALERTS: ReadonlySet<OpsSignal> = new Set(['enquiry.delivery_failed'])

let logger: Logger | undefined
function signalLogger(): Logger {
  logger ??= createLogger({ level: (process.env.LOG_LEVEL as Level | undefined) ?? 'info' })
  return logger
}

/** Test hook: route signals to a capture stream (or back to stdout with `undefined`). */
export function setSignalDestinationForTests(destination: DestinationStream | undefined) {
  logger = destination ? createLogger({ level: 'trace', destination }) : undefined
}

export function emitSignal(name: OpsSignal, fields: Record<string, Field> = {}): void {
  try {
    const allowed: readonly string[] = OPS_SIGNALS[name]
    const safe: Record<string, Field> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (!allowed.includes(k)) continue
      if (v !== null && !['string', 'number', 'boolean'].includes(typeof v)) continue
      safe[k] = typeof v === 'string' ? v.slice(0, 64) : v
    }
    const alert = ALERTS.has(name)
    const line = { signal: name, ...(alert ? { alert: true } : {}), ...safe }
    if (alert) signalLogger().error(line, name)
    else signalLogger().warn(line, name)
  } catch {
    // Never let monitoring break the operation it observes.
  }
}
