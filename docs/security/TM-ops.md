# Threat Model: Operations (US8, T132–T136, ADR-009)

Scope: health endpoints, the scheduler endpoints, operational signals (logs), backups and
restores, production configuration, and the hosting boundary (Vercel, Neon, R2).

**Assets**: availability; the database and media (all content, accounts, audit log, enquiries);
backup artefacts and the backup key; operational secrets; the alert path itself.

**Actors**: anonymous internet clients; the host scheduler; a compromised CI runner or provider
token; an insider with access to backups or the hosting console.

| Threat                                                       | Mitigation                                                                                                                                                                                                              | Evidence                                                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Reconnaissance through health endpoints                      | Liveness returns `{status}` only; readiness needs a bearer token (constant-time) and returns check names with ok/fail, never hosts, errors or counts                                                                    | `tests/integration/platform/health.test.ts`, `tests/integration/ops/observability.test.ts`          |
| Forged scheduler calls (spam the queue, force purges)        | Bearer `JOBS_SIGNING_SECRET` (= Vercel `CRON_SECRET`) on GET and POST, constant-time; missing secret → every call 401; cookies/CMS sessions do not authorise; purges only delete what retention rules already allow     | observability test: missing, wrong, `Basic`, suffixed, lower-case `bearer` → 401 on all four routes |
| Cross-site GET triggering jobs                               | Authorisation is a header token, which a browser cannot attach cross-site                                                                                                                                               | same                                                                                                |
| Probe hangs exhausting functions                             | Each readiness check is capped at 3 s and counts as failed                                                                                                                                                              | observability test (hanging check)                                                                  |
| Secrets or personal data in logs                             | Pino redaction plus allow-listed, primitive-only signal fields; abuse signals carry scope/reason only (no IP, email, account id, submitted text)                                                                        | `tests/unit/platform/logger.test.ts`, observability test (content-free assertions)                  |
| Log pipeline failure hides an outage                         | Emitting never throws; delivery failures are also read from the database by readiness, so the monitor pages without logs                                                                                                | observability test (broken sink; alert visible via readiness)                                       |
| Alert path shares the failing component                      | Alerts come from the external monitor polling readiness, not from the app's own email provider                                                                                                                          | docs/runbooks/monitoring.md                                                                         |
| Unsafe production configuration                              | Start-up refuses dev substitutes, test Turnstile keys, placeholders, plaintext/credential-less/loopback SMTP, non-TLS database URLs, the in-process job runner and missing scheduler secret; errors name variables only | `tests/unit/platform/config.test.ts`                                                                |
| Backup theft                                                 | age encryption before anything reaches disk; only the public key on the runner; separate bucket and write-only token; private key offline with two holders                                                              | `tests/integration/ops/backup.test.ts` (no plaintext markers), drill report                         |
| Backup tampering or corruption                               | SHA-256 sidecar and age header verified for both artefacts before restore touches anything; age is authenticated encryption                                                                                             | backup test (tampered byte, missing checksum)                                                       |
| Restore overwrites live data                                 | Restore refuses non-empty databases and media directories; single-transaction `pg_restore`; production restores go to a new Neon branch                                                                                 | backup test (non-empty target refused, unchanged)                                                   |
| Malicious archive paths on restore                           | `tar` default refusal of absolute and `..` members (GNU tar, bsdtar)                                                                                                                                                    | documented; artefacts are authenticated by age                                                      |
| Silent backup stoppage                                       | Heartbeat monitor with 26 h grace; failed workflow notifies                                                                                                                                                             | docs/runbooks/backup.md                                                                             |
| Unbounded growth (rate-limit buckets)                        | Ended windows purged by the daily retention route                                                                                                                                                                       | observability test (`rateLimitBucketsDeleted`)                                                      |
| Connection-string exposure via process list on backup runner | Runner is a single-tenant GitHub-hosted VM; read-only database role                                                                                                                                                     | accepted residual risk                                                                              |

## Residual risks and open items

- **Encryption at rest of Neon and R2** is a provider property; the owner verifies it for the
  chosen plans (O-7). Not testable from this repository.
- **Provider and console compromise**: Vercel/Neon/R2/GitHub accounts need MFA and least-privilege
  tokens (owner). A compromised Vercel account can read every runtime secret.
- **Storage adapter missing** (O-3): production cannot serve media yet; readiness reports it.
- **Production RTO** depends on Neon/R2 transfer rates; the local drill measured seconds for a
  ~2.4 MB backup set. Repeat the drill against a Neon branch before launch.
- **Backup workflow and Vercel Cron** are configured in the repository but have never run (no
  remote, no accounts in this stage).
