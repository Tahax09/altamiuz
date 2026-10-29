# Numeral and formatting convention (FR-006)

Status: **proposed** in WS10 (2026-10-17). Needs owner review together with the Arabic UI strings
and CD-13. The engineering default is chosen so it can be changed in one place
(`src/modules/i18n/messages/index.ts`).

| Locale         | Intl locale                  | Digits                                     | Calendar  | Time zone        |
| -------------- | ---------------------------- | ------------------------------------------ | --------- | ---------------- |
| Arabic (`ar`)  | `ar-LY-u-nu-latn-ca-gregory` | Western (0–9), the usual practice in Libya | Gregorian | `Africa/Tripoli` |
| English (`en`) | `en-GB`                      | Western (0–9)                              | Gregorian | `Africa/Tripoli` |

Rules:

- Percentages, numbers with symbols and phone numbers are rendered inside a left-to-right
  isolate (`<bdi dir="ltr">`). The R-B specimen showed "95%" rendering as "%95" in an RTL run.
- Arabic uses ICU's `ar-LY` separators: `1.234,5` (grouping `.`, decimal `,`). English uses
  `1,234.5`.
- Phone numbers are stored in E.164. Libyan numbers display as `+218 XX XXX XXXX`.
- Editor-entered text is shown as entered; digits inside rich text are not converted.

The alternative is Arabic-Indic digits (٠–٩) for Arabic: change `nu-latn` to `nu-arab`.
