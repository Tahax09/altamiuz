# Quickstart and Validation Guide: Altamiuz v1

This guide shows how to run the app locally and prove that each user story works. Commands are
the target interface; they exist only after the scaffolding phase. No paid account is needed.

## Prerequisites

- Node 22 LTS, pnpm 10, Docker (Compose v2).
- `gitleaks` installed for the pre-commit hook.

## Local setup

```bash
cp .env.example .env.local        # placeholders → local values; never commit .env*
pnpm install --frozen-lockfile
docker compose -f docker-compose.dev.yml up -d   # postgres:17, mailpit
pnpm payload migrate              # apply committed migrations (no push mode)
pnpm bootstrap:owner              # one-time first-owner procedure (FR-030); refuses if an owner exists
pnpm dev                          # http://localhost:3000 ; admin at /admin ; Mailpit UI at :8025
```

Expected: startup fails with a clear error if `APP_ENV=production` and any development
substitute is configured ([contracts/configuration.md](./contracts/configuration.md)).

## Validation scenarios

| # | Story | Run | Expected |
|---|---|---|---|
| V1 | US1 locale parity | `pnpm test:e2e --grep @us1` | Both locales render with correct `lang`/`dir`; the switcher maps to the equivalent page; missing locale → localized 404 |
| V2 | US2 compose/publish | `pnpm test:e2e --grep @us2` | Draft is invisible publicly; preview requires session + MFA; restore creates a draft; pasted script is stripped |
| V3 | US3 access | `pnpm test:security --grep authz` | Every cell of [access-matrix.md](./contracts/access-matrix.md) passes, both allow and deny, via UI and direct request |
| V4 | US3 MFA/sessions | `pnpm test:security --grep "mfa\|session"` | No CMS function before MFA; replayed code rejected; recovery code single-use; idle and absolute expiry enforced; revocation immediate |
| V5 | US3 audit | `pnpm test:integration --grep audit` | Every FR-045 event produces a complete entry; UPDATE/DELETE on audit table rejected by the database |
| V6 | US4 media | `pnpm test:security --grep upload` | Malicious fixtures rejected; EXIF stripped; variants generated; draft-only media returns 403/404 anonymously; keyboard reorder persists |
| V7 | US5 enquiry | `pnpm test:e2e --grep @us5` | Turnstile test "fail" key rejected; rate limit at 6th request; enquiry stored before confirmation; email visible in Mailpit; outage test retries |
| V8 | US6 SEO + routes | `pnpm test:e2e --grep @us6` | Canonical/hreflang/x-default built from the route map; switcher reaches the same document's other-locale slug; slug colliding with a static segment or redirect is rejected; cross-locale segment returns 404; sitemap excludes drafts; every legacy URL redirects in one hop; loop/chain rejected |
| V9 | US7 nav/banner | `pnpm test:e2e --grep @us7` + `pnpm test:security --grep authz` | Banner schedule respected; `javascript:` links rejected; Publisher can save nav/banner drafts but is denied publish and unpublish via UI and direct request |
| V10 | US8 operations | `pnpm ops:restore-drill` | Restore into a clean Compose project within RTO; content, users, audit and media intact |
| V11 | Accessibility | `pnpm test:a11y` | 0 serious or critical axe issues per template and locale, then manual checklist in `docs/runbooks/a11y-manual.md` |
| V12 | Performance | `pnpm test:perf` | Budgets in [research.md](./research.md#performance-budgets-resolves-todoperf_budgets) met per template and locale |
| V13 | Supply chain | `pnpm audit:deps && gitleaks detect` | 0 critical/high (or documented time-bound exception); 0 secrets |
| V14 | Migrations | `pnpm test:migrations` | Each migration up → down → up on a disposable database |
| V15 | Rich-text safety | `pnpm test:security --grep richtext` | Every corpus case rejected on all write paths; malicious JSON injected into the DB renders with no unsafe `href` (SC-018) |
| V16 | Admin accessibility | `pnpm test:a11y --grep admin` | No serious/critical finding beyond `tests/a11y/admin/baseline.json`; reorder and editor focus checks pass (SC-019) |

## Release gate (local, before any commit checkpoint)

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm test:security && pnpm test:a11y && gitleaks protect --staged
```
