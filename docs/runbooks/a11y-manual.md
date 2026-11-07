# Runbook: Manual keyboard and screen-reader walkthrough (T138, FR-080, SC-006)

SC-006 needs **manual** keyboard and screen-reader walkthroughs on every public template and on
the contact, sign-in, media-reordering and section-reordering flows. Automated axe results do
not satisfy that part. No WCAG 2.2 AA conformance claim is made until this is done and recorded.

## Status

| Part                                                               | Status (2026-11-07)                                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Automated public (axe, 16 templates × 2 widths, en + ar)           | **done, automated**: 0 WCAG 2.2 AA violations, best practice not worse than baseline (`tests/a11y/public/baseline.spec.ts`, 32/32)        |
| Automated admin regression (SC-019)                                | **done, automated**: no new rule vs baseline, 9/9; findings in `docs/accessibility/admin-findings.md`                                     |
| Automated keyboard assertions (reorder, editor focus, error focus) | **done, automated** (`tests/a11y/admin/content-editing.spec.ts`) — scripted key presses, not a person using assistive technology          |
| **Manual keyboard walkthrough**                                    | **not executed** — needs a person                                                                                                         |
| **Manual screen-reader walkthrough**                               | **not executed** — needs a person with NVDA (Windows, Firefox/Chrome) and VoiceOver (macOS Safari, iOS Safari), Arabic and English voices |

## Setup

Production build with the seeded e2e data (`pnpm build`, then the Playwright `e2e` web server
or `scripts/lighthouse.sh`'s setup), or the preview deployment once it exists. Record the
environment (URL, browser, AT and versions) in each result row.

## Script (each step in English and Arabic)

1. **Skip link and landmarks**: first Tab shows "skip to content"; Enter moves focus to `main`.
   Screen reader lists banner, navigation, main, contentinfo landmarks; one `h1`.
2. **Header navigation**: Tab through menus; sub-menus open with Enter/Space and close with
   Escape returning focus to the trigger; current page announced (`aria-current`).
3. **Language switch**: announced with its target language; switching keeps the equivalent page;
   Arabic page reads right-to-left, `lang="ar"` voice used; mixed Latin terms (e.g. ISO 27001)
   read correctly.
4. **Home, page, services list, service, training list, course, missing-translation, 404**: heading
   order without jumps; links have unique, meaningful names; images have alt text or are skipped
   as decorative; focus always visible (≥3:1); no keyboard trap; 200 % zoom and 320 px width
   without horizontal scrolling.
5. **Banner**: dismiss button reachable and named; dismissal does not move focus to the top.
6. **Contact form**: every field has a spoken label and required state; the "do not send
   sensitive information" advice is read before the message field; submit with errors → focus
   moves to the error summary, each error links to its field and is announced; consent checkbox
   operable with Space; success message announced (live region); bot-check widget does not trap
   focus.
7. **Sign-in (`/admin/login`, `/account/mfa`)**: labels, error announcement on wrong password,
   one-time-code field with `autocomplete="one-time-code"`; recovery-code path reachable.
8. **Section reordering (admin page edit)**: Move up/down buttons named with the section;
   the move is announced; focus stays on the moved control; result persists after save.
9. **Media reordering / media selection**: choose, replace and remove an image in a section by
   keyboard; alt text field labelled and required unless "decorative".

## Recording

For each template/flow × language × AT: pass / fail, defect description, WCAG criterion,
screenshot or recording reference. Defects in project code are fixed before launch; defects in
Payload core go to `docs/accessibility/admin-findings.md`. Then set T138 to done in tasks.md.
