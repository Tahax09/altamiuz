# ADR-010: Preview deployments — protection and plan terms (T141, R-G, FR-066)

- **Status**: Accepted as the required configuration; **not yet verified** (no Vercel account or
  deployment exists — owner action O-1). The task file named this `ADR-009-preview-deploys.md`;
  ADR-009 is the hosting/operations record, so this is ADR-010.
- **Context**: FR-066 forbids indexing or public exposure of non-production deployments. Vercel
  creates a preview URL for every pushed branch; Hobby plan terms forbid commercial use.

## Decision

1. **Plan**: Vercel Pro only (ADR-009, O-1). No preview or production deployment from a Hobby
   account.
2. **Protection**: Deployment Protection → _Vercel Authentication_ for **all preview
   deployments** (and the generated `*.vercel.app` production alias), so only team members can
   open them. No "Protection Bypass for Automation" secret unless CI needs one; if created, it is
   rotated like other secrets (docs/runbooks/secret-rotation.md). Shareable links are not used.
3. **Application level (enforced, local evidence)**: every `APP_ENV` other than `production`
   sends `X-Robots-Tag: noindex, nofollow`, `noindex` metadata and a disallow-all robots.txt
   (ADR-008; `tests/security/public-http.spec.ts`).
4. **Data separation**: previews use their own Neon branch with seeded or anonymised data, never
   a copy of production enquiries or accounts; Turnstile **test** keys; email to a sandbox inbox
   or `EMAIL_DRIVER=memory`; a storage bucket/prefix separate from production.
5. **Secrets**: production-scope environment variables are not exposed to the Preview scope.

## Verification checklist (run on the first preview; record date and result here)

| Check                                                                                              | Result  |
| -------------------------------------------------------------------------------------------------- | ------- |
| Anonymous request to the preview URL → Vercel login wall (401 or redirect), no application HTML    | not run |
| Signed-in team member: responses carry `X-Robots-Tag: noindex, nofollow`; robots.txt disallows all | not run |
| Preview environment variables contain no production secret (names and scopes in Vercel)            | not run |
| Preview `DATABASE_URL` points to a non-production Neon branch                                      | not run |
| Team billing shows the Pro plan                                                                    | not run |
