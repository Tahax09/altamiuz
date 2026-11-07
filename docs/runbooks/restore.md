# Runbook: Restore (FR-102, FR-103, SC-013, A-10)

Restores never overwrite: `ops/restore.sh` refuses a non-empty database or media directory. Restore
into something new, verify it, then switch to it.

## Production procedure (target RTO ≤ 4 h)

1. Open an incident (docs/runbooks/incident-response.md). Note the start time: the RTO clock runs
   from here.
2. Choose the backup: the newest `db-*.dump.age` and `media-*.tar.age` pair in the backup bucket
   before the damage (RPO ≤ 24 h). Download both with their `.sha256` files to a trusted machine.
   If the damage is within Neon's history window, a Neon point-in-time branch is faster; still
   run steps 5–8 against it.
3. Get the age private key from one of its two holders (docs/runbooks/backup.md#keys).
4. Create the targets: a new, empty Neon branch/database (direct URL, migration role) and a new R2
   bucket or prefix mirrored to an empty local directory.
5. Restore:

   ```sh
   RESTORE_DB_FILE=db-….dump.age RESTORE_MEDIA_FILE=media-….tar.age \
     AGE_IDENTITY_FILE=backup-identity.txt RESTORE_DATABASE_URL=<new direct URL> \
     RESTORE_MEDIA_DIR=./restored-media PG_BIN_DIR=<pg 17+ bin> ops/restore.sh
   ```

   It checks both checksums and that both files decrypt with this key **before** writing; the
   database is restored in one transaction (all or nothing).

6. Upload `./restored-media` to the new bucket/prefix (`aws s3 sync … --endpoint-url <R2>`).
7. Verify against the restored database: `pnpm migrate:status` (all "Yes"; run `pnpm migrate` if
   the backup predates the deployed release), `DATABASE_URL=<new> pnpm scan:richtext` (0
   violations), sign in as an Owner, open a page, a media item, the audit log and the enquiry
   inbox.
8. Switch: set `DATABASE_URL` (pooled endpoint of the restored branch) and the media bucket in
   Vercel, redeploy, readiness `ready`, expire the public cache (docs/runbooks/cache.md).
9. Record the times (start, restore done, service back) and the backup timestamp in the incident
   log. Destroy the local decrypted media and the key copy.

## Restore drill (before launch, then monthly)

`ops/restore-drill.sh` runs the same restore locally, end to end, with no cloud account: backs up
a source database and media directory with `ops/backup/{db,media}.sh` (ephemeral age key), starts
a clean Compose project (`ops/restore-drill.compose.yml`, Postgres 17 on tmpfs), restores with
`ops/restore.sh`, verifies every table's row count and every media file's SHA-256 against the
source, checks the backups contain no plaintext table names, counts applied migrations against
`migrations/`, runs `pnpm scan:richtext` on the restored database, writes a timed report to
`test-results/ops/` and removes the environment.

```sh
SOURCE_DATABASE_URL=postgres://…/altamiuz_e2e SOURCE_MEDIA_DIR=test-results/e2e-media pnpm ops:restore-drill
```

Before launch, run it once more against a copy of production (a Neon branch as source) to measure
the production-sized RTO.

## Evidence

Local drill, 2026-11-07 (report `docs/runbooks/evidence/restore-drill-20261107T060553Z.json`), source =
seeded e2e database (14 migrations) and its media:

| Measure                                   | Result                                                                                                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source                                    | 268 tables, 1,702 rows, 120 media files                                                                                                                                                                        |
| Backup (db + media, encrypted)            | 0.66 s; 1.17 MB + 1.23 MB; no plaintext markers found                                                                                                                                                          |
| Clean environment up                      | 2.9 s                                                                                                                                                                                                          |
| Restore (verify checksums/keys + restore) | 1.6 s                                                                                                                                                                                                          |
| Verification                              | 2.4 s: row counts equal, media checksums equal, 0 pending migrations, rich-text scan pass                                                                                                                      |
| **Measured RTO (environment → verified)** | **7.0 s** (objective 4 h)                                                                                                                                                                                      |
| RPO                                       | Restored state = state at backup time (0 rows lost relative to the backup). Production RPO is bounded by the daily schedule (≤ 24 h) and enforced by the 26 h heartbeat alert; not yet observed in production. |

An earlier run the same day (before the migration check was hardened) measured 10.7 s. Limits:
the dataset is small and local; transfer from R2 and restore into Neon will dominate production
RTO and are not measured yet. Failure paths are covered by `tests/integration/ops/backup.test.ts`.
