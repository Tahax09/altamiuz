# Altamiuz Website Platform Constitution

This constitution governs the clean-room rebuild of the Altamiuz public website and its CMS.
It states obligations. A requirement here is not evidence that a control is implemented; only
merged code with passing tests and recorded verification counts as implemented.

## Core Principles

### I. Clean-Room Implementation

- All code MUST be written for this repository. Legacy Altamiuz code (the current Gatsby site
  or any other prior implementation) MUST NOT be copied, ported, or adapted.
- The live legacy site MAY be consulted only as a read-only source of content and information
  architecture; extracted content is subject to Principle XI.
- Third-party code, components, fonts, and assets MUST have a verified licence compatible with
  commercial use, recorded in the stage that introduces them.

Rationale: provenance and licensing must be provable for a security consultancy's own platform.

### II. Security-First Engineering

- Every feature that touches authentication, authorization, input, uploads, publishing, or
  external integrations MUST include a threat model (assets, actors, trust boundaries, abuse
  cases, mitigations) in its plan before implementation.
- Least privilege and secure defaults apply everywhere: deny-by-default access rules, minimal
  database and service-account privileges, strict security headers (CSP, HSTS, frame, referrer,
  permissions policy), and no debug or verbose error output in production.
- OWASP ASVS Level 2 (current release; 5.0.0 at ratification, re-verify per stage) is the
  verification target. Each security-relevant stage MUST map its controls to ASVS requirements
  and record which are verified, partially verified, or not yet addressed.
- Adversarial testing MUST cover, as applicable: authorization bypass, IDOR/BOLA, privilege
  escalation, injection, XSS, CSRF, brute force, rate-limit evasion, unsafe uploads, and session
  handling.
- Dependencies MUST be pinned via lockfile and scanned; known critical/high vulnerabilities
  block release unless a documented, time-bound exception exists.

Rationale: the client sells information security; the platform is part of its credibility.

### III. Accessibility (WCAG 2.2 AA)

- Public pages and the admin UI customisations built by this project MUST target WCAG 2.2 AA.
- Every UI stage MUST include automated checks (e.g. axe) plus manual keyboard and
  screen-reader verification of new interactive patterns, in both Arabic and English.
- Motion MUST be restrained and purposeful, and MUST honour `prefers-reduced-motion`.
- Drag-and-drop interactions MUST have a keyboard and single-pointer alternative.

Rationale: accessibility is a legal and quality baseline, not an enhancement.

### IV. Arabic/English Parity

- Arabic and English are equal first-class locales. Every public route, component, metadata
  field, structured-data block, email, and error message MUST exist in both.
- Layout MUST use logical CSS properties and `dir`-aware components so RTL and LTR render
  correctly; directional icons and motion MUST mirror where semantically appropriate.
- URLs MUST be locale-prefixed; each page MUST emit `lang`, `dir`, canonical, and reciprocal
  `hreflang` (including `x-default`) and a locale-specific sitemap entry.
- Untranslated content MUST NOT silently fall back on the public site; missing translations
  MUST be visible to editors and blocked or explicitly handled at publish time.

Rationale: genuine bilingual quality is a stated product requirement and a trust signal.

### V. Schema-Defined, Inert Content

- All editable content (pages, sections, navigation, banners, text, media, SEO, settings) MUST
  come from the CMS through typed schemas. Editor-facing copy MUST NOT be hardcoded in the
  frontend; only structural UI strings may live in versioned locale files.
- Page bodies MUST be composed of schema-defined, reorderable section blocks.
- Editable content MUST NOT carry executable JavaScript, raw HTML, inline event handlers, or
  arbitrary embeds. Rich text MUST be stored as structured data and rendered through an
  allow-listed serializer; URLs MUST be scheme-validated.

Rationale: structured, inert content prevents stored XSS and keeps design integrity.

### VI. Test-First for Critical Boundaries (NON-NEGOTIABLE)

- For authentication, authorization/RBAC, uploads and media processing, draft/publish/preview,
  localization, and every other security boundary, tests MUST be written and observed failing
  before the implementation that makes them pass.
- Authorization tests MUST include negative cases per role and per resource (who must be denied).
- Other code MUST have tests proportionate to risk. Coverage figures do not substitute for
  boundary tests.

Rationale: these boundaries fail silently and expensively; tests are the only durable proof.

### VII. Identity, Access & Accountability

- There MUST be no public registration and no default or seeded production credentials. The
  first administrator is provisioned through a documented, one-time, out-of-band procedure.
