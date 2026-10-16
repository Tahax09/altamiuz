# R-A Findings: Payload Arabic/RTL Admin Proof of Concept

**Date**: 2026-10-16 | **Time spent**: within the 1-day time box | **Status**: complete, with the
limitations listed below. Plan procedure: `specs/001-v1-website-cms/research.md` § R-A.

## Environment (exact resolved versions)

| Item | Version |
|---|---|
| payload, @payloadcms/{next,ui,db-postgres,richtext-lexical,translations} | 3.91.0 |
| next | 16.3.3 (template pin; plan allows ≥16.3.3) |
| react / react-dom | 19.2.6 |
| sharp | 0.35.4 |
| Node / pnpm | 22.23.1 / 10.25.0 |
| PostgreSQL | `postgres:17` Docker image (digest `sha256:2d2b8998…`), bound to `127.0.0.1:54329`, throwaway random credentials in git-ignored `.env` |
| Test harness | @playwright/test 1.58.2: Chromium build 1208 and WebKit 26.0 (build 2248); @axe-core/playwright 4.14.0 |

**Deviations from the procedure**:
- The scaffold was generated with `create-payload-app@3.91.0 -t blank` in a scratch directory and
  only the needed files were copied in.
- Schema used Payload dev `push` (acceptable for a throwaway POC; the app will use migrations).
- 200% zoom, branded Safari/Chrome, Firefox, VoiceOver and real devices were **not tested** (see
  Limitations).

## Configurations

- **C1**: Arabic admin UI (`payload-lng=ar`) editing Arabic content (`?locale=ar`).
- **C2**: English admin UI editing Arabic content.

Config: `localization` ar (RTL, default) / en, `fallback: false`; `i18n.supportedLanguages`
`{ ar, en }`; `experimental.localizeStatus` with `versions.drafts.localizeStatus`. See
[src/payload.config.ts](src/payload.config.ts).

## Reproduce

```bash
cd research/payload-rtl-poc
# .env (git-ignored) needs: DATABASE_URL, PAYLOAD_SECRET, POC_ADMIN_EMAIL/PASSWORD, POC_EDITOR_EMAIL/PASSWORD
docker run -d --name altamiuz-rtl-poc-db -e POSTGRES_USER=poc -e POSTGRES_PASSWORD=<random> \
  -e POSTGRES_DB=poc -p 127.0.0.1:54329:5432 postgres:17
pnpm install --ignore-workspace && pnpm generate:importmap && pnpm seed
PORT=3100 pnpm dev &
export PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers && pnpm exec playwright install chromium webkit
pnpm exec playwright test --project=chromium        # main matrix → evidence/results-chromium-*.json
pnpm exec playwright test --project=webkit          # checks 01–06 → evidence/results-webkit-*.json
pnpm exec playwright test evidence-tests/followup.spec.ts --project=chromium
pnpm payload run scripts/api-checks.ts              # publish/restore/session semantics
node scripts/retake.mjs && node scripts/blank-diagnose.mjs && node scripts/overflow-culprit.mjs
```

## Results (Chromium unless stated; statuses after manual review of the raw harness output)

| # | Check | C1 (Arabic UI) | C2 (English UI) | Evidence / notes |
|---|---|---|---|---|
| 1 | Login screen direction | **pass** | **pass** | `<html lang dir>` = ar/rtl vs en/ltr at 1440 and 768 |
| 2 | Navigation mirrored | **pass** (1440) | **pass** (1440) | Nav on the right in C1, on the left in C2. At 768 px the nav is a full-width overlay, so the harness heuristic cannot decide: **not tested** at 768 |
| 3 | List view + Arabic search | **partial** | **partial** | List renders. Search is **diacritic-sensitive**: `أَمْنِ` finds the page, `أمن` finds 0 |
| 4 | Field direction for Arabic content | **pass** | **pass** | title, summary: computed `direction: rtl` in both UIs; labels show `— ar` |
| 5 | Rich text | **fail** | **fail** | Direction OK (`dir="auto"` paragraphs). Pasted `<script>`, `onerror` and `<iframe>` do not reach the DOM, **but a pasted `javascript:alert(3)` link URL is kept and persisted to the database** (`evidence/stored-richtext-check.json`). C1 also has the RTL overflow defect below |
| 6 | Mixed-direction strings | **partial** | **pass** | ISO/IEC, PCI DSS, email, `+218`, Arabic-Indic and Western digits read correctly in fields (`C2-06-mixed-1440.png`). C1 document meta date shows `أكتوبر 16 ,2026` (misplaced comma) |
| 7 | Array/blocks keyboard reorder | **fail** | **fail** | Drag handle is a `DIV.collapsible__drag` with no tabindex or role, so keyboard drag is impossible. The row "⋯" menu offers Move Up/Down (single-pointer alternative). Keyboard use of that menu changed and persisted order but **with an unexpected resulting order**, and item focus could not be confirmed. Drag announcements are **English-only raw IDs** ("Draggable item 6ad1… moved over droppable area …") |
| 8 | Focal point | **partial** | **partial** | Edit Image drawer: draggable focal button (`tabindex=0`) plus **2 numeric inputs** as a keyboard alternative. Screen-reader operability not tested |
| 9 | Date picker | **pass** | **pass** | C1: Arabic month names (`نوفمبر 2026`), picker `rtl`; C2: English, `ltr` |
| 10 | Relationship / select with Arabic type-ahead | **pass** | **pass** | Arabic query returns the matching option |
| 11 | Per-locale publish | **pass** (experimental) | **pass** (experimental) | UI shows "نشر في العربية" / "Publish in Arabic". API: publishing `ar` only leaves `en` draft; `_status` stored per locale `{ar: published}`; `en` published query returns 0 (`evidence/api-checks.json`). Requires `experimental.localizeStatus` |
| 12 | Version restore | **partial** | **partial** | Local API `restoreVersion` → document `_status: draft` (restore does not auto-publish). UI restore and the compare view were not exercised by the harness; axe ran on the versions list |
| 13 | Document locking | **pass** | **pass** | Second user opening the same document sees the locked-document state |
| 14 | Validation errors | **partial** | **partial** | Errors shown and toasts follow UI direction, but **focus stays on `<body>`** and the invalid field has **no `aria-invalid`** |
| 15 | Keyboard-only operation | **fail** | **fail** | Tab does **not** leave the rich-text editor (Escape then Tab does); the editor has **no visible focus indicator** (outline none, no shadow). Other fields show focus; no obscured focus detected. Full create→publish keyboard journey not completed |
| 16 | axe (WCAG 2.0–2.2 A/AA tags) | **fail** | **fail** | Serious/critical rule violations on every admin view, the same in C1 and C2. Edit view: `button-name`(18 nodes), `color-contrast`, `label`, `target-size`, `aria-hidden-focus`, `aria-command-name`, `aria-input-field-name`, `label-content-name-mismatch`, `list` |

