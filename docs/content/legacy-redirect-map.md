# Legacy redirect map (CD-12) — PENDING OWNER APPROVAL

**Status**: blocked. Every target below must be supplied and approved by Altamiuz (CD-12) before
`scripts/seed-legacy-redirects.ts` (T119) is written and run. Targets must be v1 paths in the
approved route vocabulary (CD-13); Arabic targets cannot be written until CD-13 is approved.

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
