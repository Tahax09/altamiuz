# Contract: Role × Action Permission Matrix

This is the single source of truth for `modules/access` (D-8) and for the generated authorization
test suite (SC-003). Every cell is tested both allowed and denied, through the admin interface and
by direct request. ✓ means allowed. Anything not marked ✓ is denied. Every action requires an
authenticated session with completed MFA (FR-033). Anonymous users are denied everything except
the public site and contact submission.

| Resource / action | Editor | Publisher | Administrator | Owner |
|---|---|---|---|---|
| pages/services/courses: read, create, update draft | ✓ | ✓ | ✓ | ✓ |
| pages/services/courses: publish, unpublish, restore | | ✓ | ✓ | ✓ |
| pages/services/courses: delete | | | ✓ | ✓ |
| evidence: set `verified` | | | ✓ | ✓ |
| media: read, upload, update (alt, focal point) | ✓ | ✓ | ✓ | ✓ |
| media: delete | | ✓ | ✓ | ✓ |
| navigation, banner: read | ✓ | ✓ | ✓ | ✓ |
| navigation, banner: create, update draft | | ✓ | ✓ | ✓ |
| navigation, banner: publish, unpublish | | | ✓ | ✓ |
| navigation, banner: delete | | | ✓ | ✓ |
| redirects: read | ✓ | ✓ | ✓ | ✓ |
| redirects: create, update, delete | | | ✓ | ✓ |
| site-settings: read | ✓ | ✓ | ✓ | ✓ |
| site-settings: update, publish | | | ✓ | ✓ |
| enquiries: read, export, delete | | | ✓ | ✓ |
| audit-events: read, export | | | ✓ | ✓ |
| users: read directory (never authentication secrets) | | | ✓ | ✓ |
| users: invite, suspend, revoke sessions, reset MFA (editor/publisher targets) | | | ✓ | ✓ |
| users: same actions on administrator targets | | | | ✓ |
| users: same actions on owner targets | | | | ✓ (not the last owner) |
| users: change role | | | ✓ (to ≤ publisher) | ✓ |
| own account: password, MFA, sessions (recent re-auth) | ✓ | ✓ | ✓ | ✓ |
| security settings (session timeouts, lockout thresholds) | | | | ✓ |

Owner decisions (WS4, 2026-10-16):

- The matrix is approved on condition that every role × action cell above, allowed and denied,
  is tested both through the admin interface and by direct server request (REST / Local API with
  `overrideAccess: false`). A test that only checks hidden buttons doesn't count.
- Publishers may edit navigation and banner drafts. Only Owners and Administrators may publish or
  unpublish them.
- Enquiry permissions (read, export, delete) stay separate from other permissions, and are
  granted to Owners and Administrators only.
- Roles are fixed in v1. Permission sets change only through a reviewed release.

Owner decisions (WS8, 2026-10-16): navigation and banners are readable by every role (Editors are
read-only) and creatable/editable as drafts by Publishers. Publishing, unpublishing and deleting
are Administrator/Owner only. The user directory is readable and manageable by Administrators and
Owners only, within the target rules above. Password hashes, MFA secrets, recovery codes and
session tokens are never returned by any API.

Invariants tested separately:
- No user can raise any account, including their own, above their own role.
- No role can edit or delete audit events.
- Every denied attempt on a protected action writes a `denied` audit event.
