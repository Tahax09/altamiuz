import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig, type EnvSource } from '@/modules/platform/config'

const SECRET = 'a3f9c2e17b6d4f08a1c5e9b2d7f3a6c4e8b1d5f9a2c6e0b4d8f2a7c1e5b9d3f6' // gitleaks:allow (synthetic test fixture)
const MFA_KEY = '9f1e3c5a7b2d4f6e8a0c1b3d5f7e9a2c4b6d8f0e1a3c5b7d9f2e4a6c8b0d1f3e' // gitleaks:allow (synthetic test fixture)

const devEnv = (): EnvSource => ({
  APP_ENV: 'development',
  SITE_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgres://altamiuz:pw@127.0.0.1:54320/altamiuz',
  PAYLOAD_SECRET: SECRET,
  MFA_ENCRYPTION_KEY: MFA_KEY,
  HEALTH_READY_TOKEN: 'b7e2c9d4a1f6e3b8c5d2a9f4', // gitleaks:allow (synthetic test fixture)
  STORAGE_DRIVER: 'local',
  EMAIL_DRIVER: 'smtp',
  SMTP_URL: 'smtp://127.0.0.1:1025',
  EMAIL_FROM: 'no-reply@localhost',
  RATELIMIT_DRIVER: 'postgres',
  JOBS_TRIGGER: 'local-runner',
  CAPTCHA_DRIVER: 'test',
  TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
  ANALYTICS_DRIVER: 'none',
})

const prodEnv = (): EnvSource => ({
  APP_ENV: 'production',
  SITE_URL: 'https://www.altamiuz.example',
  DATABASE_URL: 'postgres://app:Zq8vT2mL9xR4@db.internal:5432/altamiuz',
  PAYLOAD_SECRET: SECRET,
  MFA_ENCRYPTION_KEY: MFA_KEY,
  HEALTH_READY_TOKEN: 'b7e2c9d4a1f6e3b8c5d2a9f4', // gitleaks:allow (synthetic test fixture)
  JOBS_SIGNING_SECRET: 'e4b8d1f7a3c9e2b6d0f5a8c1', // gitleaks:allow (synthetic test fixture)
  STORAGE_DRIVER: 's3',
  S3_ENDPOINT: 'https://storage.internal',
  S3_BUCKET: 'altamiuz-media',
  S3_ACCESS_KEY_ID: 'AKX7Q2M9P4R8T1V6',
  S3_SECRET_ACCESS_KEY: 'q7Lm2Vx9Rt4Kp8Wz1Ny5Hb3Jc6Fd0Gs', // gitleaks:allow (synthetic test fixture)
  EMAIL_DRIVER: 'resend',
  RESEND_API_KEY: 'rk_9Xv2Lm7Qp4Tz8Wn1Ry5Kb3', // gitleaks:allow (synthetic test fixture)
  EMAIL_FROM: 'no-reply@altamiuz.example',
  RATELIMIT_DRIVER: 'postgres',
  JOBS_TRIGGER: 'cron',
  CAPTCHA_DRIVER: 'turnstile',
  TURNSTILE_SITE_KEY: '0x4AAAAAAAB7cDeFgHiJkLmN',
  TURNSTILE_SECRET_KEY: '0x4AAAAAAAB7cDeFgHiJkLmNoPqRsTuVwXyZ',
  ANALYTICS_DRIVER: 'none',
  LOG_LEVEL: 'info',
  TRUSTED_PROXY_HOPS: '1',
})

const errorFor = (env: EnvSource): ConfigError => {
  try {
    loadConfig(env)
  } catch (e) {
    if (e instanceof ConfigError) return e
    throw e
  }
  throw new Error('expected loadConfig to throw ConfigError')
}

describe('loadConfig — development', () => {
  it('accepts local substitutes outside production', () => {
    const cfg = loadConfig(devEnv())
    expect(cfg.appEnv).toBe('development')
    expect(cfg.storage.driver).toBe('local')
    expect(cfg.captcha.driver).toBe('test')
  })

  it('returns a frozen object', () => {
    expect(Object.isFrozen(loadConfig(devEnv()))).toBe(true)
  })

  it('rejects a missing DATABASE_URL even in development', () => {
    const env = devEnv()
    delete env.DATABASE_URL
    expect(errorFor(env).issues.map((i) => i.variable)).toContain('DATABASE_URL')
  })

  it('rejects an unknown driver value', () => {
    expect(errorFor({ ...devEnv(), STORAGE_DRIVER: 'ftp' }).issues[0]?.variable).toBe(
      'STORAGE_DRIVER',
    )
  })
})

