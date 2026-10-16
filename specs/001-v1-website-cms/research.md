# Research: Altamiuz v1 Website and CMS

**Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Evidence gathered so far is read-only (npm registry metadata and published package contents,
inspected in a scratch directory; nothing installed into the repository). Items marked
**VERIFY** are planning assumptions that must be confirmed by a research task before the phase
that depends on them. Nothing here claims a control is implemented.

## Evidence snapshot (2026-10-16)

| Item | Finding | Source |
|---|---|---|
| Payload | 3.91.0 current; `engines.node >=20.18.1` | `npm view payload` |
| Next.js | 16.4.2 current; `@payloadcms/next@3.91.0` peer accepts `>=16.3.3 <17` | `npm view @payloadcms/next peerDependencies` |
| Admin Arabic UI strings | `@payloadcms/translations` ships `languages/ar.js` (also `fa`, `he`) | tarball listing |
| Admin RTL styling | `@payloadcms/ui@3.91.0` `styles.css`: 37 `[dir=rtl]` rules, 94 logical-property uses | tarball grep |
| TOTP plugins | `payload-totp` 3.0.6 (MIT, single maintainer, active Sept–Oct 2026); `@purposeinplay/payload-totp` 0.5.1 | `npm search` |
| TOTP libraries | `otplib` 13.5.0, `otpauth` 9.5.2 | `npm view` |
| Fonts (self-host packages) | `@fontsource/ibm-plex-sans-arabic` 5.3.0, `@fontsource-variable/manrope` 5.3.0, `@fontsource-variable/inter` 5.3.0 | `npm view` |
| Vercel Hobby | non-commercial personal use only | vercel.com/docs/limits/fair-use-guidelines (updated 2026-09-14) |

The RTL styling evidence shows intent, not usability. It does not satisfy TODO(PAYLOAD_RTL).

## Research results (2026-10-16, WS4)

### R-A Payload Arabic/RTL admin: done
Full matrix, versions, reproduction steps and evidence:
[research/payload-rtl-poc/findings.md](../../research/payload-rtl-poc/findings.md).
Tested with Payload 3.91.0, Next 16.3.3 and Postgres 17 (Docker), using Playwright Chromium and
WebKit engines.

| Area | Result |
|---|---|
| Arabic content entry (fields, rich text, dropdowns, dates) in both UI languages | **works**: Arabic-locale fields render RTL, also under the English UI |
| Arabic admin UI | mostly mirrored correctly, **but** edit views with rich text overflow horizontally by ≈10,000 px in RTL (Lexical floating controls parked at `left:-9940px`); date meta glitch |
| Per-locale publish | **works** via `experimental.localizeStatus` (API verified: publishing `ar` leaves `en` draft) |
| Version restore | restore yields a **draft**; UI compare/restore not exercised |
| Document locking | **works** |
| Sessions | default `useSessions`: token **rejected after logout** |
| Array/blocks keyboard reorder | **fails**: drag handle not focusable; menu Move Up/Down exists but keyboard result unreliable; announcements English-only raw IDs |
| Rich-text paste | scripts, handlers and iframes dropped, **but a `javascript:` link URL is stored** (security finding) |
| Keyboard and focus in editor | Tab trapped (Esc+Tab exits); no visible editor focus indicator |
| axe on core admin | serious/critical violations on every view, identical in both UI languages |
| Not tested | 200% zoom, branded Safari/Chrome, Firefox, screen readers, real devices |

**Admin is not RTL-ready as an Arabic-language UI.** Arabic *content* editing is viable.

### R-B Typography: done
Report: [research/typography-specimen/report.md](../../research/typography-specimen/report.md).
- All three families are SIL OFL 1.1, confirmed at upstream: IBM/plex, rsms/inter,
  googlefonts/manrope. "Plex" is a Reserved Font Name.
- Shaping, ligatures, diacritics (no clipping at line-height 1.7) and isolated mixed-direction
  runs render correctly in the Chromium and WebKit engines at 375 and 1440 px.
