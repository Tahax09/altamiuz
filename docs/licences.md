# Dependency Licences

Recorded for constitution I (licences verified when introduced). Source: `pnpm licenses list`
on 2026-10-16 after `pnpm install` (lockfile `pnpm-lock.yaml`). 640 packages in the resolved tree.
W-1 (2026-11-11, ADR-011) added `tailwindcss`, `@tailwindcss/postcss`, `motion` (with
`framer-motion`, `motion-dom`, `motion-utils`, MIT), `clsx`, `tailwind-merge` and
`class-variance-authority`; none runs an install script (`@tailwindcss/oxide` ships prebuilt
platform binaries as optional dependencies).

## Direct dependencies

| Package                      | Version | Licence      |
| ---------------------------- | ------- | ------------ |
| @axe-core/playwright         | 4.14.0  | MPL-2.0      |
| @eslint/js                   | 9.39.5  | MIT          |
| @lhci/cli                    | 0.16.0  | Apache-2.0   |
| @payloadcms/db-postgres      | 3.92.1  | MIT          |
| @payloadcms/next             | 3.92.1  | MIT          |
| @payloadcms/richtext-lexical | 3.92.1  | MIT          |
| @payloadcms/translations     | 3.92.1  | MIT          |
| @payloadcms/ui               | 3.92.1  | MIT          |
| @playwright/test             | 1.64.1  | Apache-2.0   |
| @simplewebauthn/browser      | 14.0.0  | MIT          |
| @simplewebauthn/server       | 14.0.3  | MIT          |
| @tailwindcss/postcss         | 4.3.3   | MIT          |
| @types/node                  | 22.20.5 | MIT          |
| @types/nodemailer            | 8.0.2   | MIT          |
| @types/pg                    | 8.23.1  | MIT          |
| @types/qrcode                | 1.5.5   | MIT          |
| @types/react                 | 19.2.18 | MIT          |
| @types/react-dom             | 19.2.7  | MIT          |
| class-variance-authority     | 0.7.1   | Apache-2.0   |
| clsx                         | 2.1.1   | MIT          |
| eslint                       | 9.39.5  | MIT          |
| eslint-config-next           | 16.4.5  | MIT          |
| graphql                      | 16.14.2 | MIT          |
| maplibre-gl                  | 6.16.0  | BSD-3-Clause |
| motion                       | 14.5.0  | MIT          |
| next                         | 16.4.5  | MIT          |
| nodemailer                   | 10.1.7  | MIT-0        |
| payload                      | 3.92.1  | MIT          |
| pg                           | 8.20.0  | MIT          |
| pino                         | 10.4.0  | MIT          |
| prettier                     | 3.9.10  | MIT          |
| qrcode                       | 1.5.4   | MIT          |
| react                        | 19.2.6  | MIT          |
| react-dom                    | 19.2.6  | MIT          |
| sharp                        | 0.35.5  | Apache-2.0   |
| tailwind-merge               | 3.7.0   | MIT          |
| tailwindcss                  | 4.3.3   | MIT          |
| tsx                          | 4.23.15 | MIT          |
| typescript                   | 5.9.3   | Apache-2.0   |
| typescript-eslint            | 8.71.2  | MIT          |
| vite                         | 7.3.7   | MIT          |
| vitest                       | 5.0.5   | MIT          |
| zod                          | 4.6.7   | MIT          |

## Licence distribution (full tree)

`pnpm licenses list`, 2026-11-05 (after the dependency advisory remediation): 864 packages.

| Licence                 | Packages |
| ----------------------- | -------- |
| MIT                     | 731      |
| Apache-2.0              | 44       |
| ISC                     | 36       |
| BSD-3-Clause            | 18       |
| BSD-2-Clause            | 13       |
| BlueOak-1.0.0           | 7        |
| MPL-2.0                 | 2        |
| LGPL-3.0-or-later       | 1        |
| Python-2.0              | 1        |
| PSF-2.0                 | 1        |
| CC-BY-4.0               | 1        |
| (MPL-2.0 OR Apache-2.0) | 1        |
| CC0-1.0                 | 1        |
| MIT-0                   | 1        |
| WTFPL OR ISC            | 1        |
| FSL-1.1-Apache-2.0      | 1        |
| WTFPL                   | 1        |
| 0BSD                    | 1        |
| (MIT OR CC0-1.0)        | 1        |
| (WTFPL OR MIT)          | 1        |

2026-11-14 (ADR-012, owner decision): new runtime dependencies `qrcode` 1.5.4 (MFA enrolment QR
code, drawn as inline SVG; MIT; pulls `dijkstrajs`, `pngjs`, `yargs` 15 tree, all MIT/ISC) and
`@simplewebauthn/server` 14.0.3 / `@simplewebauthn/browser` 14.0.0 (passkeys; MIT; pulls the
`@peculiar/*` ASN.1/X.509 packages (MIT), `asn1js` (BSD-3-Clause), `reflect-metadata`
(Apache-2.0), `tslib` (0BSD), `tsyringe` (MIT)). No install scripts. Versions chosen at least two
weeks old (`@simplewebauthn/server` 14.1.0, published 2026-11-06, skipped). Override
`get-uri>basic-ftp` 6.2.6 (dev-only, via `@lhci/cli`) fixes GHSA-5pm8-86m8-9m6r and
GHSA-r4jh-29pc-gfqr; 6.0.0's only breaking change (separate transfer hosts refused by default) does
not affect `get-uri`'s calls. Totals after the change: 908 packages (462 production); no new
licence family; the LGPL-3.0-or-later (libvips via `sharp`) and FSL entries are unchanged.

