# Legacy redirect map (CD-12) — PENDING OWNER APPROVAL

**Status**: blocked on CD-12. The loader exists (T119, 2026-11-12): `pnpm seed:redirects` reads
this table, checks every row and prints the plan without writing; `pnpm seed:redirects apply`
writes it. Either refuses the whole run while any row is PENDING, has no "Approved by / date",
keeps a `<placeholder>` path, points off-site or outside a locale, uses a placeholder Arabic route
segment (CD-13), or targets a page that is not published in that language. Re-runs update rows in
place (`source: legacy`); redirects created by editors or slug changes are never overwritten.

How to fill a row: `v1 target` = a code-quoted published path such as `` `/en/services` `` or
`` `/ar/من-نحن` ``; `Type` = 301 (permanent) or 302; `Approved by / date` = name and date. For `/`
write `A-3` as the target to keep the language redirect (no stored redirect is created). Arabic
targets under services or training can only be written after CD-13 is approved.

Inventory: FR-065, taken from the legacy sitemap on 2026-10-16. Each source matches with and
without a trailing slash and in percent-encoded form (ADR-008). Add any further legacy URLs found
before launch (e.g. search-console data).

| Legacy path                         | v1 target                          | Type | Approved by / date |
| ----------------------------------- | ---------------------------------- | ---- | ------------------ |
| `/`                                 | PENDING                            | 301  |                    |
| `/about/`                           | PENDING                            | 301  |                    |
| `/services/`                        | PENDING                            | 301  |                    |
| `/iso_services/`                    | PENDING                            | 301  |                    |
| `/pcidss_services/`                 | PENDING                            | 301  |                    |
| `/training_courses/`                | PENDING                            | 301  |                    |
| `/training_courses/<Arabic slug 1>` | PENDING                            | 301  |                    |
| `/training_courses/<Arabic slug 2>` | PENDING                            | 301  |                    |
| `/training_courses/<Arabic slug 3>` | PENDING                            | 301  |                    |
| `/blog/`                            | PENDING (closest relevant v1 page) | 301  |                    |
| `/blog/ma-hw-alamn-alsybrany`       | PENDING (closest relevant v1 page) | 301  |                    |
| `/document/`                        | PENDING (closest relevant v1 page) | 301  |                    |
| `/contact/`                         | PENDING                            | 301  |                    |

Input required from the owner: (1) the exact three Arabic course slugs as they appear in the
legacy sitemap; (2) one approved v1 target per row; (3) note that `/` is currently handled by the
A-3 language redirect, so a stored redirect for `/` must be a deliberate decision.
