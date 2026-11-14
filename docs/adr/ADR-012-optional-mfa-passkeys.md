# ADR-012: Optional two-factor authentication and passkeys

- **Status**: Accepted (owner decision, 2026-11-14: "The owner explicitly rejects mandatory MFA for
  v1. Keep MFA optional and default it to OFF … Add passkey support using WebAuthn/FIDO2").
- **Amends**: FR-033, FR-033a–c, SC-017 (spec.md, amended in place with a dated note); ADR-005
  (sessions) gains a sign-in method per session; D-6 (mandatory TOTP) is superseded.
- **Code**: `src/modules/auth/{passkeys,mfa,sessions,settings,endpoints}.ts`,
  migrations `20261114_064904_optional_mfa`, `20261114_142706_passkeys`.

## Decision

1. **Policy switch.** Security settings → "Require two-factor authentication for every account"
   (`requireMfa`), owner only, **off by default**. Changing it needs a completed sign-in and a
   re-authentication within 5 minutes, and is audited (`settings.change`). Other server instances
   apply a change within 30 seconds (settings cache).
2. **When a sign-in is complete** (one rule, `sessionComplete()` in `sessions.ts`): the session
   completed a second step, **or** the owner does not require two-factor authentication **and** the
   account has no authenticator app. An account that set up an authenticator app is always asked
   for its code, whatever the first step was. Every collection, global, admin view, preview and
   custom endpoint keeps checking this one flag (`isMfaVerified`, unchanged name).
3. **Two different things a passkey can be**, never confused in code, UI or audit:

   | Use                          | Factors                                                           | Counts as two-factor authentication?                                                                |
   | ---------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
   | Passwordless sign-in         | One credential (device + its screen lock), replacing the password | **No.** Recorded as `auth_method = 'passkey'`; the second step is still asked where rule 2 needs it |
   | Second step after a password | Password + passkey                                                | **Yes**                                                                                             |

   A passkey session can never use a passkey as its second step (`not_allowed`). The UI says the
   same in words ("On its own it is one sign-in step, not two-factor authentication").

4. **WebAuthn verification** (`@simplewebauthn/server` 14.0.3): RP ID and origin from `SITE_URL`;
   user verification **required** at registration and every assertion; attestation `none` (no
   device allow-list in v1); resident keys required (discoverable sign-in). Challenges are random
   (library), stored server-side, single-use (`DELETE … RETURNING`), valid 5 minutes, bound to
   their purpose and, where a session exists, to that user and session. The signature counter can
   only move forward (atomic compare-and-set; authenticators that always report 0 stay at 0). The
   asserted user handle must equal the credential owner's random 32-byte handle (never the id or
   e-mail). At most 10 passkeys per account.
5. **Gates on changing credentials.** Adding or removing a passkey, turning the authenticator app
   off and regenerating recovery codes need a completed sign-in and recent re-authentication
   (password, 5 minutes; completing a second step also counts). Adding an authenticator app to a
   complete session needs re-authentication; an incomplete session (owner requires it) may add one
   as its first second step, **except** a password session on an account that already holds
   passkeys (`passkey_required`), so a stolen password cannot attach a new factor to such an
   account. Removing a passkey ends the user's other sessions.
6. **Recovery.** Password recovery by e-mail changes only the password and keeps every factor
   (unchanged). The lost-device reset by a higher role (FR-033c) now removes the authenticator
   app, its recovery codes **and all passkeys**, ends all sessions and e-mails the user. Recovery
   codes remain the self-service path for a lost authenticator app.
7. **Audit and notices.** `passkey.register`, `passkey.remove` (success, failure, denied),
   `auth.login.success`/`failure` with `method: 'passkey'`, `mfa.remove` for turning the app off,
   `settings.change` for the policy. No challenge, credential id, public key, assertion or secret
   is ever logged. The user is e-mailed (Arabic and English) when a passkey is added or removed and
   when the authenticator app changes.

## Residual risks (accepted by the owner's decision)

- **Optional means single-factor for accounts that opt out.** With the default policy, an account
  without an authenticator app is protected by its password alone (or one passkey). Anyone with
  that password has the account's full role, can add a passkey or authenticator app (after
  re-entering the password) and can lock the real holder out until an administrator resets the
  account. Mitigations that remain: breached-password check, lockout and rate limits, new-device
  notices by e-mail, audit trail, session limits. **Recommendation**: the owner and administrators
  set up an authenticator app or use a passkey after their password; the owner can turn the
  requirement on at any time without a deployment.
- **First-time setup under the requirement**: when the owner turns the requirement on, an account
  that has no second factor and no passkey sets up its authenticator app at its next sign-in after
  the password alone (as with D-6 before). A stolen password used first wins that race.
- **E-mail compromise**: password recovery by e-mail gives full access to an account without an
  authenticator app under the default policy.
- **Passkey sync**: synced passkeys (iCloud Keychain, Google Password Manager, 1Password) are as
  safe as that account. The UI shows which passkeys are synced; v1 does not refuse them.
- **No attestation**: any authenticator that performs user verification is accepted; the UV flag
  is the authenticator's own statement.
- **Browser support**: passkeys need a secure context and a domain name (`localhost` locally;
  never an IP address). Production uses its https origin; changing the domain invalidates every
  registered passkey (RP ID changes).
- **Settings cache**: up to 30 seconds on other instances after the owner changes the policy.

## Alternatives rejected

- Keep TOTP mandatory (D-6): rejected by the owner.
- Count a passwordless passkey sign-in as two-factor authentication: a passkey with user
  verification is a strong single credential, but treating it as "two factors" would make the
  policy switch and the UI claim something the session did not do. Rejected for v1.
- Allow passkey registration from a password-only session while the requirement is on: would let
  a stolen password add a factor and then pass the second step with it. Rejected.
