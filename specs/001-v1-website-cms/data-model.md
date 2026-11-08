# Data Model: Altamiuz v1 Website and CMS

**Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

The data model is Payload collections and globals on PostgreSQL. `L` marks a localized field
(`ar` and `en`). Every collection gets Payload's `id`, `createdAt` and `updatedAt`. Access columns
refer to the permission matrix in [contracts/access-matrix.md](./contracts/access-matrix.md). No
collection grants anonymous REST access except `media` file delivery of published-use assets
(D-3).

## Shared groups

- **seo** (`L`): `title` (≤60, required to publish), `description` (≤160, required to publish),
  `ogImage` → media, `noindex` (bool), `canonicalOverride` (internal path only).
- **evidence**: `status` (`unverified` | `verified`, default `unverified`), `reference` (text,
  required if verified), `verifiedBy` → users, `verifiedAt` (date). If any claim-bearing field
  carries `status ≠ verified`, the parent cannot be published (FR-016).
- **link**: `type` (`internal` | `external` | `email` | `tel`), `page` / `service` / `course` →
  relationship (internal), `url` (external: `https:` only, or an allow-listed `http:` host),
  `email`, `tel`, `label` (`L`), `newTab` (external only). Every `url`/`email`/`tel` is validated with the rich-text URL policy (`safeHref`, contracts/rich-text.md) on save and re-checked at render (FR-014).

## Collections

### users (auth)
| Field | Rules |
|---|---|
| email | unique, normalised lower-case |
| name | required |
| role | `owner` / `administrator` / `publisher` / `editor`; editable only by a strictly higher role, or by an owner on an owner (D-8) |
| status | `invited` / `active` / `suspended` |
| MFA material | **not on users** (WS8): `user_mfa` (AES-256-GCM secret, `last_used_step` replay guard) and `mfa_recovery_codes` (salted scrypt, atomic `used_at`), reachable by no Payload API |
| lockout | per-account limiter (`login:account`, A-8); Payload `maxLoginAttempts` disabled (ADR-005) |

- Status transitions: `invited → active` (password and MFA enrolment done), `active ↔ suspended`.
  Suspension revokes every session.
- Invariant: at least one `owner` with status `active` exists.

### sessions (ADR-005: Payload built-in sessions + project `auth_sessions` state)
`user` → users, `createdAt`, `lastSeenAt`, `expiresAt` (absolute), `mfaVerified` (bool),
`ip`, `userAgent`, `revokedAt`, `revokedBy`. Hidden from the API; listed through a custom
endpoint for the owner of the session and for administrators.

### invitations
`email`, `role`, `tokenHash`, `expiresAt` (72 h), `usedAt`, `invitedBy`. Single use. Creating one
needs `users:manage`. Owners may invite any role, including owner; every other inviter only roles strictly below their own (matches contracts/access-matrix.md).

### pages (drafts + versions)
| Field | Rules |
|---|---|
| title `L` | required to publish locale |
| slug `L` | unique per locale and route scope; NFC; `^[\p{L}\p{N}-]+$`u; must not equal or prefix a static route-map segment of that locale or an active redirect `from` (D-5); auto-redirect on change |
| template | `default` / `home` / `legal` |
| sections | blocks (see Block library), each with `hidden` (bool) |
| seo `L` | group above |
| publishedLocales | only if D-4 falls back |

Versions are kept per A-11 (R-E). Document locking is on (FR-015, verified in R-A).

### services / courses (drafts + versions)
Common fields: `title` `L`, `slug` `L`, `summary` `L` (≤300), `sections` (blocks), `order` (int),
`hidden`, `seo` `L`.

Course-only fields:
- `audience` `L`
- `duration` `{ value, unit }`
- `deliveryFormat` (`in-person` / `online` / `hybrid`)
- `provider` `L`
- `accreditationStatement` `L` with **evidence** (claim-bearing)

Listings are derived by querying published, non-hidden items in the locale, ordered by `order`.

### media (upload)
| Field | Rules |
|---|---|
| filename | random 128-bit id + extension (D-12) |
| mimeType | from magic bytes; allow-list jpeg/png/webp/avif |
| alt `L` | required unless `decorative` |
| decorative | bool |
| focalX, focalY | Payload focal point |
| sizes | generated variants (D-12) |
| usage | virtual: reverse references for the "used in" panel (FR-057) |

Read access: public only when referenced by at least one published document; otherwise
authenticated readers only (FR-056).

### redirects
`from` (normalised path, unique), `to` (`link`), `type` (301/302), `source` (`manual` /
`slug-change` / `legacy`), `createdBy`. Saves are rejected for a loop, a chain, a self-redirect,
or a non-allow-listed external target (FR-064).

### enquiries
| Field | Rules |
|---|---|
| name | ≤100 |
| email | valid email ≤254 |
| phone | optional, E.164-ish ≤20 |
| organization | optional ≤150 |
| topic | select from configured topics, or a service relationship |
| message | ≤5000 plain text |
| consent | must be true |
| locale | `ar` / `en` |
| delivery | `{ status: pending/sent/failed, attempts, lastError(code only), sentAt }` |
| deleteAfter | `createdAt + 12 months` |

