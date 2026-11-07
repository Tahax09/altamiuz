#!/usr/bin/env bash
# Encrypted database backup (FR-102, A-10, docs/runbooks/backup.md).
#   BACKUP_DATABASE_URL  direct (non-pooled) Postgres URL; read-only role recommended
#   AGE_RECIPIENTS_FILE  age public key(s), one per line (the private key is never on this host)
#   BACKUP_DIR           output directory (created if missing)
#   PG_BIN_DIR           optional directory holding pg_dump (must be >= the server's major version)
#   BACKUP_RETENTION_DAYS optional, default 30
# Output: $BACKUP_DIR/db-<UTC stamp>.dump.age (+ .sha256). pg_dump custom format, no owners/ACLs.
source "$(dirname "$0")/lib.sh"
need_var BACKUP_DATABASE_URL AGE_RECIPIENTS_FILE BACKUP_DIR
PG_DUMP=${PG_BIN_DIR:+$PG_BIN_DIR/}pg_dump
need_cmd age "$PG_DUMP"
[ -s "$AGE_RECIPIENTS_FILE" ] || die "AGE_RECIPIENTS_FILE is empty or missing"
grep -q '^age1' "$AGE_RECIPIENTS_FILE" || die "AGE_RECIPIENTS_FILE holds no age public key"
mkdir -p "$BACKUP_DIR"

started=$(utc_now)
out="$BACKUP_DIR/db-$(utc_stamp).dump.age"
tmp="$out.partial"
trap 'rm -f "$tmp"' EXIT

# pipefail: a pg_dump failure fails the pipeline even though age exits 0.
"$PG_DUMP" --format=custom --no-owner --no-acl --dbname="$BACKUP_DATABASE_URL" \
  | age --encrypt --recipients-file "$AGE_RECIPIENTS_FILE" >"$tmp" \
  || die "database dump or encryption failed; no backup written"
is_age_file "$tmp" || die "encrypted output is malformed; no backup written"
mv "$tmp" "$out"
write_checksum "$out"
prune_old "$BACKUP_DIR" db
printf '{"kind":"db","file":"%s","bytes":%s,"startedAt":"%s","finishedAt":"%s"}\n' \
  "$(basename "$out")" "$(wc -c <"$out" | tr -d ' ')" "$started" "$(utc_now)"