- Not tested: Firefox, branded browsers, real devices.
- The 120 KB per-locale font budget is achievable **only** with ≤3 Arabic weights and no latin-ext
  on first load. Example: Arabic page with 2 weights = 93 KB; English page = 71–104 KB, computed
  from measured Google woff2 sizes. To be re-measured with self-hosted files.

### Decisions changed or added by the research
- **D-4 updated**: adopt `experimental.localizeStatus`. Pin Payload exactly; add a regression
  test for per-locale publish to the Phase 3 gate and re-run it on every Payload upgrade. Keep the
  `publishedLocales` fallback design documented.
- **D-12 updated**: Payload's built-in array/blocks reordering does not meet FR-012, FR-055 or
  WCAG 2.1.1. Build a project-owned **accessible reorder control** (focusable Move up/down, order
  position, localized `aria-live` announcements), used for gallery items, blocks and listing
  order.
- **D-22 (new) Rich-text URL safety**: a server-side `validate` hook walks the Lexical JSON and
  rejects any link or autolink URL whose scheme is not `https:`, `http:` (allow-listed host),
  `mailto:` or `tel:`, or an internal reference. The public renderer applies the same allow-list
  again. Covered by the XSS suite (threat T6). Check upstream Payload issues before reporting.
- **D-23 (new) Admin UI language**: English admin UI in v1, with Arabic content entered RTL. An
  Arabic admin UI is a later per-user option, gated on (a) an admin CSS fix for the RTL overflow,
  verified, and (b) re-running R-A checks 2–6.
- **D-24 (new) Typography**: adopt Manrope (EN headings), Inter (EN body/UI) and IBM Plex Sans
  Arabic (AR, ≤3 weights: 400/600/700).
  - Self-host unmodified OFL woff2 via `next/font/local`; no runtime Google requests.
  - Arabic line-height 1.7 (headings 1.45); Arabic small text ≥15 px.
  - Responsive `clamp()` type scale.
  - `<bdi>`/`dir="ltr"` wrappers for Latin identifiers, numbers with symbols, emails and phone
    numbers (the specimen showed "95%" rendering as "%95" without one).
- **Admin accessibility risk**: Payload core admin views have axe violations outside our control.
  FR-080 covers project-built customisations, which must pass. Core issues are tracked as a risk
  and may go to upstream reports. Owner awareness is needed (see plan Risks).

## Priority research tasks (run before detailed implementation)

### R-A. Payload Arabic/RTL admin proof of concept

**Question**: Can editors use the Payload admin (a) with the Arabic UI language, and (b) with the
English UI while editing Arabic content, at an acceptable usability and WCAG 2.2 AA level? Does
Payload support the localization behaviours the spec needs?

**Isolation**: `research/payload-rtl-poc/` with its own `package.json`; never imported by the app.
`node_modules/`, `.next/`, database volumes, and uploads are git-ignored. Only config, the
evidence directory, and `findings.md` are committed. Third-party scaffold code stays inside this
directory and is not copied into the application (constitution I).

**Prerequisite**: owner approval to install dependencies inside the isolated directory (WS3 did not
authorise installs).

**Procedure**

1. Pin versions: Payload 3.91.0, Next 16.4.x, Node 22 LTS, pnpm 10.
2. Check `pnpm dlx create-payload-app@3.91.0 --help`, then scaffold the blank template with the
   Postgres adapter into the POC directory. Run Postgres 17 in Docker on port 54329 with throwaway
   credentials held in a git-ignored `.env`.
3. Configure:
   - `localization`: locales `ar` (RTL) and `en`, `defaultLocale: 'ar'`, `fallback: false`.
   - `i18n`: `supportedLanguages` `{ ar, en }`, `fallbackLanguage: 'en'`.
   - A `pocPages` collection with drafts and versions enabled. Localized fields: text, textarea,
     Lexical rich text (headings, lists, links, quote), select, number, date, checkbox, a
     relationship, an upload with focal point, an array, and a blocks field with two block types.
   - A `pocMedia` upload collection with `focalPoint: true` and two `imageSizes`.
   - Also try per-locale publish status (`localizeStatus` or the current equivalent) and document
     locking.
