# Contract: HTTP Surface

All responses carry the headers in research D-17. Anything not listed here returns a 404.

## Public site (anonymous)

| Path | Method | Behaviour |
|---|---|---|
| `/` | GET | 307 to `/{locale}` by the A-3 rule (cookie → Accept-Language → `ar`); `Vary: Cookie, Accept-Language` |
| `/{locale}` | GET | home page; `locale ∈ {ar, en}`; `<html lang dir>` |
| `/{locale}/{slug}` | GET | published page in that locale; otherwise a localized 404 with a link to the other locale if it exists |
| `/{locale}/{seg(servicesIndex)}`, `/{locale}/{seg(servicesIndex)}/{slug}` | GET | automatic listing / detail (FR-018). `en`: `services`; `ar`: `TODO(AR_ROUTE_VOCAB)` |
| `/{locale}/{seg(trainingIndex)}`, `/{locale}/{seg(trainingIndex)}/{slug}` | GET | automatic listing / detail. `en`: `training`; `ar`: `TODO(AR_ROUTE_VOCAB)` |

Segments come only from the typed route map (research D-5). A request whose segment belongs to
the other locale (e.g. `/ar/services/…`) returns 404 unless an explicit redirect exists.
| `/sitemap.xml` | GET | published, indexable pages, both locales, `xhtml:link` alternates |
| `/robots.txt` | GET | disallows `/admin`, `/api`, `/preview`, auth paths; `Disallow: /` outside production |
| any redirect `from` path | GET/HEAD | 301/302 to target in one hop (FR-064, FR-065) |

## Contact submission

`POST` via a server action (fixed in Phase 6, 2026-11-06: `sendEnquiry` in
`src/app/(site)/[locale]/enquiry-action.ts`; `/api/enquiries` stays the admin collection API).
Turnstile's widget posts its token as `turnstileToken`.

- **Input**: `name, email, phone?, organization?, topic, message, consent, locale, turnstileToken`
  (validated with a shared schema; limits in data-model.md).
- **Order of checks**:
  1. Origin check
  2. Rate limit (A-8: 5 per source per 10 min)
  3. Turnstile verification (fail closed)
  4. Schema validation
  5. Persist
  6. Enqueue email
- **Responses**: `200 { ok: true }`; `400 { errors: { field: code } }` (codes localized on the
  client); `403` bot check failed; `429` rate limited with `Retry-After`; `503` bot service
  unavailable. Messages do not reveal which check failed beyond these codes.

## Operations

| Path | Method | Access | Behaviour |
|---|---|---|---|
| `/api/health` | GET | public | `{ status }` liveness only, no versions or details |
| `/api/health/ready` | GET | token from env or internal network | database ping |
| `/api/jobs/run` | POST | `Authorization: Bearer <JOBS_SIGNING_SECRET>` (constant-time; QStash signature when `JOBS_TRIGGER=qstash`, not built) | runs due jobs; `?retention=1` also purges expired enquiries and audit entries; 401 otherwise |

## Admin and CMS API (authenticated + MFA)

- `/admin/**`: Payload admin with MFA gate views (`/admin/mfa/enrol`, `/admin/mfa/verify`). CSP
  per R-D.
- `/api/{collection}` REST: used by the admin only. Every operation goes through the access
  matrix. Anonymous requests get 403 except `GET /api/media/file/*` for publicly used media.
- GraphQL: disabled.
- `/preview/{collection}/{id}?locale=`: draft mode, requires session + MFA + read permission;
  `noindex`.
- Custom endpoints: `POST /api/users/mfa/{enrol|verify|recovery}`, `GET/DELETE /api/sessions`,
  `POST /api/invitations`, `GET /api/enquiries/export`, `GET /api/audit-events/export`. Each is
  rate-limited and audited, and recent re-authentication is required where FR-039 applies.

## Documentation obligation

`docs/api.md` documents every custom endpoint: authentication, required permission, request and
response schema, rate limit, and audit action (FR-096). It is generated from or checked against
the route schemas in CI.
