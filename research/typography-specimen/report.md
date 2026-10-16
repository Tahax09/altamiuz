# R-B Typography Specimen: Report

**Date**: 2026-10-16 | **Candidates**: Manrope (English headings), Inter (English body and UI),
IBM Plex Sans Arabic (Arabic) | **Specimen**: [specimen.html](./specimen.html) |
**Capture script**: [capture.mjs](./capture.mjs)

## What was actually tested

| Environment | Tested |
|---|---|
| Playwright Chromium (Chromium build 1208) on macOS, 375 px and 1440 px | yes: screenshots and measurements |
| Playwright WebKit 26.0 (WebKit build 2248) on macOS, 375 px and 1440 px | yes: screenshots and measurements |
| Google Chrome or Safari desktop (branded browsers) | **no**. The Playwright engines are close proxies, not the same products |
| Firefox | **no** (engine not installed) |
| Real iOS or Android devices | **no** (no device available). This is required before final sign-off |

Fonts were loaded from the Google Fonts CSS2 API **for research only**. Text is neutral sample
copy, and phone numbers are placeholders (`000 0000`).

## Licensing (checked at authoritative upstream sources, 2026-10-16)

| Family | Upstream | Licence text found | Ref checked |
|---|---|---|---|
| IBM Plex Sans Arabic | `github.com/IBM/plex` `LICENSE.txt`; also `google/fonts` `ofl/ibmplexsansarabic/OFL.txt` | SIL OFL 1.1, © 2017 IBM Corp., Reserved Font Name "Plex" | IBM/plex `39276912b05f` (2026-10-13) |
| Inter | `github.com/rsms/inter` `LICENSE.txt`; `google/fonts` `ofl/inter/OFL.txt` | SIL OFL 1.1, © 2016/2020 The Inter Project Authors | rsms/inter `353b61b9f443` (2024-11-19) |
| Manrope | `github.com/googlefonts/manrope` `OFL.txt` (repo licence: OFL-1.1); `google/fonts` `ofl/manrope/OFL.txt` | SIL OFL 1.1, © 2018 The Manrope Project Authors | googlefonts/manrope `468c0dbe38ef` (2026-09-14) |

The research plan named `sharanda/manrope` as the upstream, but that repository returns 404. The
copyright line identifies `googlefonts/manrope` as the upstream, so that is what was checked.

**Conclusion**:
- All three fonts are under the SIL OFL 1.1, which permits commercial use, self-hosting,
  embedding and subsetting.
- The reserved name "Plex" means any *modified* build (for example our own subset) must not be
  distributed under the name "Plex". Using unmodified files, or subsets made by the upstream or by
  Google Fonts, is fine. If we subset ourselves, the delivered family name must change. This is a
  task for Phase 5.
- This is an engineering reading of the licence text, not legal advice.

## Rendering findings

| Check | Result | Evidence |
|---|---|---|
| Arabic shaping and joining | Correct in both engines | `evidence/chromium-1440.png`, `webkit-1440.png` |
| Lam-alef ligatures (لا لأ لإ لآ) | Rendered as ligatures | same |
| Diacritics (tashkeel) at line-height 1.7 | Not clipped: measured ink box within the line box in all 4 captures | `measurements.json` → `diacriticsLine` |
| Arabic punctuation ، ؛ ؟ « » | Correct glyphs and position | screenshots |
| Arabic-Indic and Western digits | Both render; tabular figures align in the table | screenshots |
| Mixed direction (`ISO/IEC 27001:2022`, `PCI DSS v4.0.1`, `NIST SP 800-53 Rev. 5`, email, `+218` phones) | Correct when Latin runs are isolated (`unicode-bidi: isolate` or `dir="ltr"` on phone numbers) | screenshots |
| Western "95%" inside Arabic text | Shown as "%95" (bidi placement of `%` in an RTL run). **Needs an explicit `<bdi>` or `dir="ltr"` wrapper** for Latin numerics with symbols | chromium-1440 stress panel |
| Long words and wrapping | No horizontal overflow at 375 px or 1440 px | `measurements.json` → `horizontalOverflow: false` |
| English 56 px heading at 375 px | Wraps to one word per line. The type scale must be responsive (`clamp`). This is a design-scale issue, not a typeface issue | `webkit-375.png` |
| Arabic text at 13–14 px | Legible but small for Arabic's lower x-height. Recommend at least 15 px for Arabic small text (hints, captions) | screenshots |