- Access: create through the public submission service only (no REST create). Read, export and
  delete are owner and administrator only, and every read or export is audited.
- Excluded from logs and analytics (FR-078).

### audit-events (append-only)
`actor` (user id or `system` / `anonymous`), `action` (enum, FR-045), `targetType`, `targetId`,
`outcome` (`success` / `denied` / `failure`), `ip`, `userAgent` (truncated), `meta` (JSON, schema
per action, no secrets or content), `at`.

- No API write access. A database trigger blocks UPDATE and DELETE except the retention function
  (24 months, A-9).
- Indexes: `(at)`, `(actor, at)`, `(action, at)`, `(targetType, targetId)`.

### rate-limit-buckets *(Postgres limiter adapter)*
`key` (hashed source + scope), `windowStart`, `count`. TTL cleanup job.

### payload-jobs (Payload-managed)
Tasks: `sendEnquiryEmail`, `purgeExpiredEnquiries`, `purgeAuditEvents`, `pruneVersions`,
`purgeRateLimitBuckets`.

## Globals (drafts + versions)

- **site-settings**:
  - Company name `L` with evidence, address `L` with evidence, phone, email, hours `L`.
  - Social links (`link` array).
  - Default SEO (`L`), default `ogImage`.
  - Legal page links.
  - `enquiryRecipients` (emails, admin only).
  - `enquiryTopics` `L`.
  - `analytics.enabled` (read-only mirror of config).
- **header-nav / footer-nav**: an `items` array of `{ link, children[] (one level) }`. Unpublished
  targets are flagged on save.
- **banner**: `enabled`, `message` `L` (plain), `link`, `startsAt`, `endsAt`, `dismissKey`
  (changes when the content changes).

## Rich-text fields

Every `richText` field (richText block `content`, FAQ `answer`, and service and course body
sections) uses one shared editor configuration and the policy in
[contracts/rich-text.md](./contracts/rich-text.md):

- Feature-limited Lexical editor.
- `beforeChange` hook and `validate` both enforce the allow-list.
- Drafts are validated (`versions.drafts.validate: true`).

Inline images, uploads, embeds, HTML and code nodes are not allowed.

## Block library (section types)

Every block has `hidden` (bool) and `anchorId` (optional, slug-safe).

| Block | Fields | Claim-bearing |
|---|---|---|
| hero | eyebrow `L`, heading `L`, subheading `L`, media, primaryCta/secondaryCta (`link`) | no |
| richText | content `L` (Lexical allow-list) | no |
| textMedia | eyebrow `L`, heading `L`, body `L` (rich text), media, mediaPosition (`end`/`start`), link (company introduction, expertise) | no |
| process | eyebrow `L`, heading `L`, intro `L`, media (optional illustration), steps[] `{ title L, text L }` (ordered; homepage approach) | no |
| standards | eyebrow `L`, heading `L`, intro `L`, items[] `{ name L, text L, logo media }` (frameworks followed; certifications held go in `credentials`) | no |
| resourceList | eyebrow `L`, heading `L`, intro `L`, items[] `{ kind L, title L, summary L, link }`, moreLink (insights and resources) | no |
| featureGrid | eyebrow `L`, heading `L`, intro `L`, items[] `{ icon (enum), title L, text L }` | no |
| serviceList | eyebrow `L`, heading `L`, intro `L`, moreLink, mode (`all` / `selected`), services[] → services | no |
| courseList | eyebrow `L`, heading `L`, intro `L`, moreLink, mode, courses[] → courses | no |
| cta | heading `L`, text `L`, link | no |
| faq | items[] `{ question L, answer L (rich text) }` → FAQPage JSON-LD | no |
| mediaGallery | eyebrow `L`, heading `L`, intro `L`, items[] `{ media, caption L }` (ordered) | no |
| stats | eyebrow `L`, heading `L`, intro `L`, items[] `{ value, label L }` + evidence (header fields are part of the verified claim) | **yes** |
| credentials | eyebrow `L`, heading `L`, intro `L`, display (`cards`/`logos`: certifications, registrations, partnerships), items[] `{ name L, issuer L, logo media, validUntil }` + evidence (header fields and display are part of the verified claim) | **yes** |
| testimonials / clientLogos | deferred: blocked until CD-08 permissions exist | **yes** |
| contactBlock | heading `L`, intro `L` (renders the enquiry form) | no |

## State transitions (pages, services, courses, globals)

```text
draft ──publish(locale) [publisher+, required fields L complete, evidence verified for the
        stored draft AND the resulting published version, every language (A-8)]──▶ published
published ──edit──▶ published + newer draft
published ──unpublish(locale) [publisher+]──▶ draft
any revision ──restore [publisher+]──▶ new draft (history unchanged)
```

Every publish, unpublish and restore writes an audit event and triggers revalidation of the
affected paths, listings, sitemap and navigation.
