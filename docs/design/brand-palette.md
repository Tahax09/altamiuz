# Brand palette: evaluation and web tokens (CD-09)

**Status (2026-11-13): engineering recommendation for owner approval.** The owner supplied the
logo (`content/brand/`: emblem and Arabic lockup, SVG and PNG) and proposed a six-colour palette.
This record checks that palette against the logo, WCAG 2.2 AA and the site's needs, and lists the
tokens the site now uses. Nothing here changes the logo artwork.

## The proposed palette, checked

The logo files use four of the six colours exactly: navy `#14243A`, blue `#2563EB`, charcoal
`#111827` and slate `#64748B`. The proposal therefore matches the mark. Contrast below is the
WCAG ratio; AA requires 4.5:1 for body text, 3:1 for large text (≥24 px, or ≥18.66 px bold) and
for interface parts.

| Role (proposed)           | Colour    | On white | On `#F8FAFC` | On navy `#14243A` | Verdict                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | --------- | -------- | ------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary, Deep Navy        | `#14243A` | 15.6     | 14.9         | n/a               | **Keep.** Logo colour; dark surfaces and headings                                                                                                                                                                                                                                                                       |
| Secondary, Corporate Blue | `#2563EB` | 5.17     | 4.94         | 3.02              | **Keep on light surfaces** (links, buttons, accents; white text on it 5.17). **Not for text on navy** (3.02 fails body text); on navy use the light blue below                                                                                                                                                          |
| Tertiary, Muted Red       | `#C30000` | 6.32     | 6.04         | 2.47              | **Do not use as a brand colour.** It is not in the logo, and it is not muted (fully saturated). On a security site red reads as alert or error, so a decorative red would compete with real warnings. It also fails on navy (2.47). **Keep it as the semantic error/alert colour only** (form errors, incident notices) |
| Neutral Dark, Charcoal    | `#111827` | 17.7     | 17.0         | n/a               | **Keep.** Body text                                                                                                                                                                                                                                                                                                     |
| Neutral, Slate            | `#64748B` | 4.76     | 4.55         | 3.29              | **Keep for the logo tagline and large text only.** It passes body-text AA on white and `#F8FAFC` by a thin margin and fails on tinted panels (4.31 on `#EEF4FF`). Body secondary text uses the darker slate `#475569` (7.2)                                                                                             |
| Background, "Warm White"  | `#F8FAFC` | n/a      | n/a          | n/a               | **Keep, renamed Cool White.** It is a cool blue-grey white (slate-50), which suits the navy and blue. Used for light bands; cards stay pure white so they still separate from it                                                                                                                                        |

Colour vision: navy, blue and slate differ mainly in lightness, so they stay distinguishable
under protanopia and deuteranopia. Red against navy is the one weak pair (2.47), another reason
to keep red away from navy surfaces.

Note: four of the colours coincide with Tailwind defaults (blue-600, gray-900, slate-500,
slate-50). That is acceptable because they are the logo's own values. The site's identity comes
from the navy surfaces, the emblem and the type, not from a rare hue.

## Web tokens derived from it (`src/app/(site)/site.css`, brand block)

| Token            | Value     | Use                                            | Checked pair                |
| ---------------- | --------- | ---------------------------------------------- | --------------------------- |
| `--night`        | `#14243A` | hero, methodology panel, contact panel, footer | white text 15.6             |
| `--night-2`      | `#1E3350` | raised elements on navy                        | light blue 6.1, muted 7.2   |
| `--night-muted`  | `#B8C4D6` | secondary text on navy                         | 8.9 on navy                 |
| `--night-rule`   | `#2E4566` | rules on navy (decorative)                     | n/a                         |
| `--cobalt`       | `#2563EB` | links, primary buttons, accents on light       | 5.17 on white, 4.68 on mist |
| `--cobalt-hover` | `#1D4ED8` | hover, pressed                                 | white text 6.70             |
| `--peri`         | `#8AB4FF` | accent and links on navy                       | 7.5 on navy                 |
| `--mist`         | `#EEF4FF` | tinted panels, chips, page headers             | cobalt 4.68, ink-muted 6.9  |
| `--mist-2`       | `#DCE7FE` | chips on mist, hover                           | ink 15+                     |
| `--ink`          | `#111827` | body text                                      | 17.7 on white               |
| `--ink-muted`    | `#475569` | secondary text                                 | 7.2 on `#F8FAFC`            |
| `--paper-alt`    | `#F8FAFC` | light bands, form notices                      | n/a                         |
| `--rule`         | `#E2E8F0` | hairlines (decorative)                         | n/a                         |
| `--danger`       | `#C30000` | errors and alerts only                         | 6.32 on white               |
| `--success`      | `#15803D` | confirmations                                  | 5.02 on white               |

