# ADR-005: Sessions, expiry and lockout (R-C, T038)

- **Status**: Accepted (WS7, 2026-10-16). Implemented in Phase 3 (T062, T063).
- **Evidence**: `tests/integration/auth/rc-sessions.test.ts` against Payload 3.91.0 with the
  shipped placeholder auth config (all defaults). The findings JSON is written to
  `test-results/rc-sessions-findings.json` on each run.

## Measured behaviour (2026-10-16)

| Capability                                                | Built-in?                                                                                                          | Evidence                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Server-side session per login (`useSessions`, default on) | **yes**: distinct `sid` per login, rows in `users_sessions`                                                        | test "each login creates a distinct…"      |
| Revocation                                                | **yes**: deleting the session row rejects the token immediately                                                    | test "removing the session row…"           |
| Absolute expiry                                           | **yes**: `tokenExpiration` (default 7,200 s) bounds token and session                                              | test "absolute expiry…"                    |
| Idle timeout                                              | **no**: a token unused for 31 min is still accepted                                                                | test "GAP: no idle timeout…"               |
| Lockout                                                   | **yes**: `maxLoginAttempts` (default 5) → `LockedAuth`; correct password refused while locked                      | test "locks the account…"                  |
| Same error for wrong password vs unknown account          | **yes**: both `AuthenticationError` / 401                                                                          | test "wrong password and unknown account…" |
| Same error for locked vs unknown account                  | **no**: `LockedAuth` vs `AuthenticationError` (account enumeration)                                                | test "GAP: a locked account…"              |
| Comparable timing                                         | **no**: median ≈82 ms for an existing account with a wrong password vs ≈1 ms for an unknown account (no hash work) | test "GAP (informational)…"                |

## Decision

1. **Use Payload's built-in sessions** for revocation. Set `auth.tokenExpiration` to 12 h, the
   absolute lifetime (A-6). There will be no separate `sessions` collection.
2. **Idle timeout (30 min, A-6) is project code** (T062). It records `lastSeenAt` per session and
   rejects or deletes sessions idle longer than 30 min in the auth path used by the admin, REST and
   preview. Activity updates are throttled to limit write load.
3. **Session rotation**: a new session on login (built in). Rotation on MFA completion and role
   change is project code (T062): delete the old session and issue a new one.
4. **Lockout**: keep Payload's `maxLoginAttempts: 5` and `lockTime` per A-8. **Wrap login and
   recovery** (T063) so responses are identical for unknown, wrong-password and locked accounts,
   and timing is equalised (always perform a password-hash comparison). Lockouts are notified to
   the account owner by email instead of being revealed in the response.
5. Per-source and per-account rate limits (T039 limiter) apply in front of login, MFA and recovery
   (T055).

## Consequences

T048 and T049 tests must assert the gaps closed: uniform locked/unknown responses, timing within
tolerance, and idle expiry. The GAP tests in the spike become assertions of the fixed behaviour
once T062/T063 land.
