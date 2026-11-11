# ADR-011: Public front-end stack: Tailwind CSS, shadcn/ui pattern, Motion (W-1)

- **Status**: Accepted (owner instruction, 2026-11-11: "Next.js App Router, React, TypeScript,
  Tailwind CSS, shadcn/ui selectively, Motion for React; selective patterns from 21st.dev, Motion
  Primitives, React Bits, Aceternity UI").
- **Context**: The public site was built with server components and one hand-written stylesheet
  (T102, H-1). Constraints that any addition must keep: the public CSP allows styles only from
  this origin or with the request nonce (no inline `style` attributes in HTML); client
  JavaScript ≤150 KB per page (FR-083); content and navigation readable without JavaScript
  (FR-082); reduced motion respected and nothing flashes (FR-081); dependency pins at least two
  weeks old, licence and lifecycle-script review (constitution I, T145).

## Decision

| Concern              | Choice                                                                                                     | How it is used                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Runtime cost                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Utility CSS          | `tailwindcss` 4.3.3 + `@tailwindcss/postcss` 4.3.3 (dev)                                                   | `src/app/(site)/globals.css` imports Tailwind's theme and utilities layers only (no preflight). Theme values are mapped onto the existing tokens (`@theme inline`), and the default palette, fonts, shadows and radii are removed, so a utility cannot produce an off-system value. `site.css`, `media.css` and `chrome.css` sit in the `components` layer; utilities win over them                                                                                          | none (build-time CSS)                 |
| Component primitives | shadcn/ui **pattern**: `cn()` (`clsx` 2.1.1 + `tailwind-merge` 3.7.0) and `class-variance-authority` 0.7.1 | `buttonVariants()` (typed variants over the shared `.button*` classes), the Breadcrumb structure. Radix primitives are **not** installed: every interactive need is met by native elements (`<details>` menus, native form controls) that work without JavaScript                                                                                                                                                                                                            | none (server components)              |
| Motion               | `motion` 14.5.0: `useAnimate` from `motion/react-mini` (WAAPI) and `inView`                                | One client island, `src/ui/site/Enhancements.tsx`: groups marked `data-reveal` that start below the fold settle into place once (16 px, 480 ms, `cubic-bezier(0.2, 0, 0, 1)`), staggered at most 5 × 60 ms; direction-aware on the inline axis. Tokens in `src/ui/motion/tokens.ts`, mirrored as CSS variables in `site.css` (unit-tested). Nothing is hidden server-side; content already on screen is never animated; reduced motion disables it; no scroll-linked effects | a few KB; measured pages stay ≤150 KB |
| Menus                | native `<details>`                                                                                         | The same island adds Escape (focus back to the toggle), click/focus outside and one-open-at-a-time                                                                                                                                                                                                                                                                                                                                                                           | shared with the island                |

**21st.dev, Motion Primitives, React Bits, Aceternity UI**: used as pattern references only (an
"in view" reveal wrapper, a numbered index list, a sticky outline). No code was copied: their
components depend on full `framer-motion`, inline styles or decorative effects (gradients, glows,
spotlights) that conflict with the CSP, the JavaScript budget or the Institutional Precision
direction. The 21st.dev MCP was not available (authentication failed) and is not needed.

**Typography** is unchanged (T101/D-24): IBM Plex Sans Arabic for Arabic, Manrope for English
headings and Inter for English body text, self-hosted through `next/font`. Google Sans Flex was
not added: a fourth family would exceed the 120 KB per-language font budget.

## Consequences

- New components are server components styled with utilities and shared classes; block markup
  keeps its semantic classes (the CMS renderer is shared with preview).
- Preview now loads the public stylesheet and fonts (FR-022: drafts look as published).
- Adding a Radix-based shadcn component later needs a new decision: it adds client JavaScript.
- `.next/cache/fetch-cache` is cleared by the browser-test setup (stale data from a previous run).
