# Runbook: Database migration (FR-103, ADR-009)

1. Migrations are committed (`migrations/*.ts`) and tested in CI (`pnpm test:migrations`: up, down,
   up on a fresh database). Never use schema push outside a throwaway local database (refused by
   configuration).
2. **Expand, then contract**: a release only adds (tables, nullable columns, new enum values) or
   removes things the previous release no longer reads. Renames are add + backfill + later drop.
3. Take a backup first (docs/runbooks/backup.md, "on demand") or confirm the last nightly one is
   less than 24 hours old.
4. Run against the **direct** Neon endpoint (the pooler's transaction mode breaks migration
   locking): `DATABASE_URL=<direct URL> pnpm migrate`, then `pnpm migrate:status` (all "Yes").
   For the dev branch: `node scripts/with-neon.mjs --direct -- pnpm migrate` (it refuses pooled URLs).
5. Deploy the application that uses the new schema (docs/runbooks/deploy.md).
6. After content-rewriting migrations: `pnpm scan:richtext` and expire the public cache
   (docs/runbooks/cache.md).
7. On failure: the migration runs in a transaction and rolls back; fix forward. Data damage →
   docs/runbooks/rollback.md#database.
