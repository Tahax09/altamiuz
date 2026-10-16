# Runbook: First-Owner Bootstrap (FR-030, T070)

1. Confirm no owner exists (`select count(*) from users where role = 'owner'` must be 0).
2. Set `BOOTSTRAP_OWNER_EMAIL=<owner address>` in the server environment only.
3. Run `pnpm bootstrap:owner`. It refuses if an owner exists or an owner invitation is pending.
   The invitation link is **e-mailed only**; nothing secret is printed.
4. **Remove `BOOTSTRAP_OWNER_EMAIL`** from the environment immediately.
5. The owner opens the link within 72 hours, sets a password (≥12 characters, not common), signs
   in, and enrols TOTP MFA at `/account/mfa`. Store the 10 recovery codes offline.
6. Verify the audit log shows `user.invite`, `user.create`, `auth.login.success` and `mfa.enrol`.
