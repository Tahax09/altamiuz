# ADR-006: Versions, drafts, per-locale publishing and restore

- Status: accepted (WS9, 2026-10-16)
- Decides: R-E (version retention), D-4 follow-up (per-locale publishing), FR-015, FR-020–FR-025
- Pinned to: Payload 3.91.0 (ADR-003). Re-verify every item below on any Payload upgrade.

## Decisions

1. **Drafts with per-locale status.** `pages`, `services` and `courses` use
   `versions.drafts.localizeStatus: true` under `experimental.localizeStatus`. `_status` is stored
   per locale in `<collection>_locales`. Publishing Arabic leaves English as it was, and the
   reverse. This is an experimental Payload feature. `tests/integration/content/publish.test.ts`
   (T075 block) pins the installed version and asserts the storage shape and behaviour.
2. **Drafts are not validated for required fields** (`drafts.validate: false`). This deviates from
   the D-22 wording (`validate: true`). Editors must be able to save incomplete work. The safety
   checks still run on every draft save: rich-text policy, link URLs, evidence verification
   rights. Required fields and slug rules are enforced when publishing.
3. **No autosave.** Payload 3.91.0 deletes the document lock on every save. With autosave the lock
   was released every few seconds, so a second editor could open and overwrite the document. That
   was observed in T076 and breaks FR-015. Editors save drafts explicitly. The lock then holds
   until they save or leave. Other users see "currently editing", and a REST update from another
   user is refused with 423.
4. **Restore always creates a draft and never touches the live document.** Payload's non-draft
   restore overwrites the published document. Also, the Local API `restoreVersion` drops the
   `draft` option in 3.91.0. So:
   - `POST /api/<collection>/versions/:id` is replaced by `restoreAsDraftEndpoint`. User
     endpoints take precedence over Payload's built-in route.
   - `restoreAsDraft()` calls the exported `restoreVersionOperation` with `draft: true`.
   - `enforceWorkflow` rejects any non-draft restore with a 400.
   - Restore requires the `restore` permission and writes a `content.restore` audit event.
5. **Workflow permissions are separate from draft editing.**
   - Any non-draft update counts as a publish, including one with no `_status`, because Payload
     sets `published` itself.
   - `_status: 'published'` sent with `draft: true` also counts as a publish.
   - `unpublishAllLocales` counts as an unpublish.
   - Denials write `access.denied` audit events.
6. **All-locale re-verification.** Field hooks only see the current locale. Restore, duplicate
   and copy-to-locale carry other locales, so after every write `verifyStoredContent` re-reads
   the document with `locale: 'all'` in the same transaction and checks it against policy. It
   throws on any violation, which rolls the write back.
7. **Retention (A-11, R-E).** `pruneVersions()` deletes versions that are older than 12 months
   and outside the newest 50 for their document. It never deletes the latest version. Unlimited
   versions are kept until then (`maxPerDoc: 0`). Schedule it when the jobs runner exists
   (deployment-dependent). Until then, run it manually.

## Consequences

- Payload's built-in restore UI keeps working. Its request reaches our endpoint, which always
  produces a draft.
- No autosave means unsaved edits are lost if the browser closes. This trade-off is accepted for
  FR-015.
- Each upgrade must re-run `publish.test.ts`, `richtext-writepaths.test.ts` and
  `tests/security/content-http.spec.ts` before the version pin changes.
