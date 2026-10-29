# ADR-006: Versions, drafts, per-locale publishing and restore

- Status: accepted (WS9, 2026-10-16); amended WS10 (2026-10-17): items 2–4 and 8–10
- Decides: R-E (version retention), D-4 follow-up (per-locale publishing), FR-015, FR-020–FR-025
- Pinned to: Payload 3.91.0 (ADR-003). Re-verify every item below on any Payload upgrade.

## Decisions

1. **Drafts with per-locale status.** `pages`, `services` and `courses` use
   `versions.drafts.localizeStatus: true` under `experimental.localizeStatus`. `_status` is stored
   per locale in `<collection>_locales`. Publishing Arabic leaves English as it was, and the
   reverse. This is an experimental Payload feature. `tests/integration/content/publish.test.ts`
   (T075 block) pins the installed version and asserts the storage shape and behaviour.
2. **Drafts are validated** (`drafts.validate: true`, D-22 and data-model, corrected in WS10 by
   T094a). Every draft save of the edited locale enforces required fields, slug rules and
   length limits, through the Local API and REST. The rich-text and link safety hooks run on
   every save as well. Other locales are not required: a complete English draft saves while
   the Arabic one is still empty. WS9 had used `validate: false`; that deviation is withdrawn.
3. **No autosave; FR-015 is enforced by optimistic concurrency, not locks.**
   - **Lock behaviour.** Payload 3.91.0's `checkDocumentLockStatus` deletes the document lock on
     _every_ update, and no setting changes that. Payload re-creates the lock on the editor's
     next change, so between a save and the next change the document is unlocked. Locks are
     also managed from the browser over REST (list, delete on leave, PATCH to take over).
   - **Consequence.** Locks cannot be kept across saves, and on their own they cannot prevent
     "A saves, B saves, A saves a stale form".
   - **Server-enforced precondition.** The admin form sends the `updatedAt` it loaded with every
     save (measured over HTTP). `captureOperation` records that base value; Payload always
     resets `updatedAt` itself, so the client value is only a precondition. `enforceWorkflow`
     rejects the update with **409** if the stored draft is newer. This covers draft saves,
     publish, REST and bulk updates. A malformed base is a 400. Clients that send no base (scripts,
     the Local API) are not checked. That is acceptable because FR-015 concerns concurrent editors,
     and every write is still access-checked and audited.
   - **Locks stay, but advisory.** They still show "currently editing".
   - **Autosave stays off** until autosave is proven compatible with the precondition. An
     autosaving form must carry forward the `updatedAt` returned by each autosave, or an editor
     would get 409s against their own autosaves. That has not been tested.
   - **Trade-off.** Unsaved work in an open form is lost if the browser closes or the session
     expires. A stale save is refused with a message telling the editor to reload, so their
     unsaved edits must be re-applied by hand after reloading.
4. **Restore always creates a draft, validated per locale, and never touches the live document.**
   Payload's `restoreVersion` is not used:
   - its non-draft mode overwrites the published document;
   - the Local API drops `draft`;
   - with draft validation on, it validates only the **default locale** (`ar`), so an
     English-only document could not be restored and the English content of a restored version
     was never validated.

   `captureOperation` now rejects that operation outright. Instead, `restoreAsDraft()`:
   - checks the `restore` permission (denials are audited);
   - reads the version through `readVersions` access;
   - writes each locale that has content with a normal draft `update`, so validation, rich-text
     policy, workflow and lock checks all apply;
   - runs all of this in one transaction (any failure rolls everything back);
   - records one `content.restore` event with `{collection, version, locales}`.

   Locales the version has no content for keep their current draft. The admin Restore button
   calls `POST /api/<collection>/versions/:id`, which is served by `restoreAsDraftEndpoint`.

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

## Document-lock and session-metadata hardening (WS10)

8. **Lock REST surface.** Payload's lock collection uses `defaultAccess` (any signed-in user). A
   password-only (MFA-pending) session could list and **delete** locks (measured: 200), and any
   user could silently release someone else's lock. Payload offers no supported way to change
   that collection's access. A project route,
   `src/app/(payload)/api/payload-locked-documents/[[...rest]]`, takes precedence over the
   catch-all and enforces:
   - an MFA-verified CMS session for every request;
   - listing by the admin's filters only;
   - delete own lock only;
   - take-over may only assign the lock to the requester;
   - no REST create;
   - responses carry `{id, email}` for users-directory readers and only the id for everyone else.

   Denials are audited.

9. **Admin server functions require completed MFA.** `access.admin` admits password-only
   sessions so the MFA screens load, and Payload's form-state function writes locks directly to
   the database. So the `serverFunction` wrapper in `src/app/(payload)/layout.tsx` calls
   `assertAdminServerFunctionAllowed` first. Payload documents this wrapper as the place to add
   server functions.
10. **Session metadata.** `_sid`, `mfaVerified` and `reauthAt` are now non-enumerable on
    `req.user`, and `sessions` is removed from it. Server code still reads them, but they are
    not serialised. **Accepted residual:** Payload's `initReq → applyUserReadAccess`
    deliberately re-adds the viewer's _own current_ `_sid` to the user object sent to the admin
    client. Removing it would mean patching Payload. It reveals no other session, and an
    attacker with script access could already act as that user. Drafted upstream issue, not
    filed.
