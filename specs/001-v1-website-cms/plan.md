# Implementation Plan: Altamiuz v1 Bilingual Website and CMS

**Branch**: `main` (spec directory `specs/001-v1-website-cms`) | **Date**: 2026-10-16 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-v1-website-cms/spec.md`, constitution v1.1.0.

## Summary

Build a bilingual (Arabic-first, full RTL/LTR) public website for Altamiuz and a hardened website
CMS as one Next.js application with Payload CMS 3 embedded, backed by PostgreSQL:

- Content is schema-defined: section-built pages, Services and Training courses with automatic
  listings, and globals for navigation, banner and settings. All content is localized, has drafts
  and versions, and publishes per locale.
- Security work is project-owned and test-first: mandatory TOTP MFA for every CMS user, revocable
  sessions, a matrix-driven RBAC, an append-only audit log, a hardened media pipeline, and an
  abuse-resistant enquiry flow.
- Every external service sits behind a configuration-selected adapter with a free local substitute.
- The build is deployment-neutral (`output: 'standalone'`) because production hosting is undecided.

Two isolated research tasks come before detailed implementation: **R-A**, the Payload
Arabic/RTL admin proof of concept, and **R-B**, the typography specimen
([research.md](./research.md)).

## Technical Context

| Item | Value |
|---|---|
| **Language/Version** | TypeScript 5.x (strict), Node.js 22 LTS |
| **Primary Dependencies** | Next.js 16.x (≥16.3.3), Payload 3.91.x (`@payloadcms/next`, `db-postgres`, `richtext-lexical`, optional `storage-s3`), sharp, otplib, a content-type sniffer, pino, zod. Exact pins go in the lockfile; each new dependency gets a licence check and a lifecycle-script review |
| **Storage** | PostgreSQL 17 (Payload Drizzle adapter, committed migrations); media on local disk in development, R2 proposed for production |
| **Testing** | Vitest (unit, integration against real Postgres), Playwright (e2e, security, axe), Lighthouse CI, gitleaks, `pnpm audit` / osv-scanner |
| **Target Platform** | Modern evergreen browsers (last 2 versions, iOS Safari 16+); server: Node 22 standalone build, local Docker and Vercel preview; production host undecided |
| **Project Type** | Web application (public site + embedded CMS) |
| **Performance Goals** | Mobile p75 LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms; ≤1 MB first visit; ≤150 KB JS; fonts ≤120 KB per locale; publish-to-live ≤60 s |
| **Constraints** | WCAG 2.2 AA; OWASP ASVS 5.0 L2 target; no paid services in development; no host-proprietary APIs; no unsafe HTML or executable content in the CMS; no unverified claims published |
| **Scale/Scope** | Low thousands of visits per day; fewer than 10 CMS users; about 20 pages, 10 services, 10 courses, a few hundred media assets per locale at launch |

There are no open NEEDS CLARIFICATION items. Items that still depend on evidence are scheduled
as VERIFY research (R-A to R-H) at the phase where they block.

## Constitution Check

*Gate before Phase 0: PASS. Re-checked after Phase 1 design: PASS.*

| # | Principle | How the plan complies | Status |
|---|---|---|---|
| I | Clean room | No legacy code. POC scaffold code stays isolated under `research/` and is not copied. Licence checks for every dependency and font (R-B) | PASS |
| II | Security-first, ASVS L2 | Plan-level threat model and ASVS chapter mapping in [threat-model.md](./threat-model.md), refined per phase in `docs/security/`; adversarial suite (D-18); headers and CSP (D-17); dependency and secret scanning | PASS (to be verified per phase) |
| III | WCAG 2.2 AA | axe + manual checks per UI phase; reduced-motion; keyboard reorder alternative (R-A check 7) | PASS |
| IV | ar/en parity | `fallback: false`; per-locale publish (D-4); localized route segments and slugs through a typed route map (D-5); localized metadata; hreflang (D-16) | PASS (per-locale status VERIFY in R-A) |
| V | Inert schema content | Block library + Lexical allow-list rendered via JSX converter; link scheme validation; no HTML fields | PASS |
| VI | Test-first boundaries | Phase 2 (auth/RBAC/MFA/audit), Phase 4 (uploads), Phase 3 (publish/localization) start with failing tests; matrix-generated authz tests | PASS |
| VII | Identity and accountability | No registration; one-time owner bootstrap; MFA for all; sessions D-7; RBAC D-8; audit D-9 | PASS (session support VERIFY in R-C) |
| VIII | Secure media | D-12 pipeline; private draft media; persistent ordering | PASS |
| IX | No secrets | Placeholder `.env.example`; gitleaks pre-commit and CI; config loader refuses defaults in production | PASS |
| X | Migrations | D-21 up/down/up tests; no push mode outside throwaway databases; backup before production migration | PASS |
| XI | Evidence-backed claims | `evidence` group blocks publishing; claim blocks (stats, credentials, testimonials, logos) gated; CD list tracked | PASS |
| XII | Maintainable, observable, recoverable | Modules with public APIs; ADRs; budgets set; logs, health, backups, restore drill | PASS |
| XIII | Stage-based delivery | Phases below each have acceptance gates and a commit checkpoint; no push or deploy without approval | PASS |
| XIV | Standards integrity | ASVS, WCAG, ISO references labelled as engineering targets in `docs/security/`; public copy contains no compliance claims | PASS |
| — | Stack and hosting (v1.1.0) | Next + Payload 3 + Postgres + Drizzle migrations; adapters with local substitutes; standalone build; Vercel previews only; no purchases | PASS |

Implementation status: nothing in this plan is implemented. Payload is **not** assumed to satisfy
the MFA, audit, upload-security or authorization requirements; each is built and verified by its
own phase gate.

## Project Structure

### Documentation (this feature)

```text
specs/001-v1-website-cms/
├── spec.md
├── plan.md              # this file
├── research.md          # R-A/R-B procedures, decisions D-1…D-21, budgets
├── threat-model.md      # plan-level threat model + ASVS 5.0 L2 chapter mapping
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── access-matrix.md
│   ├── http-surface.md
│   └── configuration.md
├── checklists/requirements.md
└── tasks.md             # created by /speckit-tasks (not yet)
```

### Source Code (repository root, target layout)

```text
research/
├── payload-rtl-poc/          # R-A, isolated; only config, findings.md, evidence/ committed
└── typography-specimen/      # R-B, static specimen.html, report.md

