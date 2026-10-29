// Shared `link` group (data-model; hero/CTA/nav/social/banner). URL, e-mail and phone are checked
// with the rich-text URL policy on save; internal links reference documents, never free paths.
import type { Field, GroupField } from 'payload'
import { publicError } from './errors'
import { INTERNAL_LINK_COLLECTIONS } from './richtext/editor'
import { classifyUrl } from './richtext/policy'
import { linkGroupIssues } from './richtext/walk'

export function linkGroup(
  name: string,
  opts: { label?: string; required?: boolean } = {},
): GroupField {
  const fields: Field[] = [
    {
      name: 'linkType',
      type: 'select',
      required: opts.required,
      defaultValue: 'internal',
      options: ['internal', 'external', 'email', 'tel'].map((v) => ({ label: v, value: v })),
    },
    {
      name: 'doc',
      type: 'relationship',
      relationTo: [...INTERNAL_LINK_COLLECTIONS],
      admin: { condition: (_, s) => s?.linkType === 'internal' },
    },
    {
      name: 'url',
      type: 'text',
      maxLength: 2048,
      admin: { condition: (_, s) => s?.linkType === 'external' },
      validate: (v: unknown, { siblingData }: { siblingData?: { linkType?: string } }) =>
        siblingData?.linkType !== 'external' || !v || classifyUrl(v).ok
          ? true
          : 'Only https:// links (or allow-listed http) are permitted.',
    },
    { name: 'email', type: 'email', admin: { condition: (_, s) => s?.linkType === 'email' } },
    {
      name: 'tel',
      type: 'text',
      maxLength: 20,
      admin: { condition: (_, s) => s?.linkType === 'tel' },
      validate: (v: unknown) =>
        !v || /^\+[0-9]{6,15}$/.test(String(v)) || 'Use +country code and digits only.',
    },
    { name: 'label', type: 'text', localized: true, maxLength: 120 },
    {
      name: 'newTab',
      type: 'checkbox',
      admin: { condition: (_, s) => s?.linkType === 'external' },
    },
  ]
  return {
    name,
    type: 'group',
    label: opts.label,
    fields,
    hooks: {
      beforeChange: [
        ({ value }) => {
          if (value && typeof value === 'object') {
            const issues = linkGroupIssues(value as Record<string, unknown>, name)
            if (issues.length)
              throw publicError(`Link rejected (${issues.map((i) => i.code).join(', ')})`, 400, {
                issues,
              })
          }
          return value
        },
      ],
    },
  }
}