4. Seed with realistic bilingual sample text. Include mixed-direction strings:
   `ISO/IEC 27001:2022`, `PCI DSS v4.0.1`, `info@example.ly`, `+218 21 000 0000`, Arabic-Indic and
   Western digits, and diacritics.
5. Run every check below in two configurations: **C1** Arabic UI with Arabic content, and **C2**
   English UI with Arabic content. Use desktop Chrome and Safari at 1440 px and 768 px, plus a
   200% zoom pass. Capture screenshots with the gstack `/browse` skill or with Playwright inside
   the POC directory.
6. Run axe on the login, list, edit, versions and media views. Spot-check with VoiceOver in Safari.
7. Record every check as pass, partial or fail. For each partial or fail, record the workaround
   (custom admin CSS, component override, or none) and link any upstream issue.

**Check matrix**

1. Login and account screens: direction, alignment, and error messages.
2. Navigation sidebar, breadcrumbs and header: mirrored correctly, icons point the right way.
3. List view: column alignment, pagination arrows, filters, search with Arabic input.
4. Edit view: label and input direction per field type. In C2, check that the Arabic content
   locale renders its fields RTL.
5. Rich text: caret movement, selection, toolbar position, lists and links, pasting from Word or
   web pages (sanitized).
6. Mixed-direction strings render and edit in logical order. No digit-reversal bugs.
7. Array and blocks rows: drag handle, keyboard reorder, screen-reader announcement, and order
   persisting after reload (FR-012, FR-055).
8. Upload focal-point picker: usable in RTL and operable by keyboard.
9. Date picker and number fields under the Arabic locale.
10. Relationship and select dropdowns: alignment and type-ahead with Arabic.
11. Draft, publish and autosave controls. Per-locale publish status (FR-020).
12. Version list, compare (diff) view, and restore behaviour (does restore create a draft?).
13. Document locking when two sessions edit the same document (FR-015).
14. Toasts, modals and validation errors: direction and focus management.
15. Keyboard-only journey (create, edit, publish) with visible focus that is never hidden
    (WCAG 2.4.11).
16. axe results, with no serious or critical issues in pages we control.

**Outputs**: `research/payload-rtl-poc/findings.md` (matrix, versions, reproduction commands,
decision) and an `evidence/` directory (screenshots named `C{1|2}-{check}-{width}.png`, plus axe
JSON).

**Decision rule**:
- If C1 passes, offer an Arabic admin UI.
- If C1 fails but C2 passes, the admin UI is English and Arabic content is entered RTL.
- If C2 fails on content direction, add an admin CSS or component override as a tracked task, or
  escalate.
- If checks 7, 11, 12 or 13 fail, plan custom work, recorded as plan amendments.

**Time box**: 1 working day.

### R-B. Typography specimen

**Question**: Do Manrope (English headings), Inter (English body and UI) and IBM Plex Sans Arabic
(Arabic) work together at production quality, and how should they be delivered?

**Isolation**: `research/typography-specimen/` holds one static `specimen.html` plus CSS. No
application or package installation is needed. The specimen may load the families from the
Google Fonts CSS2 API for research only. Production delivery is decided below.

**Procedure**

1. Build specimen panels in both directions:
   - Headings at 56, 40, 32, 24 and 20 px. Body at 18, 16 and 14 px.
   - Navigation bar, primary and secondary buttons.
   - A contact form with labels, hints, errors and focus states.
   - A card grid, a footer, and a table with numbers.
2. Use realistic but neutral copy (no company claims). Include these test strings:
   - Diacritics: `إِدَارَةُ أَمْنِ المَعْلُومَات`
   - The lam-alef ligature (لا, لأ, لإ) and long joined words
   - Arabic punctuation: ، ؛ ؟
   - Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) and Western digits
   - Mixed-direction strings: `ISO/IEC 27001:2022`, `PCI DSS v4.0.1`, email, `+218` phone numbers
   - Long English words, and Arabic headings that wrap to three lines
3. Test weights: Arabic 400/500/600/700 (Plex Arabic is static, 100–700); Manrope 500–800
   (variable); Inter 400–600 (variable).
