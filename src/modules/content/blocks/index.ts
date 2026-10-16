// Block library (T085, FR-011, FR-012, data-model). Deferred until their dependencies exist:
// mediaGallery and image fields (US4 media), testimonials/clientLogos (CD-08 permissions).
import type { Block, Field } from 'payload'
import { evidenceGroup } from '../evidence'
import { linkGroup } from '../link'
import { richTextField } from '../richtext/field'

const ANCHOR = /^[a-z0-9-]{1,64}$/
const REORDER_ROW_LABEL = '/modules/content/admin/ReorderControl#ReorderRowLabel'

const common: Field[] = [
  {
    name: 'hidden',
    type: 'checkbox',
    defaultValue: false,
    admin: { description: 'Hidden sections stay editable but are not published.' },
  },
  {
    name: 'anchorId',
    type: 'text',
    maxLength: 64,
    validate: (v: unknown) =>
      !v || ANCHOR.test(String(v)) || 'Use lower-case letters, digits and hyphens.',
  },
]
const text = (name: string, maxLength = 200, required = false): Field => ({
  name,
  type: 'text',
  localized: true,
  maxLength,
  required,
})
const textarea = (name: string, maxLength = 1000): Field => ({
  name,
  type: 'textarea',
  localized: true,
  maxLength,
})
const items = (name: string, fields: Field[]): Field => ({
  name,
  type: 'array',
  fields,
  admin: { components: { RowLabel: REORDER_ROW_LABEL } },
})

const withReorder = (block: Block): Block => ({
  ...block,
  admin: { ...block.admin, components: { ...block.admin?.components, Label: REORDER_ROW_LABEL } },
})

const definitions: Block[] = [
  {
    slug: 'hero',
    fields: [
      text('heading', 160, true),
      textarea('subheading', 400),
      linkGroup('primaryCta'),
      linkGroup('secondaryCta'),
      ...common,
    ],
  },
  { slug: 'richText', fields: [richTextField('content'), ...common] },
  {
    slug: 'featureGrid',
    fields: [
      text('heading'),
      items('items', [
        {
          name: 'icon',
          type: 'select',
          options: ['shield', 'audit', 'policy', 'training', 'risk', 'response'].map((v) => ({
            label: v,
            value: v,
          })),
        },
        text('title', 120, true),
        textarea('text', 600),
      ]),
      ...common,
    ],
  },
  {
    slug: 'serviceList',
    fields: [
      text('heading'),
      {
        name: 'mode',
        type: 'select',
        defaultValue: 'all',
        options: ['all', 'selected'].map((v) => ({ label: v, value: v })),
      },
      { name: 'services', type: 'relationship', relationTo: 'services', hasMany: true },
      ...common,
    ],
  },
  {
    slug: 'courseList',
    fields: [
      text('heading'),
      {
        name: 'mode',
        type: 'select',
        defaultValue: 'all',
        options: ['all', 'selected'].map((v) => ({ label: v, value: v })),
      },
      { name: 'courses', type: 'relationship', relationTo: 'courses', hasMany: true },
      ...common,
    ],
  },
  {
    slug: 'cta',
    fields: [text('heading', 160, true), textarea('text', 600), linkGroup('link'), ...common],
  },
  {
    slug: 'faq',
    fields: [items('items', [text('question', 300, true), richTextField('answer')]), ...common],
  },
  {
    slug: 'stats',
    fields: [
      items('items', [
        { name: 'value', type: 'text', maxLength: 40, required: true },
        text('label', 120, true),
      ]),
      evidenceGroup(),
      ...common,
    ],
  },
  {
    slug: 'credentials',
    fields: [
      items('items', [
        text('name', 200, true),
        text('issuer', 200),
        { name: 'validUntil', type: 'date' },
      ]),
      evidenceGroup(),
      ...common,
    ],
  },
  { slug: 'contactBlock', fields: [text('heading', 160), textarea('intro', 600), ...common] },
]

export const blocks: Block[] = definitions.map(withReorder)

export const sectionsField: Field = { name: 'sections', type: 'blocks', blocks }
