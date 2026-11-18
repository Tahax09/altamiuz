// Records the owner's attestation (content/attestation.ts) on every claim block of a draft:
// statistics, credentials and team blocks. Run after both languages are written, because changing
// a claim in any language afterwards removes the verification again (CLAIM_BLOCKS).
import type { Payload } from 'payload'
import { OWNER_ATTESTATION } from '../content/attestation'

type Obj = Record<string, unknown>
const CLAIM_TYPES = new Set(['stats', 'credentials', 'team'])

export async function attestClaimBlocks(
  payload: Payload,
  collection: 'pages',
  id: number,
): Promise<number> {
  const doc = (await payload.findByID({
    collection,
    id,
    draft: true,
    locale: 'ar',
    depth: 0,
    overrideAccess: true,
  })) as unknown as { sections?: Obj[] }
  let n = 0
  const sections = (doc.sections ?? []).map((b) => {
    if (!CLAIM_TYPES.has(String(b.blockType)) || b.hidden) return b
    n++
    return { ...b, evidence: { status: 'verified', reference: OWNER_ATTESTATION } }
  })
  if (n)
    await payload.update({
      collection,
      id,
      locale: 'ar',
      draft: true,
      data: { sections } as never,
      overrideAccess: true,
    })
  return n
}
