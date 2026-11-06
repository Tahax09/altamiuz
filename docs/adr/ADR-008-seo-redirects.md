# ADR-008: SEO metadata, sitemap, robots and redirects (US6, T114–T118)

- **Status**: Accepted (2026-11-06). Implements D-13 and D-16.
- **Metadata** (`src/modules/seo/metadata.ts`, `src/app/(site)/seo.tsx`): title and description
  from the document's `seo` group, else site-settings defaults; self-canonical absolute URL from
  the typed route map; `hreflang` alternates only for locales where the same document is
  published; `x-default` → `/` (the A-3 language redirect); Open Graph and Twitter cards with the
  document's `seo.ogImage` (the 1440 px JPEG variant; public because the published document uses
  it). `seo.canonicalOverride` accepts internal paths only; such documents are left out of the
  sitemap.
- **Indexing**: every non-production environment (`APP_ENV` ≠ `production`) sends
  `X-Robots-Tag: noindex, nofollow` on all responses, `noindex, nofollow` page metadata, and a
  robots.txt that disallows everything (FR-066). Host-level protection of non-production
  deployments is T141 (open). Production robots.txt disallows `/admin`, `/api`, `/preview`,
  `/account` and lists the sitemap.
- **Sitemap** (`src/app/sitemap.ts`): rendered per request (the build has no database): home and
  listings per locale, plus published, visible, non-`noindex`, self-canonical pages, services and
  courses with reciprocal alternates.
- **Structured data**: one `application/ld+json` graph per page (non-executable data block, `<`
  escaped, CSP nonce): WebSite always; Organization only when site-settings `companyName` is
  verified (address only when `addressEvidence` is verified); BreadcrumbList; FAQPage from visible
  FAQ blocks; Service; Course (provider = the course's own provider text). Nothing unverified is
  emitted (FR-016, FR-063).
- **Redirects** (`src/modules/seo/redirects/`): `from`/`to` normalised (percent-decoded, NFC, no
  trailing slash, no query); targets internal only, because no external allow-list has been
  approved; no self-redirects, chains or loops (checked on create and update); author recorded;
  every change audited. Next's automatic trailing-slash redirect is disabled
  (`skipTrailingSlashRedirect`): the proxy follows a stored redirect for either spelling in one
  hop, otherwise drops the slash with a 308. Measured: `/x/` and `/x` with a stored redirect →
  one 308 to the target (`tests/security/redirects.spec.ts`).
- **Not decided here**: the legacy redirect map (CD-12, `docs/content/legacy-redirect-map.md`),
  the Arabic route vocabulary (CD-13), an external-target allow-list (none requested), the
  social preview image for pages without their own (site-level default image needs a public-use
  rule for globals).