### Size matching (canvas measurements at 100 px, Chromium)

| Glyph | Ascent (px) |
|---|---|
| Inter "x" | 54.6 |
| Manrope "x" | 54.0 |
| Plex Arabic Latin "x" | 51.6 |
| Plex Arabic "ب" (body height) | 38 (+20 descent) |
| Plex Arabic "ا" (alef) | 74 |
| Inter "H" | 72.8 |

Inter and Manrope x-heights match within about 1%, so they pair well. Plex Arabic's alef is about
the same height as the Latin cap height, which lets Arabic and Latin share one size on mixed lines
without obvious mismatch. No `size-adjust` is needed for the Arabic face. Fallback-font metric
overrides (for CLS) are still to be computed from the self-hosted files in Phase 5.

## Font payload vs the ≤120 KB per-locale first-load budget

Sizes were measured from Google-served woff2 files (unicode-range subsets) on 2026-10-16:

| Face / subset | KB |
|---|---|
| Plex Arabic, arabic subset, per static weight (400/500/600/700) | 32.7 / 35.0 / 35.0 / 32.8 |
| Plex Arabic, latin subset, per weight | 13.6 / 14.4 / 14.7 / 13.9 |
| Inter variable 400–600, latin / latin-ext | 47.3 / 83.3 |
| Manrope variable 500–800, latin / latin-ext | 24.0 / 14.9 |

The specimen page itself fetched 263.6 KB, because it shows both languages and all weights on one
page. It is not a per-locale page. The figures below are computed from the measured file sizes:

| Scenario | Faces loaded | KB | vs 120 KB |
|---|---|---|---|
| English page | Inter latin + Manrope latin | 71.3 | ✓ |
| English page + "العربية" switcher label in Plex Arabic 400 | + Plex arabic 400 | 104.0 | ✓ |
| English page if latin-ext is triggered | + Inter latin-ext | 154.6+ | ✗: avoid latin-ext characters in UI copy, or subset |
| Arabic page, 2 weights (400, 700) incl. Latin runs | arabic 400+700, latin 400+700 | 93.0 | ✓ |
| Arabic page, 3 weights (400, 500, 700), Latin only at 400 | | 114.1 | ✓ (tight) |
| Arabic page, all 4 weights + Latin runs | | 192.1 | ✗ |

**Assessment**: the 120 KB target is **realistic but only with weight discipline**:

- At most 3 Arabic weights on first load (recommended: 400, 600, 700, or 400/700 only).
- No latin-ext subsets on first load.
- The language-switcher label renders "العربية" from the already-required face, or accepts the
  32.7 KB.

The target is **not** weakened. These figures are for Google's subsets. Self-hosted files must be
re-measured in Phase 5, because packaging and subsets may differ.

## Recommendation

1. **Adopt the trio**: Manrope (English headings, 600–800), Inter (English body and UI, 400–600),
   IBM Plex Sans Arabic (Arabic, at most 3 weights: 400, 600, 700). All licences are confirmed as
   OFL 1.1.
2. **Arabic line-height**: 1.7 for body text and 1.45 for headings (no diacritic clipping
   observed). Arabic small text ≥15 px.
3. **Bidi rule**: wrap Latin identifiers, numbers with symbols, emails and phone numbers in
   `<bdi>` or use `dir="ltr"` at the component level. Rich-text rendering should isolate inline
   Latin runs where possible.
4. **Responsive type scale** using `clamp()`. The 56 px display size is for desktop only.
5. **Production delivery**: self-host unmodified OFL woff2 files (for example the `@fontsource`
   packages or Google's subset files) via `next/font/local`. Preload only the body weight of the
   active locale. Load nothing from Google at runtime (privacy and CSP). This needs no extra
   application dependency beyond the font files.
6. **Still required before final sign-off**: Firefox, branded Safari and Chrome, and at least one
   real iOS and one real Android device. Owner visual review of the screenshots.
