// Typed, validated runtime configuration (contracts/configuration.md, FR-104, FR-105).
// Production refuses development substitutes, placeholders and missing secrets. Error messages
// name variables only; values are never echoed.
import path from 'node:path'
import { z } from 'zod'
import { routeVocabularyPending } from '../../i18n'

export type AppEnv = 'development' | 'test' | 'preview' | 'production'

export type ConfigIssue = { variable: string; reason: string }

export class ConfigError extends Error {
  readonly issues: ConfigIssue[]
  constructor(issues: ConfigIssue[]) {
    super(
      `Invalid configuration:\n${issues.map((i) => `  - ${i.variable}: ${i.reason}`).join('\n')}`,
    )
    this.name = 'ConfigError'
    this.issues = issues
  }
}

const PLACEHOLDER = /replace-with|change-me|placeholder|example-secret/i
const TURNSTILE_TEST_KEY = /^[123]x0{20,}AA$/

const optional = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v))

const rawSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'preview', 'production']).default('development'),
  SITE_URL: z.url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgres:// URL'),
  DATABASE_ALLOW_PUSH: z.enum(['true', 'false']).default('false'),
  PAYLOAD_SECRET: z.string().min(32, 'must be at least 32 bytes'),
  MFA_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, 'must be 64 hex characters (32 bytes)'),
  HEALTH_READY_TOKEN: z.string().min(16, 'must be at least 16 characters'),
  JOBS_SIGNING_SECRET: optional,
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  MEDIA_DIR: optional,
  S3_ENDPOINT: optional,
  S3_BUCKET: optional,
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  EMAIL_DRIVER: z.enum(['smtp', 'memory', 'resend']).default('smtp'),
  SMTP_URL: optional,
  EMAIL_FROM: optional,
  RESEND_API_KEY: optional,
  RATELIMIT_DRIVER: z.enum(['memory', 'postgres', 'upstash']).default('postgres'),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  CLIENT_IP_HEADER: optional.pipe(
    z
      .string()
      .regex(/^[a-z0-9-]{1,64}$/, 'lower-case header name')
      .optional(),
  ),
  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,
  JOBS_TRIGGER: z.enum(['local-runner', 'cron', 'qstash']).default('local-runner'),
  QSTASH_TOKEN: optional,
  QSTASH_CURRENT_SIGNING_KEY: optional,
  QSTASH_NEXT_SIGNING_KEY: optional,
  CAPTCHA_DRIVER: z.enum(['test', 'turnstile']).default('test'),
  TURNSTILE_SITE_KEY: optional,
  TURNSTILE_SECRET_KEY: optional,
  // ADR-007: first-party aggregate counter; off unless set (FR-086).
  ANALYTICS_DRIVER: z.enum(['none', 'counter']).default('none'),
  BOOTSTRAP_OWNER_EMAIL: optional.pipe(z.email().optional()),
})

type Raw = z.infer<typeof rawSchema>

const SECRET_VARS = [
  'PAYLOAD_SECRET',
  'MFA_ENCRYPTION_KEY',
  'HEALTH_READY_TOKEN',
  'JOBS_SIGNING_SECRET',
  'S3_SECRET_ACCESS_KEY',
  'RESEND_API_KEY',
  'UPSTASH_REDIS_REST_TOKEN',
  'QSTASH_TOKEN',
  'TURNSTILE_SECRET_KEY',
  'SMTP_URL',
] as const

