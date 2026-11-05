#!/bin/sh
# T139: Lighthouse CI against the production build (`pnpm build` first) on the seeded e2e database
# (created by the Playwright global setup: run `pnpm test:public` or the full Playwright suite
# first). Uses Playwright's Chromium; results go to test-results/lighthouse (nothing uploaded).
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
PORT="${LHCI_PORT:-3100}"
export DATABASE_URL="${DATABASE_URL%/*}/altamiuz_e2e"
export SITE_URL="http://127.0.0.1:$PORT" LHCI_BASE_URL="http://127.0.0.1:$PORT"
export APP_ENV="${APP_ENV:-test}" EMAIL_DRIVER=memory
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$PWD/.pw-browsers}"
CHROME_PATH="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")"
export CHROME_PATH
mkdir -p test-results
pnpm -s start --port "$PORT" --hostname 127.0.0.1 > test-results/lighthouse-server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT INT TERM
i=0
until curl -fsS "http://127.0.0.1:$PORT/api/health" > /dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && { echo 'server did not start' >&2; exit 1; }
  sleep 1
done
pnpm -s exec lhci autorun --config=tests/perf/lighthouserc.cjs