4. Measure and record:
   - x-height and cap-height ratios, and the visual size match between Arabic and Latin on the
     same line. Derive `size-adjust` values for the Arabic face if needed.
   - Arabic line-height at which diacritics are never clipped (try 1.5–1.8).
   - Fallback font metric overrides (`ascent-override` and similar) to keep layout shift
     (CLS) at or below 0.02 when the web font swaps in.
   - woff2 size per family, weight and subset: arabic, latin, latin-ext.
5. Render in Chrome, Safari and Firefox on macOS, plus at least one real iOS and one Android
   device. Screenshot each panel in light theme at 375 px and 1440 px.
6. Check text contrast at 14 px against WCAG AA (4.5:1) using the candidate navy and charcoal
   palette.
7. Licensing: confirm the SIL OFL 1.1 licence for each family from its upstream repository
   (`IBM/plex`, `sharanda/manrope`, `rsms/inter`). Record the licence URL and the commit or release
   checked.

**Outputs**: `research/typography-specimen/report.md` (measurements table, screenshots, licence
record, recommendation) and `specimen.html`.

**Decision rule**: adopt the trio if Arabic diacritics never clip, mixed-direction lines look
balanced after `size-adjust`, and the font payload per locale on first load is ≤120 KB woff2.
Otherwise propose one change, with evidence.

**Time box**: half a working day.

## Decisions

### D-1 Runtime and framework versions
- **Decision**: Node 22 LTS, pnpm 10, Next.js 16.x (≥16.3.3), Payload 3.91.x, TypeScript strict.
  Pin exact versions in the lockfile and upgrade deliberately.
- **Rationale**: these are the current versions that satisfy Payload's peer range. Node 22 is
  already installed locally.
- **Alternatives**: Next 15.x LTS line (no benefit at this point); Payload 2 (end of life).

### D-2 Single deployable with module boundaries
- **Decision**: one Next.js app with Payload embedded, organised as `src/modules/*`. Each module
  exposes an `index.ts` public API, and lint rules forbid deep cross-module imports.
- **Rationale**: least operational surface. Clear seams leave room for a later portal
  (constitution XII).
- **Alternatives**: a separate API service (rejected in WS0); a monorepo with packages (premature).

### D-3 Public site reads through Payload's Local API only
- **Decision**: public pages render on the server via the Local API with explicit access
  (`overrideAccess: false` and an anonymous user). Anonymous REST and GraphQL access is denied for
  every collection except media file delivery. GraphQL is disabled.
- **Rationale**: removes most of the public API attack surface (BOLA and over-exposure, FR-092).
- **Alternatives**: public REST reads with field filtering (larger surface, more tests).

### D-4 Localization and per-locale publishing
- **Decision**: Payload `localization` with `ar` and `en`, default `ar`, `fallback: false`.
  Per-locale draft and publish uses Payload's per-locale status feature if R-A confirms it works.
  Otherwise, a `publishedLocales` field maintained by publish hooks, plus a public query filter.
- **Rationale**: FR-004 and FR-020. **VERIFY** in R-A check 11.

### D-5 URL scheme (approved by owner 2026-10-16, WS4)
- **Decision**: localized static route segments plus localized slugs. Example shape:
  `/ar/{ar-services-segment}/{arabic-slug}` and `/en/services/{english-slug}`.
  - **Centralized typed route map**: `modules/i18n/routes.ts` maps each route key
    (`home`, `page`, `servicesIndex`, `serviceDetail`, `trainingIndex`, `trainingDetail`) to one
    static segment per locale. Every link, the language switcher, canonicals, hreflang, the
    sitemap and redirects are built only through `href(routeKey, locale, params)`. No string
    concatenation of paths anywhere else (enforced by a lint rule).
  - **Locale-linked variants**: each page, service or course is one document with localized
    `slug` fields. The switcher and hreflang resolve the *same document's* other-locale slug.
    Missing locale → switcher disabled and no hreflang for that locale (FR-003, FR-004).
  - **Localized SEO**: self-canonical per locale; reciprocal hreflang plus `x-default`, all
    generated from the route map.
  - **Collision validation**: a save-time validator rejects a slug that (a) equals or prefixes
    any static segment of the same locale, (b) duplicates another document's slug in the same
    locale and route scope, or (c) equals an active redirect `from` path. A startup test
    asserts the route map itself has no duplicate segments per locale.
  - **Legacy URLs**: every inventory URL (FR-065) gets an explicit redirect entry to a
    route-map-generated target. No pattern-based catch-alls.
