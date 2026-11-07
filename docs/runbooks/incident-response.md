# Runbook: Incident response (FR-103, FR-100)

## Triggers

Monitor alert (site down, readiness `unavailable`/`degraded`, missing backup heartbeat), a staff
report, a spike in `auth.login_failure` / `ratelimit.hit` / `captcha.failure` / `upload.rejected`
signals, or a suspected compromise.

## Steps

1. **Acknowledge** the alert in the monitoring service (stops escalation) and open an incident
   log: time, who, what is seen. Times in UTC.
2. **Classify** with readiness (`curl -H "authorization: Bearer $HEALTH_READY_TOKEN" …/api/health/ready`):

   | Result                  | Meaning and first action                                                                                                                                                                                                      |
   | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `database: fail`        | Neon status page; Neon console (branch suspended, compute limits, role password). Public pages cached up to 60 s, then errors.                                                                                                |
   | `storage: fail`         | R2 status/token; media unavailable. Content still renders.                                                                                                                                                                    |
   | `email: fail`           | Email driver cannot be built: configuration (driver/adapter). Fix the environment, redeploy.                                                                                                                                  |
   | `enquiryDelivery: fail` | An enquiry email failed permanently in the last 24 h or is >30 min late. Enquiries are safe in the CMS inbox: tell staff to read the inbox; check the provider and the cron log (401s → secret mismatch, secret-rotation.md). |
   | 200 but site broken     | Recent deployment → docs/runbooks/rollback.md.                                                                                                                                                                                |

3. **Contain** a suspected compromise: suspend the affected accounts, revoke sessions (rotate
   `PAYLOAD_SECRET` ends all sessions), rotate the exposed secrets (secret-rotation.md), and keep
   the audit log (export it before anything else; it is append-only).
4. **Recover**: rollback.md or restore.md. Afterwards expire the public cache (cache.md).
5. **Notify**: the Owner always; affected people and the regulator where the law requires it
   (owner decision, with legal advice) when personal data (enquiries, accounts) may be exposed.
6. **Review** within 5 working days: timeline, cause, what detected it, actions with owners.
