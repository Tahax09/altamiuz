# Contract: Configuration and Service Adapters

`.env.example` contains only placeholders. `modules/platform/config` validates the environment
at startup. When `APP_ENV=production`, any `*_DRIVER` set to a development substitute, any
missing secret, or any placeholder value causes the app to **refuse to start** (FR-105).

| Variable | Purpose | Local default | Production |
|---|---|---|---|
| `APP_ENV` | `development` / `test` / `preview` / `production` | `development` | `production` |
| `SITE_URL` | canonical origin | `http://localhost:3000` | required |
| `DATABASE_URL` | Postgres | Docker Compose service | required |
| `DATABASE_ALLOW_PUSH` | Payload schema push (throwaway DBs only) | `false` | must be `false` (refused otherwise; also refused in `preview`) |
| `POSTGRES_DEV_PASSWORD` | password for the local compose Postgres | random, `.env.local` only | — |
| `PAYLOAD_SECRET` | Payload signing secret | generated locally, never committed | required (≥32 bytes) |
| `MFA_ENCRYPTION_KEY` | TOTP secret encryption | generated locally | required (32 bytes) |
| `STORAGE_DRIVER` | `local` / `s3` | `local` | `s3` (R2, proposed) |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | object storage | — | required if `s3` |
| `EMAIL_DRIVER` | `smtp` / `memory` / `resend` | `smtp` (Mailpit) | `resend` (proposed) |
| `SMTP_URL` | local SMTP | `smtp://localhost:1025` | — |
| `RESEND_API_KEY`, `EMAIL_FROM` | email | — | required if `resend` |
| `RATELIMIT_DRIVER` | `memory` / `postgres` / `upstash` | `postgres` | `postgres` or `upstash` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis | — | required if `upstash` |
| `JOBS_TRIGGER` | `local-runner` / `cron` / `qstash` | `local-runner` | decided with hosting |
| `JOBS_SIGNING_SECRET` / `QSTASH_*` | job endpoint auth | generated locally | required |
| `CAPTCHA_DRIVER` | `test` / `turnstile` | `test` (emulates Cloudflare test secrets offline) | `turnstile` |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | bot challenge | Cloudflare official test keys | required, real keys (test keys refused) |
| `ANALYTICS_DRIVER` | `none` / provider (R-F) | `none` | to be decided |
| `LOG_LEVEL` | pino level | `debug` | `info` |
| `HEALTH_READY_TOKEN` | readiness probe | generated locally | required |
| `BOOTSTRAP_OWNER_EMAIL` | one-time first-owner setup (FR-030) | unset | set only for the bootstrap run, then removed |

Local services (`docker-compose.dev.yml`): `postgres:17` on `127.0.0.1:54320` and `axllent/mailpit:v1.27` (SMTP `1025`, UI `8025`). No paid accounts.
Test runs use `memory` email and rate limit, Turnstile test keys, and a disposable database.
