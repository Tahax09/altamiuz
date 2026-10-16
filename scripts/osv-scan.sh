#!/bin/sh
# Dependency vulnerability scan of the lockfile with the pinned osv-scanner image (FR-098).
set -eu
ROOT="$(git rev-parse --show-toplevel)"
docker run --rm -v "$ROOT:/src" -w /src ghcr.io/google/osv-scanner:v2.7.0 \
  scan source --config /src/osv-scanner.toml --lockfile /src/pnpm-lock.yaml