## Logo use on the site

- **Header, Arabic pages**: the Arabic lockup (`lockup-ar`), 40–46 px tall in the compact header
  (owner request, 2026-11-13). At that size the tagline is small; a lockup without the tagline,
  or the emblem, would read better in the header (owner or designer decision).
- **Header, English pages**: there is no English lockup. Until one is supplied, the emblem can
  stand alone, with the company name for screen readers. With no logo published at all, the header
  shows the supplied emblem (`/icon.svg`) as the home link, never the word "Home". Choosing the English treatment and
  approving an English name is the owner's decision (CD-01, CD-09).
- **Footer (navy)**: both supplied files are dark artwork for light backgrounds and disappear on
  navy. A reversed (light) version is needed. Until it is supplied, the footer keeps the text
  name. Producing a reversed version is the owner's (or designer's) decision; it was not made
  here.
- **Favicon and app icons**: generated from the emblem by scaling and padding only
  (`pnpm brand:icons`). At 16 px the fine circuit lines are faint. A simplified small-size mark
  would be a design decision for the owner.
- In the CMS: upload the 4x PNGs (SVG is not accepted by the media pipeline), set alt text per
  language to the name as written in the logo, and choose them in Site settings → Brand.

## Owner decisions

1. Approve the adjusted palette above (red as error colour only; darker slate for body text).
2. Supply or approve an English lockup and a reversed (light) lockup for dark backgrounds.
3. Confirm the company name in each language (CD-01). The Arabic lockup reads "شركة التميز
   للاستشارات وأمن المعلومات"; the site copy uses the Latin "Altamiuz".

## Payload Admin

The admin uses the same palette (2026-11-17), through Payload's supported extension points only:

- **Graphics** (`src/modules/platform/admin/Brand.tsx`): the supplied emblem replaces Payload's logo
  on the login page (with the text "Altamiuz / Content management"; no English lockup exists) and its
  icon in the navigation. The emblem file is served unchanged from `src/app/icon.svg`. On the dark
  theme it sits on a light tile, since its navy would disappear on navy.
- **Meta** (`src/payload.config.ts`): page titles end "· Altamiuz CMS"; favicon and touch icon are the
  site's; admin pages are `noindex`; generated Open Graph images (`/api/og`) are off.
- **Colours** (`src/app/(payload)/custom.scss`): Payload's 21-step neutral scale and 19-step accent
  ("success") scale are replaced step for step by colours with the **same relative luminance**,
  taken from the slate ramp through brand navy `#14243A` and the blue ramp through brand blue
  `#2563EB`. Every contrast pair Payload builds from these scales therefore keeps its ratio (drift
  under 2 %), so the admin accessibility baseline is unaffected. The dark theme's surfaces become
  navy (`base-850` ≈ `#14243A`). Error and warning scales stay Payload's. Focus rings: `#1D4ED8` on
  light (6.70:1), `#8AB4FF` on dark (8.84:1; the old blue was 2.76:1 there).
  `tests/unit/platform/admin-brand.test.ts` re-checks the luminance match against the installed
  Payload release, so an upgrade that adds or retunes a step fails the unit suite.
