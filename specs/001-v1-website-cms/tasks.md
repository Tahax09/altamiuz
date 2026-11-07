---
description: "Task list for Altamiuz v1 bilingual website and CMS"
---

# Tasks: Altamiuz v1 Bilingual Website and CMS

**Input**: `specs/001-v1-website-cms/` — spec.md, plan.md, research.md, threat-model.md,
data-model.md, contracts/ (access-matrix, http-surface, configuration, rich-text), quickstart.md

**Prerequisites**: constitution v1.1.0; Phase 0 research complete (below).

**Tests**: REQUIRED. Constitution VI makes test-first non-negotiable for auth, authorization,
uploads, publishing, localization and security boundaries; every such task pair is ordered
"failing test → implementation". Requirement IDs in parentheses map tasks to spec.md; the
coverage matrix at the end is generated from them.

**Organization**: Setup → Foundational → user stories in dependency/priority order → Polish.
Plan phase mapping: Setup = plan Phase 1; Foundational + US3 = plan Phase 2 (detailed);
US2 = plan Phase 3; US1 = plan Phase 5 (public part); US4 = plan Phase 4; US6 = plan Phase 5
(SEO part); US5 = plan Phase 6; US7 = plan Phase 3 globals; US8 + Polish = plan Phase 7.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on an incomplete task)
- **[Story]**: US1…US8 from spec.md
- Paths follow plan.md "Source Code" layout (single Next.js + Payload app at repo root)

## Phase 0: Research — COMPLETE (no tasks)

- R-A Payload Arabic/RTL admin POC → `research/payload-rtl-poc/findings.md` (commit `46e87a1`)
- R-B Typography specimen → `research/typography-specimen/report.md` (commit `46e87a1`)
- Decisions D-4, D-12, D-22–D-25, CD-13 gate, version pin → `research.md`
- Remaining research is task-tracked: R-C (T038), R-D (T018), R-E (T089), R-F (T127),
  R-G (T141), R-H (T132)

---

## Phase 1: Setup (plan Phase 1 — Foundation)

**Purpose**: runnable skeleton with no paid accounts, security headers, scanning, migrations.
**Gate before starting**: owner approval to install dependencies in the repository root
(not yet granted — WS1–WS5 authorised only `research/payload-rtl-poc/`).

