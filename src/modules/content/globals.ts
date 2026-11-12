// Site-wide globals (T131, FR-010, FR-014, FR-016, FR-036, FR-045, FR-075; data-model "Globals"):
// site-settings, header-nav, footer-nav, banner. Drafts with per-locale status, validated like
// collections (D-22). Permissions come from contracts/access-matrix.md: navigation/banner drafts
// for Publisher+, publish/unpublish for Administrator/Owner; site-settings update/publish for
// Administrator/Owner only. Restore is not granted for globals, so it is refused for every role.
import { createHash } from 'node:crypto'
import type {
  Access,
  Endpoint,
  Field,
  FieldAccess,
  GlobalAfterChangeHook,
  GlobalAfterReadHook,
  GlobalBeforeChangeHook,
  GlobalBeforeOperationHook,
  GlobalConfig,
  PayloadRequest,
} from 'payload'
import { allow, can, isMfaVerified, roleOf, type Resource } from '../access'
import { recordAudit } from '../audit'
import { assertPublishableImages, globalFieldsOf, invalidatePublicMedia } from '../media'
import { expireCacheTags, getConfig } from '../platform'
import { contentRead, mayDo } from './access'
import { assertClaimsVerified, evidenceGroup, unverifiedClaims } from './evidence'
import { isLocaleCopy } from './locale-copy'
import { linkGroup } from './link'
import { findContentIssues } from './richtext/walk'
import {
  assertNotStale,
  assertSeoComplete,
  captureBaseUpdatedAt,
  ctx,
  deny,
  forceDraft,
  publicationIntent,
} from './workflow'
import { publicError } from './errors'

export type SiteGlobal = 'site-settings' | 'header-nav' | 'footer-nav' | 'banner'
const RESOURCE: Record<SiteGlobal, Resource> = {
  'site-settings': 'site-settings',
  'header-nav': 'navigation',
  'footer-nav': 'navigation',
  banner: 'banner',
}

const captureGlobalOperation =
  (slug: SiteGlobal): GlobalBeforeOperationHook =>
  async ({ args, operation, req }) => {
    if (operation === 'restoreVersion') await deny(req, slug, 'restore')
    if (operation === 'update') {
      if (isLocaleCopy()) forceDraft(args) // L-2: a copied language is always a draft
      const c = ctx(req)
      c.contentOp = 'update'
      c.draftArg = (args as { draft?: boolean }).draft === true
      c.publishLocale = (args as { publishSpecificLocale?: string }).publishSpecificLocale
      const all = (args as { unpublishAllLocales?: unknown }).unpublishAllLocales
      c.unpublishAll = all === true || all === 'true'
      const data = (args as { data?: unknown }).data
      captureBaseUpdatedAt(req, data)
      const issues = findContentIssues(data)
      if (issues.length) throw publicError('Content rejected by policy', 400, { issues })
      if (slug === 'header-nav' || slug === 'footer-nav') assertTwoLevels(data)
    }
    return args
  }

/** Array rows of a menu level. The admin form sends an array with no rows as its row count
 * (`children: 0`), so anything that is not an array has no rows. */
const rowsOf = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? (v as Record<string, unknown>[]) : []

/** Menus are two levels; a third level is rejected rather than silently dropped. */
function assertTwoLevels(data: unknown) {
  const items = (data as { items?: unknown } | undefined)?.items
  if (!Array.isArray(items)) return
  for (const item of items)
    for (const child of rowsOf((item as { children?: unknown } | null)?.children))
      if (child && typeof child === 'object' && 'children' in child)
        throw publicError('Menus have two levels at most', 400, { reason: 'policy' })
}

const enforceGlobalWorkflow =
  (slug: SiteGlobal): GlobalBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    const resource = RESOURCE[slug]
    const { publishing, unpublishing } = publicationIntent(req, data)
    ctx(req).publishing = publishing
    // Compare with the latest version, never the frozen main row (see latestVersionAt).
    assertNotStale(req, { updatedAt: (await latestVersionAt(req, slug)) ?? originalDoc?.updatedAt })
    if (req.user) {
      if (publishing && !mayDo(req, resource, 'publish')) await deny(req, slug, 'publish')
      if (unpublishing && !mayDo(req, resource, 'unpublish')) await deny(req, slug, 'unpublish')
    }
    if (publishing) {
      const merged = { ...(originalDoc ?? {}), ...data }
      const unverified = unverifiedClaims(merged)
      if (unverified.length)
        throw publicError('Unverified claims cannot be published', 400, { paths: unverified })
      if (slug === 'site-settings') assertSeoComplete(merged.defaultSeo, 'defaultSeo')
    }
    return data
  }

