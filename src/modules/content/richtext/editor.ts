// Shared Lexical configuration (T081, FR-013a). The editor offers only the allow-listed features;
// this is UX, not the control (the policy hooks are).
import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'
import { classifyUrl } from './policy'

export const INTERNAL_LINK_COLLECTIONS = ['pages', 'services', 'courses'] as const

export const safeEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    LinkFeature({
      enabledCollections: [...INTERNAL_LINK_COLLECTIONS],
      disableAutoLinks: true,
      fields: ({ defaultFields }) =>
        defaultFields.map((f) =>
          'name' in f && f.name === 'url'
            ? {
                ...f,
                validate: (value: unknown, args: { siblingData?: { linkType?: string } }) => {
                  if (args?.siblingData?.linkType === 'internal') return true
                  const v = classifyUrl(value)
                  return v.ok ? true : 'Use an https://, mailto:, tel:, /path or #anchor link.'
                },
              }
            : f,
        ) as never,
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
