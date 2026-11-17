# Brand assets and images: what to supply and where it goes (CD-09)

**Status (2026-11-13)**: the owner supplied the logo (emblem and Arabic lockup, SVG and PNG at
1x–4x), now in `content/brand/`. The favicon and app icons are generated from the emblem
(`pnpm brand:icons`, scaling and padding only), and the brand colours are applied
(`docs/design/brand-palette.md`). Still to supply: an English lockup and a reversed (light)
lockup for the navy footer; photographs and illustrations. Earlier status (2026-11-12): the CMS and the public site are ready to receive the owner's assets.
**No logo, favicon, photograph or illustration has been supplied, generated or substituted.** Until
an asset exists, the site shows the company name as text and every image slot collapses on the
public site (preview shows a labelled placeholder of the expected size).

## Where each asset goes

| Asset                            | Upload to                                     | Then choose it in                                               | Per language?                                    |
| -------------------------------- | --------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Header logo (dark on light)      | Admin → Media library                         | Site settings → Brand → Logo                                    | yes: an Arabic and an English logo may differ    |
| Footer logo (light on navy)      | Admin → Media library                         | Site settings → Brand → Logo inverse                            | yes                                              |
| Default social preview image     | Admin → Media library                         | Site settings → Default SEO → Og image                          | no (one image; alt text per language)            |
| Page social preview image        | Admin → Media library                         | the page → SEO → Og image (overrides the default)               | no                                               |
| Section images and illustrations | Admin → Media library                         | the section's image field (hero, text and image, methodology …) | no: sections share images; alt text per language |
| Standard / credential logos      | Admin → Media library                         | Standards block or credentials block → item → Logo              | no                                               |
| Favicon and app icons            | repository files (not the CMS), see "Favicon" | n/a                                                             | no                                               |

Site settings are published by an Administrator or Owner, per language. An image becomes publicly
downloadable only once a **published** page or the **published** site settings use it (FR-056);
until then it is visible only to signed-in CMS users.

## File requirements (all images through the media library)

Accepted: **JPEG, PNG, WebP, AVIF**. Not accepted: SVG, GIF, HEIC, PDF (the upload pipeline rejects
markup and re-encodes every file). Limits: **20 MB** and **40 megapixels** per file (A-7). On
Vercel, request bodies above **4.5 MB** fail until owner decision O-4 is made, so keep files under
4 MB. Every upload is re-encoded without metadata (EXIF/GPS removed) and gets AVIF, WebP and JPEG
variants at 480, 768, 1024, 1440 and 1920 px wide; nothing is enlarged.

| Slot                          | Field                                            | Shown at                                 | Aspect ratio                    | Supply at least                    | Notes                                                                                                  |
| ----------------------------- | ------------------------------------------------ | ---------------------------------------- | ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Header logo                   | `brand.logo`                                     | 40–46 px tall, up to 224 px wide         | the artwork's own (wide lockup) | 960 px wide                        | **Transparent PNG or WebP**; served as AVIF/WebP (JPEG variants have no transparency and are not used) |
| Footer logo                   | `brand.logoInverse`                              | 40 px tall on navy `#12355b`             | the artwork's own               | 960 px wide                        | light artwork, transparent background                                                                  |
| Hero image                    | `hero.media`                                     | about 45 % of the width on desktop       | **4:3** (cropped)               | 1920 × 1440                        | set the focal point; loaded eagerly (largest image above the fold)                                     |
| Text beside image             | `textMedia.media`                                | about 40 % of the width                  | **4:3** (cropped)               | 1600 × 1200                        | focal point                                                                                            |
| Methodology sequence          | `process.media`                                  | full content width (up to 1152 px)       | the image's own, wide (≥ 16:9)  | 1920 px wide                       | not cropped; mirrored horizontally on Arabic pages, so it must contain **no text**                     |
| Gallery                       | `mediaGallery.items.media`                       | one third of the width on desktop        | **4:3** (cropped)               | 1440 × 1080                        | caption per language                                                                                   |
| Standards / credential logos  | `standards.items.logo`, `credentials.items.logo` | up to 128–160 px wide                    | contained, any                  | 480 px wide                        | transparent PNG/WebP preferred; a credentials logo is part of an evidence-gated claim (CD-01/05/06)    |
| Service / course card         | service or course → `image` (sidebar)            | card width; the first card leads wider   | **3:2** (16:9 when leading)     | 1600 × 1067                        | optional; without it the card shows its `icon`                                                         |
| Insight card                  | `resourceList.items.image`                       | card width; the first card leads         | **3:2** (cropped)               | 1600 × 1067                        | optional; date and category are separate fields                                                        |
| Team photo                    | `team.members.photo`                             | quarter width on desktop, half on phones | **4:5** (cropped)               | 1200 × 1500                        | **written consent (CD-03)**; part of the evidence-gated team claim; without a photo the initials show  |
| Social preview (default/page) | `defaultSeo.ogImage`, `seo.ogImage`              | link previews                            | **1.91:1**                      | 1200 × 630 (2400 × 1260 preferred) | JPEG-safe (no transparency); the 1440 px JPEG variant is used                                          |
| Photographs of people         | any image field                                  | —                                        | —                               | —                                  | only with written consent (CD-03); none in v1 content                                                  |

