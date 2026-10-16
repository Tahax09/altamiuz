// Pages, services and courses (T087, T088, FR-002, FR-010, FR-011, FR-017).
import type { CollectionConfig, Field } from 'payload'
import type { RoutedCollection } from '../i18n'
import { contentAccess } from './access'
import { sectionsField } from './blocks'
import { evidenceGroup } from './evidence'
import { slugField } from './slugs'
import {
  auditAndRevalidate,
  auditDelete,
  captureOperation,
  enforceWorkflow,
  restoreAsDraftEndpoint,
  verifyStoredContent,
} from './workflow'

const seo: Field = {
  name: 'seo',
  type: 'group',
  fields: [
    { name: 'title', type: 'text', localized: true, maxLength: 60 },
    { name: 'description', type: 'textarea', localized: true, maxLength: 160 },
    { name: 'noindex', type: 'checkbox', defaultValue: false },
  ],
}

function routed(
  slug: RoutedCollection,
  fields: Field[],
  extra: Partial<CollectionConfig> = {},
): CollectionConfig {
  return {
    slug,
    admin: {
      useAsTitle: 'title',
      group: 'Content',
      defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
      // Same-origin, session-gated preview route; no shareable or token links (FR-022).
      preview: (doc, { locale }) =>
        `/preview/${slug}/${String(doc.id)}?locale=${locale === 'en' ? 'en' : 'ar'}`,
    },
    access: contentAccess(slug),
    // localizeStatus: per-locale publish (experimental, D-4, regression-tested). Drafts are not
    // validated for required fields (editors may save incomplete work); safety hooks always run.
    // No autosave: Payload 3.91.0 deletes the document lock on every save, so autosave would
    // release the lock every few seconds and defeat FR-015 (verified by tests/security T076).
    versions: {
      drafts: { localizeStatus: true, validate: false },
      maxPerDoc: 0,
    },
    endpoints: [restoreAsDraftEndpoint(slug)],
    hooks: {
      beforeOperation: [captureOperation],
      beforeChange: [enforceWorkflow(slug)],
      afterChange: [verifyStoredContent(slug), auditAndRevalidate(slug)],
      afterDelete: [auditDelete(slug)],
    },
    fields: [
      { name: 'title', type: 'text', localized: true, required: true, maxLength: 160 },
      slugField(slug),
      ...fields,
      seo,
    ],
    ...extra,
  }
}

const listingFields: Field[] = [
  { name: 'summary', type: 'textarea', localized: true, maxLength: 300 },
  sectionsField,
  {
    name: 'order',
    type: 'number',
    defaultValue: 0,
    admin: {
      position: 'sidebar',
      description:
        'Listing position (lower first). Keyboard-editable alternative to drag ordering.',
    },
  },
  { name: 'hidden', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
]

export const pages = routed('pages', [
  {
    name: 'template',
    type: 'select',
    defaultValue: 'default',
    options: ['default', 'home', 'legal'].map((v) => ({ label: v, value: v })),
  },
  sectionsField,
])

export const services = routed('services', listingFields)

export const courses = routed('courses', [
  ...listingFields,
  { name: 'audience', type: 'text', localized: true, maxLength: 200 },
  {
    name: 'duration',
    type: 'group',
    fields: [
      { name: 'value', type: 'number', min: 0 },
      {
        name: 'unit',
        type: 'select',
        options: ['hours', 'days', 'weeks'].map((v) => ({ label: v, value: v })),
      },
    ],
  },
  {
    name: 'deliveryFormat',
    type: 'select',
    options: ['in-person', 'online', 'hybrid'].map((v) => ({ label: v, value: v })),
  },
  { name: 'provider', type: 'text', localized: true, maxLength: 200 },
  {
    name: 'accreditationStatement',
    type: 'text',
    localized: true,
    maxLength: 300,
    admin: { description: 'Claim-bearing: needs verified evidence to publish.' },
  },
  evidenceGroup('accreditationEvidence'),
])
