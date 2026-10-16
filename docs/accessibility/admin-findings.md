# Admin Accessibility Findings Register (D-25, FR-080a)

These findings are **not accepted as compliant**. No WCAG 2.2 AA claim is made for the admin
without evidence. Each finding is remediated through, in order of preference:

1. **upstream**: a fix in Payload, via an issue or PR to `payloadcms/payload`;
2. **extension**: a supported Payload extension point (admin `components` overrides, custom field
   components, admin CSS in `src/app/(payload)/custom.scss`) or our own field configuration;
3. **unresolved**: documented, with its reason and upstream reference.

The regression suite is `tests/a11y/admin/baseline.spec.ts` (`pnpm test:a11y`), with the baseline
in `tests/a11y/admin/baseline.json`.

## Source of current evidence

| Source                                                                                  | Scope                                                                           | Status                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-A POC, `research/payload-rtl-poc/evidence/results-chromium-C2-1440.json` (2026-10-16) | Payload 3.91.0 core views, English UI, **POC field config** (fields unlabelled) | reference only. POC config differs from the app                                                                                                   |
| App baseline, `tests/a11y/admin/baseline.json` (WS7, 2026-10-16)                        | Login view, production build, English UI                                        | **0 serious/critical**                                                                                                                            |
| App, WS8: dashboard, users list/edit, audit-events list, invitations list/create        | authenticated MFA-verified owner, production build                              | **baselined** (`baseline.json`): same rule families as R-A (`color-contrast`, `label`, `target-size`, `aria-hidden-focus`, `button-name`, `list`) |
| Project-built account pages (`/account/*`)                                              | 4 pages                                                                         | **0 serious/critical** (asserted, not baselined)                                                                                                  |
| App: versions, media views                                                              | collections not built yet                                                       | pending (Phase 4/6)                                                                                                                               |

## Findings (R-A, English UI; axe serious/critical rule → node count)

| ID   | View                  | Finding                                                                                                                                                                                                | Likely origin               | Remediation path                                       | Task       | Status   |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------ | ---------- | -------- |
| A-01 | dashboard             | `aria-hidden-focus` (1), `color-contrast` (1), `label` (1)                                                                                                                                             | core                        | upstream → extension (CSS for contrast)                | T093       | open     |
| A-02 | list                  | `color-contrast` (5), `label` (4), `target-size` (8)                                                                                                                                                   | core                        | upstream; extension CSS for contrast/target size       | T093       | open     |
| A-03 | edit                  | `button-name` (18), `aria-command-name` (5), `aria-hidden-focus` (4), `color-contrast` (7), `label` (3), `aria-input-field-name` (1), `label-content-name-mismatch` (1), `list` (1), `target-size` (6) | core + POC config (`label`) | upstream; our field labels; extension                  | T093       | open     |
| A-04 | versions              | `color-contrast` (4), `list` (1), `target-size` (2)                                                                                                                                                    | core                        | upstream; extension CSS                                | T093       | open     |
| A-05 | media                 | `button-name` (3), `color-contrast` (1), `list` (1)                                                                                                                                                    | core                        | upstream; extension                                    | T093       | open     |
| A-06 | array/blocks rows     | Drag handle (`DIV.collapsible__drag`) not focusable; menu Move Up/Down keyboard result unreliable; drag announcements are English raw IDs                                                              | core                        | **extension**: project ReorderControl                  | T078, T092 | open     |
| A-07 | rich-text editor      | Tab does not leave the editor (Escape then Tab does); no visible focus indicator                                                                                                                       | core                        | extension: field help text + focus CSS; upstream issue | T079, T093 | open     |
| A-08 | validation            | Focus stays on `<body>` after a failed save; the invalid field lacks `aria-invalid`                                                                                                                    | core                        | upstream; extension error-focus component              | T079, T093 | open     |
| A-09 | Arabic admin UI (RTL) | ≈10,000 px horizontal overflow from Lexical floating controls                                                                                                                                          | core                        | **out of v1 scope** (D-23: English admin)              | —          | deferred |

Upstream issue links are added when filed (T093). Counts come from the POC configuration and must
be re-measured against the app once authenticated views render (Gate 2).