const auditGlobal =
  (slug: SiteGlobal): GlobalAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    const c = ctx(req)
    const actor = req.user ? `user:${req.user.id}` : 'system'
    const target = { type: 'global', id: slug }
    const operation =
      doc._status === 'published'
        ? 'publish'
        : !c.draftArg && previousDoc?._status === 'published'
          ? 'unpublish'
          : null
    if (operation)
      await recordAudit(req.payload, {
        actor,
        action: slug === 'site-settings' ? 'settings.change' : 'navigation.change',
        target,
        outcome: 'success',
        meta: slug === 'site-settings' ? { global: slug } : { global: slug, operation },
      })
    expireCacheTags(`global:${slug}`)
    if (slug === 'site-settings') invalidatePublicMedia() // brand images (FR-056) may change
    return doc
  }

/** L-1 backstop for globals: a publish needs every claim verified for what is stored and published;
 * site-settings images (logos, default social image) need alt text in every published language
 * or must be decorative (FR-054), like images on pages. */
const verifyStoredGlobalClaims =
  (slug: SiteGlobal): GlobalAfterChangeHook =>
  async ({ doc, req }) => {
    if (!ctx(req).publishing) return doc
    // A-8: check the draft and the published version (a per-language publish merges them).
    const read = (draft: boolean) =>
      req.payload.findGlobal({ slug, locale: 'all', draft, depth: 0, overrideAccess: true, req })
    const published = await read(false)
    assertClaimsVerified(await read(true), published)
    const status = (published as { _status?: unknown })._status
    if (slug === 'site-settings' && status && typeof status === 'object')
      await assertPublishableImages(
        req,
        globalFieldsOf(req.payload, slug),
        published as unknown as Record<string, unknown>,
        Object.entries(status as Record<string, unknown>)
          .filter(([, st]) => st === 'published')
          .map(([locale]) => locale),
      )
    return doc
  }

/**
 * FR-015 for globals (WS11 finding). Payload 3.91.0 never updates a global's main-row `updatedAt`
 * after creation, so once the latest version is published every read returns that frozen value,
 * while the server's `originalDoc` is the latest version. Clients would then always look stale
 * (false 409s) and two publishes could not be told apart. CMS readers therefore see the latest
 * version's `updatedAt`: the same value assertNotStale compares against.
 */
async function latestVersionAt(req: PayloadRequest, slug: SiteGlobal) {
  const latest = await req.payload.db.findGlobalVersions({
    global: slug,
    limit: 1,
    sort: '-updatedAt',
    pagination: false,
    req,
  })
  return (latest.docs[0] as { updatedAt?: string } | undefined)?.updatedAt
}

const exposeLatestVersionTimestamp =
  (slug: SiteGlobal): GlobalAfterReadHook =>
  async ({ doc, req }) => {
    if (!req.user || req.context?.publicSite) return doc
    const at = await latestVersionAt(req, slug)
    return at ? { ...doc, updatedAt: at } : doc
  }

/** Payload's POST /api/globals/:slug/versions/:id restores; not granted to any role. */
const noRestoreEndpoint = (slug: SiteGlobal): Endpoint => ({
  path: '/versions/:id',
  method: 'post',
  handler: async (req) => {
    if (req.user)
      await recordAudit(req.payload, {
        actor: `user:${req.user.id}`,
        action: 'access.denied',
        target: { type: 'global', id: slug },
        outcome: 'denied',
        meta: { resource: slug, action: 'restore' },
      })
    return Response.json(
      { errors: [{ message: 'You are not allowed to perform this action.' }] },
      { status: 403 },
    )
  },
})

function versionedGlobal(
  slug: SiteGlobal,
  label: string,
  fields: Field[],
  extra: { beforeChange?: GlobalBeforeChangeHook[] } = {},
): GlobalConfig {
  const resource = RESOURCE[slug]
  const write: Access = allow(resource, slug === 'site-settings' ? 'update' : 'updateDraft')
  return {
    slug,
    label,
    admin: { group: 'Site' },
    access: {
      read: contentRead(resource),
      readVersions: allow(resource, 'read'),
      update: write,
    },
    // Same draft model as pages (ADR-006): per-locale status, drafts validated, no autosave.
    versions: { drafts: { localizeStatus: true, validate: true }, max: 0 },
    endpoints: [noRestoreEndpoint(slug)],
    hooks: {
      beforeOperation: [captureGlobalOperation(slug)],
      beforeChange: [enforceGlobalWorkflow(slug), ...(extra.beforeChange ?? [])],
      afterChange: [verifyStoredGlobalClaims(slug), auditGlobal(slug)],
      afterRead: [exposeLatestVersionTimestamp(slug)],
    },
    fields,
  }
}

