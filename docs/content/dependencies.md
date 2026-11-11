# Content Dependencies — Launch Gates (T144, FR-065, FR-079)

The content dependencies CD-01…CD-13 (spec.md "Content Dependencies") must be **supplied and
verified by Altamiuz**. None may be invented or inferred from the legacy site. Status below is
what the repository records as of **2026-11-07**; "open" means no approved input has been
received in the repository. Only the owner changes a status, by supplying the item and naming who
approved it. What each dependency holds back on the homepage: `homepage.md`.

| CD    | Item                                                                                   | Status | What it blocks (enforcement)                                                                                                                                      | Owner action                                                      |
| ----- | -------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| CD-01 | Legal name (ar/en), commercial registration and licence numbers, authorities, validity | open   | Company name and credentials on the site; Organization structured data is emitted only when `companyNameEvidence` is verified (ADR-008)                           | Supply documents; Administrator records evidence in site settings |
| CD-02 | Founding year, Tripoli address, phone, email, hours                                    | open   | Contact details, address in structured data (only with verified `addressEvidence`)                                                                                | Supply and confirm                                                |
| CD-03 | Founder/team biographies, credentials, photo consent                                   | open   | Any team/about content naming people; no claim block exists for it in v1                                                                                          | Supply with written photo consent                                 |
| CD-04 | Authoritative service catalogue (ar/en)                                                | open   | Publishing the services listing and service pages                                                                                                                 | Supply approved catalogue                                         |
| CD-05 | Training courses, providers, accreditation evidence (e.g. PECB)                        | open   | Course pages; `accreditationStatement` cannot be published without verified evidence (FR-016)                                                                     | Supply written partnership/accreditation evidence                 |
| CD-06 | Standards cited and their current editions                                             | open   | Service text naming standards (legacy cites ISO/IEC 27001:2013, superseded by 2022)                                                                               | Confirm editions                                                  |
| CD-07 | Experience and statistics claims with evidence                                         | open   | `stats` blocks cannot be published without verified, referenced evidence (`pnpm check:evidence`)                                                                  | Supply evidence or drop the claims                                |
| CD-08 | Client names, logos, case studies, testimonials with written permission                | open   | Testimonials and client logos (no v1 blocks; tasks.md T085 note)                                                                                                  | Supply permissions, or leave out of v1                            |
| CD-09 | Brand assets: logo files, colours, usage rights                                        | open   | Design tokens are provisional (T102); favicon missing (Lighthouse best-practice 0.96, T139)                                                                       | Supply brand files and rights                                     |
| CD-10 | Privacy notice, terms, cookie statement reviewed under Libyan (and applicable) law     | open   | **Contact form must not launch** without the privacy notice and its link at the consent checkbox (FR-079, `privacy-notice-requirements.md`); analytics disclosure | Legal review and approved texts                                   |
| CD-11 | Copy approval owner and translation review process (ar/en)                             | open   | All public copy, including the Arabic form strings (`src/modules/i18n/messages/ar.ts`)                                                                            | Name the approver; native-speaker review                          |
| CD-12 | Destination for every legacy URL (FR-065 inventory)                                    | open   | Legacy redirects (`docs/content/legacy-redirect-map.md`, "pending owner approval"); SC-012                                                                        | Approve the map                                                   |
| CD-13 | Arabic/English static route vocabulary                                                 | open   | **Production refuses to start** while `ar-vocab-pending-*` segments exist (`routeVocabularyPending`, `loadConfig`); Arabic redirect targets cannot be written     | Approve the Arabic segments for services and training             |

## Enforcement summary

- **Hard gates in code**: CD-13 (production start), CD-01/02/05/07 claims (publish gate and
  `pnpm check:evidence`), CD-10 (since H-3, 2026-11-08: the contact form is neither shown nor
  accepted in a language without a published privacy notice, and a legal page with "Pending"
  sections cannot be published; `docs/content/privacy-notice.md`).
- **Procedural gates**: everything else blocks the content that depends on it; the launch
  checklist (`docs/launch-readiness.md`) lists each as a blocker until supplied.

## Reference corrections and gaps (2026-11-08)

The CD numbers above are canonical (spec.md, "Content Dependencies"); nothing has been renumbered
or reassigned. Records that cited them wrongly are corrected in place with a note:

| Where                                        | Cited                                | Correct                                                                                       |
| -------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `tasks.md` H-1 (and the H-1 stage report)    | homepage text depends on CD-03/CD-04 | homepage copy approval is **CD-11**; CD-03/CD-04 apply only to the team and services sections |
| `homepage.md` section 4 (and the H-2 report) | CD-06 as "certifications"            | CD-06 is the **standards cited and their editions**; certifications are not CD-06             |

Unresolved (owner decision needed; no CD is assumed):

- **G-1**: no CD covers certifications held by Altamiuz itself (e.g. an ISO/IEC 27001
  certificate of the company) or partnerships other than training-provider relationships
  (CD-05). Until the owner assigns them to an existing CD or adds a new one, no such claim can be
  sourced, and the homepage credentials section stays absent.
- **G-2**: the privacy notice needs decisions outside CD-10's wording: email and hosting
  providers and data locations (T132) and backup retention (T134). They are tracked as "Pending"
  sections of the notice, not as new CDs.
- **G-3** (W-1, 2026-11-11): the Arabic page slugs created by `pnpm seed:pages` (`من-نحن`,
  `المعايير-والأطر`, `الخبرة-والتجربة`, `رؤى-وموارد`, `شروط-الاستخدام`) are content, not route
  vocabulary: they are approved with the copy under **CD-11**, not CD-13. The terms of use are part
  of **CD-10** (legal texts); the page holds headings only and cannot be published until then.