## Alternative text (FR-054)

Each image has **alt text per language** on the media item (Media library → the image → switch the
language at the top), or is marked **decorative**. A page, or the site settings, cannot be
published in a language whose images have no alt text in that language unless they are decorative.
For a logo, the alt text is the company name as written in that language (CD-01); if a logo is
marked decorative, the header still names the link with the company name for screen readers.

## Missing-image behaviour (verified)

- Public site: an empty image slot renders nothing (no broken image, no reserved gap); the header
  and footer show the company name as text. A deleted image renders nothing.
- Preview: an empty slot shows "Image to be added (4:3)" (or its ratio) at the real size, so editors
  see the intended layout.
- Social preview: a page without its own image uses the site default; with neither, no image tags
  are emitted.
- Tests: `tests/unit/media/picture.test.ts`, `tests/unit/ui/site-ui.test.ts` (slots, brand mark),
  `tests/integration/media/brand-assets.test.ts` (private until published, alt gate, public read).

## Favicon and app icons (not CMS content)

Next.js file conventions (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`);
place the owner's files in `src/app/` and commit them:

| File                     | Format and size                            |
| ------------------------ | ------------------------------------------ |
| `src/app/favicon.ico`    | ICO containing 16 × 16 and 32 × 32         |
| `src/app/icon.png`       | 512 × 512 PNG (or `icon.svg`, static file) |
| `src/app/apple-icon.png` | 180 × 180 PNG, opaque background           |

Generated from the supplied emblem on 2026-11-13 (`pnpm brand:icons`); `src/app/icon.svg` is the supplied vector without its editor title. Regenerate after any change to `content/brand/emblem.svg`.

## Existing project-made drawings (owner decision)

The homepage draft (H-2) contains three line drawings made for the project
(`content/homepage/illustrations/*.svg`: hero, introduction, methodology). They are not brand
assets. Before publishing the homepage the owner keeps them, replaces them with supplied artwork, or
removes them (the slots then collapse). This is part of CD-09 in `docs/owner-decisions.md`.

## Brand colours

Applied 2026-11-13 from the owner's palette and logo: navy `#14243A`, blue `#2563EB`, charcoal
`#111827`, slate (`#475569` for text, `#64748B` large text only), cool white `#F8FAFC`, red
`#C30000` for errors only. Evaluation, contrast pairs and the derived tokens:
`docs/design/brand-palette.md` (adjustments await owner approval). The project-made homepage line
drawings still use the earlier navy `#12355b`; they are kept, replaced or removed with CD-09.

## Logo files (`content/brand/`)

| File                                | What                                                                    | Use                                                             |
| ----------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| `emblem.svg`, `emblem@4x.png`       | The circuit "T" mark (634 × 632 px PNG)                                 | App icons; English header candidate (owner decision)            |
| `lockup-ar.svg`, `lockup-ar@4x.png` | Emblem with "شركة التميز للاستشارات وأمن المعلومات" (1611 × 632 px PNG) | Arabic header logo at 40–46 px tall; not on navy (dark artwork) |

Upload the PNGs to the media library (SVG is refused by the upload pipeline), give each alt text
per language, and choose them in Site settings → Brand.

## Partner logos (`content/partners/`)

Supplied by the owner on 2026-11-14: `dataprotect.webp`, `pecb.webp`, `searchinform.webp`,
`xertiance.webp` (transparent WebP, used unchanged). Naming a partner is a claim: the logos go
only into a **credentials** block (homepage or About "trust strip"), which cannot be published
until each item has a verified evidence record (a written partnership or accreditation
confirmation, CD-05 and gap G-1). PECB and DataProtect appear on the legacy site; SearchInform and
Xertiance are new and need the same evidence. Upload: `pnpm seed:partners` puts the four files in
the media library through the upload pipeline (alt text = the partner's name in both languages;
re-runs reuse them) and places them nowhere; then Credentials block (display "Logos") → item →
Logo. The logo is part of the verified claim, like a team photo: changing an item's logo after
verification removes the verification (`tests/integration/content/team-claims.test.ts`). The
site must not imply accreditation by these bodies: the block heading and intro are verified with
the items, so they say what the evidence supports (for example "Partners", not "Accredited by").