- RBAC and granular permissions MUST be enforced server-side on every operation (API, admin,
  preview, server actions). Client-side checks are presentation only.
- Privileged roles MUST require MFA. Login and recovery MUST be rate-limited and bot-protected;
  recovery MUST NOT enable account enumeration.
- Sessions MUST use secure, HttpOnly, SameSite cookies, rotate on privilege change, expire on
  idle and absolute timeouts, and be revocable by administrators.
- Users MUST NOT be able to grant themselves or others a role above their own.
- Security-relevant events (auth success/failure, MFA changes, role/permission changes, publish,
  delete, settings changes, media deletion) MUST be written to an append-only audit log that
  editors cannot alter.

Rationale: the CMS is the highest-value target; compromise defaces a security brand.

### VIII. Secure Media Handling

- Uploads MUST be authenticated, size-limited, type-allow-listed, and verified by content
  (magic bytes), not by extension or client MIME. SVG and other active formats are rejected
  unless sanitized by an approved pipeline.
- Each image is uploaded once; the server MUST re-encode it, strip metadata, and generate
  responsive variants. Editors MUST be able to set a focal point used when cropping.
- Stored objects MUST use non-guessable keys; drafts and unpublished media MUST NOT be publicly
  reachable.
- Media ordering MUST persist server-side and be operable via drag-and-drop and keyboard.

Rationale: uploads are the most common path from CMS access to server or visitor compromise.

### IX. No Secrets or Sensitive Data in the Repository

- Secrets, API keys, production credentials, personal data, and customer data MUST NOT be
  committed. `.env.example` contains placeholders only.
- Secret scanning MUST run before commits (pre-commit) and in CI.
- Any committed secret is treated as compromised: rotate first, then purge history.

Rationale: repository history is permanent and broadly replicated.

### X. Disciplined Database Migrations

- Schema changes MUST go through Payload's Drizzle-based migration workflow; no ad-hoc schema
  edits in shared or production databases.
- Each migration MUST be reviewed, tested against a disposable database, documented with intent
  and data impact, and provide a working `down` path where technically feasible; where not
  feasible, the irreversibility and recovery plan MUST be stated.
- Production migrations MUST be preceded by a verified backup.

Rationale: content is the client's asset; schema mistakes must be recoverable.

### XI. Evidence-Backed Claims

- Company facts (legal name, registrations, licences, founder credentials, services, client
  names, testimonials, partnerships, certifications, statistics) MUST NOT be published unless
  verified evidence is recorded. Unverified items are marked as such and kept out of production.
- No content may be invented to fill a layout. Placeholder copy MUST be clearly marked and MUST
  NOT reach production.
- Trust badges and logos MUST NOT appear without written authorization from their owner.

Rationale: false or unsupported claims are a legal and reputational risk for a consultancy.

### XII. Maintainable, Observable, Recoverable

- Code MUST be organised into cohesive modules with explicit boundaries so a future client
  portal can be added without restructuring; portal features MUST NOT be built speculatively.
- Public and internal APIs MUST be documented; architecture decisions MUST be recorded as ADRs.
- Performance budgets (Core Web Vitals and asset size) MUST be defined in the first plan and
  enforced in CI thereafter.
- Structured logs, error tracking, health checks, and uptime monitoring MUST exist before
  production launch; logs MUST NOT contain secrets or unnecessary personal data.
- Backup and restore for database and media MUST be documented and restore-tested before launch.

Rationale: a small team needs a system it can understand, debug, and restore.

### XIII. Stage-Based Verifiable Delivery

- Work proceeds in approved stages, each with written, verifiable acceptance criteria.
- A stage is complete only with: passing tests (output recorded), security review of the diff,
  accessibility checks where UI changed, and an explicit list of what remains.
- Each stage ends at a commit checkpoint prepared for owner approval. Nothing is pushed,
  deployed, or connected to external services without explicit authorization.

Rationale: small, evidenced steps keep quality visible and rollback cheap.

### XIV. Standards Integrity

- Every standards reference MUST be classified as one of: (a) applicable requirement (legal or
  contractual obligation), (b) engineering target this project aligns with, or (c) formal
  certification (only with an issued certificate from an accredited body, cited with scope and
  validity).
- Referenced standards (e.g. OWASP ASVS, WCAG 2.2, NIST SSDF, ISO/IEC 25010, 27001/27002,
  27034, 29148, 29119, 12207, ISO 9241-210, ISO/IEC 42001) are engineering targets by default.
  Editions MUST be verified when cited.
- Neither the codebase nor public copy may state or imply that Altamiuz or this platform is
  certified or compliant on the basis of engineering alignment.

