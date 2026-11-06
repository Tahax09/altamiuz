# Dependency Vulnerability Exceptions

Constitution II: known critical or high vulnerabilities block release unless a documented,
time-bound exception exists. Every exception below is enforced in both scanners and expires on the
date in its row. After that date the scanners fail again until the exception is re-reviewed.

- `osv-scanner.toml`: every exception, with `ignoreUntil` (the expiry).
- `package.json` → `pnpm.auditConfig.ignoreGhsas`: only the high and critical ones, because
  `pnpm audit:deps` runs `pnpm audit --audit-level high`. pnpm has no expiry field, so the expiry
  is enforced by osv-scanner and by this file.

Nothing here is a production-readiness claim. Re-run `pnpm audit:deps` whenever dependencies
change.

## Current exceptions (re-verified 2026-11-06)

Every exception has the same owner: **Taha Alabyad (project owner)**. Expiry dates are unchanged
from the commit that recorded them (`dcca936`, and 2026-10-16 for esbuild); only the owner may
extend one. Each block says what must happen before it expires. Affected and fixed ranges are taken
from `pnpm audit --json` on 2026-11-06.

### E-1 DOMPurify inside Monaco (admin code editor) — expires 2026-12-05

| Advisory            | Severity | Affected        | Fixed in |
| ------------------- | -------- | --------------- | -------- |
| GHSA-cg2g-xh64-v4q7 | critical | ≥3.4.4 ≤3.4.16  | 3.4.17   |
| GHSA-mrv2-3pqr-j5jr | high     | ≤3.4.16         | 3.4.17   |
| GHSA-c6gr-qvv4-5v3f | low      | ≤3.4.16         | 3.4.17   |
| GHSA-p98j-92pf-mc4p | low      | ≥3.4.13 ≤3.4.15 | 3.4.16   |
| GHSA-6688-9rhm-gjv2 | low      | ≤3.4.15         | 3.4.16   |

- **Path** (production dependency): `dompurify` 3.4.15 ← `monaco-editor` 0.57.0 ← `@monaco-editor/react`
  4.7.0 ← `@payloadcms/ui` 3.92.1. `monaco-editor` is not pinned by Payload: it is the
  auto-installed peer of `@monaco-editor/react` (`>= 0.25.0 < 1`).
- **Exposure**: admin only. Payload renders JSON and code fields with Monaco; v1 has one such
  field, `audit-events.meta` (readable by roles with `audit-events:read`, after MFA). Inside
  Monaco, DOMPurify is used by `vs/base/browser/domSanitize.js`, which the markdown renderer
  (hovers, content widgets) and buttons call. The public site never loads Monaco.
- **Unverified**: which Monaco actually runs. Payload does not call the loader's `config`, so by
  code reading `@monaco-editor/loader` 1.7.0 fetches Monaco 0.55.1 from `cdn.jsdelivr.net`, not the
  installed 0.57.0. The admin CSP (`script-src 'self' 'nonce-…' 'strict-dynamic'`,
  `style-src 'self' 'unsafe-inline'`, `connect-src 'self'`) would let the injected loader script
  run but block parts of a CDN Monaco. No test opens an audit event's document view, so this has
  not been observed in a browser.
- **Mitigation**: admin requires authentication and MFA; the field holds server-written audit
  metadata, not user HTML; public rendering does not use DOMPurify.
- **Why no fix**: `monaco-editor` 0.57.0 is the latest stable release. It pins `dompurify`
  3.4.15 exactly and **vendors** it (`esm/vs/base/browser/dompurify/dompurify.js`), so a pnpm
  override would change the lockfile but not the shipped code.
- **Upstream remediation (tracked)**: the prerelease `monaco-editor@0.58.0-dev-20261105` (dist-tag
  `next`) already depends on `dompurify` 3.4.17. When `monaco-editor` 0.58.0 is published as
  `latest`: run `pnpm update monaco-editor` (lockfile only, inside the peer range), confirm the
  vendored file's header reads 3.4.17, re-run the audit, and remove all five entries from both
  scanners.
- **Before expiry**: (1) open an audit event's document view in the admin and record whether
  Monaco loads from the CDN and whether the CSP blocks it; (2) if 0.58.0 is still unreleased, the
  owner decides whether to re-date.

### E-2 basic-ftp in the Lighthouse CI proxy chain — expires 2026-12-05

- **Advisory**: GHSA-c475-qrg2-pj4r, high; affected ≤6.2.0, fixed in 6.2.1. Quadratic CPU use in
  `Client.list()` when parsing a hostile server's directory listing.
