# Threat Model: Media Library (US4, T113)

Scope: the `media` upload collection (`src/modules/media/`), Payload's file route
`/api/media/file/:name`, media fields in content blocks (hero, gallery, credential logos) and their
public rendering (`src/ui/media/Picture.tsx`). Authentication, MFA and sessions: `TM-auth.md`;
content editing: `TM-admin.md`.

**Assets**: the server and its disk; visitors' and editors' browsers; image metadata (EXIF GPS,
owner names); unpublished images (drafts can reveal plans or people); the integrity of published
pages.

**Actors**: anonymous visitors; CMS users of every role (a compromised or careless Editor
included); a password-only session (second factor not completed).

**Trust boundary**: every byte of an upload, its declared type, its name and every client-supplied
field are untrusted. Only the re-encoded output of `prepareImage` is stored.

## Pipeline (D-12, A-7)

1. Proxy: `POST`/`PATCH /api/media[/:id]` multipart bodies over 20 MB + 64 KiB of multipart
   overhead are refused with 413; bodies without a declared length with 411
   (`src/modules/security/upload-limit.ts`). Payload's own parser limit (20 MB, `abortOnLimit`) is
   pinned in `payload.config.ts` as a second line.
2. `beforeOperation` hook (`validateUpload`) on create and update, before Payload writes anything:
   size; leading-byte sniff against JPEG, PNG, WebP, AVIF (`sniff.ts`); scan for markup or script
   signatures; header decode, where the decoded format must equal the sniffed one and
   width × height must be ≤ 40,000,000; full decode with `limitInputPixels` and `failOn: 'error'`;
   re-encode in the same format with metadata dropped (sharp's default; `withMetadata` is never
   called); re-sniff of the output; random 128-bit file name.
3. Payload writes the master and 15 variants (480/768/1024/1440/1920 × AVIF/WebP/JPEG, never
   upscaled) under `MEDIA_DIR` from the re-encoded bytes.

## Threats and mitigations

