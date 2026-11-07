# Runbook: Monitoring and alert routing (FR-100, FR-101, SC-010, SC-015, T136, ADR-009)

## Signals the application provides

| Source                                       | What                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/health`                            | Liveness: `200 {"status":"ok"}`, nothing else.                                                                                                                                                                                                                                                                                                   |
| `GET /api/health/ready` (bearer token)       | `200 ready` / `503 unavailable` (database or storage failed) / `503 degraded` (email adapter or enquiry delivery failed), with per-check `ok`/`fail`. Each check is capped at 3 s.                                                                                                                                                               |
| Signal lines on stdout (JSON, one per event) | `signal` = `auth.login_failure` (`reason`), `auth.lockout`, `ratelimit.hit` (`scope`), `captcha.failure` / `captcha.unavailable` (`scope`), `upload.rejected` (`reason`): level `warn`. `enquiry.delivery_failed` (`enquiry` id, `attempts`, `reason`): level `error`, `alert: true`. No IPs, addresses, account ids or submitted text (FR-101). |
| Vercel cron log                              | `/api/jobs/run` every minute, `/api/jobs/retention` daily: a 401 means `CRON_SECRET` ≠ `JOBS_SIGNING_SECRET`.                                                                                                                                                                                                                                    |
| Backup heartbeat                             | `.github/workflows/backup.yml` pings the heartbeat URL after a successful upload.                                                                                                                                                                                                                                                                |

## Monitors to configure (owner action O-9; any external uptime service)

| Monitor             | Target                                                                                                                     | Interval | Alert when                                                                             | Purpose                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| M1 Public site      | `GET https://<site>/ar` and `/en`, expect 200 and a fixed text from the footer                                             | 1 min    | 2 consecutive failures, from ≥2 regions                                                | SC-015 availability (the measured number)  |
| M2 Readiness        | `GET https://<site>/api/health/ready` with `Authorization: Bearer <HEALTH_READY_TOKEN>`, expect 200 and `"status":"ready"` | 5 min    | 2 consecutive failures                                                                 | database, storage, email, enquiry delivery |
| M3 Backup heartbeat | heartbeat URL used by the backup workflow                                                                                  | —        | no ping for 26 h                                                                       | FR-102 / A-10 RPO                          |
| M4 Abuse spikes     | Vercel log drain → log service query on `signal`                                                                           | 15 min   | e.g. > 50 `auth.login_failure` or > 200 `ratelimit.hit` per 15 min (tune after launch) | FR-100 abuse signals                       |
| M5 Delivery alert   | Vercel log drain → any line with `"alert":true`                                                                            | instant  | any                                                                                    | faster than M2 for enquiry email failures  |

M2 is the alert of record for enquiry delivery: it reads the database, so it fires even when the
email provider or the log drain is the failing part. M4/M5 need a log drain (Vercel Pro) and a log
service; until then M1–M3 still cover availability, delivery and backups.

**Alert routing**: every monitor notifies the human alert recipient(s) named by the owner by
email **and** a second channel that does not depend on the site's email provider (SMS or a chat
app), then the escalation contact after 30 minutes unacknowledged. The recipient list is kept in
the monitoring service, not in this repository. The monitoring service's own failure (it stops
checking) is covered by its status page and a monthly test alert (below).

## Availability measurement (SC-015)

Monthly availability = 1 − (minutes M1 failed from ≥2 regions ÷ minutes in the month), from the
monitoring service's report; planned maintenance is not excluded. Target ≥ 99.5 % (≤ 3 h 39 min
down in a 31-day month). Record each month's figure and the incident references in the ops log.

## Monthly checks

1. Send a test alert from each monitor; the recipient confirms receipt on both channels.
2. Restore drill (docs/runbooks/restore.md); file the report.
3. Review signal volumes (M4 thresholds) and the Vercel cron log for 401/5xx.

## SC-010

**Target**: 99 % of valid enquiries reach the staff inbox within 2 minutes; during an email
outage every accepted enquiry stays in the CMS inbox and is delivered after recovery. No
statement of guaranteed delivery is made from this local evidence alone.

**Method** (`ops/measure/delivery.sh`, ~10 min): disposable migrated database; real
`submitEnquiry` path (enquiry and job written in one transaction); a scheduler tick every 60 s
calling `payload.jobs.run` (the Vercel Cron `* * * * *` cadence); real SMTP to Mailpit. Latency =
Mailpit receipt time − enquiry `createdAt`. Phase A: 100 enquiries at random moments over 180 s
(random position in the cron minute). Phase B: 10 enquiries during a 2-minute simulated provider
outage (every send fails), then recovery.

**Result** 2026-11-07 (`docs/runbooks/evidence/sc010-2026-11-07T055720478Z.json`):

| Phase | Result                                                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | 100/100 delivered within 120 s. Seconds: min 0.6, p50 33.8, p95 57.8, p99 60.2, max 60.8 (bounded by the 60 s cron interval).                |
| B     | 10/10 stored in the inbox during the outage, 10/10 delivered after recovery (71.6–240.2 s after submission via the retry backoff), 0 failed. |

**Limits**: 0 misses in 100 bounds the true miss rate below ~3 % at 95 % confidence, so this run
alone does not prove 99 %; the structural bound (cron interval + send time) is what keeps
latency near 60 s. Not measured: Vercel cold starts, Vercel Cron start jitter, Neon latency and the
real provider's acceptance-to-inbox time. **Re-run on the preview deployment with the chosen
provider** (O-6), then monitor continuously with M2 (`enquiryDelivery`).