- **Path** (devDependency, not shipped): `basic-ftp` 5.3.1 ← `get-uri` ← `pac-proxy-agent` ←
  `proxy-agent` 6.5.0 ← `@lhci/cli` 0.16.0.
- **Exposure**: only when Lighthouse CI is given an `ftp://` proxy auto-config URL.
- **Mitigation**: no proxy or PAC URL is configured; Lighthouse CI runs only against the local
  build (`pnpm perf:lighthouse`).
- **Why no fix**: the latest `get-uri` (8.0.1) still requires `basic-ftp ^5.3.1`.
- **Before expiry**: check `get-uri` and `@lhci/cli` for a release that allows `basic-ftp` ≥6.2.1;
  otherwise the owner decides whether to re-date.

### E-3 minimatch in lint tooling — expires 2026-12-05

- **Advisory**: GHSA-g3hv-75wg-m249, moderate; affected ≥7.0.0 <11.0.1, fixed in 11.0.1.
- **Path** (devDependency, not shipped): `minimatch` 10.2.6 ← `@typescript-eslint/typescript-estree`
  ← `@typescript-eslint/parser` ← `eslint-plugin-import` ← `eslint-config-next` 16.4.5.
- **Exposure / mitigation**: lint-time only, on the repository's own globs (trusted input).
- **Why no fix**: the latest `@typescript-eslint/typescript-estree` still requires `^10.2.2`.
- **Before expiry**: check for a `typescript-estree` release on minimatch 11.

### E-4 deepmerge in Payload — expires 2026-12-05

- **Advisory**: GHSA-gcqx-w48m-w2h4, low (CVSS 3.1 5.3, integrity low); affected ≥4.2.0 ≤4.3.1; no
  fixed release published. Prototype poisoning of the object `mergeObject()` returns (not global
  prototype pollution).
- **Path** (production dependency): `deepmerge` 4.3.1 ← `payload` 3.92.1.
- **Exposure (corrected 2026-11-06)**: reachable. On every create and update, Payload's
  `beforeChange` field hook builds validation data with `deepMergeWithSourceArrays(doc, data)`
  (`payload/dist/fields/hooks/beforeChange/promise.js`), so request data from any authenticated
  writer passes through deepmerge before field validators run. The public enquiry form (T123,
  not yet built) would add an unauthenticated write path if it writes through Payload. The
  earlier statement that no request body reaches deepmerge was wrong.
- **Mitigation**: writes require an authenticated, permitted role; the merged object is used only
  as validator input, and project validators read their own field values. No test yet sends a
  `__proto__` or `constructor` key through a write.
- **Before expiry**: add an integration test that a write carrying `__proto__`/`constructor`
  keys neither changes validation outcomes nor persists those keys (proposed below); check
  deepmerge and Payload for a fix.

### E-5 esbuild via drizzle-kit — expires **2026-11-16**

- **Advisory**: GHSA-67mh-4wv8-2f99, moderate; affected ≤0.24.2, fixed in 0.25.0. esbuild's
  development server answers cross-origin requests.
- **Path** (production dependency tree, CLI only): `esbuild` 0.18.20 ← `@esbuild-kit/core-utils`
  3.3.2 ← `@esbuild-kit/esm-loader` ← `drizzle-kit` 0.31.7 ← `@payloadcms/db-postgres`
  3.92.1 (audit path).
- **Exposure (re-verified 2026-11-06)**: none found. Payload imports only `drizzle-kit/api`; neither
  `drizzle-kit/api.js` nor `bin.cjs` loads `@esbuild-kit/*` (they use drizzle-kit's own esbuild
  0.25 and `esbuild-register`). The vulnerable copy is installed but not loaded, and nothing in
  this project starts an esbuild dev server.
- **Mitigation**: no esbuild dev server anywhere.
- **Why no fix**: Payload 3.92.1 and 3.93.0 both pin `drizzle-kit` 0.31.7; the latest drizzle-kit
  (0.31.11) still declares `@esbuild-kit/esm-loader`, which is deprecated ("merged into tsx") and
  stays on esbuild `~0.18.20`.
- **Follow-up action (owner decision needed by 2026-11-16)**: on that date osv-scanner stops
  ignoring this advisory and `pnpm audit:deps` / CI fail. The owner either re-dates the
  exception in `osv-scanner.toml` and here (proposed: 2026-12-05, aligned with E-1…E-4, on the
  evidence above), or accepts a red supply-chain gate until upstream drops `@esbuild-kit`. It is
  not ignored in `pnpm.auditConfig` (moderate is below the `--audit-level high` gate).