Rationale: misrepresenting certification undermines the client's core business.

## Technology Stack & Open Decisions

Approved architecture (WS1 2026-10-16, reaffirmed v1.1.0):

- Application: Next.js (App Router) with Payload CMS 3 embedded, TypeScript, single deployable.
- Database: PostgreSQL via Payload's Postgres adapter; migrations via Payload's Drizzle-based
  workflow. Prisma is not used.
- Locales: `ar` and `en`, full RTL/LTR parity.
- CMS scope: public website management only, structured for future portal extensibility.
- Typography candidates: Manrope (English headings), Inter (English body/UI), IBM Plex Sans
  Arabic (Arabic). Visual direction: institutional precision, modern advisory, restrained
  cybersecurity detail; light-first editorial layout.
- Multi-tenancy is out of scope. PostgreSQL RLS is adopted only if a real data-isolation
  requirement is approved.

Environments, hosting, and cost (v1.1.0):

- Local development comes first. Local development and the automated test suite MUST run
  without paid accounts or external service credentials.
- Vercel MAY be used for private preview deployments only, and only within its applicable plan
  terms. Production hosting is undecided.
- No paid subscription, purchase, production deployment, or production secret may be created
  without explicit owner approval for that specific item.
- Application code MUST stay deployment-neutral (no hard dependency on a single host's
  proprietary runtime features) until production hosting is decided.

External services (proposed production options; none is approved for purchase):

- Every external service MUST sit behind a documented adapter with a local or test substitute,
  selected by configuration. Production mode MUST refuse to start when a required production
  service or security setting is missing; it MUST NOT fall back silently to a development
  substitute.
- Media storage: local storage in development; Cloudflare R2 is the proposed production option,
  pending account and billing verification.
- Planned integrations: Upstash Redis (rate limiting, caching), Upstash QStash (background jobs),
  Resend (transactional email), Cloudflare Turnstile (bot challenge on public and auth forms).
- Analytics: cookieless, no personal data or persistent identifiers, configurable, and disabled
  by default in local development and tests.
- Cloudflare WAF, proxying, bot management, and related edge controls MUST be evaluated against
  the eventual production architecture; they are not assumed compatible with any host.

Implementation status (non-negotiable reading of this document):

- Engineering requirements in this constitution and in specs do not prove that any control is
  implemented. Only merged code with passing tests and recorded verification counts.
- Payload is not assumed to meet this project's requirements for MFA, audit logging, upload
  security, or authorization. Each is an acceptance criterion to implement and verify.

Unresolved (MUST be decided before the stage that depends on them):

- TODO(PROD_HOSTING): production host, region (EU low-latency to Libya preferred), and cost
  approval; VPS remains a candidate.
- TODO(VENDOR_BILLING): account and billing verification for each proposed production service.
- TODO(PAYLOAD_RTL): Payload admin Arabic/RTL experience is unverified; a proof of concept MUST
  precede finalising the admin experience. Public-site RTL support does not prove admin support.
- TODO(TYPOGRAPHY): final typefaces and licences after specimen review in both scripts.
- TODO(PERF_BUDGETS): numeric performance budgets, set in the first implementation plan.
- TODO(ANALYTICS_PROVIDER): free or self-hostable provider, selected after privacy, security,
  hosting, and legal evaluation.

## Delivery Workflow & Quality Gates

- Flow per feature: `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` (MUST pass the
  Constitution Check) → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
- Plans MUST include: threat model (Principle II), ASVS mapping, accessibility approach,
  localization impact, migration impact, and test strategy.
- Merge/commit gate: type-check, lint, unit and integration tests, security tests for touched
  boundaries, secret scan, dependency audit, and accessibility checks for UI changes all pass,
  with results reported.
- Deviations from a principle require a written justification in the plan's Complexity
  Tracking section and owner approval before implementation.

## Governance

- This constitution supersedes conflicting practices, templates, and conventions in this
  repository.
- Amendments require a written proposal, owner approval, a Sync Impact Report, and updates to
  dependent artifacts where affected.
- Versioning: MAJOR for removing or redefining a principle; MINOR for adding a principle or
  materially expanding guidance; PATCH for clarifications.
- Every plan and review MUST check compliance; non-compliance blocks the stage until resolved
  or an approved exception is recorded.
- Runtime agent guidance lives in `CLAUDE.md` (to be created) and MUST NOT contradict this
  document.

**Version**: 1.1.0 | **Ratified**: 2026-10-16 | **Last Amended**: 2026-10-16
