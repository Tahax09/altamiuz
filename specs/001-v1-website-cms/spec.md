# Feature Specification: Altamiuz v1 Bilingual Website and CMS

**Feature Branch**: `main` (no feature branch; spec directory `specs/001-v1-website-cms`)

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "Altamiuz v1 product: premium bilingual (Arabic/English) public website
for a Libyan information-security consultancy plus a website CMS. Scope: (1) premium responsive
public site; (2) ar/en localization, true RTL/LTR, localized URLs, metadata, translation parity;
(3) CMS-managed pages, reusable schema-defined sections, ordering, visibility, navigation, banners,
global settings, drafts, previews, publishing, revision history; (4) secure admin auth, recovery,
privileged-admin MFA, session controls, server-enforced RBAC with granular permissions; (5) audit
logging of security-sensitive admin actions; (6) media library: one upload per image, secure
validation, generated responsive variants, focal point, persistent accessible ordering; (7)
localized SEO: redirects, canonical, hreflang, sitemap, robots, Open Graph, structured data,
draft/private-page protections; (8) contact forms with server-side validation, abuse prevention,
Turnstile, email delivery; (9) WCAG 2.2 AA, performance, observability, backups, recovery,
operational docs; (10) API and security requirements, negative/adversarial tests, acceptance
criteria, measurable quality gates. No arbitrary JS/unsafe HTML in CMS. Do not invent company
credentials/clients/testimonials/certifications/partnerships/legal details; mark as content
dependencies. Exclude: client portal, multi-tenancy, unsupported integrations, speculative
features, any claim that engineering standards certify the consultancy."

## Clarifications

### Session 2026-10-16

- Q: Should services, training courses, insights/blog, and documents be dedicated structured
  content types or ordinary section-built pages? → A: B — Services and Training courses are
  dedicated structured content types with automatic listing pages. Insights/blog and the public
  document library are deferred to a later approved workstream. Legacy `/blog` and `/document`
  URLs redirect per a verified redirect map; no indexed URL is dropped without one.
- Q: Should contact enquiries be stored in the CMS as well as emailed, and for how long? → A: B —
  stored in a restricted CMS enquiry inbox and emailed; automatic deletion after 12 months;
  role-based access; every view and export audit-logged; collected personal data minimised;
  purpose, retention, and handling documented in the privacy notice. No zero-loss claim is made
  until delivery, persistence, backup, and recovery have been tested.
- Q: Should a second sign-in factor be required for every CMS user or only privileged roles? →
  A: A — authenticator-app one-time-code MFA mandatory for every CMS user, including Editors,
  with single-use recovery codes; secure enrolment, recovery, session invalidation, rate
  limiting, and adversarial tests required. Passkeys deferred to a later approved workstream.
- Owner hosting decision (as clarified after Q-5): managed hosting (Vercel) is used for private
  preview deployments only, subject to the applicable plan terms. Production hosting is
  undecided: no paid plan is approved, no production provider is selected, nothing is purchased
  or deployed, and the free non-commercial plan MUST NOT host the production site. Local media
  storage for development; Cloudflare R2 intended for production, subject to account and billing
  verification. Recorded in the spec only; constitution amendment pending.
- Q: Should v1 include visitor analytics, and what kind? → A: B — privacy-respecting analytics
  without cookies or personal data, limited to page views and contact-form conversions; no
  advertising pixels or cross-site tracking; configurable and disabled in local development by
  default; a free or self-hostable provider selected after evaluating privacy, security, hosting
  compatibility, and applicable Libyan and EU legal requirements. Cookieless analytics is not
  assumed to remove every legal obligation.
- Owner decisions (WS5): English-only CMS navigation and controls in v1, with Arabic content
  fully editable and previewable RTL; typography trio adopted and self-hosted within the 120 KB
  per-language target; admin accessibility findings are not accepted as compliant (FR-080a);
  the rich-text editor is in scope with server-side allow-list enforcement and safe rendering
  (FR-013a–FR-013d); the Arabic route vocabulary (CD-13) remains a publication gate.
- Owner planning decisions (WS4): public addresses use localized static route segments as well
  as localized slugs, generated from one typed route map (final Arabic vocabulary pending CD-13);
  Publishers may edit navigation and banner drafts but not publish or unpublish them.
- Owner decisions recorded alongside Q-1 (constraints, not clarification answers): local
  development first, managed hosting as the initial deployment target, VPS deferred, no deployment
  yet; no paid subscriptions or purchases for now; admin right-to-left behaviour requires a proof
  of concept before the admin experience is finalised; typography candidates confirmed pending
  specimen validation. See A-1, A-15, A-16, A-17, FR-105.

## Actors

- **Visitor**: anonymous member of the public (prospective client, partner, candidate,
  regulator), Arabic- or English-speaking, on mobile, tablet, or desktop.
- **Search engine / social crawler**: automated agent that indexes pages or builds link previews.
- **Editor**: staff member who writes and maintains content in both languages.
- **Publisher**: staff member allowed to publish, unpublish, and restore content.
- **Administrator**: manages users, roles, global settings, and security configuration.
- **Owner**: highest-privilege administrator; the only role that can manage Administrators.
- **Operator**: person responsible for deployment, monitoring, backups, and recovery (may be the
  same person as an Administrator, but acts outside the CMS).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor reads the site in their language (Priority: P1)

A visitor opens the Altamiuz website, reads about the company and its services in Arabic or
English, switches language from any page, and lands on the equivalent page in the other language
with correct reading direction, typography, and navigation.

**Why this priority**: The public site is the product's reason to exist; without it nothing else
delivers value.

**Independent Test**: With published content in both locales, browse every page template on
mobile, tablet, and desktop in both languages; switch language on each page; verify direction,
content, navigation, and metadata.

**Acceptance Scenarios**:

1. **Given** a published page exists in both locales, **When** a visitor opens its Arabic URL,
   **Then** the page renders right-to-left with Arabic content, Arabic metadata, and Arabic
   navigation, and the document declares Arabic language and RTL direction.
