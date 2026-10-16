# Threat Model and ASVS Mapping (plan level): Altamiuz v1

**Date**: 2026-10-16 | **Plan**: [plan.md](./plan.md)

This is a plan-level model, required by constitution II. Each phase refines its part in
`docs/security/TM-*.md` before code. Status values describe **plans, not implementation**:
nothing here is implemented or verified.

## Assets

1. Admin accounts and sessions, especially owner and administrator.
2. Published site integrity: the brand of a security consultancy.
3. Unpublished drafts, claim evidence, and private media.
4. Enquiry personal data.
5. Audit log integrity.
6. Secrets: Payload secret, MFA key, service credentials.
7. Availability of the public site and contact channel.

## Actors

- Anonymous visitor
- Automated bot or scanner
- Credential-stuffing attacker
- Malicious or compromised editor
- Compromised administrator
- Malicious uploader (via a compromised account)
- Supply-chain attacker (dependency)
- Crawler

## Trust boundaries

- Browser → request proxy (headers, redirects, locale) → server components or Local API → Postgres.
- Browser → admin/REST (session + MFA + access matrix) → Postgres / storage.
- Server → external services (Turnstile, email, Redis, object storage) through adapters.
- Job trigger → `/api/jobs/run` (signed).
- Developer machine and CI → repository (secrets boundary).

## Top abuse cases → mitigations

| # | Abuse case | Mitigation (plan ref) | Test |
|---|---|---|---|
| T1 | Credential stuffing or brute force on login | lockout + per-source rate limit, breached-password check, MFA for all (FR-032–034, D-6) | security suite: brute force, enumeration timing |
| T2 | MFA bypass: calling the API or admin after the password step only | single `requireMfa` wrapper on all access functions, admin views and preview; session flag set only after TOTP (D-6, D-7) | every route enumerated with a password-only session must return 401/403 |
| T3 | TOTP replay or guessing, recovery-code reuse | last-used-step check, attempt limits, hashed single-use codes (FR-033b) | replay and brute-force tests |
| T4 | Privilege escalation via the role field or user management | field-level access from the matrix, strict-higher rule, last-owner guard (D-8) | matrix-generated tests incl. self-escalation |
| T5 | IDOR/BOLA on drafts, enquiries, media | Local API for public site, anonymous REST denied, per-document access, private draft media (D-3, D-12) | id-swap tests per collection |
| T6 | Stored XSS or unsafe links through CMS rich text. **Evidence**: Payload 3.91.0 `validateUrl()` accepts `javascript:`/`data:`/`vbscript:`/`file:`; the JSX link converter renders `href` unsanitized; R-A persisted a pasted `javascript:` link. Also: inline CSS via text `style`, unexpected node types via API, draft or autosave or restore paths skipping `validate` | Project allow-list policy enforced in a richText `beforeChange` hook on every write path, plus `validate`, plus drafts validated; safe renderer re-applies the policy; `scan:richtext` for out-of-band writes; strict CSP with nonces (FR-013a–d, FR-014, D-22, [rich-text contract](./contracts/rich-text.md)) | Adversarial corpus through admin paste, REST, Local API, draft, autosave, duplicate, version restore, nested blocks and both locales; render test with malicious content injected directly into the DB; SC-018 |
| T7 | Malicious upload (polyglot, SVG script, decompression bomb, path tricks) | magic-byte allow-list, pixel and size limits, re-encode, random names, no SVG (D-12) | malicious fixture suite |
| T8 | Contact form spam, header injection, flooding | Turnstile fail-closed, rate limit, schema limits, plain-text email, escaped reply-to (D-15) | abuse suite |
| T9 | Open redirect or redirect loop | internal targets or allow-listed hosts only, graph validation (D-13) | redirect suite |
| T10 | Session theft or fixation | HttpOnly/Secure/SameSite cookies, rotation on login, MFA and role change, idle and absolute expiry, revocation (D-7) | session suite |
| T11 | CSRF on admin or form actions | SameSite, Payload CSRF origin list, server-action origin checks (D-17) | cross-origin POST tests |
| T12 | Audit tampering by an admin or app bug | no API write access, DB trigger blocks UPDATE/DELETE (D-9) | direct SQL and API tests |
| T13 | Secret leakage via repo, logs, errors | gitleaks, log redaction, generic errors, production config guard (FR-095, FR-101, FR-105) | redaction tests, gitleaks |
| T14 | Dependency compromise | lockfile, audit/osv scan, minimal dependencies, install-script review | CI scan |
| T15 | Draft or admin indexing, preview leakage | noindex, robots, auth-only preview, no shareable links (D-11, D-16) | crawler tests |
| T16 | Unverified claims published (reputational/legal) | evidence gating (FR-016) | publish-blocked test |

## ASVS 5.0 Level 2 mapping (chapter level, targets)

| ASVS chapter | Plan coverage | Phase |
|---|---|---|
| V1 Encoding and Sanitization | JSX rendering, Lexical allow-list, parameterised queries via the ORM | 3, 5 |
| V2 Validation and Business Logic | shared schemas, publish rules, evidence gating, rate limits | 3, 6 |
| V3 Web Frontend Security | CSP, HSTS, framing, cookie flags, CSRF | 1, 2 |
| V4 API and Web Service | anonymous REST denied, GraphQL off, documented endpoints | 1, 3 |
| V5 File Handling | D-12 pipeline | 4 |
| V6 Authentication | password policy, lockout, MFA for all, recovery, invitations | 2 |
| V7 Session Management | D-7 | 2 |
| V8 Authorization | access matrix, field-level access, object-level checks | 2, 3 |
| V9 Self-contained Tokens | auth/preview token handling if JWTs are used (R-C) | 2 |
| V10 OAuth and OIDC | not applicable in v1 (no federated login) | — |
| V11 Cryptography | TOTP secret encryption, hashing, key management via env | 2 |
| V12 Secure Communication | TLS/HSTS, decided with hosting | 7 |
| V13 Configuration | config loader, no defaults, dependency hygiene | 1 |
| V14 Data Protection | enquiry minimisation, retention, cache controls on admin pages | 6 |
| V15 Secure Coding and Architecture | module boundaries, supply-chain controls | 1 |
| V16 Security Logging and Error Handling | audit log, structured logs, redaction, generic errors | 2, 7 |
| V17 WebRTC | not applicable | — |

The chapter titles follow ASVS 5.0.0 and should be re-verified against the official release when
`docs/security/asvs-l2.md` is produced at requirement level in Phase 1.
