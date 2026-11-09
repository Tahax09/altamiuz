# Privacy notice and contact page: draft register (H-3, CD-10, FR-079)

**Status: draft, not approved, not publishable.** Text: `content/contact/copy.ts` (English and
Modern Standard Arabic). Loaded by `pnpm seed:contact [replace-draft]`
(`scripts/contact-privacy.ts`) as drafts; the script never publishes. Requirements and open
questions: `privacy-notice-requirements.md`. Legal review and approval: CD-10; copy and
translation approval: CD-11.

## How the gates work

- The notice is a page with the **legal** template. Each open decision is a hidden section
  labelled "Pending: …". A legal page with any such section **cannot be published**, hidden or not
  (`assertNoPendingLegalSections`, `src/modules/content/workflow.ts`; 400 and rollback).
- Site settings `privacyNotice` names the notice (legal-template pages only). The contact form is
  **not shown** in a language where that page is not published, and `submitEnquiry` **refuses**
  enquiries in that language (503, also for direct posts): `privacyNoticeFor`,
  `src/modules/enquiries/submit.ts`; `src/app/(site)/contact-form.tsx`.
- The consent label links to the notice in the same language (new tab, `rel="noopener"`).
- The seed fills empty site settings in the **draft** only (notice link; one neutral topic,
  "General enquiry", if none exist). Publishing settings stays an Administrator's decision.

## Visible draft sections and their evidence

| Section         | Statement                                                                                                                                                                       | Verified in                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Scope           | Covers information sent through the contact form                                                                                                                                | the form is the only collection point (`src/modules/enquiries`)                                                                    |
| What we collect | Name, email, optional phone and organisation, topic, message, consent, page language, time; delivery status and deletion date; no IP or browser details stored with the enquiry | `src/modules/enquiries/collection.ts`, `schema.ts` (FR-070 fields only)                                                            |
| Abuse limits    | 5 submissions per network address per 10 minutes; only a keyed one-way digest kept; counters deleted after the window by the scheduled maintenance task                         | `ENQUIRY_LIMIT` (`submit.ts`); HMAC-SHA256 keys and `purgeRateLimitBuckets` (`platform/adapters/ratelimit/postgres.ts`); `jobs.ts` |
| Purpose         | Read and reply; stored in the inbox; staff notified by email                                                                                                                    | `submit.ts` (persist, then enqueue notification), `delivery.ts`                                                                    |
| Access          | Only administrator access can open, export or delete; each action audited without content; recipients set by administrators                                                     | access matrix (Administrators and Owners), audit `enquiry.*` events, `enquiryRecipients` (admin-only)                              |
| Retention       | Scheduled for deletion 12 months after receipt, then deleted automatically                                                                                                      | `RETENTION_MONTHS`, `deleteAfterFor`, `retention.ts` (D-15, FR-077)                                                                |

## Pending sections (each blocks publication)

| Section             | Decision needed                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Controller          | CD-01 registered legal name; CD-10 identity and contact details of the party responsible                                        |
| Legal basis         | CD-10 legal basis under Libyan and any other applicable law                                                                     |
| Service providers   | T132 email delivery and hosting providers and data locations; CD-10 wording for the production bot check (Cloudflare Turnstile) |
| Backups             | T134 backup retention; T132 schedule of the maintenance task that runs deletions                                                |
| Requests            | CD-10 rights, procedure and response time; CD-02 contact point                                                                  |
| Cookies and storage | CD-10 cookie statement: `altamiuz-locale` cookie (one year), banner dismissal in browser storage, bot check, analytics (FR-087) |
| Changes             | CD-10 effective date and how changes are announced                                                                              |

## Contact page

Slug `contact` / `تواصل-معنا`, default template: summary, the enquiry form section (heading and
intro), and a hidden "Pending: CD-02" section for the address, phone, email and hours, which are
not stated anywhere until supplied and verified. The homepage calls to action link to this page
(internal link, shown only once the page is published).

## Before publishing (owner and legal)

1. Legal review fills each pending decision (CD-10), owner approves the text in both languages
   (CD-11); remove each resolved "Pending" section or replace it with approved text.
2. Publish the notice in English and in Arabic, then publish site settings with the notice
   linked and the real topic list.
3. Publish the contact page; the form then appears in each language whose notice is published.
