// Loads the owner-supplied partner logos (content/partners/, 2026-11-14) into the media library
// through the Payload Local API, so the upload pipeline (type sniffing, variants, metadata
// stripping) applies. Files are uploaded unchanged; alt text is the partner's name in both
// languages. It creates media only: naming a partner on the site is a claim, so the logos are
// placed by an editor in a credentials block (display "logos"), which cannot be published until
// an Administrator verifies its evidence (CD-05, G-1; docs/content/brand-assets.md). Re-running
// reuses existing items (matched by English alt text).
import fs from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'

const DIR = path.join(process.cwd(), 'content/partners')

/** Supplied files and the partner names as written by each partner. */
export const PARTNER_LOGOS = [
  { file: 'dataprotect.webp', name: 'DataProtect' },
  { file: 'pecb.webp', name: 'PECB' },
  { file: 'searchinform.webp', name: 'SearchInform' },
  { file: 'xertiance.webp', name: 'Xertiance' },
] as const

export type PartnerLogoResult = { name: string; id: number; created: boolean }[]

export async function loadPartnerLogos(payload: Payload): Promise<PartnerLogoResult> {
  const out: PartnerLogoResult = []
  for (const { file, name } of PARTNER_LOGOS) {
    const found = await payload.find({
      collection: 'media',
      where: { alt: { equals: name } },
      locale: 'en',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    let id = (found.docs[0] as { id?: number } | undefined)?.id
    const created = id === undefined
    if (id === undefined) {
      const data = fs.readFileSync(path.join(DIR, file))
      id = (
        (await payload.create({
          collection: 'media',
          locale: 'en',
          data: { alt: name } as never,
          file: { data, mimetype: 'image/webp', name: file, size: data.length },
          overrideAccess: true,
        })) as unknown as { id: number }
      ).id
    }
    await payload.update({
      collection: 'media',
      id,
      locale: 'ar',
      data: { alt: name } as never,
      overrideAccess: true,
    })
    out.push({ name, id, created })
  }
  return out
}
