// R-A proof of concept only. Not application code; never imported by the app.
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: 'users', importMap: { baseDir: path.resolve(dirname) } },
  i18n: { supportedLanguages: { ar, en }, fallbackLanguage: 'en' },
  localization: {
    locales: [
      { code: 'ar', label: { ar: 'العربية', en: 'Arabic' }, rtl: true },
      { code: 'en', label: { ar: 'الإنجليزية', en: 'English' } },
    ],
    defaultLocale: 'ar',
    fallback: false,
  },
  experimental: { localizeStatus: true },
  collections: [
    { slug: 'users', auth: true, admin: { useAsTitle: 'email' }, fields: [] },
    {
      slug: 'poc-media',
      upload: {
        staticDir: path.resolve(dirname, '../media'),
        focalPoint: true,
        imageSizes: [
          { name: 'card', width: 640, height: 400 },
          { name: 'wide', width: 1440, height: 600 },
        ],
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      },
      fields: [{ name: 'alt', type: 'text', localized: true }],
    },
    {
      slug: 'poc-services',
      orderable: true,
      admin: { useAsTitle: 'title' },
      fields: [{ name: 'title', type: 'text', localized: true, required: true }],
    },
    {
      slug: 'poc-pages',
      admin: { useAsTitle: 'title' },
      versions: { drafts: { localizeStatus: true }, maxPerDoc: 20 },
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'summary', type: 'textarea', localized: true },
        { name: 'body', type: 'richText', localized: true },
        {
          name: 'category',
          type: 'select',
          options: [
            { value: 'iso', label: { ar: 'أيزو', en: 'ISO' } },
            { value: 'pci', label: { ar: 'بي سي آي', en: 'PCI' } },
          ],
        },
        { name: 'durationDays', type: 'number' },
        { name: 'startsOn', type: 'date' },
        { name: 'featured', type: 'checkbox' },
        { name: 'service', type: 'relationship', relationTo: 'poc-services' },
        { name: 'hero', type: 'upload', relationTo: 'poc-media' },
        {
          name: 'gallery',
          type: 'array',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'poc-media' },
            { name: 'caption', type: 'text', localized: true },
          ],
        },
        {
          name: 'sections',
          type: 'blocks',
          blocks: [
            {
              slug: 'textBlock',
              fields: [{ name: 'heading', type: 'text', localized: true }],
            },
            {
              slug: 'ctaBlock',
              fields: [
                { name: 'label', type: 'text', localized: true },
                { name: 'url', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' } }),
  sharp,
})
