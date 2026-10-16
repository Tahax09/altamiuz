// richTextField(): every rich-text field in the CMS (T082, FR-013b). The beforeChange hook runs on
// create, update, draft, autosave, duplicate, copy-to-locale and version restore; `validate` gives
// editors inline errors. The collection-level verifyStoredContent re-checks all locales.
import type { RichTextField } from 'payload'
import { APIError } from 'payload'
import { safeEditor } from './editor'
import { checkRichText, RichTextPolicyError } from './policy'

export const RICH_TEXT_HELP =
  'Formatting: headings, bold, italic, lists, quotes and links. To leave the editor with the keyboard, press Escape, then Tab.'

export function richTextField(
  name: string,
  opts: { label?: string; required?: boolean; localized?: boolean } = {},
): RichTextField {
  return {
    name,
    type: 'richText',
    label: opts.label,
    localized: opts.localized ?? true,
    required: opts.required,
    editor: safeEditor,
    admin: { description: RICH_TEXT_HELP },
    validate: (value: unknown) => {
      const issues = checkRichText(value)
      return issues.length
        ? `Content rejected (${[...new Set(issues.map((i) => i.code))].join(', ')}).`
        : true
    },
    hooks: {
      beforeChange: [
        ({ value }) => {
          const issues = checkRichText(value)
          if (issues.length) {
            const err = new RichTextPolicyError(issues)
            throw new APIError(err.message, 400, { issues }, true)
          }
          return value
        },
      ],
    },
  }
}
