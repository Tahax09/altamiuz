# ADR-004: Content-Security-Policy for public, admin and API responses (R-D, T018)

- **Status**: Accepted for Setup; re-measure when authenticated admin views exist (Phase 3/4).
- **Method**: production build (`pnpm build && pnpm start`). A Playwright listener records
  `securitypolicyviolation` events on `/admin/login` in Chromium and WebKit
  (`tests/smoke/admin-csp.spec.ts`). It compares the shipped policy with a stricter candidate.
  With zero users, Payload redirects to the (blocked) first-user screen. The test therefore
  inserts a probe `users` row with no password hash, which cannot sign in, and deletes it after.

## Measured (2026-10-16, Payload 3.91.0 / Next 16.3.3)

| Policy                                                                                      | Chromium                                              | WebKit                      |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| Shipped admin policy (scripts nonce + `strict-dynamic`; `style-src 'self' 'unsafe-inline'`) | 0 violations, login renders                           | 0 violations, login renders |
| Candidate without style `'unsafe-inline'`                                                   | 6 × `style-src-elem` (inline `<style>` without nonce) | 6 × `style-src-elem`        |

## Decision

- **Public pages**: `default-src 'self'`; `script-src 'self' 'nonce-…' 'strict-dynamic'`;
  `style-src 'self' 'nonce-…'`; `img-src 'self' data: blob:`; `font-src 'self'`;
  `connect-src 'self'`; `frame-src https://challenges.cloudflare.com` (Turnstile);
  `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`.
  The public policy is re-measured when the first public pages exist (Phase 5).
- **Admin**: as public, but `style-src 'self' 'unsafe-inline'`, because Payload's admin injects
  un-nonced inline `<style>` elements (measured above). Also `font-src 'self' data:`,
  `frame-src 'self'` and `worker-src 'self' blob:`. Scripts remain nonce-only. This is the only
  admin relaxation.
- **API**: `default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`.
- **`upgrade-insecure-requests`**: emitted only when `SITE_URL` is https. Production config
  already requires https, so production always gets it. Keying it on `NODE_ENV` broke a local
  plain-http `next start` in WebKit, which upgraded same-origin assets to https (TLS failure,
  observed).
- **Development-only exception**: `next dev` adds `'unsafe-eval'` to `script-src`. Next's docs say
  React needs it for debugging, and production builds never include it (unit-tested).
- **Static headers on every response** (`next.config.ts`):
  - HSTS `max-age=63072000; includeSubDomains`; `preload` is deferred until the production domain
    is fixed.
  - `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.
  - A restrictive `Permissions-Policy` and `Cross-Origin-Opener-Policy: same-origin`.
- **Limitations**: measured on the login screen only. Authenticated admin views, the rich-text
  editor and live preview are re-measured in Phase 3/4.

## Amendment 1 (2026-11-06): admin scripts without `'strict-dynamic'` (closes F-1)

- **Trigger**: finding F-1 (`docs/security/dependency-exceptions.md` E-1). With
  `'strict-dynamic'`, a script that a trusted script injects runs from any origin. Payload's JSON
  field used it to load Monaco from `cdn.jsdelivr.net` into the authenticated admin.
- **Change**: admin `script-src 'self' 'nonce-…'` (no `'strict-dynamic'`), `worker-src 'self'`
  (no `blob:`, which only Monaco's workers used). Public and API policies unchanged.
  `audit-events.meta` renders through a read-only viewer instead of Monaco.
- **Measured** (production build, Chromium): 17 admin views (dashboard, every collection list,
  user, page, media and audit-event edit views, create views, globals): 0 CSP violations, 0
  requests to other origins; a jsDelivr `<script>` injected by page code is refused
  (`script-src-elem`) and never fetched. `tests/security/admin-code-editor.spec.ts`; the full
  Playwright suite (admin a11y, US4 and US7 admin e2e) passes under the new policy.