2. **Given** a visitor is on an English page, **When** they choose Arabic in the language
   switcher, **Then** they arrive at the same page's Arabic URL (not the Arabic home page).
3. **Given** a page is published in only one locale, **When** a visitor requests the missing
   locale's URL, **Then** they receive a clear localized "not available in this language" response
   with a link to the available version, and the language switcher does not offer a dead link.
4. **Given** a visitor opens the site root with no locale in the URL, **When** the page loads,
   **Then** they are sent to the locale chosen by the rule in Assumptions (A-3).
5. **Given** any page, **When** viewed at 320 px, 768 px, and 1440 px widths, **Then** no content
   is clipped, overlapped, or horizontally scrollable, and touch targets meet minimum size.

---

### User Story 2 - Editor composes, previews, and publishes bilingual pages (Priority: P1)

An editor creates or edits a page by adding, configuring, reordering, hiding, and removing
predefined section types (e.g. hero, text, service list, feature grid, call-to-action, FAQ,
media gallery, contact block), entering content for both languages. They save drafts, preview
the draft exactly as it will appear, and a publisher publishes it. Every saved version is kept;
a publisher can compare and restore an earlier version.

**Why this priority**: The requirement that no editable content is hardcoded makes the CMS a
precondition for maintaining the site without developers.

**Independent Test**: Create a page from section types only, preview in both locales, publish,
edit again, restore an earlier revision; verify the public site reflects each step and nothing
unpublished is publicly visible.

**Acceptance Scenarios**:

1. **Given** an editor is signed in, **When** they add sections to a draft page and reorder them,
   **Then** the new order persists after reload and appears in preview.
2. **Given** a draft with unpublished changes on a published page, **When** a visitor opens the
   public URL, **Then** they see only the last published version.
3. **Given** a draft, **When** the editor opens preview, **Then** the preview matches the public
   rendering in the selected locale and is accessible only to authenticated users with read access
   to that page.
4. **Given** an editor without publish permission, **When** they attempt to publish (including via
   a direct request that bypasses the interface), **Then** the action is refused and logged.
5. **Given** a page with several revisions, **When** a publisher restores an earlier revision,
   **Then** it becomes a new draft (history is not rewritten) and is published only by an explicit
   publish action.
6. **Given** a section is marked hidden, **When** the page is published, **Then** the section does
   not appear on the public site in either locale but remains editable.
7. **Given** a section contains rich text, **When** an editor pastes content containing scripts,
   inline event handlers, styles, iframes, or unsupported markup, **Then** only the permitted
   formatting is kept and nothing executable reaches the public page.

---

### User Story 3 - Administrator controls who can do what (Priority: P1)

An administrator invites staff by email, assigns roles, and can suspend accounts or revoke
sessions. Staff sign in with password plus a second factor, recover access through a secure
flow, and are signed out after inactivity. Every security-sensitive action is recorded in a
tamper-resistant audit log that administrators can search.

**Why this priority**: The CMS is the highest-value attack target; a compromise would deface a
security consultancy's own brand. No content work can safely start without it.

**Independent Test**: Run the full permission matrix (every role × every protected action ×
allowed/denied) via the interface and via direct requests; run account lifecycle, MFA, recovery,
lockout, and session scenarios; verify each produces the expected audit entries.

**Acceptance Scenarios**:

1. **Given** no account exists, **When** anyone visits any sign-up path, **Then** there is no
   self-registration; accounts exist only through invitation or the documented first-owner
   bootstrap procedure.
2. **Given** an invited user, **When** they accept the invitation, **Then** they must set a strong
   password and enrol a second factor before reaching any CMS function, and receive one-time
   recovery codes.
3. **Given** a user enters a wrong password repeatedly, **When** the failure threshold is reached,
   **Then** further attempts are throttled, the user is notified, and the response is identical
   whether or not the account exists.
4. **Given** a user requests password recovery, **When** the request is made for any email,
   **Then** the response is identical whether or not the account exists, the emailed link is
   single-use and short-lived, and completing recovery revokes all existing sessions and still
   requires the second factor.
5. **Given** an Editor, **When** they try to change any user's role, read the audit log, or alter
   global security settings (by interface or direct request), **Then** the request is denied.
6. **Given** an Administrator, **When** they try to grant the Owner role or modify an Owner,
   **Then** the request is denied.
7. **Given** a user's role is reduced or their account suspended, **When** they next make any
   request, **Then** the new permissions apply immediately and suspended users' sessions are ended.
8. **Given** a signed-in user is inactive past the idle timeout, or the absolute session lifetime
   elapses, **When** they act, **Then** they must re-authenticate.
9. **Given** any event in the audit-event list (FR-045), **When** it occurs, **Then** an audit
   entry records who, what, target, when, source address, and outcome, and no role can edit or
   delete audit entries through the product.

---

### User Story 4 - Editor manages media once and reuses it everywhere (Priority: P2)

An editor uploads an image from their computer once, adds alternative text in both languages,
sets a focal point, and reuses it in any section. The system validates the file, removes hidden
metadata, and produces the sizes and formats each layout needs. In galleries and ordered lists,
editors reorder items by drag-and-drop or by keyboard, and the order is kept.

**Why this priority**: Required for a premium visual site, but pages can launch with a minimal
media set if needed.

**Independent Test**: Upload valid and invalid files; verify variants, metadata stripping, focal
cropping across breakpoints, bilingual alt text, reordering via mouse, touch, and keyboard, and
persistence after reload.

**Acceptance Scenarios**:

1. **Given** a valid image, **When** an editor uploads it, **Then** the system stores one master
   asset and generates the defined responsive variants without further uploads.
2. **Given** a file whose content is not an allowed image type (regardless of its name or declared
   type), an oversized file, an image with excessive dimensions, or an active-content file (e.g.
   script-bearing vector or document), **When** uploaded, **Then** it is rejected with a localized
   message and nothing is stored or publicly reachable.