function safeUrl(value: string): URL | undefined {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

const isLoopback = (host: string) =>
  host === 'localhost' || host === '[::1]' || host.startsWith('127.')

function lowEntropy(value: string): boolean {
  return new Set(value.toLowerCase()).size < 8
}

function crossChecks(raw: Raw): ConfigIssue[] {
  const issues: ConfigIssue[] = []
  const need = (variable: keyof Raw, when: string) => {
    if (!raw[variable]) issues.push({ variable, reason: `required when ${when}` })
  }

  if (raw.STORAGE_DRIVER === 's3') {
    for (const v of [
      'S3_ENDPOINT',
      'S3_BUCKET',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
    ] as const)
      need(v, 'STORAGE_DRIVER=s3')
  }
  if (raw.EMAIL_DRIVER === 'smtp') need('SMTP_URL', 'EMAIL_DRIVER=smtp')
  if (raw.EMAIL_DRIVER === 'resend') {
    need('RESEND_API_KEY', 'EMAIL_DRIVER=resend')
    need('EMAIL_FROM', 'EMAIL_DRIVER=resend')
  }
  if (raw.RATELIMIT_DRIVER === 'upstash') {
    need('UPSTASH_REDIS_REST_URL', 'RATELIMIT_DRIVER=upstash')
    need('UPSTASH_REDIS_REST_TOKEN', 'RATELIMIT_DRIVER=upstash')
  }
  if (raw.JOBS_TRIGGER === 'qstash') {
    for (const v of [
      'QSTASH_TOKEN',
      'QSTASH_CURRENT_SIGNING_KEY',
      'QSTASH_NEXT_SIGNING_KEY',
    ] as const)
      need(v, 'JOBS_TRIGGER=qstash')
  }
  if (raw.CAPTCHA_DRIVER === 'turnstile') {
    need('TURNSTILE_SITE_KEY', 'CAPTCHA_DRIVER=turnstile')
    need('TURNSTILE_SECRET_KEY', 'CAPTCHA_DRIVER=turnstile')
  }

  if (
    raw.APP_ENV !== 'development' &&
    raw.APP_ENV !== 'test' &&
    raw.DATABASE_ALLOW_PUSH === 'true'
  ) {
    issues.push({
      variable: 'DATABASE_ALLOW_PUSH',
      reason: 'schema push is only for throwaway local databases',
    })
  }

  if (raw.APP_ENV === 'production') {
    const devOnly: [keyof Raw, string][] = [
      ['STORAGE_DRIVER', 'local'],
      ['EMAIL_DRIVER', 'memory'],
      // ADR-009: serverless functions have no long-running process for the in-process runner.
      ['JOBS_TRIGGER', 'local-runner'],
      ['RATELIMIT_DRIVER', 'memory'],
      ['CAPTCHA_DRIVER', 'test'],
    ]
    for (const [variable, value] of devOnly) {
      if (raw[variable] === value)
        issues.push({
          variable,
          reason: `development substitute "${value}" is not allowed in production`,
        })
    }
    need('JOBS_SIGNING_SECRET', 'APP_ENV=production')
    if (raw.TRUSTED_PROXY_HOPS === 0 && !raw.CLIENT_IP_HEADER)
      issues.push({
        variable: 'TRUSTED_PROXY_HOPS',
        reason: 'set TRUSTED_PROXY_HOPS or CLIENT_IP_HEADER so rate limits are per client',
      })
    // ADR-009 email boundary: any provider's SMTP relay, but only over implicit TLS, with
    // credentials, to a non-local host (Mailpit and plaintext SMTP stay development-only).
    if (raw.EMAIL_DRIVER === 'smtp' && raw.SMTP_URL) {
      const u = safeUrl(raw.SMTP_URL)
      if (!u || u.protocol !== 'smtps:' || !u.username || !u.password || isLoopback(u.hostname))
        issues.push({
          variable: 'SMTP_URL',
          reason: 'production SMTP must be smtps:// with credentials to a non-local host',
        })
    }
    // ADR-009: the database (Neon) is reached over TLS; only a loopback host may omit it.
    {
      const u = safeUrl(raw.DATABASE_URL)
      const mode = u?.searchParams.get('sslmode')
      if (u && !isLoopback(u.hostname) && mode !== 'require' && mode !== 'verify-full')
        issues.push({
          variable: 'DATABASE_URL',
          reason: 'must set sslmode=require or verify-full in production',
        })
    }
    if (new URL(raw.SITE_URL).protocol !== 'https:')
      issues.push({ variable: 'SITE_URL', reason: 'must use https in production' })
    for (const v of ['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'] as const) {
      const value = raw[v]
      if (value && TURNSTILE_TEST_KEY.test(value))
        issues.push({ variable: v, reason: 'Turnstile test keys are not allowed in production' })
    }
    for (const v of SECRET_VARS) {
      const value = raw[v]
      if (!value) continue
      if (PLACEHOLDER.test(value)) issues.push({ variable: v, reason: 'placeholder value' })
      else if (lowEntropy(value))
        issues.push({ variable: v, reason: 'value has too little entropy' })
    }
  }
  return issues
}

function build(raw: Raw) {
  return {
    appEnv: raw.APP_ENV as AppEnv,
    siteUrl: raw.SITE_URL,
    logLevel: raw.LOG_LEVEL,
    database: { url: raw.DATABASE_URL, allowPush: raw.DATABASE_ALLOW_PUSH === 'true' },
    secrets: {
      payload: raw.PAYLOAD_SECRET,
      mfaEncryptionKey: raw.MFA_ENCRYPTION_KEY,
      healthReadyToken: raw.HEALTH_READY_TOKEN,
      jobsSigning: raw.JOBS_SIGNING_SECRET,
    },
    storage:
      raw.STORAGE_DRIVER === 's3'
        ? {
            driver: 's3' as const,
            endpoint: raw.S3_ENDPOINT!,
            bucket: raw.S3_BUCKET!,
            accessKeyId: raw.S3_ACCESS_KEY_ID!,
            secretAccessKey: raw.S3_SECRET_ACCESS_KEY!,
          }
        : { driver: 'local' as const, dir: path.resolve(raw.MEDIA_DIR || 'media') },
    email: {
      driver: raw.EMAIL_DRIVER,
      from: raw.EMAIL_FROM ?? 'no-reply@localhost',
      smtpUrl: raw.SMTP_URL,
      resendApiKey: raw.RESEND_API_KEY,
    },
    rateLimit: {
      driver: raw.RATELIMIT_DRIVER,
      upstashUrl: raw.UPSTASH_REDIS_REST_URL,
      upstashToken: raw.UPSTASH_REDIS_REST_TOKEN,
      trustedProxyHops: raw.TRUSTED_PROXY_HOPS,
      clientIpHeader: raw.CLIENT_IP_HEADER,
    },
    jobs: { trigger: raw.JOBS_TRIGGER },
    captcha: {
      driver: raw.CAPTCHA_DRIVER,
      siteKey: raw.TURNSTILE_SITE_KEY,
      secretKey: raw.TURNSTILE_SECRET_KEY,
    },
    analytics: { driver: raw.ANALYTICS_DRIVER },
    bootstrapOwnerEmail: raw.BOOTSTRAP_OWNER_EMAIL,
  }
}

export type AppConfig = Readonly<ReturnType<typeof build>>

function deepFreeze<T>(obj: T): T {
  for (const value of Object.values(obj as object)) {
    if (value && typeof value === 'object') deepFreeze(value)
  }
  return Object.freeze(obj)
}

export type EnvSource = Record<string, string | undefined>

export type ConfigGates = {
  /** CD-13: production refuses to start while the Arabic route vocabulary is a placeholder. */
  routeVocabularyPending: () => boolean
}
const DEFAULT_GATES: ConfigGates = { routeVocabularyPending }

export function loadConfig(
  env: EnvSource = process.env,
  gates: ConfigGates = DEFAULT_GATES,
): AppConfig {
  const parsed = rawSchema.safeParse(env)
  if (!parsed.success) {
    throw new ConfigError(
      parsed.error.issues.map((i) => ({
        variable: String(i.path[0] ?? 'unknown'),
        reason: i.code === 'invalid_type' ? 'missing or invalid' : i.message,
      })),
    )
  }
  const issues = crossChecks(parsed.data)
  if (parsed.data.APP_ENV === 'production' && gates.routeVocabularyPending())
    issues.push({
      variable: 'ROUTE_VOCABULARY',
      reason: 'Arabic route vocabulary is not approved (CD-13 publication gate)',
    })
  if (issues.length) throw new ConfigError(issues)
  return deepFreeze(build(parsed.data))
}

let cached: AppConfig | undefined

/** Process-wide configuration, validated once on first use. */
export function getConfig(): AppConfig {
  cached ??= loadConfig(process.env)
  return cached
}
