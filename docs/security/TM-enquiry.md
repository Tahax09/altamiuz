# Threat Model: Contact Enquiries (US5, T129)

Scope: the public contact form (`src/ui/enquiry/EnquiryForm.tsx`, server action
`src/app/(site)/[locale]/enquiry-action.ts`), the submission pipeline (`src/modules/enquiries/`),
the staff notification job, the enquiry inbox in the admin, the export endpoint, the retention
job and the job runner endpoint (`POST /api/jobs/run`).

**Assets**: visitors' personal data; staff inboxes (phishing target); the email sending
reputation; the database (storage exhaustion); staff attention (spam).

**Actors**: anonymous visitors and bots; a compromised CMS account of each role; anyone who can
reach `/api/jobs/run`.

**Trust boundary**: everything in a submission is untrusted, including hidden fields, the
challenge token, `locale` and any extra fields.

## Pipeline (contracts/http-surface.md, D-15)

Origin check → rate limit (5 per source per 10 minutes, Postgres, fail closed) → Turnstile
verification (single use, unexpired, hostname and action matched; unavailable → fail closed) →
schema (only FR-070 fields; server-side limits; configured topics only) → one transaction that
stores the enquiry and queues its notification → confirmation.

## Threats and mitigations

| Threat                                        | Mitigation                                                                                                                                                                                              | Evidence                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Automated spam / bots (SC-011)                | Turnstile on every submission, verified server-side; missing, failed, expired and reused tokens rejected; service unavailable → refused (fail closed)                                                   | `tests/integration/enquiries/access-retention.test.ts`, `tests/security/enquiry-abuse.spec.ts`, `tests/unit/enquiries/turnstile.test.ts` |
| Flooding from one source                      | 5 attempts per source per 10 minutes, counted before every other check; limiter failure denies                                                                                                          | same                                                                                                                                     |
| Cross-site submission (CSRF)                  | Next server actions check the Origin; the pipeline also requires a same-origin `Origin` header                                                                                                          | integration (`refuses a foreign or missing Origin`)                                                                                      |
| Email header injection                        | CR/LF and other controls rejected in one-line fields; fixed subject; submitted values never in headers except the validated Reply-To; the email port re-validates addresses                             | integration (field cases), `tests/integration/enquiries/mailpit.test.ts` (real SMTP headers: no Bcc/Cc, injected line stays in the body) |
| Script / markup in stored content or email    | Stored as given and rendered only as text (admin text fields, plain-text email); no HTML part                                                                                                           | `enquiry-abuse.spec.ts` (admin view inert), Mailpit test (`HTML` empty)                                                                  |
| Phishing staff through spoofed links          | Plain text only; the email links to the CMS record on the site's own origin                                                                                                                             | email text test                                                                                                                          |
| Bidi or control characters disguising content | Bidi overrides and control characters rejected in one-line fields; controls (except newline/tab) rejected in the message                                                                                | integration                                                                                                                              |
| Mass assignment (status, retention date, id)  | Only FR-070 fields are read; delivery state and `deleteAfter` are set by the server                                                                                                                     | integration (`extra fields are ignored`)                                                                                                 |
| Lost enquiry (stored but never notified)      | Enquiry and job are written in one transaction; retries with exponential backoff (5 attempts); final failure marks the enquiry `failed` and logs a content-free operator alert                          | integration (atomicity, retry then delivery, final failure)                                                                              |
| Unauthorised reading or export (FR-076)       | Read, export and delete are separate permissions (Administrator, Owner) with MFA; export also needs re-authentication within 5 minutes; create and update are denied to everyone (system writes only)   | integration, `tests/e2e/us5-enquiry.spec.ts`                                                                                             |
| Untraceable access                            | Every document shown to a user is audited (`enquiry.view`), exports (`enquiry.export`, count), deletions (`enquiry.delete`), retention (`enquiry.retention_delete`, count); no content in audit entries | integration                                                                                                                              |
| Over-retention (FR-077)                       | `deleteAfter` = submission + 12 months; purge via `/api/jobs/retention` (daily Vercel Cron)                                                                                                             | integration (retention)                                                                                                                  |
| Personal data in logs (FR-078)                | Logs carry ids, codes and counts only; signals are allow-listed per name (`src/modules/platform/signals.ts`); tested by capturing the signal sink during a failing delivery                             | integration                                                                                                                              |
| CSV/formula injection in exports              | Cells quoted and formula-neutralised (`'=`)                                                                                                                                                             | integration (export)                                                                                                                     |
| Abuse of the job runner                       | Bearer `JOBS_SIGNING_SECRET`, constant-time compare; refused without a configured secret; a CMS session is not enough; Payload's own job endpoints are closed                                           | integration (runner)                                                                                                                     |
| Topic spoofing                                | Topic must equal a configured label for the submission's language                                                                                                                                       | integration                                                                                                                              |

## Residual risks and open items

- **Encryption at rest (FR-078)** relies on Neon's storage encryption (ADR-009); the owner
  verifies it for the chosen plan (O-7). Backups are age-encrypted (docs/runbooks/backup.md). No application-level field encryption; the admin must display and search
  enquiries.
- **Operator alerting** (T136, done 2026-11-07): the final failure emits the content-free signal
  `enquiry.delivery_failed` (`alert: true`) and readiness reports `enquiryDelivery: fail` from the
  database, which the external monitor turns into a page (docs/runbooks/monitoring.md). Paging a
  person still needs the owner's monitoring account and recipient (O-9).
- **Job scheduling** (ADR-009): Vercel Cron `GET /api/jobs/run` every minute and
  `GET /api/jobs/retention` daily; the in-process runner is refused in production. SC-010 measured
  locally at that cadence (docs/runbooks/monitoring.md#sc-010); to be re-measured on the preview
  with the chosen provider (O-6).
- **Real Turnstile** is unit-tested against Cloudflare's documented API with injected responses
  only; it is not exercised against Cloudflare (no external services in this stage).
- **Rate limit identity**: behind a proxy the source address depends on `TRUSTED_PROXY_HOPS` /
  `CLIENT_IP_HEADER`; misconfiguration would put every visitor in one bucket (fail safe, but a
  denial-of-service lever). On Vercel: `CLIENT_IP_HEADER=x-real-ip` (ADR-009, O-5).
- **Privacy notice (CD-10)** missing: the form must not launch (`docs/content/privacy-notice-requirements.md`).
