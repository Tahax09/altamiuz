# Shared helpers for ops/backup/*.sh and ops/restore*.sh (FR-102, SC-013). Sourced, not run.
# Rules: fail closed (set -euo pipefail), never leave a partial artefact behind, never print a
# connection string, key or file content; one JSON summary line on stdout, messages on stderr.
set -euo pipefail
umask 077

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

need_cmd() {
  for c in "$@"; do command -v "$c" >/dev/null 2>&1 || die "required command not found: $c"; done
}

need_var() {
  for v in "$@"; do [ -n "${!v:-}" ] || die "required variable not set: $v"; done
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi
}

utc_now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
utc_stamp() { date -u +%Y%m%dT%H%M%SZ; }

# An age file starts with this line; anything else is not an encrypted backup.
AGE_HEADER='age-encryption.org/v1'
is_age_file() { [ "$(head -c ${#AGE_HEADER} "$1" 2>/dev/null)" = "$AGE_HEADER" ]; }

# Write "<sha256>  <basename>" next to an artefact.
write_checksum() { printf '%s  %s\n' "$(sha256_of "$1")" "$(basename "$1")" >"$1.sha256"; }

# Fails unless the artefact matches its .sha256 sidecar.
verify_checksum() {
  local f=$1
  [ -f "$f" ] || die "backup file not found: $(basename "$f")"
  [ -f "$f.sha256" ] || die "checksum file missing for $(basename "$f")"
  local want got
  want=$(cut -d' ' -f1 <"$f.sha256")
  got=$(sha256_of "$f")
  [ "$want" = "$got" ] || die "checksum mismatch for $(basename "$f") (corrupted or tampered)"
  is_age_file "$f" || die "$(basename "$f") is not an age-encrypted file"
}

# Removes artefacts of one kind older than BACKUP_RETENTION_DAYS (A-10: 30) from a directory.
prune_old() {
  local dir=$1 prefix=$2 days=${BACKUP_RETENTION_DAYS:-30}
  case $days in '' | *[!0-9]*) die "BACKUP_RETENTION_DAYS must be a whole number" ;; esac
  find "$dir" -maxdepth 1 -type f -name "${prefix}-*.age*" -mtime "+$days" -print -delete >&2 || true
}
