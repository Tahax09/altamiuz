# ADR-003: Exact version pins and upgrade policy

- **Status**: Accepted (WS5 D-1/D-22; implemented in Setup T001). **Amended 2026-10-16 (WS6)** for security fixes, owner-approved. **Amended 2026-11-05** (Amendment 2): Payload 3.92.1, Next 16.4.5.
- **Decision**: `payload` and all `@payloadcms/*` = **3.91.0**; `next` = **16.3.8**; `react` and
  `react-dom` = **19.2.6**; `sharp` = **0.35.5**. R-A tested Payload 3.91.0 with Next 16.3.3; the
  amended Next and sharp versions are patch releases on the same lines. Every
  dependency is pinned exactly in `package.json`, and `pnpm-lock.yaml` is committed and installed
  with `--frozen-lockfile`.
- **Supporting choices (not ADR-pinned before Setup, chosen in T001)**:
  - TypeScript 5.9.3: not 7.x, because Payload and Next tooling is unverified on TypeScript 7.
  - ESLint 9.39.5 with eslint-config-next 16.3.3: Next's flat config targets ESLint 9.
  - Vitest 5.0.5 with Vite 7.3.7, the required peer.
  - GraphQL 16.14.2: the peer Payload requires, although GraphQL is disabled.
  - `pg` 8.20.0: matches the version `payload@3.91.0` depends on.
- **Upgrade rule**: any bump of Payload or Next is a dedicated change. It must pass the rich-text
  adversarial suite (T071/T072) and the per-locale publish regression suite (T075), which uses
  `experimental.localizeStatus`, before merge.

## Amendment 1 (2026-10-16, WS6): security patch bump

- **Trigger**: Gate 1 `pnpm audit` and osv-scanner found these advisories in the original pins:
  - `next` 16.3.3: GHSA-vcvr-r3jv-pc5j (critical, next/og RCE; fixed in 16.3.6),
    GHSA-cjq9-62q9-8jv4 (high, image-optimisation SSRF; fixed in 16.3.8), and moderate cache and
    draft-mode issues (fixed in 16.3.8).
  - `sharp` 0.35.4: GHSA-wq5f-xc86-pv6w (high, librsvg; fixed in 0.35.5).
- **Change**: `next` 16.3.3 → **16.3.8** (released 2026-09-30, inside `@payloadcms/next@3.91.0`'s
  peer range `>=16.3.3 <17`); `sharp` 0.35.4 → **0.35.5** (released 2026-09-27). Owner approved
  this in WS6.
- **Verification**: every Gate 1 check was re-run after the bump (see the WS6 report).
- **Remaining advisories**: dev-only, transitive or low-severity. They are time-bound exceptions
  in `docs/security/dependency-exceptions.md`, expiring 2026-11-16.

## Amendment 2 (2026-11-05): dependency advisory remediation

- **Trigger**: `pnpm audit` reported 37 findings (3 critical, 14 high), including two critical
  unauthenticated RCEs in `next` ≤ 16.4.0 (GHSA-2464-fhr4-w9xw, GHSA-673q-mjm6-r5xr) and four high
  `undici` advisories in the version `payload@3.91.0` pins (7.29.1).
- **Change** (owner-requested remediation):
  - `next` 16.3.8 → **16.4.5** (latest patch on the 16.4 line, released 2026-11-03; first fixed
    release 16.4.1). Inside `@payloadcms/next`'s peer range `>=16.3.3 <17`.
    `eslint-config-next` 16.3.3 → 16.4.5 to match.
  - `payload` and all `@payloadcms/*` 3.91.0 → **3.92.1** (released 2026-10-27), the first line
    that pins `undici` 7.30.1. 3.93.0 (released 2026-11-04) was not needed and was not taken.
    `pg` stays 8.20.0, which 3.92.1 still depends on. Password hashing constants that
    `src/modules/auth/crypto.ts` mirrors (pbkdf2-sha256-v1, 600,000 × 32; legacy 25,000 × 512)
    are unchanged in 3.92.1.
  - `nodemailer` 10.1.1 → 10.1.7; `@lhci/cli` 0.15.1 → 0.16.0 (dev).
  - One scoped pnpm override, `@lexical/headless>happy-dom` → 21.0.4. Rationale and evidence:
    `docs/security/dependency-exceptions.md` ("Remediation 2026-11-05").
- **Upgrade rule evidence**: the per-locale publish regression suite (T075,
  `tests/integration/content/publish.test.ts`, pin assertion now 3.92.1) and the rich-text
  adversarial suites (T071 `tests/integration/content/richtext-writepaths.test.ts` and the admin
  paste test in `tests/security/content-http.spec.ts`; T072 `tests/unit/content/render.test.ts`)
  pass, along with the full unit, integration and
  Playwright suites, typecheck, lint and the production build.
- **Comments that cite 3.91.0 or 16.3.8** in source and tests record where a behaviour was found.
  The tests that pin those behaviours still pass on the new versions; the comments were not
  rewritten.
- **Remaining advisories**: time-bound exceptions in `docs/security/dependency-exceptions.md`.