3. **Given** an uploaded photo carrying location or camera metadata, **When** any variant is
   served, **Then** that metadata is absent.
4. **Given** an editor sets a focal point, **When** the image is shown at different aspect ratios,
   **Then** cropping keeps the focal point visible.
5. **Given** an ordered gallery, **When** an editor moves an item using only the keyboard, **Then**
   the move is announced to assistive technology and the new order persists after reload.
6. **Given** an image used on published pages, **When** an editor tries to delete it, **Then** they
   are shown where it is used and deletion requires confirmation and the delete permission.
7. **Given** an image is used only by unpublished drafts, **When** an anonymous visitor guesses
   or reuses its address, **Then** it is not retrievable.

---

### User Story 5 - Visitor sends an enquiry (Priority: P2)

A visitor fills in the contact form in their language, passes a low-friction bot check, and
receives on-screen confirmation. Altamiuz staff receive the enquiry by email at the configured
address.

**Why this priority**: The primary conversion path for a consultancy; the site can still inform
without it, so it follows the core content stories.

**Independent Test**: Submit valid, invalid, malicious, and automated submissions in both locales;
verify validation, rate limiting, bot challenge, delivery, confirmation, and stored-data handling.

**Acceptance Scenarios**:

1. **Given** a visitor completes required fields correctly and passes the bot check, **When** they
   submit, **Then** they see a localized confirmation and staff receive an email with the enquiry.
2. **Given** missing or invalid fields, **When** submitted, **Then** the server rejects the
   submission and the form shows accessible, field-specific, localized errors without losing input.
3. **Given** the bot check is missing, failed, expired, or reused, **When** a submission arrives,
   **Then** it is rejected regardless of other fields.
4. **Given** many submissions from one source in a short window, **When** the limit is exceeded,
   **Then** further submissions are refused with a localized message until the window passes.
5. **Given** a submission containing markup, scripts, or header-injection sequences, **When** staff
   view the email or any stored copy, **Then** the content is shown as inert text and cannot alter
   email headers or recipients.
6. **Given** the email service is temporarily unavailable, **When** a valid enquiry is submitted,
   **Then** the enquiry is stored in the CMS inbox before the visitor sees confirmation, email
   delivery is retried, and persistent failures are visible to the Operator.
7. **Given** a user with enquiry-read permission, **When** they open or export enquiries, **Then**
   each view and export is recorded in the audit log; users without the permission are denied
   through the interface and by direct request.
8. **Given** an enquiry older than 12 months, **When** the retention job runs, **Then** it is
   permanently deleted from the inbox and the deletion is recorded (without enquiry content).

---

### User Story 6 - Pages are discoverable and shared correctly (Priority: P2)

Search engines index each published page in both languages with correct titles, descriptions,
canonical addresses, and language alternates. Shared links show a proper preview image and text.
Drafts, previews, and admin areas are never indexed. Old URLs from the current website redirect
to their new equivalents.

**Why this priority**: Visibility in both languages is a core business goal and protects existing
search ranking during migration.

**Independent Test**: Crawl the site and inspect metadata, sitemap, robots directives, structured
data, redirects, and link previews; attempt to reach drafts and previews anonymously.

**Acceptance Scenarios**:

1. **Given** a page published in both locales, **When** crawled, **Then** each version has its own
   localized title, description, canonical address, reciprocal language alternates including a
   default alternate, and social preview metadata.
2. **Given** the sitemap, **When** fetched, **Then** it lists every published, indexable page in
   each available locale with alternates, and lists no drafts, hidden, private, or noindex pages.
3. **Given** any URL in the legacy inventory (FR-065), with or without a trailing slash, **When**
   requested, **Then** it permanently redirects to its verified mapped destination in one hop.
4. **Given** an editor adds a redirect that would create a loop or chain, **When** they save,
   **Then** the system rejects it with an explanation.
5. **Given** any preview, draft, admin, or authentication address, **When** requested by a crawler,
   **Then** it is excluded from indexing and not linked from public pages or sitemaps.
6. **Given** a non-production environment, **When** crawled, **Then** all pages are excluded from
   indexing.

---

### User Story 7 - Administrator manages navigation, banners, and site-wide settings (Priority: P3)

An administrator maintains header and footer navigation in both languages, schedules a site-wide
announcement banner, and edits global settings (company contact details, social links, default
social preview image, legal page links) without developer help.

**Why this priority**: Needed before launch but small in effort and dependent on Stories 2 and 3.

**Independent Test**: Edit menus, banner, and settings; verify the public site reflects changes in
both locales after publishing, and that scheduling and permissions behave as specified.

**Acceptance Scenarios**:

1. **Given** a menu, **When** an administrator adds, nests (one level), reorders, or removes items
   linking to internal pages or external URLs, **Then** the change appears on the public site in
   both locales after publishing, and links to unpublished pages are flagged before publishing.
2. **Given** a banner with a start and end time, **When** the current time is outside that window,
   **Then** the banner is not shown; visitors can dismiss it and it stays dismissed for them.
3. **Given** an external menu link using a non-web scheme (e.g. script or data scheme), **When**
   saved, **Then** it is rejected.

---

### User Story 8 - Operator runs, observes, and recovers the platform (Priority: P3)

The Operator deploys new versions, sees health, errors, and abuse signals, receives alerts, and
can restore content and media from backup by following written runbooks.

**Why this priority**: Mandatory before launch (constitution XII) but does not deliver visitor- or
editor-facing value on its own.

**Independent Test**: Trigger a health failure, an application error, and a burst of failed
logins; confirm alerts. Perform a full restore into a clean environment from backup using only
the runbook and measure time and data loss.

**Acceptance Scenarios**:

1. **Given** the site is unavailable or erroring above threshold, **When** detected, **Then** the
   Operator is alerted within the defined time.
2. **Given** a backup set, **When** the Operator follows the restore runbook in a clean environment,
   **Then** content, users, audit history, settings, and media are restored within the recovery
   objectives (A-10).
