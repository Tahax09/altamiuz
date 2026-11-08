# Homepage content (Direction A, Institutional Precision)

Source of the copy: `content/homepage/copy.ts` (English source, Modern Standard Arabic
adaptation). Illustrations: `content/homepage/illustrations/*.svg`. Loaded into the CMS by
`pnpm seed:homepage` (`scripts/homepage.ts`) as a **draft** `home`-template page in both
languages; the script never publishes and refuses to touch an existing home page unless
`--replace-draft` is given (then only the draft changes; the published version stays).

Nothing on this page is approved yet: all copy needs the owner's approval and translation review
(**CD-11**) before a Publisher publishes it, in English and then in Arabic (publishing is per
language).

## Facts used

Visible sections state only what the project brief states: Altamiuz is a Libyan information
security consultancy. Items suggested by the legacy sitemap (advisory, ISO/IEC 27001, PCI DSS and
training work) are not facts until the owner confirms them (`dependencies.md`), so they appear
only in hidden sections waiting for CD-04 and CD-06. No history, founding year, clients, team, certifications,
accreditations, partnerships or statistics are stated anywhere on the page. The Arabic company
name is not approved (CD-01), so the Latin "Altamiuz" is used in the Arabic text.

## Sections

| #   | Section                  | Block          | State in the draft       | Waiting for                                                                                                                      |
| --- | ------------------------ | -------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 1–2 | Announcement bar, header | globals        | unchanged                | CD-01 (company name in header and footer), CD-09 (logo)                                                                          |
| 3   | Hero + primary CTA       | `hero`         | visible                  | CD-11 approval. CTA links to the page with slug `contact` when one exists (none in a fresh database: no button)                  |
| 4   | Trust and credentials    | `credentials`  | **not created**          | CD-01 (registration, licences), CD-05 (accreditations), CD-06 (certifications) with verified evidence references                 |
| 5   | Company introduction     | `textMedia`    | visible                  | CD-11 approval                                                                                                                   |
| 6   | Services                 | `serviceList`  | **hidden**               | CD-04 service catalogue; at least one published service (the list is automatic)                                                  |
| 7   | Why Altamiuz             | `featureGrid`  | visible                  | CD-11 approval (method commitments only, no capability claims)                                                                   |
| 8   | Methodology              | `process`      | visible                  | CD-11 approval                                                                                                                   |
| 9   | Standards and frameworks | `standards`    | **hidden**               | CD-06: confirm the standards cited (draft: ISO/IEC 27001:2022, PCI DSS v4.0.1, from the legacy services) and editions            |
| 10  | Expertise and experience | `textMedia`    | **hidden**, heading only | CD-03 (team expertise, biographies, consent); CD-07 (experience claims) — statistics need a `stats` block with verified evidence |
| 11  | Insights and resources   | `resourceList` | **hidden**, no items     | Published insight pages (legacy `/blog/` content needs CD-11 approval and CD-12 mapping)                                         |
| 12  | Contact CTA              | `cta`          | visible                  | CD-11; a published contact page. The contact form itself must not launch before the privacy notice (CD-10)                       |
| 13  | Footer                   | globals        | unchanged                | CD-01, CD-02 (address, phone, email, hours)                                                                                      |

Hidden sections carry their dependency in the admin label ("Pending: …"). Unhide a section only
when its input exists; the claim blocks (`credentials`, `stats`) cannot be published without
verified evidence anyway (`evidence-register.md`), and a page that contains one unverified claim
block cannot be published at all, which is why the draft contains none.

## Illustrations

Original line drawings for this site (no stock imagery, no text, no gradients, filters or
external references; checked by `tests/integration/content/homepage-seed.test.ts`), in the
design-system palette. Rendered from SVG to 2400 px PNG by the seed and uploaded through the
media library, which strips metadata and generates the AVIF/WebP/JPEG variants (480–1920 px).
Measured on the local preview: 81–112 KB of images per homepage load.

| File               | Used in      | Alt text (en)                                                                                                                                                                          |
| ------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hero.svg`         | Hero         | Line drawing in plan view: three nested boundaries around an organisation’s systems, with controlled entry points and monitored connections leading to the core assets.                |
| `introduction.svg` | Introduction | Architectural floor plan of an organisation with dimensioned walls; each door and access point is marked for review.                                                                   |
| `methodology.svg`  | Methodology  | Four panels on one timeline: a focus ring over a mapped area, a grid with marked cells, a stepped schedule, and a closed loop around a core, for Understand, Assess, Plan and Support. |

Arabic alt text is in `copy.ts` and stored on each media item's Arabic locale. The methodology
drawing is mirrored on Arabic pages (CSS) so its first panel sits above step 01 at the right edge.
Brand-specific artwork may replace these once brand assets exist (CD-09).

## Before publishing (checklist for the owner)

1. Approve or edit the English and Arabic copy in the CMS draft (CD-11).
2. Create and publish the contact page (and its privacy notice, CD-10), then re-run
   `pnpm seed:homepage --replace-draft` or set the two calls to action in the admin.
3. Publish English, then Arabic.
4. Unhide sections 6, 9, 10 and 11 only as their inputs above are supplied; add credentials and
   statistics blocks only with verified evidence (`pnpm check:evidence`).