- **Arabic segment vocabulary**: **not decided.** `khadamat` in the owner's example is
  illustrative. The candidates (transliterated Latin such as `khadamat`, or Arabic script such
  as `الخدمات`, percent-encoded on the wire) go to owner and content review (CD-13, see spec).
  Until then, route-map values are placeholders flagged `TODO(AR_ROUTE_VOCAB)`, and changing them
  before launch costs nothing.
- **Rationale**: fully localized addresses for both audiences. A typed central map keeps the
  extra complexity (switcher, hreflang, redirects) in one testable place.
- **Alternatives rejected**: fixed Latin segments for both locales (the earlier proposal; less
  localized); CMS-editable segments (makes route integrity depend on editors).

### D-6 Authentication and MFA
- **Decision**: Payload local auth (email and password) for the first factor. MFA is a project
  module (`modules/auth/mfa`) built test-first on `otplib` (RFC 6238, SHA-1, 6 digits, 30 s step,
  ±1 step window):
  - TOTP secrets are encrypted at rest with a key from the environment.
  - Recovery codes (10) are stored as slow hashes.
  - Every collection, global, admin route and preview route checks a session flag `mfaVerified`
    through a single access wrapper.
  - `payload-totp` is reviewed as a reference only. It is adopted only if a code review in R-C
    finds it meets FR-033 to FR-033c and it is maintained.
- **Rationale**: authentication is the most critical security boundary; owning it keeps it
  testable and auditable. The plugin has a single maintainer.
- **Alternatives**: adopt `payload-totp` directly (faster, but concentrates supply-chain risk).

### D-7 Sessions
- **Decision**: server-side, revocable sessions.
  - Use Payload's built-in session support if R-C confirms it allows revocation, idle and absolute
    expiry, and listing. Otherwise, add a `sessions` collection referenced from the auth cookie.
  - Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, host-only, with a `__Host-` prefix where
    possible.
  - Limits: 30 min idle, 12 h absolute. Sessions rotate on login, MFA completion and role change.
- **VERIFY** in R-C.

### D-8 RBAC
- **Decision**: one `role` per user (`owner | administrator | publisher | editor`). A pure
  permission matrix `can(role, resource, action)` in `modules/access` generates every
  collection, global and field access function.
  - The role field can be updated only by a strictly higher role (or by an owner on an owner).
  - The last owner is protected by a hook plus a database check.
  - The matrix is also the source for a generated test suite covering every role × action cell,
    allowed and denied.
- **Rationale**: FR-036 to FR-038 and SC-003.

### D-9 Audit log
- **Decision**: an `audit-events` collection with no create, update or delete access through any
  API. Entries are written only by a server-side `audit.record()` service. A Postgres trigger in
  a migration rejects `UPDATE` and `DELETE` on the table except by the retention function.
- **Rationale**: append-only enforcement in depth (FR-047), so that application bugs cannot
  rewrite history.

### D-10 Content model
- **Decision**:
  - Pages are built from a `blocks` field with a fixed block library.
  - `services` and `courses` are separate collections with automatic listing routes.
  - Globals: `site-settings`, `header-nav`, `footer-nav` and `banner`.
  - Rich text uses Lexical with a feature allow-list and is rendered through a JSX converter with
    no raw HTML.
  - Claim-bearing blocks and fields carry an `evidence` group; publishing is blocked unless it is
    `verified` (FR-016).
- See [data-model.md](./data-model.md).

### D-11 Preview
- **Decision**: Next draft mode plus Payload live preview, reachable only by authenticated users
  who have completed MFA and have read permission. **No shareable preview links in v1**, which
  removes FR-022's link-token risk entirely.
- **Alternatives**: signed short-lived links (deferred until requested).