3. **Given** application logs, **When** inspected, **Then** they contain no passwords, tokens,
   second-factor secrets, full form-submission bodies, or session identifiers.

---

### Edge Cases

- Two editors edit the same page at once: the second save must not silently overwrite the first;
  the editor is warned of the conflict.
- A page slug changes after publishing: a redirect from the old address is created automatically.
- A page is unpublished or deleted while linked from menus or other pages: editors are warned and
  the public link resolves to a localized "not found" page, not an error.
- A user loses their second-factor device and recovery codes: only an Owner/Administrator can reset
  the factor through an audited procedure that does not reveal the old secret.
- The last remaining Owner tries to demote or delete themselves: refused.
- Mixed-direction text (English product names, ISO identifiers, numbers, email addresses) inside
  Arabic content renders in the correct order.
- Arabic text in titles and slugs, long words, and very long headings do not break layout.
- Upload interrupted mid-transfer: no partial asset appears in the library.
- An image is replaced: pages using it show the new image without editors relinking it.
- The bot-check provider is unavailable: the form fails closed (no submission accepted) with a
  localized message and alternative contact details, and the Operator is alerted.
- Clock skew or expired preview link: preview access is refused, not silently shown.
- Very large revision history: listing and restoring remain usable.
- A visitor asks for their enquiry to be deleted before 12 months: an authorised user deletes it
  and the deletion is audit-logged.
- Visitor with JavaScript disabled: core content and navigation remain readable.
- Visitor with reduced-motion preference: non-essential animation is disabled.

## Requirements *(mandatory)*

### Functional Requirements

#### Public site and localization

- **FR-001**: The public site MUST present every page in Arabic and English with layout,
  reading direction, alignment, and directional icons appropriate to the active language.
- **FR-002**: Every public address MUST include its locale; each locale MUST have its own
  editable address segment (slug) per page.
- **FR-003**: The language switcher MUST link to the equivalent page in the other locale, or be
  disabled with an explanation when that version does not exist.
- **FR-004**: Content MUST NOT silently fall back to the other language on the public site. The
  CMS MUST show editors which translations are missing; publishing a locale with incomplete
  required fields MUST be blocked.
- **FR-005**: All interface strings that are not editor-managed content (form labels, validation
  messages, accessibility labels, error pages, emails) MUST exist in both languages.
- **FR-006**: Dates, numbers, and phone numbers MUST be formatted per locale using a single,
  documented numeral convention per locale.
- **FR-007**: The site MUST be fully usable from 320 px width upward and on touch, mouse, and
  keyboard input.
- **FR-008**: Localized "not found" and "error" pages MUST exist and MUST NOT reveal internal
  details.

#### Content model and editing

- **FR-010**: All editor-facing content (pages, sections, navigation, banners, text, media,
  SEO fields, global settings) MUST be stored in and served from the CMS; none may be hardcoded.
- **FR-011**: Pages MUST be composed from a fixed library of defined section types. Each section
  type MUST have a defined set of fields with validation (required fields, length limits, allowed
  link targets).
- **FR-012**: Editors MUST be able to add, remove, duplicate, reorder, and hide sections; order and
  visibility MUST persist and apply per page.
- **FR-013**: Rich text MUST be limited to a defined formatting set (headings, paragraphs, lists,
  emphasis, links, quotes) and MUST NOT accept or render scripts, raw markup, inline styles,
  event handlers, or embedded frames.
- **FR-013a**: The rich-text editor is in scope for v1. It MUST support headings, paragraphs,
  bold, italic, ordered and unordered lists, blockquotes, line breaks, and safe links, with
  Arabic/English bidirectional content. Preview and public rendering MUST use the same renderer
  and produce the same output.
- **FR-013b**: Rich-text content MUST be validated on the server on every create, update, draft
  save, autosave, duplicate, version restore, and import path, against an explicit allow-list of
  node types, formatting marks, node attributes, link fields, and URL protocols. Anything outside
  the allow-list is rejected, not silently altered. Editor-side controls alone MUST NOT be relied
  upon.
- **FR-013c**: The public site and preview MUST render rich text through a safe renderer that
  re-applies the URL and node allow-list at render time. Content stored before a policy change,
  or written outside the application, cannot produce executable links or markup. A link with a
  disallowed URL renders as plain text.
- **FR-013d**: Every link MUST have non-empty visible text. Images MUST NOT be placed inline in
  rich text; image sections require alternative text per FR-054.
- **FR-014**: Links in content MUST be restricted to internal pages, web addresses, email, and
  telephone schemes. `javascript:`, `vbscript:`, `data:`, `file:`, `ftp:`, `blob:`,
  protocol-relative, malformed, and control-character-bearing URLs MUST be rejected.
- **FR-015**: The CMS MUST prevent the second of two conflicting concurrent saves from silently
  overwriting the first.
- **FR-017**: Services and Training courses MUST be dedicated structured content types, each item
  with localized title, slug, summary, body sections, display order, visibility, SEO fields, and
  publish state. Training courses MUST additionally record target audience, duration, delivery
  format, and provider/accreditation statement; the accreditation statement is claim-bearing
  content (FR-016).
- **FR-018**: Each of the two content types MUST have an automatically generated, localized listing
  page and per-item detail pages; listings MUST include only items published in that locale, in
  editor-defined order, and MUST update when an item is published or unpublished.
- **FR-019**: Pages MUST be able to feature selected Services or Training courses through a
  section that references items rather than duplicating their content.
- **FR-016**: Claim-bearing content (credentials, registrations, partnerships, certifications,
  client names or logos, testimonials, statistics) MUST carry a verification status and an
  evidence reference. Content marked unverified MUST NOT be publishable.

#### Drafts, preview, publishing, and revisions

- **FR-020**: Pages, navigation, banners, and global settings MUST support draft and published
  states independently per locale.
