# ADR-007: Analytics — first-party aggregate counter, off by default

- **Status**: Accepted for engineering (2026-11-17, T127, research item R-F). **Not enabled.**
  Turning it on in production is owner decision OD-3 and needs the privacy notice to disclose it
  (CD-10, FR-087). This record is not legal advice and makes no statement about consent
  requirements; whether any is needed is for the CD-10 legal review (spec A-14).
- **Requirements**: FR-084 (only page views per language and successful contact-form submissions;
  no cookies, device storage, personal data or persistent identifiers), FR-085 (no advertising
  pixels, cross-site tracking, session recording or fingerprinting), FR-086 (switchable, off by
  default, site works with it off or failing), FR-087 (free or self-hostable, recorded evaluation,
  disclosed).
- **Code**: `src/modules/platform/adapters/analytics/index.ts` (port and `counter` driver),
  `src/modules/platform/analytics.ts` (runtime, page-view filter), `src/app/(site)/analytics.ts`
  (page and enquiry hooks), migration `20261117_120000_analytics_daily`, retention in
  `src/modules/enquiries/jobs.ts`.

## Options evaluated

| Option                                            | Privacy                                                                                                                             | Security / operations                                                                             | Hosting fit                                       | Data location                   | Verdict                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| **A. First-party server-side daily counter**      | Stores day, language, event, total. Nothing per visitor exists to leak, link or request. No browser code.                           | No new dependency, service, secret or script; one atomic upsert; same database and backups as now | Any host (plain Postgres, already required)       | The site's own database         | **Chosen**                                                             |
| B. Self-hosted Umami / Plausible CE / GoatCounter | Cookieless, but each derives a rotating visitor hash from IP + User-Agent (+ salt) and records paths, referrers, devices, countries | A second service to run, patch, back up and secure (extra database, admin login)                  | Needs a container host; not a serverless function | Wherever it is hosted           | Rejected for v1: collects more than FR-084 allows, and more to operate |
| C. Hosted cookieless SaaS (e.g. Plausible Cloud)  | As B, processed by a third party                                                                                                    | Browser loads a third-party script: CSP change, supply-chain exposure                             | Any                                               | Provider's region (EU for most) | Rejected: paid, third-party processor, script in the page              |
| D. Host analytics (e.g. Vercel Web Analytics)     | Provider-defined hashing; host-specific                                                                                             | Script in the page; host lock-in (research D-12: no host-proprietary APIs)                        | One host only                                     | Provider's                      | Rejected                                                               |
| E. Server log analysis                            | Logs hold IP addresses and full paths                                                                                               | Depends on the host's log retention and drains (O-9)                                              | Host-specific                                     | Host's                          | Rejected for counting; logs stay operational only                      |

Free and self-hostable (FR-087): A has no cost and no provider. Libyan and EU law were considered
only as far as engineering can: A processes no personal data by design, which keeps the analytics
question out of personal-data processing as far as possible. The legal conclusion is CD-10's.

## Decision

1. **Driver** `ANALYTICS_DRIVER=counter` (config enum `none | counter`, default **`none`** in every
   environment, `.env.example` included). Any other value is refused at start-up.
2. **Data**: table `analytics_daily (day date, locale 'ar'|'en', event 'page_view'|'enquiry_conversion', count)`,
   primary key `(day, locale, event)`, one `insert … on conflict … count + 1` per event. Days are
   UTC. The adapter receives only an event name and a language from closed lists; it never sees the
   request, a path, an address, a User-Agent, a referrer, a session or enquiry content. It is not a
   Payload collection, so it has no API.
3. **What counts**:
   - _Page view_: a published public page (home, page, listing, service, course) rendered on the
     server, including client-side navigations. Not counted: 404s, redirects, the "not available in
     this language" page, admin, account, preview and API routes, router prefetches
     (`next-router-prefetch`, `next-router-segment-prefetch`), browser speculation
     (`Sec-Purpose`/`Purpose: prefetch`), and automated agents matched by a fixed User-Agent pattern
     (bots, crawlers, headless browsers, Lighthouse, monitors, curl/wget). The User-Agent is tested
     and discarded, never stored or combined (not fingerprinting).
   - _Enquiry conversion_: a contact-form submission the server accepted (status 200), by the
     language the form reports. The analytics hook gets the language and nothing else.
4. **No browser involvement**: no script, beacon, pixel, cookie, local/session storage or extra
   request, whether enabled or not. The CSP is unchanged.
5. **Isolation and failure**: the count is written after the response is sent (`after()`); a
   database error is logged by error class only and swallowed. Pages and enquiries never wait on,
   or fail because of, analytics. Disabled, the hooks return before reading any request header.
   Analytics shares no code path with authentication or the enquiry pipeline beyond that one call
   after success.
6. **Retention**: daily totals older than **25 months** (first of the month, UTC) are deleted by
   the existing retention job (`/api/jobs/retention`, `analyticsDaysDeleted`), allowing two
   full years of month-on-month comparison. Backups follow the backup lifecycle (O-10).
7. **Access**: database only (no admin view in v1). Read with `readAnalytics()` or SQL, e.g.
   `select * from analytics_daily where day >= current_date - 30 order by day`.

## Consequences

- Answers "how many page views per language per day" and "how many enquiries per language per
  day"; not which pages, sources, devices, countries or unique visitors. Those would need a new
  decision, a privacy review and a FR-084 change.
- Totals are approximate: automated agents that pose as browsers are counted; visitors whose
  requests are served by a CDN cache without reaching the server would not be (public pages are
  rendered per request today).
- Small numbers: a day with one enquiry in one language says one enquiry arrived that day, which
  the enquiry inbox already records; no new information about a person is created.
- Owner actions to enable: (1) OD-3 "yes, counter"; (2) CD-10 privacy notice discloses it (the
  draft row in `docs/content/privacy-notice-requirements.md` says what to disclose); (3) set
  `ANALYTICS_DRIVER=counter` in the production environment and run migrations.
