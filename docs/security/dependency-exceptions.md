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
