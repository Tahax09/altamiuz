#!/bin/sh
# Runs the CI workflow steps locally against the docker-compose.dev.yml database.
# Requires .env.local (copied from .env.example) and `docker compose -f docker-compose.dev.yml up -d`.
set -eu
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format
pnpm test
pnpm test:integration
pnpm test:migrations
pnpm build
pnpm migrate
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$PWD/.pw-browsers}"
pnpm test:smoke
pnpm test:security
pnpm test:a11y
pnpm audit --audit-level high
sh scripts/gitleaks.sh detect
sh scripts/osv-scan.sh
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12 -color
# CD-13 publication gate (CI job `publication-gate`): reported, not fatal, until the owner approves
# the Arabic route vocabulary. A release must pass it (`pnpm check:route-vocab` exits 0).
pnpm check:route-vocab || echo 'publication-gate: CD-13 pending (expected until approved)'