src/
├── app/
│   ├── (site)/[locale]/      # public routes: home, [slug], services, training
│   ├── (payload)/admin/      # Payload admin (generated) + MFA gate views
│   ├── (payload)/api/        # Payload REST (admin only) + custom endpoints
│   ├── preview/              # draft-mode entry, auth + MFA
│   ├── sitemap.ts, robots.ts
│   └── api/health/
├── proxy.ts                  # locale routing, redirects lookup, security headers, CSP nonce
├── payload.config.ts         # composes module configs only
├── modules/
│   ├── platform/             # config loader, logger, adapters: storage, email, ratelimit, jobs, captcha, analytics
│   ├── access/               # roles, permission matrix, can(), access wrappers (incl. requireMfa)
│   ├── auth/                 # invitations, bootstrap, MFA, recovery codes, sessions, lockout
│   ├── audit/                # audit-events collection, record(), retention
│   ├── content/              # pages, services, courses, blocks, globals, rich-text allow-list, evidence
│   ├── media/                # upload validation, processing, usage tracking, public-read rule
│   ├── seo/                  # metadata, hreflang, JSON-LD, sitemap, redirects collection + graph check
│   ├── enquiries/            # schema, submit service, email job, retention, export
│   └── i18n/                 # locales, typed route map + href() (D-5), UI strings, formatting, direction
└── ui/                       # design tokens, primitives, section renderers (server components first)