- [X] T001 Create `package.json` (pnpm 10, `"engines": {"node": "22.x"}`) pinning exact versions: `payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/ui`, `@payloadcms/translations` = 3.91.0; `next` = 16.3.8 (ADR-003 Amendment 1); `react`/`react-dom` = 19.2.6; `sharp` = 0.35.5; record licence of every dependency in `docs/licences.md` (D-1, Constitution I)
- [X] T002 [P] Configure strict TypeScript and path aliases (`@/modules/*`, `@/ui/*`) in `tsconfig.json`
- [X] T003 [P] Configure ESLint in `eslint.config.mjs` with (a) module-boundary rule: imports into `src/modules/<m>/` only via `index.ts`; (b) rule forbidding string-built URL paths outside `src/modules/i18n/routes.ts` (D-2, D-5)
- [X] T004 [P] Add `.prettierrc.json` and `.editorconfig`
- [X] T005 [P] Create placeholder-only `.env.example` covering every variable in `contracts/configuration.md` (FR-104)
- [X] T006 [P] Create `docker-compose.dev.yml` with `postgres:17` and `axllent/mailpit`, ports bound to `127.0.0.1`, throwaway credentials from `.env.local` (FR-105)
- [X] T007 [P] Add gitleaks config `.gitleaks.toml` and pre-commit hook `.githooks/pre-commit` (gitleaks protect --staged, typecheck, lint) with `pnpm prepare` installer (FR-098, SC-014)
- [X] T008 [P] Write CI workflow `.github/workflows/ci.yml` (typecheck, lint, unit, integration with Postgres service, security, a11y, gitleaks, `pnpm audit`/osv-scanner, migrations up→down→up); runs locally via `pnpm ci:local` until a remote is authorised (FR-098)
- [X] T009 Configure test tooling: `vitest.config.mts` (projects `unit`, `integration`), `playwright.config.ts` (projects chromium, webkit), disposable-DB helper `tests/setup/db.ts` creating/dropping a database per run
- [X] T010 Write failing tests `tests/unit/platform/config.test.ts`: production mode refuses dev drivers (`STORAGE_DRIVER=local`, `EMAIL_DRIVER=smtp|memory`, `RATELIMIT_DRIVER=memory`, Turnstile test keys), missing secrets, placeholder values, `PAYLOAD_SECRET` < 32 bytes, `MFA_ENCRYPTION_KEY` ≠ 32 bytes (FR-104, FR-105)
- [X] T011 Implement typed config loader `src/modules/platform/config/index.ts` (zod) per `contracts/configuration.md` until T010 passes (FR-105)
- [X] T012 [P] Write failing tests `tests/unit/platform/logger.test.ts`: passwords, tokens, cookies, `authorization`, TOTP codes/secrets, recovery codes, session ids, enquiry `message`/`email`/`phone` are redacted (FR-101)
- [X] T013 Implement pino logger with redaction `src/modules/platform/logger/index.ts` until T012 passes (FR-101)
- [X] T014 Write failing contract tests `tests/integration/platform/adapters.test.ts` for ports storage/email/ratelimit/jobs/captcha/analytics: each local substitute satisfies the port contract; analytics driver `none` is a no-op (FR-105, FR-086)
- [X] T015 Implement ports and local substitutes `src/modules/platform/adapters/{storage,email,ratelimit,jobs,captcha,analytics}/index.ts` (local disk, Mailpit SMTP + memory, memory limiter, Payload jobs local runner, Turnstile test keys, none) until T014 passes (FR-105)
- [X] T016 Create `src/payload.config.ts` composing module configs: Postgres adapter, `localization` {ar (rtl, default), en, `fallback: false`}, `experimental.localizeStatus: true`, admin `i18n.supportedLanguages: { en }` only (D-23), `graphQL.disable: true`, `csrf` origins from config, no public registration (FR-001, FR-004, FR-030, D-3, D-23)
- [X] T017 Create Next app skeleton `src/app/(payload)/**` (generated admin/API routes), `next.config.ts` with `output: 'standalone'` and no host-proprietary APIs (D-14)
- [X] T018 R-D spike: measure the minimal CSP Payload admin needs (script/style hashes or nonce support) and record in `docs/adr/ADR-004-admin-csp.md` (FR-090)
- [X] T019 Write failing tests `tests/integration/platform/headers.test.ts`: public routes carry nonce-based CSP, admin carries ADR-004 policy; HSTS, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`; error responses contain no stack trace or version (FR-090, FR-095)
- [X] T020 Implement headers/CSP nonce in `src/proxy.ts` and generic error handling until T019 passes (FR-090, FR-095)
- [X] T021 Write failing tests `tests/integration/platform/health.test.ts`: `/api/health` returns `{status}` only; `/api/health/ready` requires `HEALTH_READY_TOKEN` and pings DB (FR-100)
- [X] T022 Implement `src/app/api/health/route.ts` and `src/app/api/health/ready/route.ts` until T021 passes (FR-100)
- [X] T023 Add migration scripts (`migrate`, `migrate:create`, `migrate:down`) and failing-then-passing harness `tests/integration/migrations/updownup.test.ts` running every migration up→down→up on a disposable DB; disable `push` outside throwaway DBs (Constitution X)
- [X] T024 [P] Write ADRs `docs/adr/ADR-001-single-app.md`, `ADR-002-local-api-only-public.md`, `ADR-003-version-pin.md` (Payload 3.91.0 / Next 16.3.3 exact; upgrades require rich-text + localizeStatus regression suites) (D-1, D-2, D-3)
- [X] T025 [P] Create `docs/security/asvs-l2.md` requirement-level skeleton after re-verifying ASVS 5.0.0 chapter titles against the official release; every row status `not addressed` initially (FR-097, Constitution XIV)

**Checkpoint (Gate 1)**: app boots locally with no paid accounts; T010/T012/T014/T019/T021/T023
green; gitleaks clean → prepare commit for owner approval.

**Setup implementation notes (WS6, 2026-10-16)**:
- T019 tests live in `tests/unit/platform/headers.test.ts` (proxy and CSP logic need no database)
  and `tests/smoke/foundation.spec.ts` (real production server, Chromium and WebKit), rather than
  `tests/integration/platform/headers.test.ts`.
- T023 harness was written after the baseline migration was generated, so it was not observed
  failing first. It passes up→down→up on a disposable database.
- T015 ships ports plus local substitutes only. The Payload jobs runner, Postgres limiter (T039),
  S3/R2, Resend, Upstash, QStash, real Turnstile (T124) and analytics provider (T127) are deferred
  to the phases that first need them.
- T016 uses a deny-all placeholder `users` collection. `src/proxy.ts` blocks Payload's
  first-user screen and endpoint until T056/T057.
- T018 measured the admin **login** view only (ADR-004); authenticated views are re-measured in
  Phase 3/4.
- T008 cannot run on GitHub (no remote authorised). Its steps were run individually and locally.
- **Gate 1 audit finding resolved (owner-approved)**: `pnpm audit` and osv-scanner found 1
  critical + 3 high advisories in the original pins. ADR-003 Amendment 1 bumps `next` to 16.3.8
  and `sharp` to 0.35.5. The remaining dev-only/transitive advisories are time-bound exceptions
  in `docs/security/dependency-exceptions.md` (expire 2026-11-16).
- **Dependency advisory remediation (2026-11-05, ADR-003 Amendment 2)**: `pnpm audit` went from
  37 findings (3 critical, 14 high, 12 moderate, 8 low) to 9 (1 critical, 2 high, 2 moderate,
  4 low); 26 advisories resolved. Resolved versions: `next` 16.3.8 → 16.4.5 (GHSA-2464-fhr4-w9xw,
  GHSA-673q-mjm6-r5xr critical RCE; GHSA-p3m5-59mp-jv5r); Payload 3.91.0 → 3.92.1 with `undici`
  7.29.1 → 7.30.1 (GHSA-2m5v-pch6-74hx, GHSA-4w7w-5xrc-9h26, GHSA-qrxm-fqhp-jwvm,
  GHSA-xjj6-f33q-929c, GHSA-4qv8-2p9j-2685, GHSA-55wc-3pg8-jfw6, GHSA-9fm3-97px-rjf6,
  GHSA-f72v-6w45-q472); `nodemailer` 10.1.1 → 10.1.7 (GHSA-8c8m-p3m8-cjg8, GHSA-85x2-q946-cp5h,
  GHSA-m943-m63m-w62w); `@lhci/cli` 0.15.1 → 0.16.0 removes `extract-zip`, `tmp`, `zod` 3,
  `uuid` 8 (GHSA-7pqw-9j4j-h8q3, GHSA-jmr9-qjv8-65gv, GHSA-ph9p-34f9-6g65, GHSA-52f5-9888-hmc6,
  GHSA-mrhx-c7xc-m3w5, GHSA-w5hq-g745-h8pq); `fast-uri` 3.1.8 → 3.1.9 in range (4 advisories);
  `happy-dom` 20.14.6 → 21.0.4 through the one scoped override `@lexical/headless>happy-dom`
  (GHSA-834v-8h66-3h79, GHSA-c8p4-j97h-3vg8). `eslint-config-next` 16.4.5 follows `next`.
  Remaining exposure: time-bound exceptions (owner: project owner; expire 2026-12-05) for
  `dompurify` 3.4.15 vendored in `monaco-editor` 0.57.0 (latest stable; admin JSON-field editor
  only; GHSA-cg2g-xh64-v4q7 critical, GHSA-mrv2-3pqr-j5jr high, three low), `basic-ftp` 5.x in
  the Lighthouse CI proxy chain (GHSA-c475-qrg2-pj4r, dev-only), `minimatch` 10 in lint tooling
  (GHSA-g3hv-75wg-m249) and `deepmerge` (GHSA-gcqx-w48m-w2h4, no fix published); `esbuild`
  GHSA-67mh-4wv8-2f99 keeps its 2026-11-16 expiry. GHSA-vfj7-8cjw-p6xm (`braces`) no longer
  matches and was retired. `pnpm audit --audit-level high` and osv-scanner pass. New FSL-1.1
  licence (`sentry` CLI, Lighthouse dev tooling) noted in `docs/licences.md`. Verified: typecheck,
  lint (0 errors; the same 3 warnings as before the upgrade), unit 373/373, integration
  552/552 (incl. T075 and T071 write paths), production build, full Playwright suite 197/197
  (incl. the T071 admin paste test and the T072 public-page render test); T072's renderer cases
  run in the unit suite. Commit `dcca936`. Lighthouse CI
  (`pnpm perf:lighthouse`, lhci 0.16.0 / Lighthouse 13.6.0): all budgets pass; LCP 1.36–1.41 s,
  TBT 64–84 ms, CLS 0, JS 143 KB, fonts 72/96 KB, a11y 1.00.
- **Dependency exception review (2026-11-06, documentation only)**: every exception re-checked
  against `pnpm audit --json` and the installed code; now one block per exception (E-1…E-5) in
  `docs/security/dependency-exceptions.md` with advisory IDs, affected and fixed ranges, path,
  exposure, mitigation, owner, expiry and the action due before expiry. Corrections:
  - E-4 `deepmerge` (GHSA-gcqx-w48m-w2h4): the earlier "no request body reaches deepmerge" was
    wrong. Payload's `beforeChange` hook deep-merges every write's data with the stored document
    before validation, so authenticated writes reach it (impact limited to the merged object's
    prototype, CVSS 5.3). A `__proto__`/`constructor` write test is proposed.
  - E-1 DOMPurify/Monaco (GHSA-cg2g-xh64-v4q7 critical and four others): upstream fix tracked:
    `monaco-editor@0.58.0-dev` already depends on `dompurify` 3.4.17; a lockfile-only
    `pnpm update monaco-editor` applies it once 0.58.0 is stable. Which Monaco actually runs in
    the admin (installed 0.57.0 or CDN 0.55.1 via `@monaco-editor/loader`) is unverified.
  - E-5 esbuild (GHSA-67mh-4wv8-2f99): installed but not loaded (`drizzle-kit/api` and `bin.cjs`
    never load `@esbuild-kit/*`); no upstream fix (Payload 3.93.0 still pins drizzle-kit 0.31.7).
    **Owner decision due by 2026-11-16**: re-date (proposed 2026-12-05) or accept a failing
    supply-chain gate from that date.
  - FSL-1.1 `sentry` CLI (`docs/licences.md`): dependency path and the Lighthouse telemetry
    statement corrected (Lighthouse reuses a cached opt-in answer; it is not off by default).
    **Owner approval pending**; status not changed.
  - T071/T072 task lines now name the real test files. T071 coverage gap recorded: admin
    Copy/Paste Field and Paste Row have no dedicated test.
  - ASVS V15.1.1 and V15.2.1 moved to `partial` with evidence (`docs/security/asvs-l2.md`).
- **Release blockers (as of 2026-11-06)**. Nothing here is a readiness claim; the full
  SC-001…SC-019 mapping is T146 (`docs/launch-readiness.md`, not yet written).
  - Owner decisions: CD-13 Arabic route vocabulary
    (production build gate); CD-12 (T119); CD-10 privacy notice; T132 hosting. (E-5 re-dating and
    FSL-1.1 acceptance decided 2026-11-06.)
  - Open stories: US4 media (T107–T113), US6 SEO and redirects (T114–T119), US5 enquiries
    (T120–T129), US8 operations (T132–T136).
  - Polish: T137 adversarial report (requires 0 open critical/high; E-1 is an excepted critical),
    T138 manual a11y, T140–T146 (T145 supply-chain pass, T146 ASVS and launch readiness).
  - Review findings: L-3 and L-4 partly fixed, L-7 open.
  - Dependency follow-ups before 2026-12-05: `monaco-editor` 0.58.0 (E-1, F-1 closed), E-5
    mandatory review, E-2/E-3/E-4 upstream checks. (E-1 browser check and E-4 write test done
    2026-11-06.)
- **Tests-only security stage (2026-11-06, owner-approved; follows the proposal above)**:
  - **E-1 / finding F-1** — `tests/security/admin-code-editor.spec.ts` (Playwright, production
    build, audit event document view, own seeded account `monacoOwner`): the admin JSON field's
    Monaco editor is **not** the installed `monaco-editor` 0.57.0. `@monaco-editor/loader`'s
    default loads Monaco 0.55.1 from `cdn.jsdelivr.net` (15 scripts, 2 workers via `blob:`),
    allowed by the admin CSP's `'strict-dynamic'`; the CSP blocks only the CDN stylesheet (one
    `style-src-elem` violation). Runtime DOMPurify is 3.2.7 (1 high, 14 moderate, 6 low per OSV;
    the critical GHSA-cg2g-xh64-v4q7 does not apply to 3.2.7). The spec checks the shipped CSP is
    unchanged, pins the observed violation and third-party footprint, and keeps the intended rule
    "no third-party script in the admin" as an expected failure (`test.fail`) until F-1 is fixed.
    CSP not weakened. Fix options (owner decision) in `docs/security/dependency-exceptions.md` E-1;
    `docs/security/TM-admin.md` and ASVS V3.4.3 record the gap.
  - **E-4** — `tests/integration/security/prototype-keys.test.ts` (10 cases, raw JSON through the
    REST router and the Local API; `rest()` gained a `rawBody` option): own `__proto__` and
    `constructor.prototype` keys never satisfy a required field, never smuggle rich text past the
    content policy, never publish (Editor) or change role/status (Administrator), are never
    persisted, and leave `Object.prototype` clean. No sanitization or validation was changed.
  - **Lighthouse** — `tests/perf/lighthouserc.cjs` sets `enableErrorReporting: false`
    (Lighthouse's own flag parser reads the lhci flags file as `false`; unset it is `undefined`).
  - **Owner decisions applied**: FSL-1.1 `sentry` CLI approved for local development tooling only
    (`docs/licences.md`); E-5 esbuild extended 2026-11-16 → 2026-12-05 with a mandatory
    pre-expiry review (`osv-scanner.toml`, exceptions doc). Advisory IDs unchanged.
  - **Verified**: typecheck, lint (0 errors, 3 known warnings), format, unit 373/373, integration
    562/562 (incl. the 10 new), full Playwright 201 passed (incl. the 4 new tests, one an expected
    failure), Lighthouse CI all budgets pass (30 runs;
    LCP 1.35–1.41 s, TBT 64–87 ms, CLS 0, a11y 1.00; two earlier attempts were invalidated by host
    sleep, every run over 18 s). Commit: this entry's commit.

- **F-1 closed (2026-11-06)**: `audit-events.meta` (the only JSON/code field) renders through a
  read-only viewer (`src/modules/audit/admin/JsonViewer.tsx`); a unit guard
  (`tests/unit/security/no-code-editor.test.ts`) fails if any visible JSON/code field uses
  Payload's Monaco editor. Admin CSP without `'strict-dynamic'` and with `worker-src 'self'`
  (ADR-004 Amendment 1), so third-party scripts are refused. Payload's prebuilt client chunk still
  contains Monaco's CDN loader (a build alias cannot reach it); it never runs. The expected-failure
  marker is gone: `tests/security/admin-code-editor.spec.ts` asserts JSON renders as escaped text
  (HTML payload inert), 0 third-party requests and 0 CSP violations on 17 admin views, and an
  injected jsDelivr script refused (`script-src-elem`, never fetched). E-1 now has no runtime
  exposure; ASVS V3.4.3 verified.
- **Reverification (2026-11-06, fresh measurements)**: Lighthouse CI on the post-US4 build: all
  budgets pass, 30 runs (longest 18.3 s), LCP 1.38–1.40 s, TBT 27–57 ms, CLS 0, JS 143 KB, CSS
  6.05 KB, fonts 72/96 KB, performance 1.00, a11y 1.00. The first full Playwright run of this stage
  had 2 failures, both 429s from the shared per-IP MFA budget (30 per 15 min from 127.0.0.1) in
  `content-http.spec.ts` and `public-http.spec.ts`; both now reset rate-limit buckets in
  `beforeAll`, as `us7-nav.spec.ts` does (limits stay tested in `auth-http.spec.ts`). Rerun:
  213 passed, 0 failed, 0 expected failures (8.3 min). Unit 391, typecheck, lint, format.
---

## Phase 2: Foundational (blocking prerequisites; plan Phase 2 part 1)

**Purpose**: pure security policies and shared services every story depends on.

### Rich-text policy (D-22, contracts/rich-text.md)

- [X] T026 [P] Create adversarial corpus `tests/fixtures/richtext/corpus.ts`: `javascript:` variants (mixed case, leading space, tab/newline inside scheme, `%6A`-encoded, `javascript&colon;`, `javascript://x/%0aalert(1)`), `vbscript:`, `data:text/html`, `data:image/svg+xml`, `file:`, `ftp:`, `blob:`, `about:`, `//evil.example`, backslash `\\evil`, `https:\\evil`, >2048-char URL, empty/whitespace link text, unknown node types (`html`, `upload`, `relationship`, `block`, `code`, `horizontalrule`, `iframe`), `heading` tag h1/h5, text `style: "color:red"`, format bits code/strikethrough/underline/sub/sup, extra attributes (`onClick`, `className`, `href` on paragraph), depth 11, 5,001 nodes, link `doc.relationTo: "users"`, `linkType: "raw"`; plus valid baseline docs in ar and en with `direction: rtl|ltr` (FR-013b, FR-014, SC-018)
- [X] T027 [P] Write failing tests `tests/unit/content/richtext/policy.test.ts`: every corpus attack rejected with the error code from the contract (`node_type`, `attribute`, `format`, `style`, `url_scheme`, `url_malformed`, `limit`, `link_text`) and JSON path; valid docs accepted unchanged; errors never echo the raw URL (FR-013b, FR-014, FR-013d)
- [X] T028 [P] Write failing tests `tests/unit/content/richtext/safe-href.test.ts`: `safeHref()` returns `null` for every disallowed URL and the normalised value for `https:`, allow-listed `http:`, `mailto:`, `tel:`, `/path`, `#id` (FR-013c, FR-014)
- [X] T029 Implement `src/modules/content/richtext/policy.ts` (`POLICY_VERSION`, `assertSafeRichText`, `safeHref`, limits depth ≤10, nodes ≤5,000, text ≤10,000, URL ≤2,048) until T027–T028 pass (FR-013b, FR-013c, FR-014)

### Authorization matrix (D-8, contracts/access-matrix.md)

- [X] T030 [P] Encode the matrix as data `src/modules/access/matrix.ts` (roles `owner | administrator | publisher | editor`; every resource/action row of the contract)
- [X] T031 Write failing tests `tests/unit/access/matrix.test.ts` that parse `contracts/access-matrix.md` and assert `can(role, resource, action)` equals every ✓/blank cell (drift detection), plus invariants: no self-escalation, no grant above own role, equal/higher accounts untouchable except owner→owner, last owner protected (FR-036, FR-038, SC-003)
- [X] T032 Implement `src/modules/access/index.ts`: `can()`, deny-by-default collection/global/field access factories, `requireAuth`, `requireMfa` (session `mfaVerified`), anonymous denial for all REST except published-use media files, role-field update rule, until T031 passes (FR-037, FR-038, FR-092, D-3)
- [X] T033 Write failing tests `tests/security/injection.spec.ts`: REST `where`/`sort`/`select` operator abuse, SQL metacharacters in slugs/search, prototype-pollution keys in JSON bodies, oversized bodies → rejected or inert; no 500 with internals (FR-093, FR-095)

### Audit log (D-9)

- [X] T034 Write failing tests `tests/integration/audit/append-only.test.ts`: REST and Local API (`overrideAccess:false`) create/update/delete on `audit-events` denied for every role; direct SQL `UPDATE`/`DELETE` rejected by trigger; retention function deletes only entries older than 24 months (A-9) (FR-047, FR-048)
- [X] T035 Implement `src/modules/audit/collection.ts` (fields: actor, action enum per FR-045, targetType, targetId, outcome `success|denied|failure`, ip, userAgent truncated to 256, meta JSON, at; indexes `(at)`, `(actor, at)`, `(action, at)`, `(targetType, targetId)`) and `src/modules/audit/record.ts` with per-action meta schemas that reject secret-like keys (FR-045, FR-046)
- [X] T036 Create migration `migrations/*_audit_append_only.ts` (trigger + retention function, with `down`) and job `purgeAuditEvents` in `src/modules/audit/retention.ts` until T034 passes (FR-047, FR-048)

### Rate limiting (D-14)

- [X] T037 Write failing tests `tests/integration/platform/ratelimit.test.ts`: Postgres limiter fixed-window counts, atomic under 50 concurrent increments, stores only a hashed key, TTL cleanup job; memory limiter parity; trusted-proxy config ignores spoofed `X-Forwarded-For` (FR-094)
- [X] T038 [P] R-C spike `tests/integration/auth/rc-sessions.test.ts` + `docs/adr/ADR-005-sessions.md`: verify Payload `useSessions` revocation, idle/absolute expiry hooks, lockout settings, enumeration-safe responses; decide built-in vs `sessions` collection (D-7)
- [X] T039 Implement `src/modules/platform/adapters/ratelimit/postgres.ts` + `rate-limit-buckets` migration + `purgeRateLimitBuckets` job until T037 passes (FR-094)

### Admin accessibility baseline (D-25)

- [X] T040 [P] Create admin a11y regression suite `tests/a11y/admin/baseline.spec.ts`: axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) on login, dashboard, list, edit, versions and media views of every collection; snapshot `tests/a11y/admin/baseline.json`; fail on any serious/critical finding not in the baseline (FR-080a, SC-019)
- [X] T041 [P] Create `docs/accessibility/admin-findings.md` seeded from R-A (rule, view, node count, remediation path: upstream / extension point / unresolved, issue link) (FR-080a)

**Checkpoint (Gate 2a)**: policy corpus 100% rejected; matrix tests green; audit append-only
proven at DB level; limiter green; admin baseline recorded → commit checkpoint.

**Foundational implementation notes (WS7, 2026-10-16)**:
- T026–T029: 62 corpus attacks + 4 valid documents; `checkRichText`/`assertSafeRichText`/
  `safeHref` in `src/modules/content`. Write-path and render enforcement (Payload hooks, JSX
  converters) remain T071–T083 as planned.
- T030–T032: the matrix test parses `contracts/access-matrix.md` (20 rows × 4 roles). **Contract
  gaps (denied, not invented)**: `navigation`/`banner` read and `users` read have no row; owner
  decision needed before T065/T131. `requireMfa` reads `user.mfaVerified === true`, which no
  session sets until T061/T062, so all authenticated access is denied until then.
- T033: Local API injection suite (`tests/integration/security/injection.test.ts`) plus a
  real-server suite (`tests/security/injection.spec.ts`). **Finding**: Payload does not escape
  LIKE wildcards in `like`/`contains` (a bare `%` matches all); values remain parameterised.
- T034–T036: append-only enforced by triggers; the owner/superuser bypass is documented in
  `docs/security/audit-log.md`, with a production non-owner role requirement proven by test.
  Retention job registration waits for the jobs runner.
- T037–T039: `rate_limit_buckets` is a migration-only table (not a Payload collection, never
  exposed). The limiter is fail-closed on DB errors. New config `TRUSTED_PROXY_HOPS` /
  `CLIENT_IP_HEADER`; production requires one. `purgeRateLimitBuckets` job registration waits for
  the jobs runner.
- T038: ADR-005. Built-in revocation and absolute expiry confirmed; **gaps**: no idle timeout, and
  account enumeration via `LockedAuth` and timing (≈82 ms vs ≈1 ms) → T062/T063.
- T040–T041: only the login view can render without an admin session (0 serious/critical);
  dashboard/list/edit/versions/media are `fixme` until T056/T061. Added
  `@axe-core/playwright` 4.14.0 (dev, MPL-2.0).

---

## Phase 3: User Story 3 — Administrator controls who can do what (P1) 🎯 MVP (plan Phase 2 part 2)

**Goal**: invitation-only accounts, mandatory TOTP MFA for all, revocable sessions, server-side
RBAC, complete audit trail.
**Independent Test**: quickstart V3–V5 — full role × action matrix via UI and direct requests;
MFA/session/lockout scenarios; audit entries for every event.

### Tests for US3 (write first; must fail)

- [X] T042 [P] [US3] Failing tests `tests/integration/auth/bootstrap.test.ts`: first owner created once from `BOOTSTRAP_OWNER_EMAIL`; refuses when any owner exists; anonymous `POST /api/users` denied; no default credentials in any seed (FR-030)
- [X] T043 [P] [US3] Failing tests `tests/integration/auth/invitations.test.ts`: invitation fields `email, role, tokenHash, expiresAt (72 h), usedAt, invitedBy`; single use; expired/reused/forged token rejected; owners may invite any role incl. owner, every other inviter only roles strictly below their own (attempts above rejected); audited (FR-031, FR-038, FR-045)
- [X] T044 [P] [US3] Failing tests `tests/unit/auth/password.test.ts`: length ≥12 accepted, <12 rejected, breached/common list hit rejected, no composition rules, no forced rotation (FR-032)
- [X] T045 [P] [US3] Failing tests `tests/integration/auth/mfa.test.ts`: factor inactive until a valid code is confirmed; secret absent from every API response (`/api/users/me`, list, versions, GraphQL disabled); DB value encrypted (≠ base32 secret); code replay within the same step rejected; ±1 step window; per-account and per-source attempt limits; 10 recovery codes, stored hashed, single use, regeneration requires re-auth; enrol/reset/remove/recovery-use revokes other sessions, emails the user, writes audit (FR-033, FR-033a, FR-033b, FR-045)
- [X] T046 [P] [US3] Failing attack tests `tests/security/mfa-bypass.spec.ts`: with a password-only session, every collection/global REST route, every admin view, `/preview/*`, and every custom endpoint returns 401/403; a pre-MFA session cannot be promoted by replaying cookies; direct `PATCH /api/users/:id` on `mfa.*` fields denied (FR-033, SC-017)
- [X] T047 [P] [US3] Failing tests `tests/integration/auth/mfa-reset.test.ts`: only administrator/owner on a lower role (owner on owner) can reset; forces re-enrolment; old secret never revealed; audited (FR-033c)
- [X] T048 [P] [US3] Failing attack tests `tests/security/auth-enumeration.spec.ts`: login and recovery responses identical and timing within tolerance for existing vs unknown accounts; throttling after 5 consecutive failures (A-8) escalating; lockout notification email; recovery link single-use and 30-minute expiry; completing recovery revokes all sessions and still requires MFA (FR-034, FR-045)
- [X] T049 [P] [US3] Failing tests `tests/integration/auth/sessions.test.ts` (controlled clock): idle 30 min and absolute 12 h (A-6) expiry; id rotation on login, MFA completion and role change; user and administrator can list and revoke; suspension ends sessions immediately; cookie flags `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix where possible (FR-035, FR-091)
- [X] T050 [P] [US3] Failing tests `tests/integration/auth/reauth.test.ts`: password/MFA/email change, user/role management and security settings require re-auth within 5 minutes (FR-039)
- [X] T051 [P] [US3] Failing attack tests `tests/security/privilege-escalation.spec.ts`: self role raise; raising another above own role; modifying equal/higher accounts; demoting/deleting the last owner; mass assignment of `role`/`status`/`mfa` on create/update; IDOR on `/api/users/:id` and sessions across roles (FR-038, FR-092, SC-003)
- [X] T052 [P] [US3] Failing generated tests `tests/security/authz-matrix.spec.ts`: for every matrix cell, assert UI affordance AND direct REST AND Local API (`overrideAccess:false`) outcome; every denial writes a `denied` audit event (FR-037, FR-045, SC-003)
- [X] T053 [P] [US3] Failing tests `tests/integration/audit/auth-events.test.ts`: each auth/user event in FR-045 yields actor, action, target, timestamp, source address, outcome; meta contains no secrets (FR-045, FR-046, SC-005)
- [X] T054 [P] [US3] Failing attack tests `tests/security/csrf.spec.ts`: cross-origin state-changing POSTs to admin, REST and custom endpoints rejected (FR-091)
- [X] T055 [P] [US3] Failing tests `tests/security/auth-ratelimit.spec.ts`: login, MFA verify, recovery and invitation-accept endpoints limited per account and per source with `Retry-After`; spoofed forwarding headers ineffective (FR-094)

### Implementation for US3

- [X] T056 [US3] Implement `src/modules/auth/users.collection.ts`: `email` unique, normalised lower-case; `name` required; `role` enum; `status` `invited | active | suspended`; `mfa.enabled`, `mfa.secretEnc`, `mfa.enrolledAt`, `mfa.recoveryCodes[] {hash, usedAt}`, `mfa.lastUsedStep` hidden from all reads; Payload lockout fields; field access from `modules/access` (FR-036, FR-092)
- [X] T057 [US3] Implement one-time owner bootstrap `src/modules/auth/bootstrap.ts` + `pnpm bootstrap:owner` until T042 passes (FR-030)
- [X] T058 [US3] Implement invitations collection and accept flow `src/modules/auth/invitations/` until T043 passes (FR-031)
- [X] T059 [US3] Implement `src/modules/auth/password.ts` with an offline common/breached list `data/passwords/common.txt.gz` (source and licence recorded in `docs/licences.md`) until T044 passes (FR-032)
- [X] T060 [US3] Implement MFA `src/modules/auth/mfa/{totp.ts,crypto.ts,recovery.ts,endpoints.ts}` (otplib pinned; SHA-1/6 digits/30 s/±1; AES-256-GCM with `MFA_ENCRYPTION_KEY`; scrypt or argon2id recovery hashes) until T045, T047 pass (FR-033a, FR-033b, FR-033c)
- [X] T061 [US3] Implement accessible English admin views `/admin/mfa/enrol` and `/admin/mfa/verify` as Payload custom views (labels, `autocomplete="one-time-code"`, errors announced via live region, focus moved to first error); wire `requireMfa` into every access function, preview and custom endpoint until T046 passes (FR-033, FR-080, FR-080a)
- [X] T062 [US3] Implement sessions per ADR-005 in `src/modules/auth/sessions/` until T049 passes (FR-035, FR-091)
- [X] T063 [US3] Implement enumeration-safe login, lockout and recovery `src/modules/auth/{login.ts,recovery.ts}` with bilingual notification email templates `src/modules/auth/emails/` until T048, T055 pass (FR-034, FR-005, FR-094)
- [X] T064 [US3] Implement re-auth guard `src/modules/auth/reauth.ts` until T050 passes (FR-039)
- [X] T065 [US3] Implement user-management admin actions (invite, suspend, revoke sessions, reset MFA, change role) and session list view `src/modules/auth/admin/` until T051, T052 pass (FR-035, FR-038)
- [X] T066 [US3] Implement audit hooks `src/modules/audit/hooks/auth.ts` for all auth/user events and denied attempts until T053 passes (FR-045)
- [X] T067 [US3] Implement audit admin view with filters (actor, action, target, date range) and audited CSV export `src/modules/audit/admin/` (FR-047)
- [X] T068 [US3] Implement owner-only `security-settings` global (session timeouts, lockout thresholds within safe bounds) `src/modules/auth/security-settings.global.ts` (FR-035, FR-036)
- [X] T069 [US3] Write `docs/security/TM-auth.md` and update ASVS V6/V7/V8/V11 rows in `docs/security/asvs-l2.md` with test evidence links (FR-097)
- [X] T070 [P] [US3] Write runbooks `docs/runbooks/first-owner-bootstrap.md` and `docs/runbooks/lockout-recovery.md` (FR-103)

**Checkpoint (Gate 2)**: T042–T055 green; SC-003 100%; SC-017 green; T053 green; no regressions in
T026–T041 → commit checkpoint (plan Phase 2 complete).


**US3 implementation notes (WS8, 2026-10-16)**:
- Permissions: owner-approved rows added (navigation/banner read, create, delete; users directory
  read), with contract, matrix and drift test updated together.
- T056: MFA secrets and recovery codes live in `user_mfa`/`mfa_recovery_codes` (not hidden users
  fields), so no Payload API, query or `select` can reach them; `sessions` stripped from
  user-context reads. Payload lockout (`maxLoginAttempts`) disabled in favour of the per-account
  limiter (ADR-005).
- T058/T061: invitation acceptance, MFA, recovery and security pages are Next pages under
  `/account/*`. Payload custom admin views only render for signed-in users. The admin gets an
  MFA-gate provider (redirect, UX only) and a user-edit "security actions" field.
- T062: Payload sessions + `auth_sessions` state; the `altamiuz-session` strategy enforces
  MFA, 30 min idle and 12 h absolute, and deletes rejected sessions so the built-in strategy
  cannot accept them. Login and `/me` overridden by static routes; refresh-token,
  forgot/reset-password, unlock, verify and first-register blocked.
- Password change: Payload ends **all** sessions (including the current one); tests assert this.
- T048/T063: failures padded to 400 ms after equal hash work; measured median spread 1 ms
  (`test-results/auth-timing.json`), not assumed.
- T052: role × action asserted via Local API (`overrideAccess:false`) and real HTTP for the
  collections that exist (users, invitations, audit-events, security-settings). **Gap**: no
  systematic UI-affordance assertions; content/media/nav cells await their collections (matrix
  unit-tested).
- T067: the Payload list view provides filters; `GET /api/audit-events/export` (CSV,
  formula-neutralised, re-auth, audited `audit.export`).
- T049: `__Host-` prefix and `Secure` apply only with an https `SITE_URL`; asserted absent on local
  http, unverified on https until a preview/production host exists.
- Admin a11y: authenticated core views now baselined; `/account/*` pages asserted at 0
  serious/critical.
- **Findings**: Payload 3.91.0 `migrate:reset` runs downs oldest-first (use `migrate:down`); the
  Drizzle-generated accounts `down` needed `IF EXISTS` fixes; enum downgrades fail once new
  values are used (documented).
---

## Phase 4: User Story 2 — Editor composes, previews, publishes (P1) (plan Phase 3)

**Goal**: schema-defined bilingual pages/services/courses with safe rich text, drafts, per-locale
publishing, revisions, locking, preview, accessible reordering.
**Independent Test**: quickstart V2 + rich-text suites + reorder/editor a11y suites.
**Depends on**: Phase 3 (US3).

### Tests for US2 (write first)

- [X] T071 [P] [US2] Failing attack tests `tests/integration/content/richtext-writepaths.test.ts` (Local API, REST, draft/autosave, duplicate, copy-to-locale, version restore, bulk edit, nested and `link`-group fields) and the admin-paste Playwright test in `tests/security/content-http.spec.ts` (planned as `tests/security/richtext-writepaths.spec.ts`; corrected 2026-11-06): T026 corpus submitted via admin paste (Playwright), REST create/update, Local API, draft save, autosave, duplicate, copy-to-locale, version restore of a malicious historical version inserted by SQL, admin bulk edit, admin Copy/Paste Field and Paste Row, nested rich text in blocks/arrays, `link`-group fields, both locales — all rejected with field path and code; nothing persisted (FR-013b, FR-014, SC-018). **Coverage gap (found 2026-11-06)**: no test exercises admin Copy/Paste Field or Paste Row by name; both save through Payload's update operation, which the REST and Local API cases cover, but that is inferred, not tested
- [X] T072 [P] [US2] Failing tests `tests/unit/content/render.test.ts` (renderer, all inert-output cases) and `tests/security/public-http.spec.ts` ("stored malicious rich text renders inert on the public page"; preview uses the same `DocumentView`, checked byte-for-byte by T073 in `tests/security/content-http.spec.ts`) (planned as `tests/security/richtext-render.spec.ts`; corrected 2026-11-06): malicious Lexical JSON written directly to the DB renders on the public page and preview with no unsafe `href`, no unknown elements, no inline `style`; `newTab` links get `rel="noopener noreferrer"` (FR-013c, SC-018)
- [X] T073 [P] [US2] Failing tests `tests/e2e/richtext-bidi.spec.ts`: ar/en paragraphs honour `direction`; Latin identifiers isolated; preview HTML equals public HTML for the same document; every link has non-empty text (FR-013a, FR-013d)
- [X] T074 [P] [US2] Failing tests `tests/integration/content/publish.test.ts`: publishing `ar` leaves `en` draft (`experimental.localizeStatus`); public queries never return drafts; unpublish per locale; restore creates a draft; publish blocked when required locale fields are incomplete or evidence is unverified; editor publish via REST denied and audited (FR-004, FR-016, FR-020, FR-021, FR-023, FR-024, FR-045)
- [X] T075 [P] [US2] Failing tests `tests/integration/content/localize-status-regression.test.ts`: asserts installed Payload version equals ADR-003 pin and per-locale status semantics hold (D-4)
- [X] T076 [P] [US2] Failing tests `tests/e2e/locking.spec.ts`: second editor sees lock; no silent overwrite (FR-015)
- [X] T077 [P] [US2] Failing attack tests `tests/security/preview.spec.ts`: anonymous, password-only and no-read-permission sessions denied; preview responses `noindex`; no shareable-link endpoint exists (FR-022)
- [X] T078 [P] [US2] Failing tests `tests/a11y/admin/reorder.spec.ts`: keyboard-only move up/down for blocks, gallery items and listing order; announcement "Moved {label} to position {n} of {total}"; focus stays on moved item; order persists after save + reload; single-pointer alternative; axe clean on the control (FR-012, FR-055, FR-080, FR-080a)
- [X] T079 [P] [US2] Failing tests `tests/a11y/admin/editor.spec.ts`: visible focus indicator on the rich-text editor; Escape+Tab exit described in field help; on validation failure focus moves to first invalid field, which has `aria-invalid="true"` and an announced message (FR-080a)
- [X] T080 [P] [US2] Failing tests `tests/integration/content/collision.test.ts`: slug equal to or prefixing a static route segment, duplicate slug in same locale/scope, or slug equal to an active redirect `from` → rejected; slug change creates a redirect (FR-002, FR-025)

### Implementation for US2

- [X] T081 [US2] Implement shared editor config `src/modules/content/richtext/editor.ts`: Lexical features allow-list (paragraph, heading h2–h4, bold, italic, ordered/unordered list, blockquote, link with `url` validate override via `LinkFeature({ fields })`) (FR-013, FR-013a)
- [X] T082 [US2] Implement `richTextField()` factory applying `hooks.beforeChange: assertSafeRichText` and `validate`; set `versions.drafts.validate: true` on all versioned collections/globals until T071 passes (FR-013b)
- [X] T083 [US2] Implement safe renderer `src/ui/richtext/RichText.tsx` (custom JSX converters: `link`/`autolink` via `safeHref` → plain text when null; unknown nodes → nothing; `<bdi>` for inline Latin runs) used by preview and public site until T072–T073 pass (FR-013c, FR-013d, D-24)
- [X] T084 [US2] Implement read-only `scripts/scan-richtext.ts` (`pnpm scan:richtext`, non-zero exit on violations) and add it to migration/restore runbooks (FR-013c)
- [X] T085 [US2] Implement block library `src/modules/content/blocks/` per data-model (hero, richText, featureGrid, serviceList, courseList, cta, faq, mediaGallery, stats+evidence, credentials+evidence, contactBlock; each with `hidden` and `anchorId`; testimonials/clientLogos not registered until CD-08); the shared `link` group (hero/CTA/nav/social/banner) validates `url`/`email`/`tel` with `safeHref` on save, with corpus cases added to T071 (FR-011, FR-012, FR-014, FR-019)
- [X] T086 [US2] Implement `evidence` group and publish gate `src/modules/content/evidence.ts` (status `unverified|verified`, reference required if verified, verifiedBy, verifiedAt; only administrator/owner may set `verified`) (FR-016)
- [X] T087 [US2] Implement `pages` collection: `title` L required to publish; `slug` L "unique per locale and route scope; NFC; `^[\p{L}\p{N}-]+$`u"; `template`; `sections`; `seo` L; collision validator (T080) (FR-002, FR-010, FR-011)
- [X] T088 [US2] Implement `services` and `courses` collections: common `title` L, `slug` L, `summary` L (≤300), `sections`, `order`, `hidden`, `seo` L; course `audience` L, `duration {value, unit}`, `deliveryFormat` (`in-person|online|hybrid`), `provider` L, `accreditationStatement` L + evidence (FR-017)
- [X] T089 [US2] Implement publish workflow hooks (localizeStatus, unpublish, restore→draft, publish/unpublish/restore audit, revalidation tags) and version retention job `pruneVersions` per A-11 with R-E decision `docs/adr/ADR-006-versions.md` until T074 passes (FR-020, FR-021, FR-023, FR-024, FR-045)
- [X] T090 [US2] Implement slug-change redirect hook `src/modules/seo/redirects/slug-change.ts` until T080 passes (FR-025)
- [X] T091 [US2] Implement preview route `src/app/preview/[collection]/[id]/route.ts` (draft mode, `requireMfa`, read check, `noindex`) until T077 passes (FR-022)
- [X] T092 [US2] Implement accessible reorder control `src/modules/content/admin/ReorderControl.tsx` as a custom array/blocks row component (supported extension point) with live region; apply to blocks, gallery arrays and listing `order` until T078 passes (FR-012, FR-055, D-12)
- [X] T093 [US2] Admin a11y remediations via extension points: focus styles in `src/app/(payload)/custom.scss`, field help text, error-focus component; file upstream issues for core findings and record links in `docs/accessibility/admin-findings.md` until T079 passes (FR-080a)
- [X] T094 [US2] Write `docs/security/TM-preview.md` and `docs/security/TM-admin.md`; update ASVS V1/V2/V4 rows (FR-097)

- [X] T094a [US2] Corrective (WS10, D-22 / data-model "Drafts are validated (`versions.drafts.validate: true`)"): enable draft validation on `pages`, `services`, `courses`. Test first in `tests/integration/content/draft-validation.test.ts`: required fields, slug rules and limits on draft create/update via the Local API and REST (incl. autosave flag), per locale, with the rich-text policy still enforced. Reimplement restore as per-locale validated draft updates in one transaction (`restoreAsDraft`), because Payload's `restoreVersion` validates only the default locale (FR-004, FR-013b, FR-024)
- [X] T094b [US2] Corrective (WS10, FR-015, FR-033): server-enforced optimistic concurrency (409 on a stale base `updatedAt`, `tests/integration/content/concurrency.test.ts` + admin e2e); lock REST hardening via a project route (MFA-verified, own-lock delete, take-over to self, minimal user data); admin server functions require completed MFA; session metadata non-enumerable (`tests/integration/auth/session-metadata.test.ts`); verified-evidence metadata server-held. Autosave stays off (ADR-006 §3)
- [X] T094c [US2] Corrective (2026-10-28, WS11 M-2 follow-up, FR-020, FR-021): a duplicate is always an unpublished draft in **every** locale. With `localizeStatus`, Payload's duplicate copied the source's `_status` for every locale other than the request locale, so any role allowed to create (Editor included) could produce a page published in the other language, including through the admin Duplicate action. Fixed with a `beforeDuplicate` hook on Payload's own `_status` field (`statusDraftOnDuplicate`). Tests exercise the real operation in `tests/integration/content/duplicate.test.ts`: all four roles, Local API draft/non-draft, REST (admin action body, `selectedLocales`, `publishAllLocales`/`publishSpecificLocale`/`_status=published` bypass attempts), `services`, password-only session refused, `redirects` duplicate gated by its create permission (Administrator/Owner only)

**Checkpoint (Gate 3)**: T071–T080 green; SC-018 green on write and render paths;
publish-to-live wiring ready for T106 → commit checkpoint.

**US2 implementation notes (WS9, 2026-10-16)**:

- Test files differ from the planned names but cover the same tasks:
  - T071: `tests/integration/content/richtext-writepaths.test.ts` (85 cases), plus admin paste in
    `tests/security/content-http.spec.ts`.
  - T072: `tests/unit/content/render.test.ts`.
  - T073: `render.test.ts` and `content-http.spec.ts`. The preview `<article>` equals the
    `DocumentView` output byte for byte.
  - T074, T075: `tests/integration/content/publish.test.ts`.
  - T076, T077: `content-http.spec.ts`.
  - T078, T079: `tests/a11y/admin/content-editing.spec.ts`.
  - T080, T084, T089 (prune): `tests/integration/content/slugs-ops.test.ts`.
  - Role matrix, IDOR, anonymous REST and locale confusion:
    `tests/integration/content/access.test.ts` (99 cases).
- Deviations, all recorded in ADR-006:
  - ~~`drafts.validate: false`, not `true` (T082)~~ **withdrawn in WS10 (T094a)**: drafts are
    validated, as D-22 requires.
  - **Autosave off**: Payload 3.91.0 deletes the lock on every save, which defeats FR-015.
  - Restore always creates a draft, through an overridden `POST /versions/:id` and
    `restoreAsDraft()`, because the Local API drops `draft`.
- The preview route is a page, `src/app/(preview)/preview/[collection]/[id]/page.tsx`, not a
  route handler. The admin "Preview" link points to it. There is no draft-mode or token
  endpoint.
- Minimal prerequisites pulled forward:
  - `redirects` collection (T118 scope: `from`, `to`, `type`, `source`).
  - `STATIC_SEGMENTS` / `RESERVED_SEGMENTS` in `src/modules/i18n/routes.ts` (T098). The Arabic
    segments stay `TODO(AR_ROUTE_VOCAB)` per D-5.
- Deferred:
  - US4: `mediaGallery` block, image fields, gallery reorder.
  - CD-08: testimonials and clientLogos.
  - US1: public page route. "Preview equals public" is proven through the shared renderer.
  - US7: navigation/banner globals and their permissions.
- T093: upstream issues are drafted in `docs/accessibility/admin-findings.md` and **not filed**,
  because filing is an external action.
- Hardening found while testing:
  - Structural rich-text check in `beforeOperation`. Malformed `children` caused a 500 inside
    Lexical's hooks.
  - Renderer depth cap.
  - Slug-change redirects now compare against the live document and re-point chains.
  - `ErrorFocus` handles toast-only failures.
  - Gravatar disabled.


---

## Phase 5: User Story 1 — Visitor reads the site in their language (P1) (plan Phase 5, public part)

**Goal**: bilingual public site with localized routes, switcher, typography, error pages.
**Independent Test**: quickstart V1; route-map and CD-13 gate tests.
**Depends on**: US2 (content) and US7 globals T130–T131 (header/footer navigation and site settings are CMS-managed, FR-010). Execute T130–T131 before T103.

- [X] T095 [P] [US1] Failing tests `tests/unit/i18n/routes.test.ts`: `href()` for every route key × locale; no duplicate segment per locale; `pnpm check:route-vocab` fails while any `TODO(AR_ROUTE_VOCAB)` placeholder remains (CD-13 publication gate) (FR-002)
- [X] T096 [P] [US1] Failing tests `tests/public/us1-locale.spec.ts` (Playwright projects `public`, `public-webkit`; planned as `tests/e2e/us1-locale.spec.ts`): `<html lang dir>` per locale; switcher reaches the same document's other-locale slug; missing locale → localized notice, switcher disabled; `/` redirects per A-3; no horizontal scroll at 320/768/1440 px; touch targets ≥24×24 CSS px (FR-001, FR-003, FR-004, FR-007, SC-001)
- [X] T097 [P] [US1] Failing tests `tests/public/no-js.spec.ts` (Playwright projects `public`, `public-webkit`; planned as `tests/e2e/no-js.spec.ts`): content and navigation readable with JavaScript disabled; the 404 for missing pages, unknown locales and malformed paths is server-rendered with status 404, `lang`/`dir`, heading and links home, and `/admin`, `/api`, previews and locale homes are unaffected (FR-008, FR-082)
- [X] T098 [US1] Implement typed route map `src/modules/i18n/routes.ts` (`href(routeKey, locale, params)`; Arabic segments `TODO(AR_ROUTE_VOCAB)` until CD-13) and `pnpm check:route-vocab` until T095 passes (FR-002, D-5)
- [X] T099 [US1] Implement locale routing in `src/proxy.ts` (A-3 root redirect with `Vary`, cross-locale segment → 404) (FR-002, FR-003)
- [X] T100 [US1] Implement UI strings `src/modules/i18n/messages/{ar,en}.ts` and formatters (one documented numeral convention per locale) (FR-005, FR-006)
- [X] T101 [US1] Self-host fonts `src/ui/fonts.ts` via `next/font/local` (Manrope, Inter, IBM Plex Sans Arabic ≤3 weights; unmodified OFL files; licences in `public/fonts/LICENSES/`) and failing-then-passing `tests/perf/fonts.test.ts` asserting ≤120 KB woff2 per locale first load (D-24). **Partly done 2026-10-29**: owner instruction to source the fonts from Google Fonts, so `src/ui/fonts.ts` uses `next/font/google` (files downloaded at build and served from this origin; no runtime Google requests; CSP `font-src 'self'` unchanged; the build needs network access to Google Fonts). Manrope 600/700, Inter 400/600, IBM Plex Sans Arabic 400/700 (two weights: 400/600/700 measured 146 KB on Arabic pages, over budget). Not preloaded, so a page fetches only its own script's faces. Measured first load: English 72,868 B, Arabic 95,292 B. Test: `tests/public/fonts.spec.ts` (planned as `tests/perf/fonts.test.ts`; downloads only exist in a browser): same-origin only, ≤120 KB per language, no other-script face, faces applied. **Licences verified 2026-11-04**: the name tables of all 21 `.woff2` files the build serves (read with fontTools and re-checked on every run) carry the OFL licence URL and the copyright of their family; the files are byte-identical to Google Fonts' current files (unmodified); the copyright strings match the Google Fonts catalogue (`METADATA.pb`, licence `OFL`). The official `OFL.txt` of each family is copied byte-for-byte from `google/fonts` to `public/fonts/LICENSES/` (served at `/fonts/LICENSES/…`); provenance, upstream commits, hashes, the differing header years and IBM Plex's Reserved Font Name "Plex" are recorded in `docs/licences.md` ("Fonts"). Test: `tests/public/fonts.spec.ts` ("every served font file carries its OFL licence URL and copyright…", WOFF2 reader `tests/support/woff2-names.ts`) (D-24)
- [X] T102 [US1] Implement design tokens and section renderers `src/ui/**` (server components, `clamp()` type scale, Arabic line-height 1.7, reduced-motion support, no flashing; every `link`-group `href` rendered via `safeHref`) (FR-014, FR-081). Done 2026-10-29: `src/app/(site)/site.css` (tokens; brand values in one block, **provisional until CD-09**; logical properties only; Arabic line-height 1.7, headings 1.45, small text ≥15 px; nothing animates) and `src/ui/sections/Sections.tsx` / `src/ui/site/Chrome.tsx` (hero and CTA bands with buttons, card grids for features, credentials and service/course listings, stats, FAQ, contact panel, page header, banner, header, footer from published site settings only). Evidence: Chromium at 320/375/768/1440 px and WebKit at 375/1440 px, both languages, home, listings, details, missing-translation and 404 (66 page loads): no horizontal overflow, no failed requests, no axe serious/critical findings (WCAG 2.2 AA tags), no target under 24 px. Fixed on the way: the unavailable-language note rendered scrambled (it inherited the other language's `dir`; regression check in `tests/public/us1-locale.spec.ts`) and the missing-translation page had no `<title>`
- [X] T103 [US1] Implement public routes `src/app/(site)/[locale]/` (home, `[slug]`, services and training listings/details from published, non-hidden items in editor order) (FR-018, FR-021)
- [X] T104 [US1] Implement localized `not-found` and `error` pages without internal details (FR-008, FR-095). Document requests for missing public paths get a complete server-rendered 404 from the proxy (`src/ui/site/not-found-document.ts`); the in-app `not-found.tsx` serves client-side navigations
- [X] T105 [US1] Run T096–T097 green and record axe results for public templates in `tests/a11y/public/baseline.json` (FR-080). Done 2026-11-04: `tests/a11y/public/baseline.spec.ts` (Playwright project `a11y-public`, part of `pnpm test:a11y`) measures 13 templates × languages (home, page, service and training listings and details, missing translation, 404) at 375 and 1440 px with axe-core 4.14 (WCAG 2.0/2.1/2.2 A and AA tags): **0 violations of any impact** on all 26; axe best-practice findings are recorded in `baseline.json` (all empty) and may not grow. Remediated on the way: the skip link was not the first focusable element (the banner's dismiss button came first, WCAG 2.4.1), and the 404 page's link block duplicated the "Main navigation" landmark name. Keyboard checks: skip link first, visible on focus, moves focus into `#main`; every focused link shows a ≥2 px focus outline. Chromium only; manual screen-reader and keyboard script remains T138
- [X] T106 [US1] Failing-then-passing SC-009 checks in `tests/security/public-http.spec.ts` ("SC-009: …": published change visible ≤60 s, draft save never public) and `tests/security/cache-invalidation.spec.ts` (WS11 M-1: unpublish per locale and of all locales (the admin action), delete, replacing publish in `en` and `ar`, `en`/`ar` service listing and detail, language-switcher alternates, navigation and redirect changes take effect immediately, for document requests and client-side (RSC) navigations; public HTML is never shared-cacheable). Planned as `tests/integration/content/revalidate.test.ts`; the data cache only exists in a Next server, so these run over HTTP against a production build. With `revalidateTag(tag, 'max')` instead of `{ expire: 0 }`, 8 of the 9 write cases fail; the redirect case passes either way because missing paths are resolved uncached by the proxy (SC-009)

**US1 implementation notes (WS10, 2026-10-17, partial — Gate 4 not reached)**:

- Done:
  - T095/T098: typed route map, `matchRoute`, `pnpm check:route-vocab`. Production config refuses
    to start while CD-13 is pending.
  - T099: A-3 root redirect (`Vary`, `private, no-store`) and remembered-language cookie.
  - T100: messages ar/en and formatters (`docs/i18n/numerals.md`, proposed, pending owner
    review).
  - T103: public routes `src/app/(site)/[locale]/` over the published-only read path
    `src/modules/content/public.ts`, plus runtime redirects.
  - T104: localized not-found/error pages.
  - T106: SC-009 covered by `tests/security/public-http.spec.ts`. Cache tags plus `revalidate: 60`.
    Writes expire their tags with `revalidateTag(tag, { expire: 0 })` (`src/modules/platform/cache.ts`):
    Next 16.3.8 `'max'` is stale-while-revalidate and would serve an unpublished or replaced
    document at least once more. Route-handler revalidations run after the handler returns, i.e.
    after the Payload transaction commits. Scope: the tag manifest is per server process.
  - T130/T131 (pulled forward, required before T103): globals `site-settings`, `header-nav`,
    `footer-nav`, `banner`. Server tests are in `tests/integration/content/globals.test.ts`; the
    admin-UI parts of T130 are split into T130a (done 2026-10-29, `tests/e2e/us7-nav.spec.ts`).
- T096/T097: `tests/public/{us1-locale,no-js}.spec.ts` (Chromium and WebKit).
- Not done:
  - **T101 fonts**: Google Fonts via `next/font/google` since 2026-10-29 (owner instruction);
    licences verified against the served files 2026-11-04 (done).
  - **T102**: done 2026-10-29; brand values stay provisional until CD-09.
  - ~~**T105 public axe baseline**~~ done 2026-11-04.
  - ~~**T139 Lighthouse CI**~~ done 2026-11-04.
- ~~Known limitation: without JavaScript the 404 body is empty~~ **resolved 2026-10-28**. Next
  16.3.8 renders any page that throws `notFound()` as an empty `__next_error__` recovery shell and
  resets a proxy rewrite's status to 200. The proxy therefore resolves public document requests
  with the page's own resolution (`src/modules/content/resolve.ts`, uncached reads in
  `route-status.ts`) and answers a definite miss itself with the localized 404 document, or
  follows a stored redirect. RSC navigations, `/admin`, `/api`, `/preview`, `/account` and other
  reserved segments are never resolved there. Cost: one extra indexed query per public document
  request. Tests: `tests/public/no-js.spec.ts`, `tests/unit/i18n/locale-proxy.test.ts`.
- CD-13 (2026-10-28): the production build gate fails closed. Only an explicit
  `APP_ENV=development|test|preview` skips it, so a host building without `APP_ENV` cannot ship
  the placeholder vocabulary. `tests/unit/i18n/routes.test.ts` runs `pnpm check:route-vocab`
  (fails on the placeholders, passes on an approved copy of the vocabulary) and a real
  `next build` with `APP_ENV=production` (fails before compiling). CI runs the script in the
  `publication-gate` job, which stays red until the owner approves the vocabulary.

**Review findings (2026-10-28, low severity; L-1, L-2, L-5 fixed and L-3, L-4 partly fixed 2026-11-04; L-6 fixed; L-7 open)**:

- ~~L-1 Evidence verification is not bound to the claim text~~ **fixed 2026-11-04**: every
  evidence group holds a server-set `claimDigest` (SHA-256 of the claim in every language, taken
  at verification). Any write that changes the claim in any language (edit, restore, copy to
  locale, including whitespace) resets the evidence to unverified; client-sent status, verifier,
  time or digest are never trusted; a duplicate starts unverified. Collection/global hooks run
  before field hooks, so an after-write backstop (`storedClaimProblems`) refuses any publish whose
  stored claims are unverified or no longer match (rolls back). Existing verifications predating
  the `claim_digest` column (migration `20261104_143748_evidence_claim_digest`) carry no digest
  and must be re-verified before their next publish. Tests:
  `tests/integration/content/evidence-binding.test.ts` (courses, stats/credentials blocks incl.
  Arabic edits and dates, site settings, same-request change + publish, forged fields, duplicate
  via Local API and REST); with the reset and backstop disabled 8 of its 10 L-1 tests fail.
- ~~L-2 The admin copy-to-locale action can publish the target locale~~ **fixed 2026-11-04**: the
  admin server-function wrapper runs Payload's `copy-data-from-locale` handler inside a scope
  (`src/modules/content/locale-copy.ts`) in which the content and global workflow hooks force a
  plain draft save of the target language. Publishing the copy stays a separate,
  permission-checked, audited act under contracts/access-matrix.md (Publisher+ for pages,
  services and courses; Administrator/Owner for navigation, banner and settings). An Editor's copy
  now succeeds as a draft. Tests run Payload's real handler for all four roles (target language
  never published, source untouched; without the scope all four fail); a copied claim loses its
  verification. Upstream findings, not fixed here: in Payload 3.91 copy-to-locale for **globals**
  throws before writing (`payload.globals[slug]` is undefined), for every role; and without the
  drawer's "overwrite" option Payload copies only into fields that already exist in the target
  language, so a first translation fails required-field validation. Still not exercised through
  the admin UI drawer by a browser test.
- L-3 **partly fixed 2026-11-04**: out-of-band writes (SQL restore, scripts) still do not expire
  cache tags, measured: visible after 62–64 s (`revalidate: 60`). New:
  `POST /api/ops/expire-public-cache` (Administrator/Owner, completed MFA, same-origin, audited as
  `cache.expire`, migration `20261105_171113_audit_cache_expire`) expires every public tag at once;
  procedure in `docs/runbooks/cache.md`. Tests: `tests/integration/platform/cache-expire.test.ts`
  (four roles, anonymous, password-only, cross-origin) and `tests/security/cache-invalidation.spec.ts`
  (stale after a SQL write, fresh after the call). **Hosting-dependent, open**: the tag manifest is
  per server process; a multi-instance host needs a shared cache handler (T132).
- L-4 **partly fixed 2026-11-04**: public 404 probing is now limited per client (60 misses per
  minute, then `429` with `Retry-After` and no database work; `src/modules/security/miss-limiter.ts`,
  tests `tests/unit/platform/miss-limiter.test.ts` and `tests/unit/i18n/locale-proxy.test.ts`).
  Shared fallback addresses (`unidentified`, `invalid`) are never limited, so one client cannot
  block everyone behind them. **Hosting-dependent, open**: the client address is only known when
  `TRUSTED_PROXY_HOPS`/`CLIENT_IP_HEADER` are set for the real edge (unset locally, so the limit is
  inactive there); the counter is in memory per process; the per-request lookup cost (one indexed
  query per public document request, up to four on a miss) remains, and edge rate limiting or
  caching is the hosting-level control (T132).
- ~~L-5 The proxy's 404 document uses minimal inline styles~~ **fixed 2026-11-04**: a document
  request for a missing public path gets the real styled 404 (site header, navigation, banner,
  footer, design system, fonts, `lang`/`dir`) with status 404 and no JavaScript needed. The proxy
  fetches `/{locale}/~404` (a page `~` keeps out of every content slug) from `SITE_URL`, never from
  the request's Host header, with a key derived from `PAYLOAD_SECRET`, and returns it with that
  page's own CSP (its nonce), `no-store` and `X-Robots-Tag: noindex`. Without the key
  `/{locale}/~404` is itself an ordinary 404; a request already carrying the key header never
  triggers another fetch (no loops). If the fetch fails, times out (3 s), redirects or lacks a CSP,
  the self-contained document is served as before. Client-side navigations use the same
  `NotFoundView`. Tests: `tests/unit/i18n/locale-proxy.test.ts` ("styled 404 page (L-5)": origin,
  Host spoof, key, loop guard, fallbacks) and `tests/public/no-js.spec.ts` (11 missing-path cases
  × Chromium/WebKit: header, footer, navigation, design-system button style, `X-Robots-Tag`).
  Remaining: on a miss the server renders the 404 page through one extra internal request; behind
  a CDN that request goes to `SITE_URL` (hosting decision, T132). Unchanged: browsers without Fetch
  Metadata send no `Sec-Fetch-Dest`, so their client-side navigations to a missing page fall back
  to a full page load of the same 404.
- L-6 (fixed) Test isolation: the cache spec's navigation case replaced the seeded `header-nav`
  and never restored it, so `public` tests run after `security` lost their menu link (T097 and
  the "published globals" check). It now restores the seeded menu. Separately, the users and pages
  lists now exceed one page in a full e2e run, so Payload's unnamed pagination arrows (A-04
  family, `docs/accessibility/admin-findings.md`) are baselined for `list:users` and
  `list:pages`; the baseline is keyed by rule, so it cannot tell these from new unnamed buttons
  on those lists.
- L-7 Lint warnings that predate this change: anonymous default export in `next.config.ts`,
  `window.location.assign` in `MfaGate.tsx` and `auth/ui/forms.tsx`.

**Checkpoint (Gate 4)**: US1 green; Lighthouse CI budgets (T139) configured and passing for existing templates and enforced in CI from here on (Constitution XII); CD-13 gate active (fails production build until approved) → commit checkpoint.

---

## Phase 6: User Story 4 — Media once, reused everywhere (P2) (plan Phase 4)

**Depends on**: US3 (auth), US2 (reorder control).

- [X] T107 [P] [US4] Create fixture generator `tests/fixtures/uploads/generate.ts`: JPEG/HTML polyglot, SVG with `<script>`, PNG decompression bomb, 21 MB file, 41 MP image, `.jpg` that is a PDF, EXIF-GPS JPEG, truncated file (FR-051)
- [X] T108 [P] [US4] Failing attack tests `tests/security/upload.spec.ts`: every malicious fixture rejected with localized message and nothing stored; unauthenticated/no-permission upload denied; EXIF absent from master and variants; random 128-bit filenames; draft-only media not anonymously retrievable; interrupted upload leaves no asset (FR-051, FR-052, FR-056)
- [X] T109 [P] [US4] Failing tests `tests/e2e/us4-media.spec.ts`: variants generated; focal point respected at 3 aspect ratios (numeric focal inputs usable by keyboard); alt per locale or `decorative` required to publish; usage panel; delete warning + permission; replace updates all uses; keyboard reorder of gallery via ReorderControl (FR-050, FR-053, FR-054, FR-055, FR-057)
- [X] T110 [US4] Implement `src/modules/media/` upload collection + validation hook (magic-byte allow-list "JPEG, PNG, WebP, AVIF; maximum 20 MB and 40 megapixels"; sharp re-encode without metadata; random names; variants 480/768/1024/1440/1920 in AVIF/WebP + JPEG fallback) until T108 passes (FR-050, FR-051, FR-052)
- [X] T111 [US4] Implement public-read rule (only media referenced by a published document) and storage adapter selection (`local` | `s3`) (FR-056)
- [X] T112 [US4] Implement usage tracking, replace, delete warning with media-deletion audit in `src/modules/media/usage.ts` until T109 passes (FR-045, FR-053, FR-054, FR-057)
- [X] T113 [US4] Write `docs/security/TM-media.md`; update ASVS V5 (FR-097)

**Checkpoint (Gate 5)**: US4 green → commit checkpoint.

**US4 implementation notes (2026-11-06)**:

- T107 `tests/fixtures/uploads/generate.ts`: generated in memory (no hostile binaries committed);
  adds a real-PNG-declared-as-JPEG case. T108 `tests/security/upload.spec.ts` (6, HTTP, production
  build); T109 `tests/e2e/us4-media.spec.ts` (7, admin UI); plus
  `tests/integration/media/upload.test.ts` (19) and `tests/unit/media/*.test.ts` (16).
- T110 `src/modules/media/`: `sniff.ts` (leading bytes), `validate.ts` (size, active-content scan,
  decoded format must match, 40 MP before decode, full decode, re-encode without metadata, random
  128-bit name), `collection.ts` (15 variants 480–1920 × AVIF/WebP/JPEG without enlargement, focal
  point as 0–100 numeric inputs, `pasteURL: false`, client file keys dropped), migration
  `20261106_100933_media` (generated; its `down` constraint drops made `IF EXISTS` because the
  `media` table drop cascades). Blocks: `hero.media`, new `mediaGallery` (ordered `{media,
  caption}` with ReorderControl), `credentials.items.logo`. Public rendering `src/ui/media/Picture.tsx`.
- T111 `access.ts`/`usage.ts`: anonymous file delivery and public population only for media used in
  a visible section of a published document (any locale), cached ≤60 s per process and dropped on
  every content/media write. Storage: `STORAGE_DRIVER=local` with `MEDIA_DIR`; `s3` is refused with
  a clear error until the S3/R2 adapter dependency and hosting are approved (T132).
- T112 usage panel (`admin/UsagePanel.tsx`, server component), delete warning, `media.delete`
  audit, replace keeps the id and expires the public cache of every published use; FR-054 publish
  gate in `workflow.verifyStoredContent` (`alt.ts`).
- T113 `docs/security/TM-media.md`; ASVS V5.1.1–V5.4.1 verified, V5.4.2 partial, V5.4.3 not
  addressed (no antivirus), V5.2.3 not applicable.
- Defects found and fixed on the way: (1) Payload 3.92.1 turns its own 20 MB parser abort into a
  500 (`addDataAndFileToRequest` re-throws without a status); the proxy now refuses oversize media
  bodies with 413 (`src/modules/security/upload-limit.ts`). (2) ReorderControl ids kept the dotted
  path for nested arrays (`reorder-sections.0.items-0-down`); now dashes, top-level ids unchanged.
  (3) Admin server components must read `req.user` (the `user` prop lacks the server-set MFA flag).
- Not done / blockers: production cannot use local disk (config refuses it) and the S3/R2 adapter
  needs a new dependency plus the T132 hosting decision, so media cannot be deployed yet (Vercel
  functions have no persistent disk). Drag-and-drop/touch reorder is Payload's own row drag;
  keyboard and single-pointer reorder are the ReorderControl. Antivirus scanning not done.


---

## Phase 7: User Story 6 — Discoverable, correctly shared pages (P2) (plan Phase 5, SEO part)

**Depends on**: US1 (routes), US2 (content).

- [X] T114 [P] [US6] Failing tests `tests/e2e/us6-seo.spec.ts`: per-locale title/description/canonical/hreflang/`x-default`/Open Graph from route map; sitemap lists only published indexable pages with alternates; robots disallows admin/api/preview/auth; non-production `noindex` and protected; JSON-LD only from verified fields (FR-060, FR-061, FR-062, FR-063, FR-066, SC-012)
- [X] T115 [P] [US6] Failing attack tests `tests/security/redirects.spec.ts`: loop, chain, self and non-allow-listed external targets rejected; open-redirect payloads (`//evil`, `/\evil`, encoded) rejected; every legacy inventory URL (with/without trailing slash, percent-encoded Arabic slugs) redirects in one hop (FR-064, FR-065, SC-012)
- [X] T116 [US6] Implement `src/modules/seo/` metadata builder, hreflang from route map, JSON-LD builders (Organization, WebSite, BreadcrumbList, FAQPage, Service, Course) (FR-060, FR-061, FR-063)
- [X] T117 [US6] Implement `src/app/sitemap.ts` and `src/app/robots.ts` (FR-062, FR-066)
- [X] T118 [US6] Implement `redirects` collection (`from` normalised unique, `to` link, `type` 301/302, `source`, `createdBy`), graph validation, proxy lookup with cache, redirect-change audit until T115 passes (FR-045, FR-064)
- [ ] T119 [US6] Implement idempotent `scripts/seed-legacy-redirects.ts` reading `docs/content/legacy-redirect-map.md`; **blocked until CD-12 approval** (FR-065)

**Checkpoint (Gate 6)**: US6 green (legacy redirects pending CD-12) → commit checkpoint.

**US6 implementation notes (2026-11-06)** (decisions: `docs/adr/ADR-008-seo-redirects.md`):

- T116 `src/modules/seo/metadata.ts`, `jsonld.ts`, `src/app/(site)/seo.tsx`: per-locale title,
  description, self-canonical, hreflang for published locales, `x-default` → `/`, Open Graph and
  Twitter; JSON-LD (WebSite; Organization only from verified site settings; BreadcrumbList;
  FAQPage; Service; Course). New `seo.ogImage` and `seo.canonicalOverride` (data model), migration
  `20261106_220316_seo` (additive).
- T117 `src/app/sitemap.ts` (per request), `src/app/robots.ts`; non-production `X-Robots-Tag:
  noindex, nofollow` on every response (`next.config.ts`).
- T118 redirects: path normalisation (`src/modules/seo/paths.ts`), self/loop/chain refusal on
  create and update, internal targets only (no external allow-list approved), `createdBy`, audit
  (existing). Defect fixed: Next's trailing-slash redirect ran before the proxy, so `/x/` took two
  hops to a stored target; now `skipTrailingSlashRedirect` + the proxy (one hop).
- Tests: `tests/unit/seo/seo.test.ts` (9), `tests/integration/seo/redirect-graph.test.ts` (6),
  `sitemap.test.ts` (1), `tests/e2e/us6-seo.spec.ts` (5), `tests/security/redirects.spec.ts` (3).
  The legacy inventory is tested with synthetic legacy-style paths (CD-12 pending).
- Verified 2026-11-06: typecheck, lint, format, unit 404, integration 606, production build, full
  Playwright 230 passed, Lighthouse CI budgets pass (30 runs; LCP 1.39–1.47 s, TBT 74–123 ms, CLS
  0, JS 147.9 KB, a11y 1.00; Lighthouse's SEO category is 0.66 because this non-production build
  is `noindex` by design).
- **T119 blocked (CD-12)**: `docs/content/legacy-redirect-map.md` lists the FR-065 inventory with
  every target PENDING and the exact owner input required; the seed script is not written until
  the map is approved. Arabic targets also need CD-13.
- Open: T141 non-production host protection (FR-066 "protected from public access"); a site-level
  default social image (needs a public-use rule for media referenced by globals); Organization
  JSON-LD stays absent until CD-01 company name evidence is verified.


---

## Phase 8: User Story 5 — Visitor sends an enquiry (P2) (plan Phase 6)

**Depends on**: Foundational (limiter, audit), US1 (public pages).

- [X] T120 [P] [US5] Failing attack tests `tests/security/enquiry-abuse.spec.ts`: Turnstile always-fail key, missing, expired and reused tokens rejected; 6th submission in 10 min from one source → 429; CRLF/header injection in name/email inert; HTML/script in message inert in email and admin; captcha service unavailable → 503 fail-closed (FR-071, FR-072, FR-073, FR-094, SC-011)
- [X] T121 [P] [US5] Failing tests `tests/e2e/us5-enquiry.spec.ts`: enquiry persisted before confirmation; email in Mailpit; simulated email outage → retries then delivery, failure visible to Operator; localized field errors; consent required (FR-070, FR-074, SC-010)
- [X] T122 [P] [US5] Failing tests `tests/integration/enquiries/access-retention.test.ts`: read/export/delete owner/administrator only via UI and REST; every view/export/delete audited; retention deletes >12 months with content-free audit; enquiry content absent from logs and analytics (FR-045, FR-076, FR-077, FR-078)
- [X] T123 [US5] Implement `enquiries` collection ("name ≤100; email valid ≤254; phone optional ≤20; organization optional ≤150; topic select; message ≤5000 plain text; consent must be true; locale; delivery {status, attempts, lastError code, sentAt}; deleteAfter = createdAt + 12 months") and submit server action per `contracts/http-surface.md` check order (FR-070, FR-071, FR-078)
- [X] T124 [US5] Implement Turnstile server verification (hostname + action, single use) in `src/modules/platform/adapters/captcha/turnstile.ts` (FR-072)
- [X] T125 [US5] Implement `sendEnquiryEmail` job (retries with backoff, operator alert after final failure; plain-text body; escaped validated reply-to) and configurable recipients (FR-073, FR-074, FR-075)
- [X] T126 [US5] Implement enquiry inbox admin views, audited export, `purgeExpiredEnquiries` job until T122 passes (FR-076, FR-077)
- [ ] T127 [US5] R-F: evaluate analytics options, record `docs/adr/ADR-007-analytics.md`; implement cookieless adapter (page views per locale, successful enquiry conversion; no identifiers) disabled by default (FR-084, FR-085, FR-086, FR-087)
- [X] T128 [P] [US5] Write `docs/content/privacy-notice-requirements.md` listing FR-079 items for CD-10 legal review (FR-079)
- [X] T129 [US5] Write `docs/security/TM-enquiry.md`; update ASVS V14 (FR-097)

**Checkpoint (Gate 7)**: US5 green; no delivery-guarantee statement until SC-010 + SC-013 pass →
commit checkpoint.

**US5 implementation notes (2026-11-06)**:

- Submission is a Next server action (contract choice fixed): origin → rate limit (5 per source
  per 10 min, Postgres, fail closed) → Turnstile (single use, hostname + action, fail closed with
  a 503 outcome) → schema (FR-070 fields only; configured topics per locale) → one transaction
  that stores the enquiry and queues its notification → confirmation. Works without JavaScript.
- T123 `src/modules/enquiries/` (`collection.ts`, `schema.ts`, `submit.ts`), migration
  `20261106_171836_enquiries` (also Payload's `payload_jobs` tables; `down` constraint drop made
  `IF EXISTS`). Form `src/ui/enquiry/EnquiryForm.tsx` (native radio group for topics, linked
  errors, input kept), rendered in `contactBlock` sections on public pages only.
- T124 `src/modules/platform/adapters/captcha/turnstile.ts` (siteverify with timeout; no network in
  tests). The test driver keeps Cloudflare's test secrets and adds token-selected outcomes
  (`test-fail…`, `test-expired…`, `test-unavailable…`) and single use, so one server can exercise
  every path; production refuses test keys (configuration).
- T125 `delivery.ts`: Payload jobs task, 5 attempts with exponential backoff (1 min base); status,
  attempts and an error code on the enquiry; final failure → `failed` + content-free
  `alert: enquiry.delivery_failed` log. Plain text, fixed subject, validated Reply-To. Recipients
  from site settings (FR-075). Runner `POST /api/jobs/run` (bearer `JOBS_SIGNING_SECRET`);
  locally the queue also runs every minute in-process (`JOBS_TRIGGER=local-runner`, not in tests).
- T126 inbox: read/export/delete for Administrator and Owner (MFA; export also needs re-auth),
  create/update denied to all; `enquiry.view` per document shown, `enquiry.export`,
  `enquiry.delete`, `enquiry.retention_delete` (counts only); CSV export formula-neutralised;
  retention purge via `/api/jobs/run?retention=1`.
- T120 `tests/security/enquiry-abuse.spec.ts` (5), T121 `tests/e2e/us5-enquiry.spec.ts` (4), T122
  `tests/integration/enquiries/access-retention.test.ts` (17) + `mailpit.test.ts` (1, real SMTP to
  the local Mailpit), `tests/unit/enquiries/turnstile.test.ts` (4). The "always-fail key" case runs
  in integration (one server cannot switch secrets); CRLF injection runs in integration and over
  real SMTP (a browser cannot submit raw CR/LF in single-line inputs).
- T128 `docs/content/privacy-notice-requirements.md` (facts and open decisions for CD-10 review,
  no notice wording). T129 `docs/security/TM-enquiry.md`; ASVS V14.2.1 verified, V14.1.1,
  V14.2.3, V14.2.4, V14.3.2 partial.
- **T127 not done**: R-F analytics evaluation and ADR-007 need an owner decision on a provider
  and its disclosure (CD-10); `ANALYTICS_DRIVER=none` stays (no analytics, so no enquiry content
  can reach one).
- **Verified (2026-11-06)**: unit 395, integration 599 (18 new), full Playwright 222 passed (9
  new), typecheck, lint, format. Lighthouse CI: the first run failed one budget (JS 150.14 KB >
  150 KB): the form imported the i18n dictionaries into the shared client bundle. The server now
  passes only the form's localized strings (`src/ui/enquiry/messages.ts`); rerun passes all
  budgets: 30 runs, LCP 1.39–1.40 s, TBT 26–32 ms, CLS 0, JS 147.6 KB (was 143.0 KB before US5;
  2.4 KB headroom left, because the form's client code ships with every page of the public routes),
  CSS 6.4 KB, fonts 72/96 KB, a11y 1.00.
- **Launch blockers for US5**: CD-10 privacy notice and its link at the consent checkbox; CD-11
  Arabic copy review; T132 email provider, hosting, production Turnstile keys, host scheduler for
  retention, database encryption at rest; T136 alert routing; SC-010 (2-minute delivery) and
  SC-013 (backup/restore) not measured, so no delivery-guarantee statement.


---

## Phase 9: User Story 7 — Navigation, banners, site-wide settings (P3)

**Depends on**: US2, US3.

- [X] T130 [P] [US7] Failing tests, server side only, in `tests/integration/content/globals.test.ts` (planned as `tests/e2e/us7-nav.spec.ts`): two-level menus; unpublished targets flagged on save; `javascript:` and other disallowed schemes rejected in menu links; banner schedule ordered on save; Publisher saves nav/banner drafts but publish/unpublish is denied via the Local API ("role × action on globals", "a Publisher cannot publish navigation by any route") and REST ("over REST (what the admin sends), …", added 2026-10-28); settings changes audited. Banner display window: `tests/unit/content/banner-schedule.test.ts`. Per-visitor banner dismissal: `tests/public/us1-locale.spec.ts`. The admin-UI part is T130a (FR-014, FR-036, FR-045)
- [X] T130a [US7] Failing-then-passing admin UI tests in `tests/e2e/us7-nav.spec.ts` (Playwright project `e2e`, `pnpm test:e2e`, production build, disposable `altamiuz_e2e` database), all against the real admin: anonymous → login; password-only (MFA pending) → `/account/mfa`, API 403; Editor: navigation and banner fields, reorder controls and save/publish controls disabled or absent, API writes 403; Publisher: saves a menu draft (live menu unchanged), "Publish changes" refused with 403 and an error toast on navigation and banner, admin "Unpublish" request 403, public site unchanged; keyboard reorder of menu items (announced, focus kept, order saved); unpublished-target flag set on save and visible to Editors; validation (`javascript:`, protocol-relative and `data:` URLs, empty label, 281-character banner) refused with `aria-invalid` and nothing stored; Administrator and Owner publish navigation and the banner from the admin, visible on the public site and audited; banner schedule window (inside, not started, ended, open start, open end) and empty/inverted windows refused; a cross-origin write with a valid session and a save after sign-out are refused (FR-033 for these screens). Found and fixed: the admin sends an empty sub-menu as a row count (`children: 0`), which made every admin save of a menu with an empty sub-menu a 500, including a Publisher's publish attempt (regression test in `tests/integration/content/globals.test.ts`); the reorder controls ignored the read-only form (now disabled for Editors, lock holders elsewhere and trashed documents) (FR-014, FR-033, FR-036, FR-045). Test-only: the spec empties `rate_limit_buckets` in its disposable database before it starts, because a full run from one IP otherwise reaches the MFA limit (30 per IP per 15 min); the product limit is unchanged. The full-run failure of T079 seen once (MFA verify request hung) did not reproduce in 2 later runs
- [X] T131 [US7] Implement globals `site-settings` (contact details + evidence, social links, default SEO, legal links, `enquiryRecipients`, `enquiryTopics`), `header-nav`, `footer-nav`, `banner` per data-model until T130 passes (FR-010, FR-075)

**Checkpoint (Gate 8)** → commit checkpoint.

---

## Phase 10: User Story 8 — Operate, observe, recover (P3) (plan Phase 7 ops)

**Depends on**: T132 owner hosting decision for production targets.

- [X] T132 [US8] R-H: production hosting — **owner decision: Vercel (Pro) + Neon PostgreSQL + Cloudflare R2**; operational architecture in `docs/adr/ADR-009-hosting-operations.md` (the file name `ADR-008-hosting.md` was taken by the SEO ADR). Done 2026-11-07: pooled/direct Neon URLs, TLS required for non-loopback databases, migrations before promotion (expand/contract), R2 media (adapter not built: needs `@payloadcms/storage-s3` approval, O-3), 4.5 MB Vercel body limit vs A-7 20 MB (O-4), shared Data Cache (verify on preview), Postgres rate limiter with `CLIENT_IP_HEADER=x-real-ip` (O-5), Vercel Cron in `vercel.json` (`GET /api/jobs/run` every minute, `GET /api/jobs/retention` daily) with `CRON_SECRET` = `JOBS_SIGNING_SECRET`, provider-neutral email boundary (production `smtps://` relay only). Production config now refuses `JOBS_TRIGGER=local-runner`, plaintext/credential-less/loopback SMTP and databases without `sslmode`. Found and fixed: `rate_limit_buckets` purge existed but was never scheduled (now in the retention route). No account created or changed (SC-015)
- [X] T133 [P] [US8] Tests `tests/integration/ops/observability.test.ts` (19): signals `auth.login_failure`, `ratelimit.hit`, `captcha.failure`/`captcha.unavailable`, `upload.rejected`, `enquiry.delivery_failed` (`alert: true`) as structured JSON (`src/modules/platform/signals.ts`, allow-listed primitive fields, never throws); content-free (no email, IP, password, message, provider error); broken log sink does not break the request; readiness `database`/`storage` (critical) and `email`/`enquiryDelivery` (degraded) incl. unavailable database, missing storage, S3 driver without adapter, unbuildable email driver, hanging check (3 s cap); scheduler GET/POST on `/api/jobs/run` and `/api/jobs/retention` refuse missing/wrong/`Basic`/suffixed/lower-case signatures. Payload-logger alert test in `access-retention.test.ts` moved to the signal sink (FR-100, FR-101). Done 2026-11-07
- [X] T134 [US8] `ops/backup/{db.sh,media.sh,lib.sh}` (age, streamed, `.partial` + checksum, 30-day prune), `ops/restore.sh` (verifies checksums and decryptability of both files before writing; refuses non-empty targets; single-transaction `pg_restore`), `ops/restore-drill.sh` + `ops/restore-drill.compose.yml` (clean tmpfs Postgres 17), scheduled `.github/workflows/backup.yml` (inert until O-10), `pnpm ops:restore-drill`. Failure paths: `tests/integration/ops/backup.test.ts` (13). Drill 2026-11-07 on the seeded e2e database: 268 tables / 1,702 rows / 120 media files restored, row counts and media SHA-256 equal, 0 pending migrations, `scan:richtext` pass, no plaintext in artefacts, **measured RTO 7.0 s** (objective 4 h); RPO bounded by the daily schedule + 26 h heartbeat (not yet observed in production). Evidence `docs/runbooks/evidence/restore-drill-20261107T060553Z.json` (FR-102, SC-013 locally)
- [X] T135 [US8] Runbooks `docs/runbooks/{deploy,rollback,secret-rotation,incident-response,backup,restore,migration,monitoring}.md`; deploy.md lists owner actions O-1…O-10 (FR-103). Done 2026-11-07
- [X] T136 [US8] Repository part done 2026-11-07: readiness checks and signals (T133), alert routing and monitors M1–M5 specified in `docs/runbooks/monitoring.md` (external monitor polls readiness, so delivery failures page even when the email provider or log drain is down), SC-015 availability method. Error tracking stays the structured-log adapter (no third-party SDK, no PII). **Owner**: monitoring account, alert recipient(s) on two channels, escalation contact, Vercel log drain (O-9). SC-010 measured locally (`ops/measure/delivery.sh`): 100/100 within 120 s (p50 33.8 s, p99 60.2 s, max 60.8 s); outage 10/10 stored and delivered after recovery; re-measure on preview with the provider before any delivery statement (FR-100, FR-101, SC-010, SC-015)

**Checkpoint (Gate 9)** → commit checkpoint.

---

## Phase 11: Polish & Cross-Cutting (plan Phase 7 hardening)

- [X] T137 Adversarial suite and report `docs/security/adversarial-report.md` (FR-097, SC-004). Done 2026-11-07 on `5c04471`, **local production build only**: `pnpm test:security` 84/84, integration security 18/18, US8 ops 32/32, unit security/platform in 414/414, gitleaks/audit/osv clean with exceptions. **0 open critical/high** except the excepted, unreachable E-1. Open low: A-1 per-process media public-set cache on multi-instance hosting, A-2 sign-in timing floor under load, A-3 no AV scanning (accepted), A-4 lockout DoS (accepted), A-7 Actions pinned by tag; info: A-5 no HSTS preload, A-6 not yet run through the Vercel edge. Re-run on preview (needs O-1–O-3)
- [ ] T138 Run public a11y (axe all templates × locales) + manual keyboard/screen-reader script `docs/runbooks/a11y-manual.md`; run admin regression vs baseline; update `docs/accessibility/admin-findings.md`; no conformance claim without evidence (FR-080, FR-080a, SC-006, SC-019) — **Partial 2026-11-07 (automated part done; manual part not executed)**: public axe 32/32 (16 templates incl. new contact en/ar × 375/1440 px), 0 WCAG 2.2 AA violations; admin regression 9/9, no new rule vs baseline; newly measured views (media, enquiries, versions, globals) baselined, all flagged nodes Payload core (A-10…A-12 in `admin-findings.md`); keyboard behaviour asserted by script only. Manual keyboard + NVDA/VoiceOver walkthrough script in `docs/runbooks/a11y-manual.md`, **not executed (needs a human tester)**. No conformance claim
- [X] T139 Configure Lighthouse CI `tests/perf/lighthouserc.json` (first introduced at Gate 4, extended here to all templates) with budgets (LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms, ≤1 MB, ≤150 KB JS, fonts ≤120 KB/locale) per template × locale (FR-083, SC-007, SC-008) Done 2026-11-04 for the existing templates: `@lhci/cli` 0.15.1 (Lighthouse 12.6.1, owner-approved devDependency) with `tests/perf/lighthouserc.cjs` (`.cjs`, not `.json`, to build URLs), run by `pnpm perf:lighthouse` (`scripts/lighthouse.sh`: production build, seeded e2e database, Playwright's Chromium, results only in `test-results/lighthouse`) and enforced in CI (`verify` job, `ci-local.sh`). Mobile profile, 3 runs per URL, 10 URLs (home, page, service and training listings and details, both languages). Budgets: LCP ≤2.5 s, CLS ≤0.1, TBT ≤200 ms (lab proxy for INP), total ≤1 MB, JS ≤150 KB, fonts ≤120 KB, accessibility score 1. Measured (median): LCP 1.37–1.42 s, TBT 71–81 ms, CLS 0, total 224 KB (en) / 248 KB (ar), JS 142 KB, fonts 72 KB (en) / 96 KB (ar); performance 0.99, accessibility 1.00, SEO 1.00, best practices 0.96 (the missing favicon, a CD-09 brand asset). Throttling is applied (`devtools`): Lighthouse's default simulation reported LCP 2.51–2.83 s because on a local server the async scripts finish before first paint and are charged to LCP; the same pages paint at 1.4 s under applied slow-4G/4×CPU throttling. Fixed on the way: Payload's `Critical-CH`/`Accept-CH`/`Vary` client-hint headers were sent on every public page (each first navigation was restarted, ~0.5 s simulated LCP) and are now admin-only (`next.config.ts`, test in `tests/security/public-http.spec.ts`); listing pages lacked a meta description (now the site-settings default). Remaining: re-run with real content and brand assets; `@lhci/cli` adds six high advisories in its tooling chain (`docs/security/dependency-exceptions.md`, not excepted)
- [X] T140 Generate/check `docs/api.md` against route schemas in CI (FR-096). Done 2026-11-07: inventory generated from the sanitized Payload config (every collection, global and root endpoint, built-in vs custom) plus App Router handlers, with proxy-blocked built-ins marked (`scripts/api-docs.ts`, `pnpm docs:api`); `tests/unit/docs/api-docs.test.ts` fails `pnpm test` (CI) on drift — negative control: deleting one row failed the test. Semantics stay in `contracts/http-surface.md`. Not a full request/response schema per endpoint: Payload built-ins follow Payload's documented REST shapes
- [ ] T141 R-G: verify preview-deployment protection and plan-term compliance before any preview deploy; record `docs/adr/ADR-009-preview-deploys.md` (FR-066) — **Blocked on O-1 (2026-11-07)**: required configuration recorded in `docs/adr/ADR-010-preview-deploys.md` (ADR-009 number already used): Pro plan, Vercel Authentication on all previews, separate Neon branch/test keys/sandbox email, no production secrets in Preview scope; app-level noindex already verified locally. Verification checklist not run (no account/deployment)
- [ ] T142 Write usability protocol `docs/research/usability-sc002.md` and run with ≥2 staff (SC-002) — **Protocol written 2026-11-07** (`docs/research/usability-sc002.md`: 5 timed tasks, pass = 2 staff, unaided, first attempt, <20 min); **not run — needs 2 staff nominated by the owner**
- [X] T143 Create `docs/content/evidence-register.md` and `pnpm check:evidence` verifying every published claim has an evidence reference (FR-016, SC-016) Done 2026-11-07: `src/modules/content/evidence-register.ts`, `pnpm check:evidence` (read-only; lists every published claim with status/reference; exit 1 when a claim lacks verified evidence matching its published text or a verified item lacks a reference); `tests/integration/content/evidence-register.test.ts` 4/4; register doc `docs/content/evidence-register.md`. Run on seeded e2e data: 1 claim, **1 problem → finding A-8** (publish backstop reads the draft row; published English stats label not covered by the verified digest), open. SC-016 not verifiable until real content (CD-01/02/05/07) exists
- [X] T144 Create `docs/content/dependencies.md` tracking CD-01…CD-13 status as launch gates (FR-065, FR-079) Done 2026-11-07: `docs/content/dependencies.md` — all 13 CDs **open** (no approved input recorded in the repository), with what each blocks, how it is enforced (CD-13 production start refusal; claim gates; CD-10 contact-form launch blocker) and the owner action. No decision invented
- [X] T145 Final supply-chain pass 2026-11-07 (FR-098, SC-014): gitleaks full history (27 commits) 0 leaks; `pnpm audit --audit-level high` and osv-scanner pass with 9 advisories filtered by exceptions E-1…E-5 (raw: 1 critical, 2 high, 2 moderate, 4 low; all in E-1…E-5); upstream re-checked, **no exception retirable** (monaco 0.57.0 still bundles dompurify 3.4.15; get-uri needs basic-ftp ^5; typescript-estree needs minimatch ^10; deepmerge 4.3.1 is latest; Payload 3.93.0 still pins drizzle-kit 0.31.7). **E-5 mandatory review done**: 0 `@esbuild-kit` loads from `drizzle-kit/api.js` and from `pnpm migrate:status` (Module._load hook); expiry left at 2026-12-05 — extend or lapse is owner decision OD-1. Licences: 864 packages unchanged; prod tree 403 with no FSL/GPL/AGPL; FSL-1.1 `sentry` dev-only via `@lhci/cli` and absent from the standalone build, so the 2026-11-06 approval scope holds (`docs/licences.md`). Open: A-7 Actions pinned by tag, not SHA. SC-014 verified for the repository history as of `5c04471`; re-run at launch
- [X] T146 Complete `docs/security/asvs-l2.md` (verified / partial / not addressed per requirement) and `docs/launch-readiness.md` mapping SC-001…SC-019 to evidence (FR-097, SC-001) Done 2026-11-07: ASVS register complete — every L1/L2 requirement has status and evidence/rationale: **96 verified, 73 partial (incl. 20 code-review-only), 11 not addressed (host-dependent, O-9, accepted AV gap, password word list), 73 N/A**, all local evidence. `docs/launch-readiness.md`: SC-001…SC-019 and all 94 FRs marked verified (local) / partial / open / blocked (named O-n, CD-n, OD-n) / deferred; FRs 71 verified (local), 12 partial, 6 blocked, 3 open, 2 deferred. **Verdict: not ready to launch** (no preview/production environment; CD-01…CD-13 open; OD-1 deadline 2026-12-05)

---

## Dependencies & Execution Order

```text
Phase 0 (done) → Setup (Gate 1) → Foundational (Gate 2a) → US3 (Gate 2)
  → US2 (Gate 3) → [US7 T130–T131] → US1 (Gate 4) → { US4 (Gate 5), US6 (Gate 6), US7 (Gate 8) } → US5 (Gate 7)
  → T132 hosting decision → US8 (Gate 9) → Polish
```

- Foundational blocks all stories. US3 blocks every CMS story (MFA/RBAC/audit).
- US2 blocks US1 (content), US4 (reorder control), US6, US7. US7 globals (T130–T131) block US1 T103.
- US4, US6, US7 can proceed in parallel after US1.
- External blockers: dependency-install approval (Setup), CD-12 (T119), CD-13 (production build),
  T132 hosting decision (T134, T136), CD-10 (privacy notice publication).
- Within a story: failing tests → implementation → gate → commit checkpoint (owner approval;
  no push/deploy).

## Parallel Examples

- Foundational: T026, T027, T028, T030, T038, T040, T041 in parallel; then T029, T031→T032.
- US3 tests T042–T055 all [P] (separate files); implementation T056→T057…T068 mostly sequential
  (shared users collection), T070 parallel.
- US2 tests T071–T080 all [P]; T081→T082→T083 sequential; T085–T088 parallel after T082.

## Implementation Strategy

- **MVP** = Setup + Foundational + US3 + US2 + US1 (all P1): a secure CMS publishing a bilingual
  site locally. Not launchable until US6 legacy redirects, US5 enquiries, US8 ops and Polish gates
  pass and content dependencies clear.
- Incremental: each gate is a commit checkpoint with recorded test output; nothing is pushed or
  deployed without explicit owner approval.

## Requirement → Task Coverage

Generated from requirement IDs cited in task lines. Every FR/SC in spec.md maps to ≥1 task.

| Requirement | Tasks |
|---|---|
| FR-001 | T016, T096 |
| FR-002 | T080, T087, T095, T098, T099 |
| FR-003 | T096, T099 |
| FR-004 | T016, T074, T096 |
| FR-005 | T063, T100 |
| FR-006 | T100 |
| FR-007 | T096, T102 |
| FR-008 | T097, T104 |
| FR-010 | T087, T131 |
| FR-011 | T085, T087 |
| FR-012 | T078, T085, T092 |
| FR-013 | T081 |
| FR-013a | T073, T081 |
| FR-013b | T026, T027, T029, T071, T082 |
| FR-013c | T028, T029, T072, T083, T084 |
| FR-013d | T027, T073, T083 |
| FR-014 | T026, T027, T028, T029, T071, T085, T102, T130, T130a |
| FR-015 | T076 |
| FR-017 | T088 |
| FR-018 | T103 |
| FR-019 | T085 |
| FR-016 | T074, T086, T143 |
| FR-020 | T074, T089, T094c |
| FR-021 | T074, T089, T094c, T103 |
| FR-022 | T077, T091 |
| FR-023 | T074, T089 |
| FR-024 | T074, T089 |
| FR-025 | T080, T090 |
| FR-030 | T016, T042, T057 |
| FR-031 | T043, T058 |
| FR-032 | T044, T059 |
| FR-033 | T045, T046, T061, T130a |
| FR-033a | T045, T060 |
| FR-033b | T045, T060 |
| FR-033c | T047, T060 |
| FR-034 | T048, T063 |
| FR-035 | T049, T062, T065, T068 |
| FR-036 | T031, T056, T068, T130, T130a |
| FR-037 | T032, T052 |
| FR-038 | T031, T032, T043, T051, T065 |
| FR-039 | T050, T064 |
| FR-045 | T035, T043, T045, T048, T052, T053, T066, T074, T089, T112, T118, T122, T130, T130a |
| FR-046 | T035, T053 |
| FR-047 | T034, T036, T067 |
| FR-048 | T034, T036 |
| FR-050 | T109, T110 |
| FR-051 | T107, T108, T110 |
| FR-052 | T108, T110 |
| FR-053 | T109, T112 |
| FR-054 | T109, T112 |
| FR-055 | T078, T092, T109 |
| FR-056 | T108, T111 |
| FR-057 | T109, T112 |
| FR-060 | T114, T116 |
| FR-061 | T114, T116 |
| FR-062 | T114, T117 |
| FR-063 | T114, T116 |
| FR-064 | T115, T118 |
| FR-065 | T115, T119, T144 |
| FR-066 | T114, T117, T141 |
| FR-070 | T121, T123 |
| FR-071 | T120, T123 |
| FR-072 | T120, T124 |
| FR-073 | T120, T125 |
| FR-074 | T121, T125 |
| FR-075 | T125, T131 |
| FR-076 | T122, T126 |
| FR-077 | T122, T126 |
| FR-078 | T122, T123 |
| FR-079 | T128, T144 |
| FR-080 | T061, T078, T105, T138 |
| FR-080a | T040, T041, T061, T078, T079, T093, T138 |
| FR-081 | T102 |
| FR-082 | T097 |
| FR-083 | T139 |
| FR-084 | T127 |
| FR-085 | T127 |
| FR-086 | T014, T127 |
| FR-087 | T127 |
| FR-090 | T018, T019, T020 |
| FR-091 | T049, T054, T062 |
| FR-092 | T032, T051, T056 |
| FR-093 | T033 |
| FR-094 | T037, T039, T055, T063, T120 |
| FR-095 | T019, T020, T033, T104 |
| FR-096 | T140 |
| FR-097 | T025, T069, T094, T113, T129, T137, T146 |
| FR-098 | T007, T008, T145 |
| FR-100 | T021, T022, T133, T136 |
| FR-101 | T012, T013, T133, T136 |
| FR-102 | T134 |
| FR-103 | T070, T135 |
| FR-104 | T005, T010 |
| FR-105 | T006, T010, T011, T014, T015 |
| SC-001 | T096, T146 |
| SC-002 | T142 |
| SC-003 | T031, T051, T052 |
| SC-004 | T137 |
| SC-005 | T053 |
| SC-006 | T138 |
| SC-007 | T139 |
| SC-008 | T139 |
| SC-009 | T106 |
| SC-010 | T121 |
| SC-011 | T120 |
| SC-012 | T114, T115 |
| SC-013 | T134 |
| SC-014 | T007, T145 |
| SC-015 | T132, T136 |
| SC-016 | T143 |
| SC-017 | T046 |
| SC-018 | T026, T071, T072 |
| SC-019 | T040, T138, T146 |
