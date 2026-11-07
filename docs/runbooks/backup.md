# Runbook: Backup (FR-102, A-10, ADR-009)

Objectives (A-10): data loss at most 24 hours (RPO), service restored within 4 hours (RTO),
backups kept 30 days. Deleted enquiries may persist in backups until those expire (FR-077).

## What is backed up

| Artefact              | Tool                                                                               | Contents                                                                    |
| --------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `db-<UTC>.dump.age`   | `ops/backup/db.sh`: `pg_dump --format=custom --no-owner --no-acl` piped into `age` | every table: content, versions, users, audit log, settings, enquiries, jobs |
| `media-<UTC>.tar.age` | `ops/backup/media.sh`: `tar` of the media objects piped into `age`                 | originals and responsive variants                                           |
| `*.sha256`            | written by both scripts                                                            | checksum checked by `ops/restore.sh` before anything is written             |

Plaintext never touches disk: both scripts stream into `age` and write `*.partial`, renamed only
after the output is verified as an age file; any failure (`pipefail`) deletes the partial file
and exits non-zero. Only the age **public** key (recipient) is on the backup runner.

## Schedule (production)

`.github/workflows/backup.yml`, daily 02:23 UTC: install `age` + Postgres 17 client → `db.sh`
(Neon direct endpoint, read-only role) → mirror the R2 media bucket with a read-only token →
`media.sh` → upload to the separate backup bucket (write-only token; bucket lifecycle deletes
objects after 30 days) → heartbeat to the monitor. Inert until the owner completes O-10
(docs/runbooks/deploy.md) and sets `BACKUP_ENABLED=true`.

Alerting: a failed run fails the workflow (GitHub notifies) **and** skips the heartbeat; the
heartbeat monitor (grace 26 hours) pages the alert recipient (docs/runbooks/monitoring.md). A
backup that silently stops is therefore detected within 26 hours, inside the 24 h + 2 h window.

## On demand (before a risky migration or restore)

```sh
BACKUP_DATABASE_URL=<Neon direct URL> AGE_RECIPIENTS_FILE=recipients.txt BACKUP_DIR=./backups \
  PG_BIN_DIR=<dir with pg_dump >= server major> ops/backup/db.sh
MEDIA_SOURCE_DIR=<local mirror of the R2 bucket> AGE_RECIPIENTS_FILE=recipients.txt \
  BACKUP_DIR=./backups ops/backup/media.sh
```

Each prints one JSON line (file, bytes, times); errors name the variable or step, never a value.
Local files older than `BACKUP_RETENTION_DAYS` (default 30) are pruned from `BACKUP_DIR`.

## Keys

`age-keygen -o backup-identity.txt` on an offline machine; `age-keygen -y` gives the recipient
(public) line for `BACKUP_AGE_RECIPIENTS`. The identity (private key) is kept by two named people
in separate password managers; it is needed only to restore. Losing it makes every backup
unreadable; rotating it is in docs/runbooks/secret-rotation.md.

## Checks

- Monthly and before launch: run the restore drill (docs/runbooks/restore.md) and file the report.
- `tests/integration/ops/backup.test.ts` covers the failure paths (missing configuration, bad key
  file, unreachable database, missing media directory, retention pruning, tampered or
  checksum-less backups, wrong key, non-empty or unreachable target).
