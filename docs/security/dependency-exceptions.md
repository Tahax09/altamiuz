# Dependency Vulnerability Exceptions

Constitution II: known critical or high vulnerabilities block release unless a documented,
time-bound exception exists. Each exception below is enforced in both scanners
(`package.json` → `pnpm.auditConfig.ignoreGhsas`, and `osv-scanner.toml` with `ignoreUntil`) and
**expires 2026-11-16**. After that date the scanners fail again until each one is re-reviewed.

Recorded 2026-10-16 (WS6) after the owner-approved patch bump (`next` 16.3.3 → 16.3.8,
`sharp` 0.35.4 → 0.35.5), which removed 1 critical and 2 high advisories.

| Advisory            | Severity | Package / path                                                                                        | Exposure assessment                                                                                              | Resolution path                                                                            |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| GHSA-vfj7-8cjw-p6xm | high     | `braces` ← micromatch ← fast-glob ← `@next/eslint-plugin-next` ← `eslint-config-next` (devDependency) | Lint-time only, on our own file globs; not shipped in the production build and never fed untrusted input         | No fixed release published; re-check at expiry, or replace when eslint-config-next updates |
| GHSA-67mh-4wv8-2f99 | moderate | `esbuild` 0.18.x ← `@esbuild-kit/*` ← `drizzle-kit` ← `@payloadcms/db-postgres`                       | Affects esbuild's development server, which this project never starts; drizzle-kit runs as a local migration CLI | Upstream Payload/drizzle-kit dependency update                                             |
| GHSA-p98j-92pf-mc4p | low      | `dompurify` ← monaco-editor ← `@payloadcms/ui`                                                        | Admin-internal code editor, authenticated users only (no CMS code fields configured in v1)                       | Upstream bump to ≥3.4.16                                                                   |
| GHSA-6688-9rhm-gjv2 | low      | same as above                                                                                         | same as above                                                                                                    | same as above                                                                              |

Nothing here is a production-readiness claim. Re-run `pnpm audit:deps` whenever dependencies
change.

## Open findings, not excepted (2026-11-04)

`pnpm audit --audit-level high` fails. None of the advisories below is excepted or ignored: each
needs an owner decision (a dependency upgrade or a recorded exception) before release.

Present in the committed lockfile before 2026-11-04 (published after the exceptions above):

| Advisory                                                                           | Severity | Package / path                                 | Note                                                                   |
| ---------------------------------------------------------------------------------- | -------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| GHSA-2464-fhr4-w9xw                                                                | critical | `next` (direct, 16.3.8)                        | Runtime framework; needs an upgrade decision (ADR-003)                 |
| GHSA-673q-mjm6-r5xr                                                                | critical | `next` (direct, 16.3.8)                        | as above                                                               |
| GHSA-p3m5-59mp-jv5r                                                                | high     | `next` (direct, 16.3.8)                        | as above                                                               |
| GHSA-cg2g-xh64-v4q7                                                                | critical | `dompurify` ← monaco-editor ← `@payloadcms/ui` | Admin code editor (no code fields configured in v1)                    |
| GHSA-mrv2-3pqr-j5jr                                                                | high     | same as above                                  | same as above                                                          |
| GHSA-2m5v-pch6-74hx, GHSA-4w7w-5xrc-9h26, GHSA-qrxm-fqhp-jwvm, GHSA-xjj6-f33q-929c | high     | `undici` ← `payload`                           | Payload's HTTP client; needs a Payload/undici upgrade decision         |
| GHSA-834v-8h66-3h79, GHSA-c8p4-j97h-3vg8                                           | high     | `happy-dom` ← `vitest` (dev)                   | Test runner dependency; no test uses happy-dom (`environment: 'node'`) |

Added with `@lhci/cli` 0.15.1 (devDependency, T139; runs only against the local build):

| Advisory                                 | Severity | Package / path                                        | Exposure assessment                                                     |
| ---------------------------------------- | -------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| GHSA-7pqw-9j4j-h8q3, GHSA-jmr9-qjv8-65gv | high     | `extract-zip` ← `@puppeteer/browsers` ← lighthouse    | Browser download path; unused (Playwright's Chromium via `CHROME_PATH`) |
| GHSA-c475-qrg2-pj4r                      | high     | `basic-ftp` ← get-uri ← pac-proxy-agent ← proxy-agent | Only with an FTP proxy auto-config URL; none is configured              |
| GHSA-mrhx-c7xc-m3w5                      | high     | `zod` ← chromium-bidi ← puppeteer-core                | Parses messages from the locally launched browser only                  |
| GHSA-ph9p-34f9-6g65                      | high     | `tmp` ← external-editor ← inquirer                    | Interactive `lhci wizard` only; never run                               |
