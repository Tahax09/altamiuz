# ADR-001: Single Next.js application with embedded Payload CMS

- **Status**: Accepted (WS1, 2026-10-16; plan D-2)
- **Context**: A small team runs one bilingual website and its CMS. A separate API service would
  duplicate auth and sessions, and widen the attack surface (WS0).
- **Decision**: One Next.js app with Payload 3 embedded, built as `output: 'standalone'`. Domain
  code lives in `src/modules/<name>/` and is imported only through each module's `index.ts`
  (ESLint `no-restricted-imports`). `app/` and `payload.config.ts` only compose modules.
- **Consequences**: One deployable, one dependency tree. A future portal adds modules and routes.
  `next dev` writes `AGENTS.md` and `CLAUDE.md` at the repository root; both are git-ignored and
  never committed.
