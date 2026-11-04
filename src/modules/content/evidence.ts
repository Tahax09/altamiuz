// Evidence for claim-bearing content (T086, FR-016). Only administrators/owners may mark
// `verified`; verifiedBy/verifiedAt are set by the server; a reference is required.
// L-1 (2026-11-04): a verification is bound to the exact claim it verified. `claimDigest` is a
// server-held SHA-256 of the claim in every language at the moment of verification; any write
// that changes the claim in any language resets the evidence to unverified, and a duplicate
// always starts unverified. A stored-document check after every write (storedClaimProblems)
// refuses to publish a claim whose verification is missing or no longer matches.
import { createHash } from 'node:crypto'
import type { FieldHook, GroupField } from 'payload'
import { can, isMfaVerified, roleOf } from '../access'
import { LOCALES } from '../i18n'
import { publicError } from './errors'

/** What an evidence group verifies: a localized text field, or the rows of an `items` array. */
export type ClaimSpec =
  | { field: string }
  | { field: string; rows: { name: string; localized?: boolean; date?: boolean }[] }

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const norm = (v: unknown, date = false): unknown => {
  if (v === undefined || v === null || v === '') return null
  if (date && (typeof v === 'string' || v instanceof Date)) {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? String(v) : d.toISOString()
  }
  return v
}

/**
 * The claim in every language, in one canonical shape. Write mode: `current` is the claim's parent
 * as written in `locale` and `withLocales` the stored parent before the write. Stored mode
 * (`current` null): `withLocales` is the stored parent. Localized values are `{ ar, en }` maps in
 * `withLocales`; array rows are matched by id.
 */
function claimView(spec: ClaimSpec, current: Obj | null, withLocales: Obj | null, locale?: string) {
  const out: Record<string, unknown> = {}
  const mapOf = (v: unknown, l: string) => (isObj(v) ? v[l] : undefined)
  for (const l of LOCALES) {
    const writing = current !== null && l === locale
    if (!('rows' in spec)) {
      out[l] = norm(writing ? current[spec.field] : mapOf(withLocales?.[spec.field], l))
      continue
    }
    const stored = Array.isArray(withLocales?.[spec.field])
      ? (withLocales![spec.field] as Obj[])
      : []
    const rows = current
      ? Array.isArray(current[spec.field])
        ? (current[spec.field] as Obj[])
        : []
      : stored
    out[l] = rows.map((row) => {
      const saved = current
        ? (stored.find((r) => r.id !== undefined && r.id === row.id) ?? {})
        : row
      return Object.fromEntries(
        spec.rows.map((f) => {
          const v = !f.localized ? row[f.name] : writing ? row[f.name] : mapOf(saved[f.name], l)
          return [f.name, norm(v, f.date)]
        }),
      )
    })
  }
  return out
}

const digest = (view: unknown) => createHash('sha256').update(JSON.stringify(view)).digest('hex')

/** Digest of the claim as it will be stored after a write in `locale`. */
export function claimDigestForWrite(
  spec: ClaimSpec,
  siblingData: Obj,
  previousSibling: Obj | undefined,
  siblingWithLocales: Obj | undefined,
  locale: string,
) {
  // A partial write leaves fields it does not send unchanged.
  const current: Obj = { ...(previousSibling ?? {}), ...siblingData }
  return digest(claimView(spec, current, siblingWithLocales ?? null, locale))
}

/** Digest of the claim in a stored all-locale document. */
export const claimDigestStored = (spec: ClaimSpec, parentWithLocales: Obj) =>
  digest(claimView(spec, null, parentWithLocales))

const mayVerify = (req: Parameters<FieldHook>[0]['req']) => {
  if (!req.user) return true // system paths (scripts, migrations)
  const role = roleOf(req.user)
  return isMfaVerified(req.user) && !!role && can(role, 'evidence', 'verify')
}

const UNVERIFIED = { verifiedBy: null, verifiedAt: null, claimDigest: null }

