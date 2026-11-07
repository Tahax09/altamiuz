#!/usr/bin/env bash
# Encrypted media backup (FR-102, A-10, docs/runbooks/backup.md).
#   MEDIA_SOURCE_DIR     directory holding every media object (local MEDIA_DIR, or a local mirror of
#                        the R2 bucket made first with `rclone sync`, see the runbook)
#   AGE_RECIPIENTS_FILE  age public key(s)
#   BACKUP_DIR           output directory
# Output: $BACKUP_DIR/media-<UTC stamp>.tar.age (+ .sha256).
source "$(dirname "$0")/lib.sh"
need_var MEDIA_SOURCE_DIR AGE_RECIPIENTS_FILE BACKUP_DIR
need_cmd age tar
[ -d "$MEDIA_SOURCE_DIR" ] || die "MEDIA_SOURCE_DIR is not a directory"
[ -s "$AGE_RECIPIENTS_FILE" ] || die "AGE_RECIPIENTS_FILE is empty or missing"
grep -q '^age1' "$AGE_RECIPIENTS_FILE" || die "AGE_RECIPIENTS_FILE holds no age public key"
mkdir -p "$BACKUP_DIR"

started=$(utc_now)
out="$BACKUP_DIR/media-$(utc_stamp).tar.age"
tmp="$out.partial"
trap 'rm -f "$tmp"' EXIT
files=$(find "$MEDIA_SOURCE_DIR" -type f | wc -l | tr -d ' ')

tar -C "$MEDIA_SOURCE_DIR" -cf - . \
  | age --encrypt --recipients-file "$AGE_RECIPIENTS_FILE" >"$tmp" \
  || die "media archive or encryption failed; no backup written"
is_age_file "$tmp" || die "encrypted output is malformed; no backup written"
mv "$tmp" "$out"
write_checksum "$out"
prune_old "$BACKUP_DIR" media
printf '{"kind":"media","file":"%s","files":%s,"bytes":%s,"startedAt":"%s","finishedAt":"%s"}\n' \
  "$(basename "$out")" "$files" "$(wc -c <"$out" | tr -d ' ')" "$started" "$(utc_now)"
