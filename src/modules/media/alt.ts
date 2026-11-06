// FR-054: an image needs alternative text in a locale, or must be marked decorative, before a
// document that shows it can be published in that locale. Checked on the stored document after
// every content write (workflow verifyStoredContent), so every path is covered and a failure rolls
// the write back. Hidden sections and items are not rendered, so they are not checked.
import type { Field, PayloadRequest } from 'payload'
import { publicError } from '../content/errors'
import { collectMediaRefs, MEDIA } from './usage'

type MediaDoc = { id: number; decorative?: unknown; alt?: unknown }

const altIn = (alt: unknown, locale: string) => {
  const v = alt && typeof alt === 'object' ? (alt as Record<string, unknown>)[locale] : alt
  return typeof v === 'string' && v.trim() !== ''
}

export async function assertPublishableImages(
  req: PayloadRequest,
  fields: Field[],
  stored: Record<string, unknown>,
  publishedLocales: string[],
): Promise<void> {
  if (!publishedLocales.length) return
  const ids = [...collectMediaRefs(fields, stored, { skipHidden: true })]
  if (!ids.length) return
  const res = await req.payload.find({
    collection: MEDIA as never,
    where: { id: { in: ids } },
    locale: 'all',
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const docs = res.docs as unknown as MediaDoc[]
  const missing: { locale: string; media: number }[] = []
  for (const locale of publishedLocales)
    for (const id of ids) {
      const m = docs.find((d) => d.id === id)
      // A reference to a deleted image renders nothing; it is not an accessibility gap.
      if (m && m.decorative !== true && !altIn(m.alt, locale)) missing.push({ locale, media: id })
    }
  if (missing.length)
    throw publicError(
      'Every image needs alternative text in the language being published, or must be marked decorative.',
      400,
      { reason: 'imageAlt', missing },
    )
}