// ---------------------------------------------------------------------------------------------
// Navigation

/** Flags internal targets that are not published in the edited locale (data-model). */
async function flagUnpublished(req: PayloadRequest, item: Record<string, unknown>) {
  const link = item.link as { linkType?: string; doc?: { relationTo?: string; value?: unknown } }
  item.targetUnpublished = false
  if (link?.linkType !== 'internal' || !link.doc?.relationTo) return
  const id =
    typeof link.doc.value === 'object' && link.doc.value
      ? (link.doc.value as { id: unknown }).id
      : link.doc.value
  const found = await req.payload.find({
    collection: link.doc.relationTo as 'pages',
    where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
    locale: req.locale ?? 'ar',
    draft: false,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
  })
  item.targetUnpublished = found.totalDocs === 0
}

const flagMenuTargets: GlobalBeforeChangeHook = async ({ data, req }) => {
  for (const item of rowsOf(data.items)) {
    await flagUnpublished(req, item)
    for (const child of rowsOf(item.children)) await flagUnpublished(req, child)
  }
  return data
}

const targetFlag: Field = {
  name: 'targetUnpublished',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    readOnly: true,
    description: 'Set on save: the linked page is not published in this language.',
  },
}

const menuLink = (): Field => {
  const g = linkGroup('link')
  return {
    ...g,
    fields: g.fields.map((f) =>
      'name' in f && f.name === 'label' ? { ...f, required: true } : f,
    ) as never,
  }
}

const menu = (slug: 'header-nav' | 'footer-nav', label: string) =>
  versionedGlobal(
    slug,
    label,
    [
      {
        name: 'items',
        type: 'array',
        maxRows: 12,
        admin: {
          components: { RowLabel: '/modules/content/admin/ReorderControl#ReorderRowLabel' },
        },
        fields: [
          menuLink(),
          targetFlag,
          {
            name: 'children',
            type: 'array',
            maxRows: 12,
            admin: {
              components: { RowLabel: '/modules/content/admin/ReorderControl#ReorderRowLabel' },
            },
            fields: [menuLink(), targetFlag],
          },
        ],
      },
    ],
    { beforeChange: [flagMenuTargets] },
  )

export const headerNav = menu('header-nav', 'Header navigation')
export const footerNav = menu('footer-nav', 'Footer navigation')

// ---------------------------------------------------------------------------------------------
// Banner

const bannerRules: GlobalBeforeChangeHook = ({ data }) => {
  const starts = data.startsAt ? Date.parse(String(data.startsAt)) : NaN
  const ends = data.endsAt ? Date.parse(String(data.endsAt)) : NaN
  if (!Number.isNaN(starts) && !Number.isNaN(ends) && ends <= starts)
    throw publicError('The banner must end after it starts', 400, { reason: 'policy' })
  // Server-computed: changes whenever this locale's message or link changes (re-shows the banner).
  data.dismissKey = createHash('sha256')
    .update(JSON.stringify({ message: data.message ?? '', link: data.link ?? null }))
    .digest('hex')
    .slice(0, 16)
  return data
}

export const banner = versionedGlobal(
  'banner',
  'Site banner',
  [
    { name: 'enabled', type: 'checkbox', defaultValue: false },
    {
      name: 'message',
      type: 'textarea',
      localized: true,
      maxLength: 280,
      admin: { description: 'Plain text only.' },
    },
    linkGroup('link'),
    { name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'dismissKey', type: 'text', localized: true, admin: { readOnly: true } },
  ],
  { beforeChange: [bannerRules] },
)

// ---------------------------------------------------------------------------------------------
// Site settings

/** enquiryRecipients: Administrators and Owners only; never in public reads (FR-075). */
const settingsAdminsOnly: FieldAccess = ({ req }) => {
  const role = roleOf(req.user)
  return !!req.user && isMfaVerified(req.user) && !!role && can(role, 'site-settings', 'update')
}

