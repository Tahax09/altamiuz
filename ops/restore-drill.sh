#!/usr/bin/env bash
# Restore drill (SC-013, A-10, FR-102; docs/runbooks/restore.md). Locally executable, no cloud:
#   1. back up the source database and media with ops/backup/{db,media}.sh (ephemeral age key)
#   2. start a clean Compose project (ops/restore-drill.compose.yml, tmpfs Postgres 17)
#   3. restore with ops/restore.sh, exactly as the runbook does
#   4. verify: every table's row count and every media file's SHA-256 equal the source; the
#      backups hold no plaintext; migrations are complete; `pnpm scan:richtext` passes
#   5. write a timed report to test-results/ops/ and tear the environment down
#   SOURCE_DATABASE_URL  default: DATABASE_URL from .env.local    SOURCE_MEDIA_DIR default: ./media
# The source must be quiet during the drill (row counts are compared).
set -euo pipefail
cd "$(dirname "$0")/.."
source ops/backup/lib.sh
need_cmd age age-keygen docker pnpm psql
env_local() { [ -f .env.local ] && sed -n "s/^$1=//p" .env.local | tail -1 || true; }
SOURCE_DATABASE_URL=${SOURCE_DATABASE_URL:-$(env_local DATABASE_URL)}
SOURCE_MEDIA_DIR=${SOURCE_MEDIA_DIR:-$(env_local MEDIA_DIR)}
SOURCE_MEDIA_DIR=${SOURCE_MEDIA_DIR:-./media}
need_var SOURCE_DATABASE_URL
mkdir -p "$SOURCE_MEDIA_DIR"

ms() { node -e 'process.stdout.write(String(Date.now()))'; }
work=$(mktemp -d "${TMPDIR:-/tmp}/altamiuz-drill.XXXXXX")
export DRILL_PG_PASSWORD="drill-$(openssl rand -hex 16)"
export DRILL_PG_PORT=${DRILL_PG_PORT:-54329}
compose=(docker compose -f ops/restore-drill.compose.yml)
cleanup() {
  "${compose[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

table_counts() {
  psql --no-psqlrc -qtAX --dbname="$1" -c "select string_agg(table_name || '=' ||
    (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name),
      false, true, '')))[1]::text, E'\n' order by table_name)
    from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'"
}
media_manifest() { (cd "$1" && find . -type f -print0 | sort -z | xargs -0 -r shasum -a 256); }

echo "drill: ephemeral age key, backup of source" >&2
age-keygen -o "$work/identity.txt" 2>/dev/null
age-keygen -y "$work/identity.txt" >"$work/recipients.txt"
t0=$(ms)
BACKUP_DATABASE_URL=$SOURCE_DATABASE_URL AGE_RECIPIENTS_FILE="$work/recipients.txt" \
  BACKUP_DIR="$work/backups" PG_BIN_DIR=${PG_BIN_DIR:-} ops/backup/db.sh >"$work/db.json"
MEDIA_SOURCE_DIR=$SOURCE_MEDIA_DIR AGE_RECIPIENTS_FILE="$work/recipients.txt" \
  BACKUP_DIR="$work/backups" ops/backup/media.sh >"$work/media.json"
t1=$(ms)
backup_done_at=$(utc_now)
src_counts=$(table_counts "$SOURCE_DATABASE_URL")
src_media=$(media_manifest "$SOURCE_MEDIA_DIR")
db_file=$(ls "$work"/backups/db-*.dump.age)
media_file=$(ls "$work"/backups/media-*.tar.age)

# Encryption at rest of the backup artefacts: no table name or file name in clear.
plaintext=0
for marker in payload_migrations audit_events enquiries; do
  if LC_ALL=C grep -aq "$marker" "$db_file"; then plaintext=1; fi
done
if [ -n "$src_media" ] && LC_ALL=C grep -aq "$(basename "$(find "$SOURCE_MEDIA_DIR" -type f | head -1)")" "$media_file"; then plaintext=1; fi
[ "$plaintext" = 0 ] || die "backup contains plaintext"

echo "drill: clean environment + restore (RTO clock running)" >&2
r0=$(ms)
"${compose[@]}" up -d --wait >/dev/null
target="postgres://drill:${DRILL_PG_PASSWORD}@127.0.0.1:${DRILL_PG_PORT}/drill"
r1=$(ms)
RESTORE_DB_FILE=$db_file RESTORE_MEDIA_FILE=$media_file AGE_IDENTITY_FILE="$work/identity.txt" \
  RESTORE_DATABASE_URL=$target RESTORE_MEDIA_DIR="$work/restored-media" PG_BIN_DIR=${PG_BIN_DIR:-} \
  ops/restore.sh >"$work/restore.json"
r2=$(ms)

echo "drill: verification" >&2
[ "$(table_counts "$target")" = "$src_counts" ] || die "row counts differ between source and restore"
[ "$(media_manifest "$work/restored-media")" = "$src_media" ] || die "media files differ"
expected=$(find migrations -maxdepth 1 -name '2*.ts' | wc -l | tr -d ' ')
applied=$(psql --no-psqlrc -qtAX --dbname="$target" \
  -c "select count(distinct name) from payload_migrations where batch > 0")
pending=$((expected - applied))
[ "$pending" = "0" ] || die "restored database: $applied of $expected migrations applied"
DATABASE_URL=$target MEDIA_DIR="$work/restored-media" pnpm -s scan:richtext >"$work/scan.txt" 2>&1 \
  || { cat "$work/scan.txt" >&2; die "scan:richtext failed on the restored database"; }
r3=$(ms)

tables=$(printf '%s\n' "$src_counts" | grep -c . || true)
rows=$(printf '%s\n' "$src_counts" | awk -F= '{s+=$2} END {print s+0}')
mfiles=$(printf '%s' "$src_media" | grep -c . || true)
mkdir -p test-results/ops
report="test-results/ops/restore-drill-$(utc_stamp).json"
cat >"$report" <<JSON
{
  "drill": "restore",
  "backupCompletedAt": "$backup_done_at",
  "verifiedAt": "$(utc_now)",
  "source": { "tables": $tables, "rows": $rows, "mediaFiles": $mfiles },
  "backup": { "durationMs": $((t1 - t0)), "db": $(cat "$work/db.json"), "media": $(cat "$work/media.json"), "plaintextFound": false },
  "restore": {
    "environmentMs": $((r1 - r0)),
    "restoreMs": $((r2 - r1)),
    "verifyMs": $((r3 - r2)),
    "rtoMeasuredMs": $((r3 - r0)),
    "rowCountsMatch": true,
    "mediaChecksumsMatch": true,
    "pendingMigrations": 0,
    "richtextScan": "pass"
  },
  "objectives": { "rpoHours": 24, "rtoHours": 4, "retentionDays": 30 }
}
JSON
cat "$report"
echo "drill: PASS (report $report)" >&2