Retired 2026-11-05: GHSA-vfj7-8cjw-p6xm (`braces`). Neither pnpm audit nor osv-scanner matches it
in the current lockfile (`braces` 3.0.3), so it was removed from both configurations.

## Remediation 2026-11-05

Commit `dcca936`. Before: `pnpm audit` 37 findings (3 critical, 14 high, 12 moderate, 8 low),
35 advisories; the `audit:deps` gate failed. After: 26 advisories resolved, 9 findings remain
(1 critical, 2 high, 2 moderate, 4 low), all in E-1…E-5 above; `pnpm audit --audit-level high` and osv-scanner pass.

| Change                                                                           | Advisories resolved                                                                                                                                                                          |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next` 16.3.8 → 16.4.5 (direct; fixed in 16.4.1, inside Payload's peer range)    | GHSA-2464-fhr4-w9xw, GHSA-673q-mjm6-r5xr (critical, unauthenticated RCE), GHSA-p3m5-59mp-jv5r (high)                                                                                         |
| `payload` and `@payloadcms/*` 3.91.0 → 3.92.1 (brings `undici` 7.29.1 → 7.30.1)  | GHSA-2m5v-pch6-74hx, GHSA-4w7w-5xrc-9h26, GHSA-qrxm-fqhp-jwvm, GHSA-xjj6-f33q-929c (high), GHSA-4qv8-2p9j-2685, GHSA-55wc-3pg8-jfw6, GHSA-9fm3-97px-rjf6, GHSA-f72v-6w45-q472 (moderate)     |
| `nodemailer` 10.1.1 → 10.1.7 (direct)                                            | GHSA-8c8m-p3m8-cjg8, GHSA-85x2-q946-cp5h, GHSA-m943-m63m-w62w (moderate; fixed in 10.1.4)                                                                                                    |
| `@lhci/cli` 0.15.1 → 0.16.0 (dev; `lighthouse` 13.6.0, `puppeteer-core` 25.16.0) | GHSA-7pqw-9j4j-h8q3, GHSA-jmr9-qjv8-65gv (`extract-zip`, removed), GHSA-mrhx-c7xc-m3w5 (`zod` 4), GHSA-ph9p-34f9-6g65, GHSA-52f5-9888-hmc6 (`tmp`, removed), GHSA-w5hq-g745-h8pq (`uuid` 14) |
| `eslint-config-next` 16.3.3 → 16.4.5 (dev; kept in step with `next`)             | none on its own                                                                                                                                                                              |
| `fast-uri` 3.1.8 → 3.1.9 (lockfile only, inside `ajv`'s `^3.0.1`)                | GHSA-333x-w4r6-6crp, GHSA-xhq7-xmqj-769h, GHSA-w74x-v6f9-j3xg, GHSA-wjr9-j795-jxcr                                                                                                           |
| `happy-dom` 20.14.6 → 21.0.4 via a scoped override `@lexical/headless>happy-dom` | GHSA-834v-8h66-3h79, GHSA-c8p4-j97h-3vg8 (high)                                                                                                                                              |

The `happy-dom` override is the only override. `happy-dom` is a production dependency of
`@lexical/headless` 0.50.0 (pulled in by `@payloadcms/richtext-lexical`), which declares `^20.9.0`;
no 20.x release is fixed, and Payload 3.93.0 still uses Lexical 0.50. The override is scoped to
that one edge and is judged safe because:

- Payload never imports `@lexical/headless/dom`, the only entry point that loads `happy-dom`;
- Lexical itself moved to `happy-dom ^21.0.4` in 0.53.0;
- `withDOM()` + `$generateHtmlFromNodes()` from Lexical 0.50.0 were run against happy-dom 21.0.4
  and produced correct, escaped HTML;
- Vitest (`environment: 'node'`) resolves the same 21.0.4 as its optional peer.

Remove the override when `@payloadcms/richtext-lexical` moves to Lexical ≥ 0.53.

Remaining known gaps: `@puppeteer/browsers` 3.2.6 has an optional peer `proxy-agent >=8.0.1` that
`@lhci/cli` 0.16.0 does not meet (it ships 6.5.0). It is used only to download browsers through a
proxy; Lighthouse CI here uses Playwright's Chromium (`CHROME_PATH`).
