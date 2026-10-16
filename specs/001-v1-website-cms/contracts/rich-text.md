# Contract: Rich-Text Content Policy (v1)

This contract implements FR-013 to FR-014 and SC-018. The single source of truth is
`modules/content/richtext/policy.ts` (a pure function, versioned with `POLICY_VERSION`). Both the
write-time check `assertSafeRichText()` and the render-time renderer (`safeHref()` and the node
allow-list) use it. Evidence and rationale: [research.md](../research.md) § D-22.

## Allowed structure (Lexical JSON)

| Node `type` | Allowed attributes | Notes |
|---|---|---|
| `root` | `children`, `direction`, `format`, `indent`, `type`, `version` | exactly one |
| `paragraph` | + `textFormat`, `textStyle` (must be `''`) | |
| `heading` | + `tag` ∈ {h2, h3, h4} | h1 is reserved for the page title |
| `list` | + `listType` ∈ {bullet, number}, `start` (int ≥1), `tag` ∈ {ul, ol} | |
| `listitem` | + `value` (int) | nested lists to depth 3 |
| `quote` | common | |
| `text` | `text`, `format` (bitmask: bold=1, italic=2 only), `style` (must be `''`), `mode` ∈ {normal}, `detail` (0) | |
| `linebreak` | `type`, `version` | |
| `link`, `autolink` | `fields` = {`linkType` ∈ {custom, internal}, `url`?, `doc`?, `newTab` (bool)} | `doc.relationTo` ∈ {pages, services, courses} |

Common attributes: `type`, `version`, `children`, `direction` ∈ {ltr, rtl, null}, `format` ∈ {'',
start, end, center}, `indent` 0–3. **Any other node type, attribute key, mark bit or value is
rejected.**

## URL rules (custom links)

1. Reject if the length is over 2,048, or the value contains any control character, whitespace or
   backslash. This check runs before any normalisation.
2. Allowed: `https://` absolute URLs; `http://` only for hosts on `ALLOWED_HTTP_HOSTS` (empty by
   default); `mailto:` with one valid address; `tel:` with `+` and digits; site-relative paths
   starting with a single `/`; fragment-only `#id`.
3. Rejected: `javascript:`, `vbscript:`, `data:`, `file:`, `ftp:`, `blob:`, `about:`,
   protocol-relative `//host`, any other scheme, and anything `new URL()` cannot parse.
4. The scheme is checked case-insensitively on the parsed URL, never with a string prefix test.

## Limits

Depth ≤10; total nodes ≤5,000; text per node ≤10,000 characters; ≥1 non-whitespace character of
link text per link.

## Enforcement points

| Path | Mechanism | Outcome on violation |
|---|---|---|
| Admin form | richText field `validate` + LinkFeature `url` validate | inline error; save blocked |
| Create / update / draft / autosave / duplicate (REST, Local API) | richText field `hooks.beforeChange` → `assertSafeRichText` | `ValidationError` (400); nothing stored |
| Version restore | the same hook (restore runs `beforeChange`; **verified by a test**) | restore rejected |
| Seed, import and migration scripts | must use the Local API (hooks run); direct SQL writes are forbidden by runbook | — |
| Stored content written outside hooks | `pnpm scan:richtext` reports violations; required in restore and migration runbooks | report, exit code ≠ 0 |
| Public site + preview | safe renderer: unknown node → nothing; unsafe URL → plain text; `rel="noopener noreferrer"` on `newTab` | never emits an unsafe `href` |

## Error contract

A violation returns a field-level validation error naming the path (e.g.
`sections.2.content.root.children.4.fields.url`) and a code from: `node_type`, `attribute`,
`format`, `style`, `url_scheme`, `url_malformed`, `limit`, `link_text`. It never echoes the raw
URL back.
