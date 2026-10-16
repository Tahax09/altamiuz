// R-A seed: neutral sample content only (no company claims). Throwaway users from .env.
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const env = process.env

for (const [email, password] of [
  [env.POC_ADMIN_EMAIL!, env.POC_ADMIN_PASSWORD!],
  [env.POC_EDITOR_EMAIL!, env.POC_EDITOR_PASSWORD!],
]) {
  const found = await payload.find({ collection: 'users', where: { email: { equals: email } } })
  if (!found.docs.length) await payload.create({ collection: 'users', data: { email, password } })
}

const services = []
for (const [ar, en] of [
  ['استشارات أمن المعلومات', 'Information security consulting'],
  ['تقييم الامتثال ISO/IEC 27001:2022', 'ISO/IEC 27001:2022 readiness'],
  ['اختبار الاختراق', 'Penetration testing'],
]) {
  const doc = await payload.create({ collection: 'poc-services', locale: 'ar', data: { title: ar } })
  await payload.update({ collection: 'poc-services', id: doc.id, locale: 'en', data: { title: en } })
  services.push(doc)
}

const png = await sharp({
  create: { width: 2000, height: 1200, channels: 3, background: { r: 20, g: 40, b: 80 } },
})
  .png()
  .toBuffer()
const media = await payload.create({
  collection: 'poc-media',
  locale: 'ar',
  data: { alt: 'صورة تجريبية' },
  file: { data: png, mimetype: 'image/png', name: 'sample.png', size: png.length },
})

const rt = (text: string) => ({
  root: {
    type: 'root', direction: null, format: '', indent: 0, version: 1,
    children: [{
      type: 'paragraph', direction: null, format: '', indent: 0, version: 1, textFormat: 0, textStyle: '',
      children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
    }],
  },
})

const page = await payload.create({
  collection: 'poc-pages',
  locale: 'ar',
  draft: true,
  data: {
    title: 'إِدَارَةُ أَمْنِ المَعْلُومَات',
    summary: 'نص تجريبي يتضمن ISO/IEC 27001:2022 و PCI DSS v4.0.1 والبريد info@example.ly والهاتف +218 21 000 0000 وأرقام ١٢٣٤٥ و 12345.',
    body: rt('فقرة تجريبية: لا، لأ، لإ — علامات الترقيم ، ؛ ؟ مع نص إنجليزي ISO/IEC 27002 داخل السطر.'),
    category: 'iso', durationDays: 5, startsOn: '2026-11-01T00:00:00.000Z', featured: true,
    service: services[1].id, hero: media.id,
    gallery: [
      { image: media.id, caption: 'الأول' },
      { image: media.id, caption: 'الثاني' },
      { image: media.id, caption: 'الثالث' },
    ],
    sections: [
      { blockType: 'textBlock', heading: 'القسم الأول' },
      { blockType: 'ctaBlock', label: 'تواصل معنا', url: '/ar/contact' },
    ],
  },
})
await payload.update({
  collection: 'poc-pages', id: page.id, locale: 'en', draft: true,
  data: { title: 'Information security management', summary: 'Sample English text.' },
})
payload.logger.info(`seeded page ${page.id}, media ${media.id}, services ${services.length}`)
process.exit(0)
