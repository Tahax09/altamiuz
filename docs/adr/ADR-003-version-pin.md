# ADR-003: Exact version pins and upgrade policy

- **Status**: Accepted (WS5 D-1/D-22; implemented in Setup T001). **Amended 2026-10-16 (WS6)** for security fixes, owner-approved.
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
