// Evidence for claim-bearing content (T086, FR-016). Only administrators/owners may mark
// `verified`; verifiedBy/verifiedAt are set by the server; a reference is required.
import type { GroupField } from 'payload'
import { can, isMfaVerified, roleOf } from '../access'
import { publicError } from './errors'

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
            ({ value, previousValue, previousSiblingDoc, req, siblingData }) => {
              const prev = (previousSiblingDoc ?? {}) as Record<string, unknown>
              const mayVerify = () => {
                if (!req.user) return true // system paths (scripts, migrations)
                const role = roleOf(req.user)
                return isMfaVerified(req.user) && !!role && can(role, 'evidence', 'verify')
              }
              if (value === 'verified' && previousValue !== 'verified') {
                if (!mayVerify()) throw publicError('Only administrators can verify evidence', 403)
                if (!siblingData?.reference)
                  throw publicError('An evidence reference is required to verify', 400)
                siblingData.verifiedBy = req.user?.id ?? null
                siblingData.verifiedAt = new Date().toISOString()
              } else if (value === 'verified' && siblingData) {
                // Already verified: the reference is part of the verification, and the verifier
                // and time are server-set — incoming values are never trusted.
                if ((siblingData.reference ?? null) !== (prev.reference ?? null) && !mayVerify())
                  throw publicError('Only administrators can change verified evidence', 403)
                siblingData.verifiedBy = prev.verifiedBy ?? null
                siblingData.verifiedAt = prev.verifiedAt ?? null
                if (typeof siblingData.verifiedBy === 'object' && siblingData.verifiedBy)
                  siblingData.verifiedBy = (siblingData.verifiedBy as { id?: unknown }).id ?? null
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

/** Claim-bearing text fields and the evidence group that must be verified to publish them. */
const CLAIM_EVIDENCE = [
  ['accreditationStatement', 'accreditationEvidence'],
  ['companyName', 'companyNameEvidence'],
  ['address', 'addressEvidence'],
] as const

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
    for (const [claim, evidence] of CLAIM_EVIDENCE) {
      const value = o[claim]
      if (
        typeof value === 'string' &&
        value.trim() &&
        (o[evidence] as { status?: string } | undefined)?.status !== 'verified'
      )
        out.push(`${p}.${evidence}`)
    }
    for (const [k, x] of Object.entries(o)) visit(x, `${p}.${k}`, depth + 1)
  }
  visit(data, '$', 0)
  return out
}
