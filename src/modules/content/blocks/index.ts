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

/** Optional section header: a short label above the heading, the heading and an intro line. */
const header = (headingRequired = false): Field[] => [
  text('eyebrow', 80),
  text('heading', 160, headingRequired),
  textarea('intro', 600),
]

const select = (name: string, values: string[], description: string): Field => ({
  name,
  type: 'select',
  defaultValue: values[0],
  options: values.map((v) => ({ label: v, value: v })),
  admin: { description },
})

const withReorder = (block: Block): Block => ({
  ...block,
  admin: { ...block.admin, components: { ...block.admin?.components, Label: REORDER_ROW_LABEL } },
})

const definitions: Block[] = [
  {
    slug: 'hero',
    fields: [
      text('eyebrow', 80),
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
    // Company introduction, expertise and experience: text beside an optional illustration.
    slug: 'textMedia',
    labels: { singular: 'Text and media', plural: 'Text and media' },
    fields: [
      text('eyebrow', 80),
      text('heading', 160, true),
      richTextField('body'),
      image('media'),
      select('mediaPosition', ['end', 'start'], 'Side of the image (end = right in English).'),
      linkGroup('link'),
      ...common,
    ],
  },
  {
    // Approach: an ordered sequence of steps (e.g. Understand → Assess → Plan → Support).
    slug: 'process',
    labels: { singular: 'Process steps', plural: 'Process steps' },
    fields: [
      ...header(),
      items('steps', [text('title', 120, true), textarea('text', 400)]),
      ...common,
    ],
  },
  {
    // Standards and frameworks the work follows. Certifications held belong in a Credentials
    // block, which needs verified evidence before it can be published.
    slug: 'standards',
    labels: { singular: 'Standards and frameworks', plural: 'Standards and frameworks' },
    fields: [
      ...header(),
      items('items', [
        {
          ...text('name', 120, true),
          admin: {
            description:
              'A framework the work follows. Certifications or accreditations held go in a Credentials block (evidence required).',
          },
        } as Field,
        textarea('text', 400),
        image('logo'),
      ]),
      ...common,
    ],
  },
  {
    // Insights and resources: linked cards to published pages or external publications.
    slug: 'resourceList',
    labels: { singular: 'Insights and resources', plural: 'Insights and resources' },
    fields: [
      ...header(),
      items('items', [
        text('kind', 60),
        text('title', 200, true),
        textarea('summary', 400),
        linkGroup('link'),
      ]),
      linkGroup('moreLink'),
      ...common,
    ],
  },
  {
    slug: 'featureGrid',
    fields: [
      ...header(),
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
      ...header(),
      linkGroup('moreLink'),
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
      ...header(),
      linkGroup('moreLink'),
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
      ...header(),
      items('items', [
        { name: 'value', type: 'text', maxLength: 40, required: true },
        text('label', 120, true),
      ]),
      evidenceGroup('evidence', CLAIM_BLOCKS.stats!),
      ...common,
    ],
  },
  {
    // Credentials, certifications, registrations and partnerships. Heading, intro and display are
    // part of the verified claim (CLAIM_BLOCKS), so retitling a block needs re-verification.
    slug: 'credentials',
    fields: [
      ...header(),
      select('display', ['cards', 'logos'], 'Cards with details, or a row of logos (partners).'),
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
      ...header(),
      items('items', [{ ...image('media'), required: true } as Field, text('caption', 300)]),
      ...common,
    ],
  },
  { slug: 'contactBlock', fields: [text('heading', 160), textarea('intro', 600), ...common] },
]

export const blocks: Block[] = definitions.map(withReorder)

export const sectionsField: Field = { name: 'sections', type: 'blocks', blocks }
