# Runbook: Rich-text policy scan (T084, FR-013c)

`pnpm scan:richtext` is read-only. It checks every rich-text value and link group in `pages`,
`services` and `courses` against the rich-text policy, covering all locales, current drafts and
all stored versions. It exits `1` if anything violates the policy and logs only collection, id and
issue codes (never content).

## When to run

- After every database restore (`docs/runbooks` restore procedure, Phase 7), before reopening
  the CMS.
- After every migration that touches content tables, and after any import or bulk SQL change.
- Before raising the rich-text policy version, against a copy of production data.

## Procedure

1. Point `DATABASE_URL` at the database to check. A restored copy is fine.
2. Run `pnpm scan:richtext`.
3. Exit `0`: done. Record the run in the restore or migration log.
4. Exit `1`: do not publish affected documents.
   - Unsafe content blocks any later save of that document (the all-locale re-check rejects it).
   - Restoring a version that contains it is refused.
   - The public renderer drops it either way.
   - Remove or replace the offending values: restore an earlier clean version as a draft, or
     edit the affected locale. Then re-run the scan until it exits `0`.

Evidence: `tests/integration/content/slugs-ops.test.ts` ("T084 scan:richtext") proves exit `0`
on clean data and `1` after a violation is written to a version table behind the hooks.
