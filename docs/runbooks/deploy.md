# Runbook: Deploy (FR-103, ADR-009)

Production = Vercel (Pro) + Neon + Cloudflare R2. Nobody deploys from a laptop: production is
promoted from a verified preview deployment of `main`.

## Before the first production deployment (owner actions, all required)

| #    | Action                                                                                                                                                                                                                                                                                           | Blocks          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| O-1  | Vercel Pro team and project (commercial use; per-minute cron). Function region next to the Neon region.                                                                                                                                                                                          | everything      |
| O-2  | Neon project: production branch, app role (pooled URL → `DATABASE_URL`, with `sslmode=require`), migration role (direct URL), read-only backup role (direct URL → backup workflow).                                                                                                              | everything      |
| O-3  | Approve `@payloadcms/storage-s3` (new dependency) so the R2 media adapter can be built; create the R2 media bucket and a scoped read/write token for the app, a read-only token for backups. Production cannot boot without it (`STORAGE_DRIVER=local` is refused, `s3` is not implemented yet). | boot            |
| O-4  | Decide uploads above 4.5 MB (Vercel request limit) vs A-7's 20 MB: direct-to-R2 uploads in the adapter, or lower A-7.                                                                                                                                                                            | large uploads   |
| O-5  | Decide whether Cloudflare proxies the site. Without it: `CLIENT_IP_HEADER=x-real-ip`. With it: a separate origin-lock decision.                                                                                                                                                                  | rate limits     |
| O-6  | Email provider with an SMTP relay over implicit TLS (`SMTP_URL=smtps://…:465`), verified sending domain with SPF, DKIM and DMARC; `EMAIL_FROM` on that domain. Confirm outbound 465 from Vercel Functions on the preview, then re-run the SC-010 measurement there.                              | enquiries       |
| O-7  | Confirm encryption at rest in the Neon and R2 consoles/documentation for the chosen plan and record it in docs/security/TM-ops.md.                                                                                                                                                               | launch sign-off |
| O-8  | Production Turnstile widget for the production hostname: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (test keys are refused).                                                                                                                                                                   | enquiries       |
| O-9  | Monitoring account (any external uptime service with keyword checks, bearer headers and heartbeat monitors), the human alert recipient(s) and an escalation contact (docs/runbooks/monitoring.md).                                                                                               | SC-015, alerts  |
| O-10 | Backup bucket separate from the media bucket (preferably another account), 30-day lifecycle rule, write-only token; age key pair generated offline, private key stored by two people; GitHub secrets/variables in `.github/workflows/backup.yml`, then `BACKUP_ENABLED=true`.                    | FR-102          |

## Environment (Vercel → Project → Environment Variables, Production scope)

All of `.env.example` with real values, plus `CRON_SECRET` = the same value as
`JOBS_SIGNING_SECRET`. `APP_ENV=production`, `JOBS_TRIGGER=cron`, `RATELIMIT_DRIVER=postgres`,
`CAPTCHA_DRIVER=turnstile`, `EMAIL_DRIVER=smtp`, `STORAGE_DRIVER=s3`. The app refuses to start on a
placeholder, test key, plaintext SMTP, non-TLS database or in-process job runner and names the
variable (values are never printed).

## Every deployment

1. CI green on the commit (typecheck, lint, format, unit, integration, migrations, build, smoke,
   security, a11y, Lighthouse, audit, secret scan).
2. Preview deployment of the commit (Vercel builds it); preview has its own Neon branch.
3. If the commit adds migrations: docs/runbooks/migration.md against production **first**
   (expand-only migrations keep the running version working).
4. Check the preview: `curl -fsS -H "authorization: Bearer $HEALTH_READY_TOKEN" https://<preview>/api/health/ready`
   → `{"status":"ready",…}`; open the home page in both languages; submit one test enquiry.
5. Promote the preview to production (Vercel → Deployments → Promote). Note the previous
   production deployment id for rollback.
6. Within 5 minutes: readiness `ready`, monitors green, `/api/jobs/run` cron entries 200 in the
   Vercel cron log.
