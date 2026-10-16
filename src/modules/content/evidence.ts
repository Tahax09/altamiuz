// Evidence for claim-bearing content (T086, FR-016). Only administrators/owners may mark
// `verified`; verifiedBy/verifiedAt are set by the server; a reference is required.
import type { GroupField } from 'payload'
import { APIError } from 'payload'
import { can, isMfaVerified, roleOf } from '../access'

export function evidenceGroup(name = 'evidence'): GroupField {
  return {
    name,
    type: 'group',
    admin: {
      description:
        'Claims are publishable only once verified by an administrator, with a recorded evidence reference.',
    },
    fields: [
      {
        name: 'status',
        type: 'select',
        required: true,
        defaultValue: 'unverified',
        options: [
          { label: 'Unverified', value: 'unverified' },
          { label: 'Verified', value: 'verified' },
        ],
        hooks: {
          beforeChange: [
            ({ value, previousValue, req, siblingData }) => {
              if (value === 'verified' && previousValue !== 'verified') {
                if (req.user) {
                  const role = roleOf(req.user)
                  if (!isMfaVerified(req.user) || !role || !can(role, 'evidence', 'verify'))
                    throw new APIError('Only administrators can verify evidence', 403)
                }
                if (!siblingData?.reference)
                  throw new APIError('An evidence reference is required to verify', 400)
                siblingData.verifiedBy = req.user?.id ?? null
                siblingData.verifiedAt = new Date().toISOString()
              }
              if (value !== 'verified' && siblingData) {
                siblingData.verifiedBy = null
                siblingData.verifiedAt = null
              }
              return value
            },
          ],
        },
      },
      { name: 'reference', type: 'text', maxLength: 500 },
      { name: 'verifiedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
      { name: 'verifiedAt', type: 'date', admin: { readOnly: true } },
    ],
  }
}

/** Paths of claim evidence that is not verified (publish gate). */
export function unverifiedClaims(data: unknown): string[] {
  const out: string[] = []
  const visit = (v: unknown, p: string, depth: number) => {
    if (depth > 30 || !v || typeof v !== 'object') return
    if (Array.isArray(v)) return v.forEach((x, i) => visit(x, `${p}.${i}`, depth + 1))
    const o = v as Record<string, unknown>
    const claimBlock = o.blockType === 'stats' || o.blockType === 'credentials'
    if (claimBlock && (o.evidence as { status?: string } | undefined)?.status !== 'verified')
      out.push(`${p}.evidence`)
    if (
      typeof o.accreditationStatement === 'string' &&
      o.accreditationStatement.trim() &&
      (o.accreditationEvidence as { status?: string } | undefined)?.status !== 'verified'
    )
      out.push(`${p}.accreditationEvidence`)
    for (const [k, x] of Object.entries(o)) visit(x, `${p}.${k}`, depth + 1)
  }
  visit(data, '$', 0)
  return out
}
