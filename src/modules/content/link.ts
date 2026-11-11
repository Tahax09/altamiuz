// Shared `link` group (data-model; hero/CTA/nav/social/banner). URL, e-mail and phone are checked
// with the rich-text URL policy on save; internal links reference documents, never free paths.
// `route` links point at the fixed site routes that are not documents (home and the two automatic
// listings), resolved through the typed route map (D-5), so menus can reach the listings.
import type { Field, GroupField } from 'payload'
import { publicError } from './errors'
import { INTERNAL_LINK_COLLECTIONS } from './richtext/editor'
import { classifyUrl } from './richtext/policy'
import { linkGroupIssues } from './richtext/walk'

/** Site routes a `route` link may target (typed route map keys without a slug). */
export const ROUTE_LINK_TARGETS = ['home', 'services', 'training'] as const
export type RouteLinkTarget = (typeof ROUTE_LINK_TARGETS)[number]

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
      options: ['internal', 'route', 'external', 'email', 'tel'].map((v) => ({
        label: v,
        value: v,
      })),
    },
    {
      name: 'doc',
      type: 'relationship',
      relationTo: [...INTERNAL_LINK_COLLECTIONS],
      admin: { condition: (_, s) => s?.linkType === 'internal' },
    },
    {
      name: 'route',
      type: 'select',
      options: ROUTE_LINK_TARGETS.map((v) => ({ label: v, value: v })),
      admin: {
        condition: (_, s) => s?.linkType === 'route',
        description: 'Home page or an automatic listing (services, training).',
      },
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
