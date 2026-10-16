# Threat Model: Accounts, Authentication and Access (TM-auth, T069)

Refines plan-level threats T1–T5, T10–T13 for US3. Every mitigation listed has test evidence,
except where marked as residual risk.

| Threat                            | Mitigation (code)                                                                                                                                                                                | Evidence                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Credential stuffing / brute force | Per-source (30/15 min), per-account (5/15 min = lockout) and per-account-day (20/24 h) limits in `login.ts`; fail-closed limiter                                                                 | `tests/integration/auth/enumeration.test.ts`              |
| Account enumeration (response)    | One generic 401 body for unknown, wrong-password, locked, suspended, rate-limited; recovery always 202                                                                                           | `enumeration.test.ts`, `tests/security/auth-http.spec.ts` |
| Account enumeration (timing)      | Real or dummy PBKDF2 (600k) on every path, then padding to a 400 ms floor. **Measured** median spread 1 ms (`test-results/auth-timing.json`)                                                     | `enumeration.test.ts`                                     |
| MFA bypass                        | Project strategy marks `mfaVerified` only after TOTP; every access function requires it; pre-MFA token rotated away                                                                              | `mfa.test.ts`, `auth-http.spec.ts` (T046)                 |
| TOTP replay / guessing            | Atomic `last_used_step` update; ±1 step; 5 attempts / 15 min per account                                                                                                                         | `mfa.test.ts`                                             |
| Recovery-code reuse               | Salted scrypt hashes; atomic `used_at` consumption (concurrent replay wins once)                                                                                                                 | `mfa.test.ts`                                             |
| Secret disclosure                 | MFA material in non-Payload tables; secret AES-256-GCM; `sessions` stripped from user-context reads; `/me` and login never return the token                                                      | `mfa.test.ts`, `authz.test.ts`, `auth-http.spec.ts`       |
| Session theft / fixation          | HttpOnly, SameSite=Lax, Secure + `__Host-` on https; new session per sign-in and on MFA completion; 30 min idle, 12 h absolute; revocation on role change, suspension, password change, recovery | `sessions.test.ts`                                        |
| Built-in bypass paths             | Proxy blocks first-register, forgot/reset-password, unlock, refresh-token, verify; static routes override login/me                                                                               | `auth-http.spec.ts`                                       |
| Privilege escalation / IDOR       | Matrix + `canActOnUser` in hooks; last-owner DB trigger; mass assignment of password blocked                                                                                                     | `authz.test.ts`, `tests/unit/access/matrix.test.ts`       |
| CSRF                              | Payload cookie extraction honours the csrf allow-list; project endpoints and login check Origin                                                                                                  | `auth-http.spec.ts` (T054)                                |
| Recovery takeover                 | 256-bit single-use 30-min tokens (hash stored); completion revokes sessions and keeps MFA                                                                                                        | `enumeration.test.ts`, `recovery.ts`                      |
| Repudiation                       | Audit events for all FR-045 account actions, incl. `access.denied`                                                                                                                               | `accounts.test.ts`, `authz.test.ts`, `auth-http.spec.ts`  |

## Residual risks

- **Timing under load**: the floor masks hash cost only while processing stays under 400 ms;
  heavy load could widen differences. Re-measure on the production host.
- **Payload internals**: the session strategy wraps `JWTAuthentication`, and the users table
  layout (`users_sessions`) is a Payload 3.91.0 detail. Covered by the version pin (ADR-003) and
  regression tests.
- **Admin UI hiding is UX only**: the MFA gate redirect can be bypassed client-side, but has no
  data effect (server enforcement tested).
- **Lockout as a DoS vector**: an attacker can lock a known account for 15 minutes. Accepted per
  A-8, and the owner is notified once per window.