## Licences needing a note

- **LGPL-3.0-or-later**: `@img/sharp-libvips-darwin-arm64` (platform-specific prebuilt libvips used by `sharp`). It is dynamically linked and unmodified, and is used under LGPL terms. The Linux build used in containers resolves to the equivalent `@img/sharp-libvips-linux-*` package with the same licence.
- **(MPL-2.0 OR Apache-2.0)**: `dompurify` (via Payload). Used under Apache-2.0.
- **WTFPL / (WTFPL OR ISC) / (WTFPL OR MIT)**: `truncate-utf8-bytes`, `sanitize-filename`, `utf8-byte-length` (Payload transitive). Permissive.
- **MPL-2.0**: `axe-core` (via `@axe-core/playwright`, devDependency, accessibility testing only; not shipped).
- **FSL-1.1-Apache-2.0** (source-available, not OSI open source): `sentry` 0.45.0, Sentry's CLI.
  **Owner approval: approved 2026-11-06, limited to local development tooling** (Lighthouse CI
  run by `pnpm perf:lighthouse`; never shipped, deployed or offered to others). Any other use
  needs a new owner decision. Recorded 2026-11-05 with the `@lhci/cli` 0.16.0 security upgrade
  (`dcca936`).
  - Path (devDependency, not shipped): `sentry` ← `@sentry/bundler-plugins` 11.11.0 ← `@sentry/node`
    11.11.0 ← `lighthouse` 13.6.0 ← `@lhci/cli` 0.16.0. No install scripts; its `bin` is not invoked by
    any project script.
  - Terms (from the package's `LICENSE.md`): use is permitted for any purpose other than a
    "Competing Use" (making the software available in a commercial product or service that
    substitutes for it or for a Sentry offering); internal use is a named permitted purpose. Each
    release becomes Apache-2.0 on the second anniversary of its publication. Running Lighthouse CI
    locally appears to be internal use; this is an engineering reading, not legal advice.
  - Telemetry (corrected 2026-11-06): `lhci autorun` does not pass `--enable-error-reporting`, but
    Lighthouse does not default to off. With the flag unset it uses the answer cached in
    `~/.config/configstore/lighthouse.json`, or asks on an interactive terminal; it assumes "no"
    only without a TTY or when `CI` is set. A developer who once answered "yes" would send
    Lighthouse runtime errors to Sentry. On the machine that ran the 2026-11-05 checks the cached
    value is `false`. Since 2026-11-06 `tests/perf/lighthouserc.cjs` sets
    `enableErrorReporting: false`; lhci passes it to Lighthouse as a `--cli-flags-path` file, and
    Lighthouse's own flag parser was checked to read it as `false` (unset, it is `undefined` and
    falls back to the cached answer).

- **PSF-2.0, (MIT OR CC0-1.0)**: `argparse` 3, `type-fest` (dev tooling transitive). Permissive.
- **Python-2.0, CC-BY-4.0, BlueOak-1.0.0, CC0-1.0, 0BSD, MIT-0**: permissive or attribution-only transitive tooling and data packages.

`@lhci/cli` (devDependency, T139, owner-approved 2026-11-04; Lighthouse 12.6.1) was added 2026-11-04;
the re-scan of the full tree (857 packages) found no new copyleft licence.

2026-11-05 dependency advisory remediation (`next` 16.4.5, Payload 3.92.1, `nodemailer` 10.1.7,
`@lhci/cli` 0.16.0 with Lighthouse 13.6.0, `happy-dom` 21.0.4): re-scan of 864 packages found no
copyleft licence beyond the LGPL libvips binary above; one source-available licence (FSL-1.1, dev
tooling only) is noted above; approved 2026-11-06 for local development tooling only.

2026-11-07 final supply-chain pass (T145): `pnpm licenses list` — 864 packages, identical
licence distribution to 2026-11-05; production tree (`--prod`) 403 packages with no FSL, GPL or
AGPL licence (only LGPL libvips, permissive and attribution licences). FSL-1.1 re-assessed:
`sentry` 0.45.0 is reached only via `@lhci/cli` → `@lhci/utils` → `@sentry/node` →
`@sentry/bundler-plugins` (devDependency) and is absent from the standalone build
(`.next/standalone/node_modules`), so the 2026-11-06 approval scope (local development tooling
only) still holds. The US8 tools `age`, the Postgres 17 client and the AWS CLI run only on CI
runners and are not distributed.

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

## Map data and worker (contact page, 2026-11-18)

- `maplibre-gl` 6.16.0 (BSD-3-Clause): loaded only when a visitor opens the contact-page map; its
  render worker is served unchanged from `public/vendor/maplibre-gl-worker-6.16.0.mjs` (kept equal
  to the installed file by `tests/unit/ui/office-map.test.ts`).
- Map style and tiles: OpenFreeMap (free, no key, commercial use allowed), data © OpenMapTiles and
  © OpenStreetMap contributors (ODbL); attribution shown on the map.
- Static preview image: OpenStreetMap standard tiles composited once on the server (`pnpm
map:static`), credited "© OpenStreetMap contributors".