export function evidenceGroup(name: string, claim: ClaimSpec): GroupField {
  const bind: FieldHook = ({
    value,
    previousValue,
    previousSiblingDoc,
    req,
    siblingData,
    siblingDocWithLocales,
  }) => {
    const next: Obj = isObj(value) ? { ...value } : {}
    const prev: Obj = isObj(previousValue) ? previousValue : {}
    const status = next.status ?? prev.status ?? 'unverified'
    if (status !== 'verified') return { ...next, status, ...UNVERIFIED }
    const now = claimDigestForWrite(
      claim,
      siblingData as Obj,
      previousSiblingDoc as Obj | undefined,
      siblingDocWithLocales as Obj | undefined,
      req.locale ?? LOCALES[0],
    )
    if (prev.status !== 'verified') {
      if (!mayVerify(req)) throw publicError('Only administrators can verify evidence', 403)
      if (!next.reference) throw publicError('An evidence reference is required to verify', 400)
      return {
        ...next,
        status,
        verifiedBy: req.user?.id ?? null,
        verifiedAt: new Date().toISOString(),
        claimDigest: now,
      }
    }
    // Already verified. The reference is part of the verification; verifier, time and digest are
    // server-held and never taken from the request.
    if ((next.reference ?? prev.reference ?? null) !== (prev.reference ?? null) && !mayVerify(req))
      throw publicError('Only administrators can change verified evidence', 403)
    if (prev.claimDigest !== now)
      // The claim changed in some language: this verification no longer covers it.
      return {
        ...next,
        reference: next.reference ?? prev.reference,
        status: 'unverified',
        ...UNVERIFIED,
      }
    return {
      ...next,
      status,
      verifiedBy: idOf(prev.verifiedBy),
      verifiedAt: prev.verifiedAt ?? null,
      claimDigest: prev.claimDigest,
    }
  }
  return {
    name,
    type: 'group',
    admin: {
      description:
        'Claims are publishable only once verified by an administrator, with a recorded evidence reference. Changing the claim in any language removes the verification.',
    },
    hooks: {
      beforeChange: [bind],
      // A copy is a new document: its claims need their own verification.
      beforeDuplicate: [
        ({ value }) => ({ ...(isObj(value) ? value : {}), status: 'unverified', ...UNVERIFIED }),
      ],
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
      },
      { name: 'reference', type: 'text', maxLength: 500 },
      { name: 'verifiedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
      { name: 'verifiedAt', type: 'date', admin: { readOnly: true } },
      { name: 'claimDigest', type: 'text', maxLength: 64, admin: { hidden: true } },
    ],
  }
}

const idOf = (v: unknown) => (isObj(v) ? ((v as { id?: unknown }).id ?? null) : (v ?? null))

/** Claim-bearing text fields and the evidence group that must be verified to publish them. */
export const CLAIM_EVIDENCE = [
  ['accreditationStatement', 'accreditationEvidence'],
  ['companyName', 'companyNameEvidence'],
  ['address', 'addressEvidence'],
] as const

/** Block types whose `items` are claims, with how their rows are compared. */
export const CLAIM_BLOCKS: Record<string, ClaimSpec> = {
  stats: { field: 'items', rows: [{ name: 'value' }, { name: 'label', localized: true }] },
  credentials: {
    field: 'items',
    rows: [
      { name: 'name', localized: true },
      { name: 'issuer', localized: true },
      { name: 'validUntil', date: true },
    ],
  },
}

/** Paths of claim evidence that is not verified (publish gate, single-locale view). */
export function unverifiedClaims(data: unknown): string[] {
  const out: string[] = []
  const visit = (v: unknown, p: string, depth: number) => {
    if (depth > 30 || !v || typeof v !== 'object') return
    if (Array.isArray(v)) return v.forEach((x, i) => visit(x, `${p}.${i}`, depth + 1))
    const o = v as Record<string, unknown>
    const claimBlock = typeof o.blockType === 'string' && o.blockType in CLAIM_BLOCKS
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

/**
 * Backstop on the stored all-locale document after a write (collection and global hooks run
 * before field hooks, so the request-time gate can see a verification the write then removes).
 * For a document published in any language: every claim present in some language needs verified
 * evidence whose digest matches the stored claim.
 */
export function storedClaimProblems(doc: Obj): string[] {
  const out: string[] = []
  const ok = (ev: unknown, spec: ClaimSpec, parent: Obj) =>
    isObj(ev) && ev.status === 'verified' && ev.claimDigest === claimDigestStored(spec, parent)
  for (const [claim, evidence] of CLAIM_EVIDENCE) {
    const values = doc[claim]
    const present =
      isObj(values) && Object.values(values).some((v) => typeof v === 'string' && v.trim())
    if (present && !ok(doc[evidence], { field: claim }, doc)) out.push(`$.${evidence}`)
  }
  const sections = Array.isArray(doc.sections) ? (doc.sections as Obj[]) : []
  sections.forEach((b, i) => {
    const spec = typeof b.blockType === 'string' ? CLAIM_BLOCKS[b.blockType] : undefined
    if (spec && !ok(b.evidence, spec, b)) out.push(`$.sections.${i}.evidence`)
  })
  return out
}
