# Runbook: Public Data Cache (L-3, SC-009)

The public site caches published content per server process (`src/app/(site)/data.ts`, cache
tags plus `revalidate: 60`). Every write made through the CMS expires the affected tags at once
(`expireCacheTags`, `{ expire: 0 }`), so publishes, unpublishes and deletes are visible on the next
request.

## When the cache does not see a change

Writes that bypass the application do not expire any tag:

- a database restore (backup runbook), a migration that rewrites content, a SQL fix;
- a script or import that writes with `payload` outside a Next request.

Without action, each running server keeps serving the previous content for **up to 60 seconds**
(measured 2026-11-04: an out-of-band title change appeared after 62–64 s).

## Procedure

1. Finish the out-of-band write (and `pnpm scan:richtext` after a restore).
2. Signed in to the CMS as an **Administrator or Owner** (with the second factor), send
   `POST /api/ops/expire-public-cache` from the CMS origin, for example from the browser console
   on an admin page: `await fetch('/api/ops/expire-public-cache', { method: 'POST' })`.
   It answers `200` with the expired tags and records a `cache.expire` audit event. Publishers,
   Editors, sessions without the second factor and cross-origin requests get `403` (audited).
3. Reload an affected public page: it shows the new content.

## Limits (hosting-dependent, T132)

- **Per process.** The tag manifest lives in each server process. With more than one instance,
  call the endpoint on each instance or, better, configure a shared cache handler when hosting is
  decided. Until then, every instance converges within 60 seconds on its own.
- Restarting the server also clears its in-memory cache; `.next/cache` on disk holds the
  persistent part of the data cache and can be deleted while the server is stopped.

Evidence: `tests/security/cache-invalidation.spec.ts` ("after an out-of-band database write…"),
`tests/integration/platform/cache-expire.test.ts`.

## Production (Vercel, ADR-009)

The Data Cache behind `unstable_cache` is shared by all Vercel function instances, so one
`POST /api/ops/expire-public-cache` expires every instance. Verify this on the first preview
deployment by repeating the out-of-band write test above before relying on it.