| Threat                                                                               | Mitigation                                                                                                                                                                                                                                                                                                                                           | Evidence                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Active content uploaded as an image (SVG with script, HTML, JPEG/HTML polyglot, PHP) | Allow-list by content, not by name or declared type; markup/script signature scan; every accepted file is re-encoded, so appended or embedded payloads are not carried over                                                                                                                                                                          | `tests/unit/media/validate.test.ts`, `tests/integration/media/upload.test.ts`, `tests/security/upload.spec.ts` (T107 fixtures) |
| MIME spoofing (PDF named `.jpg`, PNG declared `image/jpeg`)                          | Format comes from the bytes and must match what sharp decodes; the stored type and extension follow the detected format                                                                                                                                                                                                                              | same                                                                                                                           |
| Decompression bomb / pixel flood                                                     | Header-only dimension check before decoding (40 MP); `limitInputPixels` on the decode                                                                                                                                                                                                                                                                | 20,000 × 20,000 PNG and 41 MP fixtures                                                                                         |
| Oversized upload / memory exhaustion                                                 | 413 in the proxy before the body is parsed; parser limit 20 MB                                                                                                                                                                                                                                                                                       | `big.jpg` fixture (21 MB) over HTTP returns 413                                                                                |
| Truncated or corrupt files crash a decoder                                           | Full decode with `failOn: 'error'`; decoder errors become a fixed 400 message (no decoder detail echoed)                                                                                                                                                                                                                                             | `truncated.jpg` fixture                                                                                                        |
| Location and identity leak through metadata (EXIF GPS, artist, copyright, XMP)       | Re-encode without metadata; checked on the master and every variant                                                                                                                                                                                                                                                                                  | EXIF/GPS fixture: no EXIF/XMP, no marker strings in any stored file                                                            |
| Path traversal / overwrite through file names                                        | Multipart file name discarded; random 128-bit name; client `filename` with a path is refused by Payload (400); `url`, `mimeType`, `filesize`, `sizes` keys from the client are dropped; Payload's file route refuses `..` and resolves inside the static directory                                                                                   | `upload.test.ts` (names, path refusal, traversal on the file route)                                                            |
| Server-side request forgery through "paste from URL"                                 | `pasteURL: false`; a create must carry an uploaded file, so `data.url` is never fetched                                                                                                                                                                                                                                                              | `upload.test.ts` ("a create without a file…")                                                                                  |
| Guessable file addresses                                                             | 128-bit random names; variants derive from the same random stem                                                                                                                                                                                                                                                                                      | name pattern assertions                                                                                                        |
| Unpublished images retrievable by anonymous visitors (FR-056)                        | Anonymous read access only for media referenced by a published, visible (not hidden) section of a published page/service/course; applies to the file route (`isReadingStaticFile`) and to public population; anonymous REST reads of media documents are denied; files are `Cache-Control: private, no-cache` so no shared cache keeps a draft image | `upload.test.ts` (draft → published → unpublished; hidden section; anonymous REST), `upload.spec.ts`                           |
| Upload or deletion without permission                                                | Upload and edit: any MFA-verified CMS role; delete: Publisher and above (access matrix); password-only and anonymous sessions refused                                                                                                                                                                                                                | `upload.test.ts`, `upload.spec.ts`, `us4-media.spec.ts` (no delete action for Editors)                                         |
| Deletion without trace                                                               | `media.delete` audit event (actor, target, outcome)                                                                                                                                                                                                                                                                                                  | `upload.test.ts`, `upload.spec.ts`                                                                                             |
| Orphaned files (replace, delete, failed write, interrupted upload)                   | Payload removes the old master and variants on replace and delete; validation runs before anything is written; an interrupted request never reaches the hook; a storage failure fails the request without a document or stray files                                                                                                                  | `upload.test.ts` (replace, delete, unwritable directory), `upload.spec.ts` (client disconnect mid-body)                        |
| Replaced image keeps showing the old file on public pages                            | The media `afterChange` hook expires the cache tags of every published document that uses the image                                                                                                                                                                                                                                                  | `us4-media.spec.ts` (replace updates the published page)                                                                       |
| Prototype poisoning through upload JSON                                              | Same Payload write path as content (E-4)                                                                                                                                                                                                                                                                                                             | `tests/integration/security/prototype-keys.test.ts`                                                                            |
| Unsafe values in rendered markup                                                     | `Picture` renders only names matching the random-name pattern, numeric dimensions, alt as text; focal point as fixed CSS classes (no inline style under the public CSP)                                                                                                                                                                              | `tests/unit/media/picture.test.ts`                                                                                             |
| Inaccessible images (FR-054)                                                         | Publishing a locale is refused while a shown image lacks alt text in that locale and is not decorative; decorative images render `alt=""` and `aria-hidden`                                                                                                                                                                                          | `upload.test.ts`, `us4-media.spec.ts`, `picture.test.ts`                                                                       |

## Residual risks and open items

- **Antivirus scanning (ASVS V5.4.3)** is not done. Only raster images of four formats are
  accepted and every file is re-encoded, so a scanner would see only sharp's output. Recorded as a
  gap, not a claim.
- **Image decoders** (libvips, libjpeg-turbo, libpng, libwebp, libheif/aom in sharp 0.35.5) parse
  untrusted bytes in the server process. Mitigation: dependency scanning; decode limits.
- **Public set computation** scans all pages, services and courses (latest published versions) and
  is cached per process for at most 60 s; it is dropped on every content or media write in the
  same process. With several server instances, another instance can serve a newly unpublished
  image for up to 60 s. Fine for the current single-instance design; revisit with hosting (T132).
- **Object storage (`STORAGE_DRIVER=s3`)** is not implemented: the configuration refuses it with
  a clear error until the S3/R2 adapter dependency and the hosting decision (T132) are approved.
  Local disk only, which does not persist on serverless hosts (e.g. Vercel functions); a
  persistent adapter is required before such a deployment.
- **Admin Monaco from a CDN (F-1)** is unrelated to media but affects the same admin origin; see
  `dependency-exceptions.md` E-1.
