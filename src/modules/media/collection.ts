// Media library (US4, D-12, FR-050–FR-057, T110–T112). One master per image, re-encoded without
// metadata under a random 128-bit name, plus 15 responsive variants (5 widths × AVIF/WebP/JPEG).
import path from 'node:path'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  ImageSize,
} from 'payload'
import { recordAudit } from '../audit'
import { expireCacheTags, getConfig } from '../platform'
import { mediaAccess } from './access'
import { ALLOWED_MIME_TYPES } from './sniff'
import { findMediaUsage, invalidatePublicMedia } from './usage'
import { MEDIA_FORMATS, MEDIA_WIDTHS, variantName, type MediaFormat } from './variants'
import { prepareImage, uploadError } from './validate'

const FORMAT_OPTIONS: Record<MediaFormat, ImageSize['formatOptions']> = {
  avif: { format: 'avif', options: { quality: 55, effort: 4 } },
  webp: { format: 'webp', options: { quality: 80 } },
  jpeg: { format: 'jpeg', options: { quality: 82, mozjpeg: true } },
}

const imageSizes: ImageSize[] = MEDIA_WIDTHS.flatMap((width) =>
  MEDIA_FORMATS.map((format) => ({
    name: variantName(width, format),
    width,
    // Never upscale: an image narrower than the variant gets the original size in that format.
    withoutEnlargement: true,
    formatOptions: FORMAT_OPTIONS[format],
  })),
)

/** Storage selection (T111). `local` writes to MEDIA_DIR; `vercel-blob` is handled by the storage
 *  plugin in payload.config.ts (the directory is then unused); S3/R2 is not built yet (T132). */
export function mediaStaticDir(): string {
  const storage = getConfig().storage
  if (storage.driver === 'vercel-blob') return path.resolve('media')
  if (storage.driver !== 'local')
    throw new Error(
      'STORAGE_DRIVER=s3 is not available yet: it needs the S3 storage adapter dependency and the hosting decision (T132). Use STORAGE_DRIVER=local or vercel-blob.',
    )
  return storage.dir
}

const CLIENT_FILE_KEYS = ['url', 'filename', 'mimeType', 'filesize', 'width', 'height', 'sizes']

/**
 * D-12 checks 1–4 on every incoming file, before Payload writes anything. A create must carry an
 * uploaded file: Payload would otherwise fetch `data.url` server-side (paste-from-URL), which is
 * disabled here. File bookkeeping keys supplied by the client are dropped on every write.
 */
const validateUpload: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return args
  const data = (args as { data?: Record<string, unknown> }).data
  if (data && typeof data === 'object')
    for (const k of CLIENT_FILE_KEYS)
      if (Object.prototype.hasOwnProperty.call(data, k)) delete data[k]
  const file = req.file
  if (!file) {
    if (operation === 'create') throw uploadError('missing')
    return args
  }
  if (file.tempFilePath) throw uploadError('storage') // temp-file uploads are not enabled
  const prepared = await prepareImage(file.data)
  req.file = {
    ...file,
    data: prepared.data,
    mimetype: prepared.mimetype,
    name: prepared.name,
    size: prepared.data.length,
  }
  return args
}

/**
 * After any media change: drop the per-process public media set (usage.ts) and expire the public
 * cache of every document that shows the image, so a replaced file, new alt text or focal point
 * appears everywhere at once (FR-057).
 */
const afterMediaChange: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  invalidatePublicMedia()
  if (operation === 'update')
    for (const use of await findMediaUsage(req.payload, doc.id as number))
      if (use.published)
        if (use.collection === 'site-settings') expireCacheTags(`global:${use.collection}`)
        else expireCacheTags(`${use.collection}:${use.id}`, use.collection)
  return doc
}

/** FR-045: every deletion is audited (Payload has already removed the master and variants). */
const auditMediaDelete: CollectionAfterDeleteHook = async ({ id, req }) => {
  invalidatePublicMedia()
  await recordAudit(req.payload, {
    actor: req.user ? `user:${req.user.id}` : 'system',
    action: 'media.delete',
    target: { type: 'media', id: String(id) },
    outcome: 'success',
  })
}

/**
 * Built when the Payload config is built, not at import: the storage directory comes from the
 * runtime configuration, which tests and scripts set before building Payload.
 */
export const mediaCollection = (): CollectionConfig => ({
  slug: 'media',
  labels: { singular: 'Image', plural: 'Media library' },
  access: mediaAccess,
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'decorative', 'width', 'height', 'updatedAt'],
    description:
      'JPEG, PNG, WebP or AVIF, up to 20 MB and 40 megapixels. Images are re-encoded without metadata; responsive sizes are generated automatically.',
  },
  upload: {
    staticDir: mediaStaticDir(),
    mimeTypes: ALLOWED_MIME_TYPES,
    focalPoint: true,
    crop: false,
    bulkUpload: false,
    pasteURL: false,
    filesRequiredOnCreate: true,
    imageSizes,
    adminThumbnail: variantName(480, 'webp'),
    // Files are served by Payload's access-checked route; nothing may cache a draft-only image in
    // a shared cache, and the browser must not sniff a type.
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'private, no-cache')
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Cross-Origin-Resource-Policy', 'same-origin')
      return headers
    },
  },
  fields: [
    // Storage object key used by the Vercel Blob plugin (STORAGE_DRIVER=vercel-blob), declared
    // here too so the database schema is the same with every storage driver (the plugin replaces
    // this definition with its own when it is loaded). Migration 20261118_231108_media_object_key.
    {
      name: '_objectKey',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
        disableBulkEdit: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
      maxLength: 300,
      admin: {
        description:
          'Describe the image for people who cannot see it, in each language. Required to publish a page that uses it, unless the image is decorative.',
      },
    },
    {
      name: 'decorative',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Decorative images carry no information and are hidden from screen readers.',
      },
    },
    // Payload adds focalX/focalY hidden; shown here as numeric inputs (keyboard path, FR-053).
    {
      name: 'focalX',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        hidden: false,
        position: 'sidebar',
        step: 1,
        description: 'Focal point, % from left.',
      },
    },
    {
      name: 'focalY',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        hidden: false,
        position: 'sidebar',
        step: 1,
        description: 'Focal point, % from top.',
      },
    },
    {
      name: 'usage',
      type: 'ui',
      admin: { components: { Field: '/modules/media/admin/UsagePanel#UsagePanel' } },
    },
  ],
  hooks: {
    beforeOperation: [validateUpload],
    afterChange: [afterMediaChange],
    afterDelete: [auditMediaDelete],
  },
})
