#!/usr/bin/env bash
# Restore one backup set into an EMPTY database and an EMPTY media directory (SC-013,
# docs/runbooks/restore.md). It never overwrites: production restores go to a new Neon branch /
# database and a new bucket prefix, which are then promoted (runbook).
#   RESTORE_DB_FILE        db-*.dump.age          RESTORE_MEDIA_FILE   media-*.tar.age
#   AGE_IDENTITY_FILE      age private key file   RESTORE_DATABASE_URL target (empty) database
#   RESTORE_MEDIA_DIR      target (empty or new) directory
#   PG_BIN_DIR             optional directory holding pg_restore/psql
# Checksums and the age header are verified for BOTH files before anything is written.
source "$(dirname "$0")/backup/lib.sh"
need_var RESTORE_DB_FILE RESTORE_MEDIA_FILE AGE_IDENTITY_FILE RESTORE_DATABASE_URL RESTORE_MEDIA_DIR
PG_RESTORE=${PG_BIN_DIR:+$PG_BIN_DIR/}pg_restore
PSQL=${PG_BIN_DIR:+$PG_BIN_DIR/}psql
need_cmd age tar "$PG_RESTORE" "$PSQL"
[ -s "$AGE_IDENTITY_FILE" ] || die "AGE_IDENTITY_FILE is empty or missing"

verify_checksum "$RESTORE_DB_FILE"
verify_checksum "$RESTORE_MEDIA_FILE"
# Decryptability of both files is proven before the target is touched (wrong key → stop here).
age --decrypt --identity "$AGE_IDENTITY_FILE" "$RESTORE_DB_FILE" | "$PG_RESTORE" --list >/dev/null \
  || die "database backup cannot be decrypted with this identity or is not a pg_dump archive"
age --decrypt --identity "$AGE_IDENTITY_FILE" "$RESTORE_MEDIA_FILE" | tar -tf - >/dev/null \
  || die "media backup cannot be decrypted with this identity or is not a tar archive"

tables=$("$PSQL" --no-psqlrc -qtAX --dbname="$RESTORE_DATABASE_URL" \
  -c "select count(*) from information_schema.tables where table_schema = 'public'") \
  || die "target database unreachable"
[ "$tables" = "0" ] || die "target database is not empty ($tables tables); restore refuses to overwrite"
if [ -d "$RESTORE_MEDIA_DIR" ] && [ -n "$(ls -A "$RESTORE_MEDIA_DIR")" ]; then
  die "RESTORE_MEDIA_DIR is not empty; restore refuses to overwrite"
fi
mkdir -p "$RESTORE_MEDIA_DIR"

started=$(utc_now)
age --decrypt --identity "$AGE_IDENTITY_FILE" "$RESTORE_DB_FILE" \
  | "$PG_RESTORE" --no-owner --no-acl --exit-on-error --single-transaction \
    --dbname="$RESTORE_DATABASE_URL" \
  || die "database restore failed (single transaction rolled back)"
# tar refuses absolute paths and '..' members by default (GNU tar and bsdtar).
age --decrypt --identity "$AGE_IDENTITY_FILE" "$RESTORE_MEDIA_FILE" | tar -xf - -C "$RESTORE_MEDIA_DIR" \
  || die "media restore failed"
printf '{"restored":true,"tables":%s,"mediaFiles":%s,"startedAt":"%s","finishedAt":"%s"}\n' \
  "$("$PSQL" --no-psqlrc -qtAX --dbname="$RESTORE_DATABASE_URL" -c "select count(*) from information_schema.tables where table_schema = 'public'")" \
  "$(find "$RESTORE_MEDIA_DIR" -type f | wc -l | tr -d ' ')" "$started" "$(utc_now)"
