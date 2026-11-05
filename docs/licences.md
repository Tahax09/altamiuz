# Dependency Licences

Recorded for constitution I (licences verified when introduced). Source: `pnpm licenses list`
on 2026-10-16 after `pnpm install` (lockfile `pnpm-lock.yaml`). 640 packages in the resolved tree.

## Direct dependencies

| Package                      | Version | Licence    |
| ---------------------------- | ------- | ---------- |
| @axe-core/playwright         | 4.14.0  | MPL-2.0    |
| @lhci/cli                    | 0.15.1  | Apache-2.0 |
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

`@lhci/cli` (devDependency, T139, owner-approved 2026-11-04; Lighthouse 12.6.1) was added 2026-11-04;
the re-scan of the full tree (857 packages) found no new copyleft licence.

No GPL/AGPL licence in the resolved tree. Re-run this check whenever dependencies change (Constitution I).

## Fonts (T101, D-24)

Served from this origin through `next/font/google` (`src/ui/fonts.ts`): the build downloads the
files from Google Fonts and Next serves them unchanged from `/_next/static/media/`. Verified
2026-11-04 against the exact files of the production build:

| Family               | Weights used        | Font version (name table) | Copyright in the font files (nameID 0)                                              | Licence URL in the font files (nameID 14) | Licence                                |
| -------------------- | ------------------- | ------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------- |
| Inter                | 400, 600 (variable) | 4.001                     | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)            | https://openfontlicense.org               | SIL OFL 1.1                            |
| Manrope              | 600, 700 (variable) | 4.505                     | Copyright 2019 The Manrope Project Authors (https://github.com/googlefonts/manrope) | https://openfontlicense.org               | SIL OFL 1.1                            |
| IBM Plex Sans Arabic | 400, 700            | 1.101                     | Copyright 2019 IBM Corp. All rights reserved.                                       | http://scripts.sil.org/OFL                | SIL OFL 1.1, Reserved Font Name "Plex" |

- **Unmodified**: all 21 `.woff2` files referenced by the build are byte-identical (SHA-256) to the
  files Google Fonts served for the same request on 2026-11-04. The copyright strings above match
  the `copyright` fields of the Google Fonts catalogue (`google/fonts`, `ofl/*/METADATA.pb`, licence
  `OFL`). The subset files carry no licence description (nameID 13); the licence URL is present.
- **Licence texts**: `public/fonts/LICENSES/{Inter,Manrope,IBMPlexSansArabic}-OFL.txt`, copied
  byte-for-byte from `google/fonts` (`ofl/inter/OFL.txt` at b0928647, `ofl/manrope/OFL.txt` at
  16c2976c, `ofl/ibmplexsansarabic/OFL.txt` at 121e596e), served at `/fonts/LICENSES/…`. Their
  copyright header years (Inter 2020, Manrope 2018, IBM Plex 2017) differ from the years embedded
  in the font files; both are upstream records and neither was edited.
- **Reserved Font Name "Plex"**: OFL 1.1 forbids using it for a Modified Version. The files are
  served exactly as Google Fonts distributes them (no subsetting or conversion here). Any future
  self-processing (subsetting, conversion) of IBM Plex Sans Arabic must not keep the name "Plex".
- `tests/public/fonts.spec.ts` re-checks on every run that each served font names its OFL licence
  and the expected copyright, and that the licence files are served unchanged.
