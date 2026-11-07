#!/usr/bin/env bash
# SC-010 measurement wrapper: disposable migrated database on the local Postgres, then
# ops/measure/delivery.ts with SMTP to Mailpit (docker-compose.dev.yml). Takes ~10 minutes.
set -euo pipefail
cd "$(dirname "$0")/../.."
base=$(sed -n 's/^DATABASE_URL=//p' .env.local | tail -1)
: "${base:?DATABASE_URL missing in .env.local}"
db="altamiuz_sc010_$(openssl rand -hex 4)"
admin="${base%/*}/postgres"
psql --no-psqlrc -q --dbname="$admin" -c "create database $db" >/dev/null
trap 'psql --no-psqlrc -q --dbname="$admin" -c "drop database if exists $db with (force)" >/dev/null' EXIT
export DATABASE_URL="${base%/*}/$db" APP_ENV=test EMAIL_DRIVER=smtp SMTP_URL=smtp://127.0.0.1:1025 \
  JOBS_TRIGGER=cron TRUSTED_PROXY_HOPS=1 MEDIA_DIR="$(mktemp -d)"
pnpm -s migrate >/dev/null
pnpm -s payload run ops/measure/delivery.ts