- **FR-021**: Only the published version MUST ever be served to the public, crawlers, sitemaps,
  and feeds.
- **FR-022**: Preview MUST render drafts exactly as published pages would appear and MUST require
  an authenticated session with read permission; any shareable preview link MUST be short-lived,
  bound to a single item, and revocable.
- **FR-023**: Every save MUST create a revision recording author, time, and change; publishers
  MUST be able to compare two revisions and restore one as a new draft.
- **FR-024**: Publishing and unpublishing MUST be explicit actions restricted to permitted roles.
- **FR-025**: Changing a published page's slug MUST automatically create a redirect from the old
  address.

#### Identity, access, and sessions

- **FR-030**: There MUST be no public registration. The first Owner MUST be created through a
  documented one-time procedure that cannot be re-run once an Owner exists. No default
  credentials may exist in any environment that is reachable from the internet.
- **FR-031**: New users MUST join only by time-limited, single-use invitation from an
  Administrator or Owner.
- **FR-032**: Passwords MUST meet a minimum length of 12 characters, MUST be checked against a
  list of known-breached or common passwords, and MUST NOT be subject to arbitrary composition
  rules or forced periodic rotation.
- **FR-033**: Second-factor authentication using an authenticator app (time-based one-time codes)
  MUST be mandatory for every CMS user in every role; no CMS function, preview, or interface may be
  reachable before the second factor is completed. Each user MUST receive single-use recovery
  codes at enrolment.
- **FR-033a**: Enrolment MUST be confirmed by a valid code before the factor is active; the shared
  secret MUST be shown only during enrolment and never retrievable afterwards; recovery codes MUST
  be stored so they cannot be read back, MUST be single-use, and MUST be regenerable only after
  re-authentication.
- **FR-033b**: One-time codes MUST NOT be accepted twice; code and recovery-code attempts MUST be
  rate-limited per account and per source; enrolling, resetting, or removing a factor and using a
  recovery code MUST revoke the user's other sessions, notify the user, and be audit-logged.
- **FR-033c**: A lost factor MUST be reset only by an Administrator or Owner acting on a
  lower-privileged account (or an Owner on an Owner), through an audited procedure that forces
  fresh enrolment at next sign-in.
- **FR-034**: Sign-in and recovery MUST resist enumeration (identical responses and comparable
  timing), MUST throttle repeated failures per account and per source, and MUST notify the account
  holder of lockouts, password changes, and second-factor changes.
- **FR-035**: Sessions MUST expire after an idle timeout and an absolute lifetime (A-6), MUST be
  renewed on sign-in and on privilege change, and MUST be listable and revocable by the user and by
  Administrators.
- **FR-036**: The system MUST define roles Owner, Administrator, Publisher, and Editor (A-5), each a
  named set of granular permissions per resource type and action (create, read, update, delete,
  publish, manage users, manage settings, read audit log, read/export/delete enquiries).
- **FR-037**: Every permission check MUST be enforced on the server for every operation,
  including direct requests, previews, file retrieval, and background actions; interface hiding
  alone MUST NOT be relied upon.
- **FR-038**: Users MUST NOT be able to assign a role, permission, or account state higher than
  their own, modify accounts of equal or higher privilege (except Owners acting on Owners), or act
  on behalf of another user. The last Owner MUST NOT be removable.
- **FR-039**: Sensitive actions (changing own password, second factor, or email; managing users
  and roles; changing security settings) MUST require recent re-authentication.

#### Audit logging

- **FR-045**: The system MUST record an audit entry for: sign-in success and failure, sign-out,
  lockout, recovery request and completion, second-factor enrolment, reset and removal, session
  revocation, invitation, user creation, suspension, deletion, role and permission changes,
  publish, unpublish, revision restore, page and media deletion, redirect changes, navigation
  and global-setting changes, enquiry view, export, and deletion (including automatic
  retention deletion), and denied attempts on protected actions.
- **FR-046**: Each entry MUST include actor, action, target, timestamp, source address, and
  outcome, and MUST exclude secrets and full form-submission content.
- **FR-047**: Audit entries MUST be append-only through the product; no role can edit or delete
  them. Read access MUST be limited to Owner and Administrator, with filtering by actor, action,
  target, and date range, and export.
- **FR-048**: Audit entries MUST be retained for the period in A-9 and included in backups.

#### Media

- **FR-050**: Editors MUST be able to upload images from their device into a shared media library.
- **FR-051**: Uploads MUST be accepted only from authenticated users with upload permission,
  MUST be checked by actual file content against an allow-list of raster image types, and MUST be
  limited in file size and pixel dimensions (A-7). Vector and other active-content formats MUST be
  rejected unless a sanitizing step is approved in planning.
- **FR-052**: Each accepted image MUST be re-encoded, stripped of embedded metadata, and stored
  once as a master with automatically generated responsive variants in modern and fallback
  formats; editors MUST NOT need to upload variants.
- **FR-053**: Editors MUST be able to set a focal point per image; all crops MUST respect it.
- **FR-054**: Each image MUST have alternative text per locale, or be explicitly marked decorative;
  images without either MUST NOT be publishable on a page.
- **FR-055**: Ordered media collections MUST support reordering by drag-and-drop, touch, and
  keyboard, with accessible announcements, and MUST persist order on the server.
- **FR-056**: Stored files MUST use non-guessable addresses; files referenced only by drafts or
  deleted content MUST NOT be publicly retrievable.
- **FR-057**: The library MUST show where each image is used and warn before deletion of
  in-use images; replacing an image MUST update all uses.

#### SEO and discoverability

- **FR-060**: Each page and locale MUST have editable title, description, social preview image,
  and indexing controls, with sensible defaults from global settings.
- **FR-061**: Each public page MUST declare language, direction, a self-referencing canonical
  address, reciprocal language alternates for available locales, and a default alternate.
- **FR-062**: The system MUST generate a sitemap of published, indexable pages per locale with
  alternates, and a robots policy that excludes admin, preview, authentication, and API paths.
