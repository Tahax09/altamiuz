# Runbook: Account Lockout and Lost Second Factor (T070, FR-033c, FR-034)

## Sign-in blocked after failed attempts

- The block lifts automatically after the lockout window (security settings; default 15 min).
- Check the audit log for `auth.login.failure` with `rate_limited` and for `auth.lockout`.
- If attempts look hostile (many sources, many accounts), review `access.denied` and
  `auth.login.failure` volumes and consider edge-level blocking at the hosting layer.

## Forgotten password

The user requests a link at `/account/recover`. The link works once, for 30 minutes. Completing it
ends every session; MFA is still required at the next sign-in.

## Lost authenticator

1. The user signs in and uses a **recovery code** at `/account/mfa` ("Use a recovery code").
2. If no code remains: an Administrator (editor/publisher targets) or an Owner (any target except
   the last owner) **verifies the person's identity out of band** (known phone number or in
   person). Record who verified and how in the change log.
3. The administrator signs in with MFA, confirms their password at `/account/security`
   (re-authentication), then uses **Reset two-factor authentication** on the user's edit screen.
4. The user's sessions end. They must enrol a new factor at the next sign-in. The action is
   audited (`mfa.reset`).

## Last owner lost both password and authenticator

No in-app path exists, by design. A DBA must perform a documented, audited emergency procedure
with two-person review, outside this runbook's scope.