### D-12 Media pipeline
- **Decision**: Payload upload collection with `focalPoint` and `imageSizes`. A `beforeValidate`
  hook runs four checks:
  1. Check magic bytes against an allow-list (JPEG, PNG, WebP, AVIF) using a content sniffer.
  2. Reject files over 20 MB, and use sharp `limitInputPixels` to reject images over 40 MP.
  3. Re-encode through sharp. Metadata is dropped by default; never call `withMetadata`.
  4. Rename to a random 128-bit identifier.
- Variants are generated by Payload/sharp at upload time (AVIF and WebP, plus a JPEG fallback,
  at widths 480/768/1024/1440/1920). They are served through Payload's access-controlled file
  route, so draft-only media stays private. The public site uses these variants directly through
  a custom loader, avoiding host-specific image optimisation and its cost.
- Storage adapter is chosen by configuration: local disk in development; `@payloadcms/storage-s3`
  pointed at R2 is proposed for production, keeping Payload access control on reads.
- Ordered galleries use an `array` of `{ media }` rows, which gives persistent order. Keyboard
  accessibility is **VERIFY** in R-A check 7, with a custom accessible reorder control if it fails.

### D-13 Redirects
- **Decision**: a custom `redirects` collection rather than the plugin, because the plugin lacks
  loop and chain validation:
  - Save-time graph validation rejects loops, chains and non-allow-listed external targets.
  - Lookup happens in the request proxy against a cached table.
  - Paths are normalised (percent-decoded, NFC, trailing slash) before matching.
  - Slug changes automatically create redirects (FR-025).
- Legacy redirects are loaded from an approved map (CD-12) by an idempotent seed script. Nothing
  is seeded before approval.

### D-14 Service adapters and local substitutes (FR-105)

| Port | Local / test | Preview | Production option (proposed, not approved) |
|---|---|---|---|
| Storage | local disk | local disk if writable, else to be decided | Cloudflare R2 (S3 adapter) |
| Email | Mailpit (Docker SMTP) / in-memory in tests | Mailpit-equivalent or disabled | Resend |
| Rate limit | in-memory (unit) / Postgres-backed | Postgres-backed | Upstash Redis |
| Jobs (retries, retention) | Payload jobs queue (Postgres) run by a local runner | same | Payload jobs triggered by host cron or QStash |
| Bot challenge | Turnstile official test keys (always pass / always fail) | test keys | Turnstile production keys |
| Analytics | disabled | disabled | provider to be decided (R-F) |
| Error tracking | console | console | optional adapter, provider to be decided |

- A typed configuration loader (`modules/platform/config`) validates the environment. In
  production it refuses to start with any development substitute, missing secret, or default
  credential.
- No host-proprietary APIs (KV, Edge Config, host image optimisation). The build uses Next
  `output: 'standalone'`, so the same artefact runs on Vercel preview or in a container.

### D-15 Contact enquiries
- **Decision**: a Next server action (or a route handler) runs these steps:
  1. Validate input with a shared schema.
  2. Verify Turnstile on the server (single-use, unexpired, hostname and action matched).
  3. Apply the Postgres or Upstash rate limit.
  4. Insert the enquiry, then show confirmation.
  5. A job sends the email with retries and backoff, and alerts after the final failure.
- A retention job runs daily and hard-deletes enquiries older than 12 months, logging a
  content-free audit entry.
- Email bodies are plain text plus escaped HTML. The reply-to is a validated address; headers
  never take raw input.

### D-16 SEO
- **Decision**:
  - Metadata comes from the `seo` group plus site-settings defaults.
  - Each locale has a self-canonical URL, reciprocal `hreflang` links, and `x-default` → `/`
    (which redirects by the A-3 rule).
  - `sitemap.xml` is generated from published, indexable documents per locale.
  - `robots.txt` disallows `/admin`, `/api`, `/preview` and auth paths. Non-production
    environments send `X-Robots-Tag: noindex` and are protected (preview host protection is
    **VERIFY** under the plan terms).
  - JSON-LD for Organization, WebSite, BreadcrumbList, FAQPage, Service and Course is built from
    verified fields only.