- **FR-063**: Pages MUST emit structured data for the organization, website, breadcrumbs, FAQ
  sections, services, and training courses where present, populated only from verified content
  (FR-016).
- **FR-064**: Administrators MUST be able to manage permanent and temporary redirects; loops,
  chains, and redirects to external domains not on an allow-list MUST be rejected.
- **FR-065**: Every URL in the legacy inventory MUST have a verified redirect mapping at launch,
  matching with and without trailing slash. The inventory, taken from the legacy sitemap on
  2026-10-16, is: `/`, `/about/`, `/services/`, `/iso_services/`, `/pcidss_services/`,
  `/training_courses/` and its three course detail pages (Arabic slugs), `/blog/`,
  `/blog/ma-hw-alamn-alsybrany`, `/document/`, and `/contact/`. Legacy `/blog` and `/document`
  URLs MUST redirect to the closest relevant v1 page approved in the redirect map (CD-12); no
  indexed legacy URL may be removed or left to return "not found" without an approved mapping.
  Any further legacy URLs found before launch (e.g. in search-console data) are added to the map.
- **FR-066**: Non-production environments MUST be excluded from indexing and protected from
  public access.

#### Contact and email

- **FR-070**: The site MUST provide a localized contact form (name, email, optional phone,
  optional organization, subject/service of interest, message, consent acknowledgment of the
  privacy notice).
- **FR-071**: All validation MUST be enforced on the server; client-side validation is a
  convenience only.
- **FR-072**: Submissions MUST require a successful, unexpired, single-use bot-challenge result
  verified on the server, and MUST be rate-limited per source; the form MUST fail closed if the
  challenge cannot be verified.
- **FR-073**: Staff notification emails MUST be sent from an authenticated sending domain, treat
  all submitted content as plain text, and never use submitted values in headers other than as an
  escaped reply-to address.
- **FR-074**: Each valid submission MUST be stored in the enquiry inbox before the visitor is shown
  confirmation; email delivery MUST be retried on transient failure, and persistent failure MUST
  alert the Operator and remain visible on the stored enquiry.
- **FR-075**: Notification recipients MUST be configurable by Administrators.
- **FR-076**: The enquiry inbox MUST be readable only by roles granted enquiry permissions (read,
  export, delete as separate permissions); every view, export, and deletion MUST be audit-logged.
- **FR-077**: Enquiries MUST be deleted automatically 12 months after submission. Deleted
  enquiries MAY persist in encrypted backups only until those backups expire (A-10); the privacy
  notice MUST state this.
- **FR-078**: The form MUST collect only the fields in FR-070, MUST advise visitors not to submit
  credentials, incident evidence, or other sensitive information, and stored enquiries MUST be
  protected at rest and excluded from logs, analytics, and audit-entry content.
- **FR-079**: The privacy notice (CD-10) MUST describe the purpose of collection, the data
  collected, the retention period, who can access enquiries, the email delivery processor, and
  how visitors can request access or deletion.

#### Accessibility and performance

- **FR-080**: Public pages and project-built admin customisations MUST meet WCAG 2.2 AA in both
  locales, including keyboard operation, visible focus, focus not obscured, target size,
  dragging alternatives, consistent help, accessible authentication (no cognitive tests), and
  redundant-entry avoidance.
- **FR-080a**: Accessibility defects in the CMS admin interface that the project relies on
  (including third-party admin views) MUST be tracked. Where a supported extension point or
  upstream fix exists, they MUST be remediated for keyboard navigation, focus visibility,
  validation focus and announcements, and reordering. An admin accessibility regression suite
  MUST run on every release. No WCAG conformance claim is made for the admin without evidence,
  and unresolved findings are documented.
- **FR-081**: Motion MUST be purposeful and MUST respect reduced-motion preferences; no content may
  flash more than three times per second.
- **FR-082**: Core content and navigation MUST be readable without client-side scripting.
- **FR-083**: Pages MUST meet the performance budgets in SC-007 to SC-009.

#### Analytics

- **FR-084**: The site MAY record visitor analytics only if it sets no cookies or other
  device storage for analytics, collects no personal data or persistent identifiers, and measures
  only page views (per locale) and successful contact-form submissions.
- **FR-085**: Advertising pixels, cross-site tracking, session recording, and fingerprinting MUST
  NOT be used.
- **FR-086**: Analytics MUST be switchable by configuration, MUST be disabled by default in local
  development and tests, and the site MUST work fully when it is disabled or unavailable.
- **FR-087**: The analytics provider MUST be free or self-hostable and MUST be selected only after
  a recorded evaluation of privacy, security, hosting compatibility, data location, and applicable
  Libyan and EU legal requirements; its use MUST be disclosed in the privacy notice (CD-10).

#### Security and interfaces

- **FR-090**: All traffic MUST use encrypted transport with strict transport security; responses
  MUST carry a restrictive content security policy and framing, referrer, content-type, and
  permissions policies.
- **FR-091**: State-changing requests from browsers MUST be protected against cross-site request
  forgery; authentication cookies MUST be inaccessible to scripts and restricted to same-site use.
- **FR-092**: Every content and media interface MUST enforce authorization per object (no access
  to an item by changing its identifier) and MUST return only fields the caller may see.
- **FR-093**: All inputs MUST be validated against defined schemas; database access MUST be
  parameterized; output MUST be encoded for its context.
- **FR-094**: Public interfaces (contact, any public read interface) MUST be rate-limited; admin
  interfaces MUST be rate-limited per user and source.
- **FR-095**: Error responses MUST NOT expose stack traces, internal identifiers beyond necessity,
  or configuration.
- **FR-096**: Interfaces used by the public site and any interfaces exposed to integrations MUST be
  documented, including authentication and authorization rules per operation.
