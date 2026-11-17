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

| Legacy path                                                              | v1 target                          | Type | Approved by / date |
| ------------------------------------------------------------------------ | ---------------------------------- | ---- | ------------------ |
| `/`                                                                      | PENDING                            | 301  |                    |
| `/about/`                                                                | PENDING                            | 301  |                    |
| `/services/`                                                             | PENDING                            | 301  |                    |
| `/iso_services/`                                                         | PENDING                            | 301  |                    |
| `/pcidss_services/`                                                      | PENDING                            | 301  |                    |
| `/training_courses/`                                                     | PENDING                            | 301  |                    |
| `/training_courses/دورة-كبير-مسؤولي-تنفيذ-نظام-ادارة-امن-معلومات-معتمدة` | PENDING                            | 301  |                    |
| `/training_courses/دورة-اساسيات-تنفيذ-نظام-ادارة-امن-معلومات-معتمدة`     | PENDING                            | 301  |                    |
| `/training_courses/دورة-مقدمة-في-نظام-ادارة-امن-معلومات`                 | PENDING                            | 301  |                    |
| `/blog/`                                                                 | PENDING (closest relevant v1 page) | 301  |                    |
| `/blog/ma-hw-alamn-alsybrany`                                            | PENDING (closest relevant v1 page) | 301  |                    |
| `/document/`                                                             | PENDING (closest relevant v1 page) | 301  |                    |
| `/contact/`                                                              | PENDING                            | 301  |                    |

The three course paths were read from the legacy sitemap (`https://www.altamiuz.ly/sitemap.xml`,
re-read 2026-11-17; 13 URLs, none missing from this table). The loader percent-encodes them
(`normaliseSitePath`).

Proposed targets (engineering suggestion from content matching, **not approved**; each needs the
target published in that language, and Arabic targets need CD-13):

| Legacy path                                         | Proposed target (draft exists)                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/about/`                                           | About page                                                                                                                                                                                                                                                                                                                    |
| `/services/`, `/iso_services/`, `/pcidss_services/` | Services listing (ISO and PCI DSS drafts: `iso-27001-implementation`, `iso-22301-business-continuity`, `pci-dss-compliance`)                                                                                                                                                                                                  |
| `/training_courses/`                                | Training listing                                                                                                                                                                                                                                                                                                              |
| `…/دورة-كبير-مسؤولي-تنفيذ-…-معتمدة`                 | course `iso-27001-lead-implementer`                                                                                                                                                                                                                                                                                           |
| `…/دورة-اساسيات-تنفيذ-…-معتمدة`                     | course `iso-27001-foundation`                                                                                                                                                                                                                                                                                                 |
| `…/دورة-مقدمة-في-نظام-ادارة-امن-معلومات`            | course `iso-27001-introduction`                                                                                                                                                                                                                                                                                               |
| `/blog/`, `/blog/ma-hw-alamn-alsybrany`             | Insights listing; the "what is cybersecurity" article draft                                                                                                                                                                                                                                                                   |
| `/contact/`                                         | Contact page                                                                                                                                                                                                                                                                                                                  |
| `/document/`                                        | No v1 page. The legacy page embeds an "ISMS policy statement" PDF (`بيان نظام إدارة أمن المعلومات`) through a third-party viewer (CloudPDF); its text was not recovered. Publishing a policy statement implies an operating ISMS (a claim, CD-05/CD-06): the owner supplies the current document, or the row points to About. |

Input required from the owner: (1) one approved v1 target per row; (2) note that `/` is currently handled by the
A-3 language redirect, so a stored redirect for `/` must be a deliberate decision.

## Legacy content coverage (checked 2026-11-18)

Every legacy page was re-read from the live site's own page data (13 sitemap URLs, including the
three course pages and the one blog post) and compared with the drafts in `content/`. 196 distinct
Arabic sentences; the drafts cover the substance of each page. What the drafts deliberately leave
out, and why:

| Legacy content                                                                                                                                 | Where           | Why not in the drafts                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| "Licensed by the Ministry of Economy and Industry, licence 01041961254; registered with the Chamber of Commerce"                               | About           | Claim needing evidence (CD-01); kept in `legacy-about.md`                                                                     |
| "Over thirty years of combined experience"                                                                                                     | Home, About     | Statistic needing evidence (CD-07)                                                                                            |
| Founder's last post (naval IT and encryption office) and the encryption-algorithm transfer project                                             | Services, About | Person and defence claim (CD-03); proposed Team entry not seeded                                                              |
| Course facts: PECB accreditation, 6-day duration, attendance and certification certificates, free exam and re-sit, optional delivery in Turkey | Course pages    | Accreditation and commercial terms need evidence or owner confirmation (CD-05); the drafts describe content and audience only |
| ISO/IEC 27001:2013, 22301:2012, BS 7799-2 editions and clause-level explanations                                                               | ISO services    | Superseded editions (CD-06); drafts cite current editions in summary form                                                     |
| "What is cybersecurity" article body                                                                                                           | Blog            | Rewritten, not copied: the legacy text reads like a translation of a vendor explainer, so reusing it risks copyright          |
| ISMS policy statement (PDF in a third-party viewer)                                                                                            | `/document/`    | Not recovered; implies an operating ISMS (claim)                                                                              |
| Contact-form messages ("phone must be ten digits", etc.)                                                                                       | Contact         | Interface text; the new form has its own validated messages                                                                   |
