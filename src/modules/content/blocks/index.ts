// Block library (T085, FR-011, FR-012, data-model). Media fields and mediaGallery added with US4
// (T110). Deferred until their dependencies exist: testimonials/clientLogos (CD-08 permissions).
import type { Block, Field } from 'payload'
import { CLAIM_BLOCKS, evidenceGroup } from '../evidence'
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

/** An image from the media library (US4). Alt text lives on the image, per locale (FR-054). */
const image = (name: string): Field => ({ name, type: 'upload', relationTo: 'media' })

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
      image('media'),
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
      evidenceGroup('evidence', CLAIM_BLOCKS.stats!),
      ...common,
    ],
  },
  {
    slug: 'credentials',
    fields: [
      items('items', [
        text('name', 200, true),
        text('issuer', 200),
        image('logo'),
        { name: 'validUntil', type: 'date' },
      ]),
      evidenceGroup('evidence', CLAIM_BLOCKS.credentials!),
      ...common,
    ],
  },
  {
    // FR-055: ordered items, keyboard/touch/drag reorder through ReorderControl (items()).
    slug: 'mediaGallery',
    fields: [
      text('heading'),
      items('items', [{ ...image('media'), required: true } as Field, text('caption', 300)]),
      ...common,
    ],
  },
  { slug: 'contactBlock', fields: [text('heading', 160), textarea('intro', 600), ...common] },
]

export const blocks: Block[] = definitions.map(withReorder)

export const sectionsField: Field = { name: 'sections', type: 'blocks', blocks }