- **FR-097**: The release process MUST include automated negative and adversarial tests covering
  authorization bypass, object-level access (IDOR/BOLA), privilege escalation, injection,
  stored and reflected XSS, CSRF, brute force and rate-limit evasion, unsafe uploads, session
  fixation and reuse, preview-link misuse, open redirects, second-factor bypass (skipping the
  second step, reusing a session issued before it), one-time-code brute force and replay,
  recovery-code reuse, and enrolment or factor-reset takeover.
- **FR-098**: Dependency vulnerability scanning and secret scanning MUST run on every change.

#### Operations

- **FR-100**: The platform MUST expose health status and report errors, latency, and abuse
  signals (failed sign-ins, rate-limit hits, rejected uploads, bot-check failures) to monitoring
  with alerting.
- **FR-101**: Logs MUST be structured and MUST NOT contain secrets, session identifiers, second-
  factor secrets, or full submission content.
- **FR-102**: Database and media MUST be backed up automatically, encrypted, stored off the
  primary server, and restore-tested before launch and periodically thereafter.
- **FR-103**: Written runbooks MUST cover deployment, rollback, first-Owner bootstrap, secret
  rotation, user lockout recovery, incident response, backup, and restore.
- **FR-104**: Configuration MUST be provided through environment settings with a placeholder-only
  example file; no secrets in the repository.
- **FR-105**: Local development and the automated test suite MUST run without paid services or
  external accounts. Every external service (media storage, email, rate limiting, background jobs,
  bot challenge, analytics) MUST be optional behind configuration with a local or test substitute, and the
  application MUST refuse to start in production mode if a required production service or security
  setting is missing (no silent fallback to development substitutes).

### Out of Scope

- Client or customer portal, client accounts, document exchange, or ticketing.
- Passkeys and hardware security keys (deferred to a later approved workstream).
- Insights/blog articles and a public document library (deferred to a later approved
  workstream; legacy URLs are redirected per FR-065).
- Multi-tenancy or per-tenant data isolation.
- E-commerce, payments, course registration with payment, or online booking.
- Public user accounts, comments, or community features.
- Third-party embeds, advertising pixels, cross-site tracking, and integrations beyond those
  approved in the constitution or this spec.
- Site search, newsletters, chat widgets, and AI assistants (may be proposed later as features).
- Any statement that the platform's engineering alignment certifies Altamiuz.

### Key Entities

- **Page**: a routable document with per-locale slug, title, SEO fields, draft/published state per
  locale, ordered sections, and revision history.
- **Section**: an instance of a defined section type within a page; holds typed, localized fields,
  order position, and visibility flag; may hold verification status (FR-016).
- **Service**: structured, localized description of a consultancy service with its own detail
  page, listing order, visibility, SEO fields, and publish state per locale.
- **Training course**: structured, localized course record (audience, duration, delivery format,
  provider/accreditation statement with verification status) with its own detail page.
- **Section type**: the fixed schema defining a section's fields and rules; changed only by
  developers through reviewed releases.
- **Navigation menu**: named ordered tree (max two levels) of localized links to pages or URLs.
- **Banner**: localized announcement with link, schedule window, and dismissal behaviour.
- **Site settings**: singleton holding contact details, social links, default SEO values, legal
  page links, notification recipients.
- **Media asset**: master image with per-locale alt text or decorative flag, focal point, usage
  references, and generated variants.
- **Ordered media list**: a section-owned, ordered set of media asset references.
- **Redirect**: source path, target, permanence, creator, and timestamps.
- **Revision**: immutable snapshot of a content item with author, time, and locale state.
- **User**: staff account with email, status, role, second-factor enrolment, and sessions.
- **Role / Permission**: named permission sets mapping resource types to allowed actions.
- **Session**: authenticated period with creation time, last activity, source, and revocation.
- **Audit event**: append-only record of actor, action, target, time, source, outcome.
- **Enquiry**: a contact submission (FR-070 fields only), submission time, locale, email delivery
  status and attempts, and scheduled deletion date (12 months after submission).
- **Content evidence**: verification status, evidence reference, verifier, and date for a claim.

## Content Dependencies

These must be supplied and verified by Altamiuz before the related content can be published.
None may be invented or inferred from the legacy site without evidence.

- CD-01 Registered legal name in Arabic and English, commercial registration and licence numbers,
  issuing authorities, and validity.
- CD-02 Founding year (stated as 2020), headquarters address in Tripoli, phone, email, and hours.
- CD-03 Founder and team biographies, credentials, and photo consent.
- CD-04 Authoritative service catalogue with descriptions in both languages.
- CD-05 Training courses: titles, providers, and written evidence of any accreditation or
  partnership (e.g. the PECB relationship claimed on the legacy site).
- CD-06 Standards referenced in service descriptions and their current editions (the legacy site
  cites ISO/IEC 27001:2013, which has been superseded by the 2022 edition).
- CD-07 Experience and statistics claims (e.g. "over thirty years of combined experience") with
  supporting evidence.
- CD-08 Client names, logos, case studies, and testimonials with written permission.
- CD-09 Brand assets: logo files, colour references, and usage rights.
- CD-10 Privacy notice, terms of use, and cookie statement reviewed for Libyan law and any other
  applicable law; the privacy notice must cover enquiry handling (FR-079) and analytics (FR-087).
  Legal review must confirm whether cookieless analytics carries any notice or consent obligation;
  none is assumed away.
- CD-11 English and Arabic copy approval owner and translation review process.
- CD-12 Approval of the destination for every legacy URL in the FR-065 inventory, including where
  the legacy blog article and document index should point while those sections are deferred.
- CD-13 Approved Arabic and English static route vocabulary (e.g. the Arabic segment for
  services and training listings), reviewed for meaning, readability, and SEO before launch.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of published pages are available in both locales or explicitly marked
  single-locale with a working alternative link; 0 public pages show text in the wrong language.
- **SC-002**: An editor with no developer help can create, preview, and publish a new bilingual
  page from existing section types in under 20 minutes on first attempt, in usability testing
  with at least 2 staff members.
- **SC-003**: 100% of cells in the role × action permission matrix pass, including all denial
  cases, when exercised both through the interface and by direct requests.