export const siteSettings = versionedGlobal('site-settings', 'Site settings', [
  { name: 'companyName', type: 'text', localized: true, maxLength: 160 },
  evidenceGroup('companyNameEvidence', { field: 'companyName' }),
  { name: 'address', type: 'textarea', localized: true, maxLength: 500 },
  evidenceGroup('addressEvidence', { field: 'address' }),
  {
    name: 'phone',
    type: 'text',
    maxLength: 20,
    validate: (v: unknown) =>
      !v || /^\+[0-9]{6,15}$/.test(String(v)) || 'Use +country code digits only.',
  },
  { name: 'email', type: 'email' },
  { name: 'hours', type: 'text', localized: true, maxLength: 200 },
  { name: 'socialLinks', type: 'array', maxRows: 10, fields: [linkGroup('link')] },
  {
    // CD-09: brand images from the media library (docs/content/brand-assets.md). Each is per
    // language, so Arabic and English wordmarks can differ; alt text lives on the image. Until an
    // image is chosen the company name is shown as text. The favicon is a static file, not CMS.
    name: 'brand',
    type: 'group',
    admin: {
      description:
        'Logos for the header and footer, per language. PNG or WebP with a transparent background, at least 960 px wide. The company name is shown as text until a logo is chosen.',
    },
    fields: [
      {
        name: 'logo',
        type: 'upload',
        relationTo: 'media',
        localized: true,
        admin: { description: 'Header logo, dark artwork on the light page background.' },
      },
      {
        name: 'logoInverse',
        type: 'upload',
        relationTo: 'media',
        localized: true,
        admin: { description: 'Footer logo, light artwork on the navy footer.' },
      },
    ],
  },
  {
    name: 'defaultSeo',
    type: 'group',
    fields: [
      { name: 'title', type: 'text', localized: true, maxLength: 60 },
      { name: 'description', type: 'textarea', localized: true, maxLength: 160 },
      {
        // FR-060: used when a page has no social preview image of its own (1200 × 630 px).
        name: 'ogImage',
        type: 'upload',
        relationTo: 'media',
        admin: {
          description:
            'Default social preview image (1200 × 630 px) for pages that have none of their own.',
        },
      },
    ],
  },
  { name: 'legalLinks', type: 'array', maxRows: 10, fields: [linkGroup('link')] },
  {
    name: 'enquiryRecipients',
    type: 'array',
    maxRows: 10,
    access: { read: settingsAdminsOnly, create: settingsAdminsOnly, update: settingsAdminsOnly },
    admin: { description: 'Who receives contact enquiries. Visible to administrators only.' },
    fields: [{ name: 'email', type: 'email', required: true }],
  },
  {
    // CD-10 / FR-079: the contact form links its consent checkbox to this page and is not shown
    // in a language where the page is not published (the form never launches without the notice).
    name: 'privacyNotice',
    type: 'relationship',
    relationTo: 'pages',
    // A draft notice may be linked before it is published (the form stays closed until it is);
    // it must be a legal-template page. Checked against the stored draft, not the published copy.
    validate: async (value: unknown, { req }: { req: PayloadRequest }) => {
      const id = typeof value === 'object' && value ? (value as { id?: unknown }).id : value
      if (id === null || id === undefined || id === '') return true
      const page = await req.payload
        .findByID({
          collection: 'pages',
          id: id as number,
          draft: true,
          depth: 0,
          overrideAccess: true,
          req,
        })
        .catch(() => null)
      return (page as { template?: unknown } | null)?.template === 'legal'
        ? true
        : 'Choose a page that uses the legal template.'
    },
    admin: {
      description:
        'The privacy notice (a page with the legal template). The contact form is shown only in languages where this page is published.',
    },
  },
  {
    // Calls to action on service and course pages and in the header link here (only while the
    // page is published in the language; otherwise they are not shown).
    name: 'contactPage',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      description:
        'The page with the contact form. Service and course pages and the header link to it where it is published.',
    },
  },
  {
    // Headings and introductions of the automatic listing pages (FR-018). Empty fields fall back
    // to the interface vocabulary ("Services", "Training") and no introduction.
    name: 'listings',
    type: 'group',
    fields: [
      { name: 'servicesHeading', type: 'text', localized: true, maxLength: 120 },
      { name: 'servicesIntro', type: 'textarea', localized: true, maxLength: 400 },
      { name: 'trainingHeading', type: 'text', localized: true, maxLength: 120 },
      { name: 'trainingIntro', type: 'textarea', localized: true, maxLength: 400 },
    ],
  },
  {
    name: 'enquiryTopics',
    type: 'array',
    maxRows: 20,
    fields: [{ name: 'label', type: 'text', localized: true, required: true, maxLength: 120 }],
  },
  {
    name: 'analyticsEnabled',
    type: 'checkbox',
    virtual: true,
    admin: { readOnly: true, description: 'Mirrors the server configuration (ANALYTICS_DRIVER).' },
    hooks: { afterRead: [() => getConfig().analytics.driver !== 'none'] },
  },
])

export const siteGlobals = [siteSettings, headerNav, footerNav, banner]