migrations/                   # Payload/Drizzle, reviewed
tests/
├── unit/  ├── integration/  ├── security/  ├── e2e/  ├── a11y/  ├── perf/
└── fixtures/uploads/         # benign + malicious samples (generated, no real personal data)
docs/
├── architecture.md  ├── api.md  ├── adr/  ├── security/ (threat models, asvs-l2.md)  └── runbooks/
docker-compose.dev.yml
.env.example
```

**Structure Decision**: single Next.js + Payload application (D-2). The domain lives in
`src/modules/*`, each exposing `index.ts`. `app/` and `payload.config.ts` only compose modules.
A later portal would add new modules and routes without restructuring the existing ones.

## Implementation Phases and Acceptance Gates

Each phase ends with:

- tests passing (output recorded)
- a security review of the diff and an updated threat model and ASVS mapping
- accessibility checks where UI changed
- a remaining-work list
- a commit checkpoint prepared for owner approval

| Phase | Scope | Gate (all must hold) |
|---|---|---|
| **0 Research** (R-A, R-B **done** 2026-10-16) | R-A Payload RTL POC; R-B typography specimen | Evidence committed; D-4 updated, D-12 updated, D-22–D-24 added (research.md § Research results). **Owner review pending**: English admin UI for v1 (D-23), typeface adoption (D-24), core-admin accessibility risk |
| **1 Foundation** | Scaffold, strict TS, lint boundaries, config loader + adapters with local substitutes, Docker dev, logger, health, proxy with headers/CSP (R-D), gitleaks + audit, CI files, migration tooling, ADR-001..003 | App boots locally with no paid accounts; production mode refuses dev substitutes (test); headers verified; gitleaks clean; migration up/down test runs |
| **2 Identity & access** (test-first) | R-C spike; users, invitations, owner bootstrap, password policy + breached-password check, lockout, MFA enrol/verify/recovery, sessions, RBAC matrix, audit log + DB trigger | 100% access-matrix cells pass (SC-003); MFA bypass/replay/brute-force suite passes (SC-017); all FR-045 auth events audited; threat model TM-auth signed off |
| **3 Content core** | Localization (`experimental.localizeStatus`, D-4), block library, Lexical allow-list + **server-side link-URL scheme validation (D-22)**, evidence gating, pages/services/courses + listings, globals, drafts/versions/restore/locking, preview, revalidation, **accessible reorder control for blocks (D-12)**, editor focus style + Esc-Tab help text | US2 and US7 e2e pass in both locales; XSS paste suite passes, including a `javascript:` link pasted via the admin **and** sent directly to the API (both rejected); per-locale publish regression test passes; unverified claim cannot publish; publish-to-live ≤60 s |
| **4 Media** (test-first) | Upload validation, re-encode/strip, variants, focal point (numeric inputs as keyboard path), random names, private draft media, usage panel, accessible reordering (D-12 control) | US4 e2e + malicious-fixture suite pass; keyboard reorder works without a pointer, is announced in the UI language, and persists after reload |
| **5 Public site & SEO** | Design tokens and typography (D-24: self-hosted OFL woff2, ≤3 Arabic weights, `clamp()` scale, bidi wrappers), section renderers, typed route map (D-5), switcher, 404/error pages, metadata, hreflang, JSON-LD, sitemap, robots, redirects + legacy map loader | US1 and US6 e2e pass; axe 0 serious/critical; perf budgets met on all templates in both locales, including fonts ≤120 KB per locale (re-measured on self-hosted files); Firefox + real iOS/Android typography check |
| **6 Enquiries & analytics** | Form, Turnstile, rate limit, persist-then-confirm, email job with retries, inbox with audited read/export/delete, retention job, R-F analytics behind a flag | US5 e2e + abuse suite pass; outage test passes before any delivery claim; retention deletion audited |
| **7 Hardening & operations** | Full adversarial suite, manual a11y and screen-reader pass, observability and alerts, backup/restore scripts + drill, runbooks, `docs/api.md`, ASVS L2 report, R-H hosting comparison | SC-003…SC-017 evidence pack; restore drill within RPO/RTO; 0 critical/high findings; launch readiness review (content dependencies cleared separately) |

Threat models (TM-auth, TM-media, TM-enquiry, TM-preview, TM-admin) live in `docs/security/` and
are written at the start of their phase, before code.

## Risks and Dependencies

- **Payload capability gaps (R-A evidence)**:
  - Keyboard reordering and rich-text URL safety need project work (D-12, D-22).
  - Per-locale publish relies on an **experimental** flag (D-4); pin the version and add a
    regression test.
  - The Arabic admin UI is deferred (D-23).
  - Sessions and expiry still need R-C.
- **Core admin accessibility**: Payload's own admin views fail axe (serious/critical) in both UI
  languages. Project-built admin parts must pass (FR-080). Core gaps are tracked, may be reported
  upstream, and **need owner acceptance** as a known limitation, or extra scope to override
  components.
- **MFA in Payload's admin flow** needs a gate across admin views and the REST API. A missed path
  means a bypass, hence the security suite and the single access wrapper.
- **Hosting is undecided**: background jobs, cron and media storage depend on it. Adapters keep
  the code neutral, and R-H runs before launch.
- **Vendor billing**: R2 may need a card on file. Local disk is used until billing is verified.
- **Content dependencies CD-01…CD-12** block publishing, not building. Unverified content stays
  draft.

## Complexity Tracking

No constitution violations require justification.
