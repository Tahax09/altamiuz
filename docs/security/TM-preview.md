# Threat Model: Draft Preview (FR-022, T094)

Scope: `/preview/{pages|services|courses}/{id}?locale=ar|en` (`src/app/(preview)/`), the admin
"Preview" link, and every other path that might expose unpublished content: REST, GraphQL, caches
and shared links. Evidence is in `tests/security/content-http.spec.ts` (HTTP, production build)
and `tests/integration/content/{publish,access}.test.ts`.

| Threat                                                           | Mitigation                                                                                                                                                                                                                                            | Evidence                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Anonymous or password-only (MFA-pending) user views a draft      | Preview resolves the session with `payload.auth` and requires `mayDo(read)`, which needs an MFA-verified role. Anything else gets `notFound()`, so existence is not confirmed                                                                         | `content-http.spec.ts` T077                                  |
| Preview of a non-content collection or a malformed id            | Collection allow-list (`pages`, `services`, `courses`); id must match `^[0-9]{1,12}$`; → 404                                                                                                                                                          | T077                                                         |
| Shareable or guessable preview links                             | None exist: no token, secret or Next draft-mode endpoint. Query parameters such as `token` and `secret` are ignored                                                                                                                                   | "no shareable preview link exists"                           |
| Draft cached by a shared cache or CDN                            | Proxy sets `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow` on `/preview/*`; route is `force-dynamic`                                                                                                                         | T077                                                         |
| Draft indexed by search engines                                  | `noindex, nofollow` header and robots meta on the preview layout                                                                                                                                                                                      | T077                                                         |
| Draft leaks through REST/GraphQL                                 | Anonymous REST is denied for content collections and their versions, even published documents. Public reads go only through the Local API with `context.publicSite`, which returns `_status: published` for the requested locale. GraphQL is disabled | `access.test.ts`, `content-http.spec.ts`                     |
| `publicSite` context forged from a request                       | Context is set only by server code; query strings cannot set it. A request carrying a user is never widened to drafts                                                                                                                                 | `access.test.ts`, `publish.test.ts`                          |
| Locale confusion (draft Arabic shown under English, or fallback) | Preview uses `fallbackLocale: false`. Per-locale `_status` (ADR-006) keeps an unpublished locale out of public reads                                                                                                                                  | T077 (Arabic preview has no English text), `publish.test.ts` |
| Stored XSS through preview                                       | Preview renders with the same allow-list renderer as the public site (T073: identical markup); unsafe URLs become text                                                                                                                                | T073, `render.test.ts`                                       |
| Preview differs from what will be published                      | One renderer (`DocumentView`) for both                                                                                                                                                                                                                | T073                                                         |

Residual risks:

- An MFA-verified user with read permission can see every draft. This is intended: the access
  matrix gives every CMS role read access.
- The public route (US1) must use `context.publicSite` and the same renderer. Its own tests in
  US1 are still pending.
- `Cache-Control` on preview is set by our proxy. A future CDN must honour `private, no-store`.
  Verify this when hosting is decided.