describe('loadConfig — production refuses unsafe configuration (FR-105)', () => {
  const approved = { routeVocabularyPending: () => false }
  it('accepts a complete production configuration once CD-13 is approved', () => {
    expect(loadConfig(prodEnv(), approved).appEnv).toBe('production')
  })

  it('refuses production while the Arabic route vocabulary is a placeholder (CD-13)', () => {
    expect(() => loadConfig(prodEnv())).toThrow(/ROUTE_VOCABULARY/)
    expect(() => loadConfig(prodEnv(), { routeVocabularyPending: () => true })).toThrow(
      /ROUTE_VOCABULARY/,
    )
  })

  it.each([
    ['STORAGE_DRIVER', 'local'],
    ['EMAIL_DRIVER', 'smtp'],
    ['EMAIL_DRIVER', 'memory'],
    ['RATELIMIT_DRIVER', 'memory'],
    ['CAPTCHA_DRIVER', 'test'],
  ])('rejects development substitute %s=%s', (variable, value) => {
    const issues = errorFor({ ...prodEnv(), [variable]: value }).issues
    expect(issues.some((i) => i.variable === variable)).toBe(true)
  })

  it.each(['1x0000000000000000000000000000000AA', '2x0000000000000000000000000000000AA'])(
    'rejects Turnstile test secret %s',
    (secret) => {
      const issues = errorFor({ ...prodEnv(), TURNSTILE_SECRET_KEY: secret }).issues
      expect(issues.some((i) => i.variable === 'TURNSTILE_SECRET_KEY')).toBe(true)
    },
  )

  it.each([
    'PAYLOAD_SECRET',
    'MFA_ENCRYPTION_KEY',
    'HEALTH_READY_TOKEN',
    'JOBS_SIGNING_SECRET',
    'S3_SECRET_ACCESS_KEY',
    'RESEND_API_KEY',
  ])('rejects a missing %s', (variable) => {
    const env = prodEnv()
    delete env[variable]
    expect(errorFor(env).issues.some((i) => i.variable === variable)).toBe(true)
  })

  it.each([
    ['PAYLOAD_SECRET', 'replace-with-32-plus-random-bytes-placeholder-value'],
    ['HEALTH_READY_TOKEN', 'change-me-local-only-token'],
    ['RESEND_API_KEY', 'replace-with-key'],
  ])('rejects placeholder value for %s', (variable, value) => {
    expect(
      errorFor({ ...prodEnv(), [variable]: value }).issues.some((i) => i.variable === variable),
    ).toBe(true)
  })

  it('rejects PAYLOAD_SECRET shorter than 32 bytes', () => {
    expect(errorFor({ ...prodEnv(), PAYLOAD_SECRET: 'short-secret' }).issues[0]?.variable).toBe(
      'PAYLOAD_SECRET',
    )
  })

  it.each([
    ['too short', 'abcd'],
    ['not hex', 'z'.repeat(64)],
    ['low entropy', '0'.repeat(64)],
  ])('rejects MFA_ENCRYPTION_KEY that is %s', (_label, value) => {
    expect(
      errorFor({ ...prodEnv(), MFA_ENCRYPTION_KEY: value }).issues.some(
        (i) => i.variable === 'MFA_ENCRYPTION_KEY',
      ),
    ).toBe(true)
  })

  it('rejects schema push in production', () => {
    expect(
      errorFor({ ...prodEnv(), DATABASE_ALLOW_PUSH: 'true' }).issues.some(
        (i) => i.variable === 'DATABASE_ALLOW_PUSH',
      ),
    ).toBe(true)
  })

  it('requires a trusted client-IP source so limits are per client', () => {
    expect(
      errorFor({ ...prodEnv(), TRUSTED_PROXY_HOPS: '0' }).issues.some(
        (i) => i.variable === 'TRUSTED_PROXY_HOPS',
      ),
    ).toBe(true)
    expect(
      loadConfig(
        { ...prodEnv(), TRUSTED_PROXY_HOPS: '0', CLIENT_IP_HEADER: 'cf-connecting-ip' },
        { routeVocabularyPending: () => false },
      ).rateLimit.clientIpHeader,
    ).toBe('cf-connecting-ip')
  })

  it.each(['9', '-1', 'abc'])('rejects TRUSTED_PROXY_HOPS=%s', (v) => {
    expect(
      errorFor({ ...prodEnv(), TRUSTED_PROXY_HOPS: v }).issues.some(
        (i) => i.variable === 'TRUSTED_PROXY_HOPS',
      ),
    ).toBe(true)
  })

  it('rejects a non-https SITE_URL', () => {
    expect(
      errorFor({ ...prodEnv(), SITE_URL: 'http://www.altamiuz.example' }).issues.some(
        (i) => i.variable === 'SITE_URL',
      ),
    ).toBe(true)
  })

  it('rejects s3 storage without bucket credentials', () => {
    const env = prodEnv()
    delete env.S3_BUCKET
    expect(errorFor(env).issues.some((i) => i.variable === 'S3_BUCKET')).toBe(true)
  })

  it('never includes secret values in the error message', () => {
    const leaked = 'replace-with-this-should-never-appear-in-errors'
    const err = errorFor({ ...prodEnv(), PAYLOAD_SECRET: leaked, STORAGE_DRIVER: 'local' })
    expect(err.message).not.toContain(leaked)
    expect(err.message).not.toContain(SECRET)
    expect(JSON.stringify(err.issues)).not.toContain(leaked)
  })

  it('reports every problem at once', () => {
    const err = errorFor({ ...prodEnv(), STORAGE_DRIVER: 'local', CAPTCHA_DRIVER: 'test' })
    expect(err.issues.length).toBeGreaterThanOrEqual(2)
  })
})
