# Dependency Licences

Recorded for constitution I (licences verified when introduced). Source: `pnpm licenses list`
on 2026-10-16 after `pnpm install` (lockfile `pnpm-lock.yaml`). 640 packages in the resolved tree.

## Direct dependencies

| Package                      | Version | Licence    |
| ---------------------------- | ------- | ---------- |
| @axe-core/playwright         | 4.14.0  | MPL-2.0    |
| @eslint/js                   | 9.39.5  | MIT        |
| @payloadcms/db-postgres      | 3.91.0  | MIT        |
| @payloadcms/next             | 3.91.0  | MIT        |
| @payloadcms/richtext-lexical | 3.91.0  | MIT        |
| @payloadcms/translations     | 3.91.0  | MIT        |
| @payloadcms/ui               | 3.91.0  | MIT        |
| @playwright/test             | 1.64.1  | Apache-2.0 |
| @types/node                  | 22.20.5 | MIT        |
| @types/nodemailer            | 8.0.2   | MIT        |
| @types/pg                    | 8.23.1  | MIT        |
| @types/react                 | 19.2.18 | MIT        |
| @types/react-dom             | 19.2.7  | MIT        |
| eslint                       | 9.39.5  | MIT        |
| eslint-config-next           | 16.3.3  | MIT        |
| graphql                      | 16.14.2 | MIT        |
| next                         | 16.3.8  | MIT        |
| nodemailer                   | 10.1.1  | MIT-0      |
| payload                      | 3.91.0  | MIT        |
| pg                           | 8.20.0  | MIT        |
| pino                         | 10.4.0  | MIT        |
| prettier                     | 3.9.10  | MIT        |
| react                        | 19.2.6  | MIT        |
| react-dom                    | 19.2.6  | MIT        |
| sharp                        | 0.35.5  | Apache-2.0 |
| tsx                          | 4.23.15 | MIT        |
| typescript                   | 5.9.3   | Apache-2.0 |
| typescript-eslint            | 8.71.2  | MIT        |
| vite                         | 7.3.7   | MIT        |
| vitest                       | 5.0.5   | MIT        |
| zod                          | 4.6.7   | MIT        |

## Licence distribution (full tree)

| Licence                 | Packages |
| ----------------------- | -------- |
| MIT                     | 560      |
| Apache-2.0              | 27       |
| ISC                     | 19       |
| BSD-3-Clause            | 13       |
| BSD-2-Clause            | 8        |
| BlueOak-1.0.0           | 2        |
| LGPL-3.0-or-later       | 1        |
| Python-2.0              | 1        |
| MPL-2.0                 | 1        |
| CC-BY-4.0               | 1        |
| (MPL-2.0 OR Apache-2.0) | 1        |
| CC0-1.0                 | 1        |
| MIT-0                   | 1        |
| WTFPL OR ISC            | 1        |
| WTFPL                   | 1        |
| 0BSD                    | 1        |
| (WTFPL OR MIT)          | 1        |

## Licences needing a note

- **LGPL-3.0-or-later**: `@img/sharp-libvips-darwin-arm64` (platform-specific prebuilt libvips used by `sharp`). It is dynamically linked and unmodified, and is used under LGPL terms. The Linux build used in containers resolves to the equivalent `@img/sharp-libvips-linux-*` package with the same licence.
- **(MPL-2.0 OR Apache-2.0)**: `dompurify` (via Payload). Used under Apache-2.0.
- **WTFPL / (WTFPL OR ISC) / (WTFPL OR MIT)**: `truncate-utf8-bytes`, `sanitize-filename`, `utf8-byte-length` (Payload transitive). Permissive.
- **MPL-2.0**: `axe-core` (via `@axe-core/playwright`, devDependency, accessibility testing only; not shipped).
- **Python-2.0, CC-BY-4.0, BlueOak-1.0.0, CC0-1.0, 0BSD, MIT-0**: permissive or attribution-only transitive tooling and data packages.

No GPL/AGPL licence in the resolved tree. Re-run this check whenever dependencies change (Constitution I).