- **SC-004**: 0 open critical or high findings from automated scans and the adversarial test
  suite (FR-097) at launch; every medium finding has an owner and due date.
- **SC-005**: 100% of events listed in FR-045 produce a complete audit entry in automated tests.
- **SC-006**: 0 serious or critical automated accessibility violations on every page template in
  both locales, and manual keyboard and screen-reader walkthroughs pass on all templates and on the
  contact, sign-in, media reordering, and section reordering flows.
- **SC-007**: At the 75th percentile on a mid-range mobile device over a typical 4G connection,
  largest content appears within 2.5 s, layout shift stays below 0.1, and interaction response
  stays below 200 ms, for every public template in both locales.
- **SC-008**: Each public page transfers no more than 1 MB on first visit (excluding
  user-initiated media), and no more than 150 KB of compressed script.
- **SC-009**: Pages reflect a newly published change within 60 seconds.
- **SC-010**: 99% of valid enquiries reach the staff email inbox within 2 minutes. In a tested
  email-service outage, every valid enquiry accepted during the outage is present in the CMS inbox
  and is delivered by email after recovery. No public or internal statement of guaranteed
  delivery is made until this test, plus backup and restore of enquiries (SC-013), has passed.
- **SC-011**: In testing, 100% of automated submissions without a valid bot-check result are
  rejected, and rate limits engage at the configured threshold.
- **SC-012**: 100% of legacy URLs redirect to their mapped destination in one hop; 0 drafts,
  previews, or admin addresses appear in the sitemap or are indexable.
- **SC-013**: A full restore from backup into a clean environment, following only the runbook,
  meets the recovery objectives in A-10.
- **SC-014**: 0 secrets detected in repository history by secret scanning at launch.
- **SC-015**: Monthly availability of the public site is at least 99.5%, measured by external
  monitoring.
- **SC-016**: 100% of published claim-bearing content has a recorded evidence reference.
- **SC-017**: 100% of active CMS accounts have a second factor enrolled, and 0 CMS functions are
  reachable without completing it in automated and adversarial tests.
- **SC-018**: 100% of the rich-text adversarial corpus (malicious links, stored-XSS payloads,
  malformed URLs, unexpected node types and attributes, bypass attempts) is rejected on every
  write path. 0 unsafe `href` values or disallowed elements appear in rendered pages, including
  when malicious content is injected directly into storage.
- **SC-019**: The admin accessibility regression suite reports no new serious or critical
  findings against the recorded baseline, and every baseline finding is either remediated or
  documented with its reason and upstream reference.

## Assumptions

- **A-1** Approved platform choices and supporting services are recorded in the constitution and
  are constraints for planning; this spec stays technology-neutral except where the owner's
  hosting decision is recorded. Hosting (2026-10-16): local development first; private preview
  deployments on managed hosting only where the plan's terms permit; production hosting is
  undecided (no paid plan approved, no provider selected, nothing purchased or deployed); the free
  non-commercial plan is never used for the production site; VPS and other commercially permitted
  hosts remain candidates for a later decision. Media: local storage in development, cloud object
  storage intended in production subject to account and billing verification. The constitution's
  hosting text requires an amendment before planning (not yet made, per owner instruction).
- **A-2** Arabic is the primary locale; English has equal functional status.
- **A-3** Root address: send visitors to their remembered language choice, else the language
  preferred by their browser if Arabic or English, else Arabic. Crawlers receive the default
  alternate.
- **A-4** Arabic pages use Arabic script slugs or editor-chosen Latin slugs; editors choose per page.
- **A-5** Roles: Owner, Administrator, Publisher, Editor. Editors draft only; Publishers also
  publish/unpublish/restore; Administrators also manage users (below Owner), navigation, banners,
  redirects, settings, and read audit logs; Owners also manage Administrators and security settings.
  Publishers may also edit navigation and banner drafts; publishing or unpublishing them stays
  with Administrators and Owners (owner decision 2026-10-16; see contracts/access-matrix.md).
  Enquiry read/export/delete is granted to Owners and Administrators only. Roles are fixed in v1:
  their permission sets change only through a reviewed release, not through the admin interface.
  The exact permission matrix is finalised in planning.
- **A-6** Sessions: 30-minute idle timeout and 12-hour absolute lifetime for CMS users.
- **A-7** Uploads: JPEG, PNG, WebP, and AVIF; maximum 20 MB and 40 megapixels per file.
- **A-8** Sign-in throttling begins after 5 consecutive failures per account and escalates;
  contact form allows 5 submissions per source per 10 minutes.
- **A-9** Audit log retention: 24 months online.
- **A-10** Recovery objectives: data loss of at most 24 hours (RPO) and service restored within
  4 hours (RTO); backups retained 30 days.
- **A-11** Revision history retains every revision for 12 months and at least the latest 50
  per item thereafter.
- **A-12** Expected traffic is modest (low thousands of visits per day); no special scaling
  requirements beyond caching and edge protection.
- **A-13** Services and Training courses are dedicated content types (FR-017 to FR-019); other
  content (home, about, contact, legal) is section-built pages; insights and documents are deferred.
- **A-14** No non-essential cookies in v1; analytics is cookieless (FR-084 to FR-087). Whether
  any consent mechanism is still required is decided by the legal review in CD-10.
- **A-15** Arabic content entry (right-to-left fields, mixed-direction text) is required
  regardless. The proof of concept (R-A, 2026-10-16) found the Arabic-language admin UI not
  ready, so v1 uses English-only CMS navigation and controls (D-23). Arabic content is fully
  editable and previewable RTL.
- **A-16** Typography candidates are confirmed (one family for English headings, one for English
  body and interface text, one for Arabic, per the constitution); final adoption follows specimen
  validation in both scripts. The visual system is decided in a design stage.
- **A-17** No paid subscriptions or purchases during v1 development. Production service selection
  must fit free tiers or receive explicit owner approval before any cost is incurred.
