#!/bin/sh
# Secret scanning (FR-098, SC-014). Uses a local gitleaks binary if present,
# otherwise the pinned container image. Usage: gitleaks.sh detect | staged
# (Directory mode is intentionally absent: it ignores .gitignore and scans local tool state.)
set -eu
IMAGE="ghcr.io/gitleaks/gitleaks:v8.30.1"
MODE="${1:-detect}"
ROOT="$(git rev-parse --show-toplevel)"
run() {
  if command -v gitleaks >/dev/null 2>&1; then
    (cd "$ROOT" && gitleaks "$@")
  else
    docker run --rm -v "$ROOT:/repo" -w /repo "$IMAGE" "$@"
  fi
}
case "$MODE" in
  detect) run git --config .gitleaks.toml --redact --no-banner . ;;
  staged) run git --config .gitleaks.toml --redact --no-banner --staged --pre-commit . ;;
  *) echo "usage: $0 detect|staged" >&2; exit 2 ;;
esac