### D-17 Security headers and CSRF
- **Decision**:
  - The request proxy sets a nonce-based CSP for public routes, with a separate policy for
    `/admin` (whatever minimum Payload's admin needs, measured and documented). Allowed origins:
    self, Turnstile (`challenges.cloudflare.com`), and the analytics endpoint if enabled.
  - Also set HSTS (preload once the production domain is fixed), `frame-ancestors 'none'`,
    `Referrer-Policy: strict-origin-when-cross-origin`, `nosniff`, and a restrictive
    `Permissions-Policy`.
  - CSRF: `SameSite` cookies, Payload `csrf` origin allow-list, and Next server action origin
    checks.

### D-18 Testing strategy

| Layer | Tooling | Scope |
|---|---|---|
| Unit | Vitest | access matrix, validators, redirect graph, TOTP, config loader |
| Integration | Vitest + real Postgres (Docker Compose locally, service container in CI) | collections, hooks, audit, jobs, Local API access |
| Security | Vitest (API) + Playwright | FR-097 adversarial suite, generated authorization matrix, malicious upload fixtures (polyglots, script-bearing SVG, decompression bombs, EXIF GPS, wrong extensions) |
| End-to-end | Playwright | user stories 1–8 in both locales |
| Accessibility | `@axe-core/playwright` + manual keyboard and screen-reader script | SC-006 |
| Performance | Lighthouse CI on mobile profile per template and locale | SC-007, SC-008 |
| Supply chain | gitleaks (pre-commit + CI), `pnpm audit` / osv-scanner, lockfile only | FR-098, SC-014 |

CI workflow files are written but only run locally until a remote is authorised.

### D-19 Observability
- **Decision**:
  - Structured JSON logs (pino) with field redaction (passwords, tokens, cookies, TOTP, enquiry
    bodies).
  - `/api/health` returns liveness, and readiness after a database ping.
  - Abuse counters are emitted as log events: login failures, rate-limit hits, rejected uploads,
    Turnstile failures.
  - An external uptime monitor and alert routing are chosen with the production host.

### D-20 Backups and recovery
- **Decision**:
  - Host-neutral scripts: encrypted `pg_dump` (with `age`) plus a media sync to off-site storage.
  - Daily backups kept 30 days (A-10: RPO 24 h, RTO 4 h).
  - A restore drill into a clean Docker environment is part of the launch gate.
  - The off-site provider is decided with hosting.

### D-21 Migrations
- **Decision**:
  - Payload's Drizzle migrations (`payload migrate:create`, `migrate`, `migrate:down`) are
    committed and reviewed.
  - Each migration is tested up/down/up in CI against disposable Postgres.
  - `push` mode is disabled outside throwaway local databases.
  - Data or irreversible migrations document their recovery path (constitution X).

### Performance budgets (resolves TODO(PERF_BUDGETS))

| Metric | Budget, per public template and locale (mobile, 75th percentile) |
|---|---|
| LCP | ≤ 2.5 s |
| CLS | ≤ 0.1 (fonts ≤ 0.02 contribution) |
| INP | ≤ 200 ms |
| First-visit transfer | ≤ 1 MB, excluding user-initiated media |
| JavaScript (compressed) | ≤ 150 KB |
| Web fonts on first load | ≤ 120 KB woff2 per locale |
| Publish-to-live | ≤ 60 s (on-demand revalidation) |

## Remaining research items (each scheduled in the phase named)

| ID | Item | Phase |
|---|---|---|
| R-C | Auth foundation spike: Payload session support (revocation, idle/absolute expiry), login lockout settings, enumeration-safe responses, `payload-totp` code review | Phase 2 start |
| R-D | Admin CSP minimum for Payload; nonce support in the Next proxy | Phase 1 |
| R-E | Version retention (A-11) via `maxPerDoc` vs a cleanup job; version restore semantics | Phase 3 (informed by R-A) |
| R-F | Analytics provider: first-party server-side page-view counter vs self-hosted Umami vs other free cookieless options; legal review input | Phase 6 |
| R-G | Preview-host protection and plan-term compliance for Vercel previews | before the first preview deploy |
| R-H | Production hosting comparison (commercially permitted hosts, cost, sharp support, cron/jobs, Cloudflare edge compatibility) | before launch planning |