**WebKit (checks 01–06)**: these match Chromium in all four config × width runs
(`evidence/results-webkit-*.json`):
- Login direction: pass.
- Navigation: pass at 1440. The 768 result is the same full-width-overlay artifact (not tested).
- Arabic content fields: computed `rtl` in both UIs.
- Rich-text paragraphs: `dir="auto"` (the harness "pass" covers direction only; the stored
  `javascript:` link URL finding is engine-independent).

These results are the WebKit engine only, not branded Safari.

### RTL defect: horizontal overflow in the Arabic UI edit view
With the Arabic UI, edit views containing rich text have `scrollWidth` 11,380 px at a 1,440 px
viewport (10,752 at 768). The English UI is normal. The cause is the Lexical floating controls
(`.draggable-block-menu`, `.link-editor`) parked at `left ≈ -9940px`: harmless in LTR, but
scrollable overflow in RTL (`evidence/rtl-overflow.json`).

The headless captures of that view came out blank, while DOM probes show the content in place
(`evidence/blank-diagnose.json`). Blank captures were deleted to avoid misleading evidence, except
`chromium/D-ar-edit-{1440,768}.png`, kept as examples. C1 edit-view visuals are therefore from
captures taken after scrolling (e.g. `C1-05-richtext-1440.png`). **Fixable with admin CSS**, but
not yet verified.

### Session note for R-C
With the default `auth.useSessions`, a JWT is **rejected after logout** (`api-checks.json` →
`sameTokenAfterLogout: false`) and a `sessions` field exists on users. Server-side revocation is
available. Idle and absolute expiry are still to be tested in R-C.

## Limitations (honest coverage)

- **Not tested**: 200% browser zoom; branded Safari and Chrome; Firefox; VoiceOver or any screen
  reader; real iOS or Android devices; full keyboard create→publish journey; UI version
  compare/restore.
- Harness heuristics produced artifacts (nav at 768, blank captures). These were reclassified by
  manual review; the raw JSON keeps the original values.
- Repeated harness runs pasted the test content several times into page 1. This has no effect on
  the conclusions.
- axe counts reflect Payload's core admin plus this POC's unlabeled field config (field labels
  were not localized here). They are not an audit of a finished admin.

## Decision (per the R-A decision rule)

- **C1 does not pass as-is** because of the RTL overflow, the date glitch, and the shared
  accessibility failures. **C2 passes on content direction.**
- **v1 admin UI = English**, with Arabic content entered RTL. An Arabic admin UI may be enabled
  later as a per-user option only after an admin CSS fix for the overflow is verified (a tracked
  task, not blocking).
- **Checks 7, 12 and 15 failed or are only partly verified, so custom work is required**:
  1. **Accessible reorder control** for arrays, blocks and media lists: focusable Move up/down
     buttons, localized live-region announcements, and persistence tests (FR-012, FR-055, WCAG
     2.1.1 / 2.5.7).
  2. **Server-side rich-text URL validation**: reject `javascript:`, `data:`, `vbscript:` and any
     non-allow-listed scheme anywhere in Lexical JSON on save, plus a render-time allow-list
     (FR-013, FR-014, threat T6). **Security finding in Payload 3.91.0 default editor; check
     upstream before reporting.**
  3. **Editor keyboard and focus**: document the Escape+Tab exit in the admin help text and add a
     visible focus style for the editor via admin CSS.
  4. **Admin accessibility gap**: Payload core admin violations are outside "project-built"
     scope (FR-080), but they are recorded as a risk. Our custom admin components (MFA views,
     reorder control, help text) must pass axe with no serious or critical issues.
- **Per-locale publishing**: adopt `experimental.localizeStatus` (works in 3.91.0) with an exact
  version pin and regression tests on every Payload upgrade. Keep the D-4 fallback design.
- **Diacritic-insensitive admin search**: optional small task (normalized search field).
