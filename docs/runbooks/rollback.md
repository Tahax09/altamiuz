# Runbook: Rollback (FR-103)

## Application

1. Vercel → Deployments → the previous production deployment → **Instant Rollback** (no rebuild).
2. Readiness `ready` and the home page in both languages; record the time in the incident log.
3. Cron jobs follow the active deployment; check one `GET /api/jobs/run` 200 in the cron log.

## Database

Migrations are expand-then-contract (docs/runbooks/migration.md), so the previous application runs
against the newer schema and **no schema rollback is normally needed**. If a migration damaged
data:

1. Stop writes: put the site in maintenance by rolling back the app and disabling the CMS logins
   (security settings) if needed.
2. Preferred: Neon branch restore to a time before the migration (point-in-time, within the plan's
   history window) into a **new branch**; verify with `pnpm scan:richtext` and the readiness check
   against it; then switch `DATABASE_URL` to it and redeploy.
3. Outside the history window: docs/runbooks/restore.md from the last good backup.
4. `pnpm migrate:down` only for a migration whose `down` was reviewed for that exact data state.
5. After any out-of-band write, expire the public cache (docs/runbooks/cache.md).
