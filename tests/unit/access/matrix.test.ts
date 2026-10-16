// T031: the code matrix must equal contracts/access-matrix.md cell-for-cell (drift detection),
// plus the escalation invariants. Every role × action is asserted, allowed and denied.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  allow,
  can,
  canActOnUser,
  ROLES,
  type Action,
  type Resource,
  type Role,
  type UserAction,
} from '@/modules/access'

const CONTRACT = path.resolve('specs/001-v1-website-cms/contracts/access-matrix.md')

type Row = { label: string; cells: Record<Role, string> }
function parseContract(): Row[] {
  const lines = fs
    .readFileSync(CONTRACT, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| '))
  const [header, ...body] = lines
  expect(header).toMatch(/Resource \/ action \| Editor \| Publisher \| Administrator \| Owner/)
  return body.map((l) => {
    const c = l
      .split('|')
      .slice(1, -1)
      .map((s) => s.trim())
    return {
      label: c[0]!,
      cells: { editor: c[1]!, publisher: c[2]!, administrator: c[3]!, owner: c[4]! },
    }
  })
}
const allowedIn = (cell: string) => cell.startsWith('✓')

type Check = (role: Role) => boolean
const res =
  (resources: Resource[], actions: Action[]): Check =>
  (role) => {
    const results = resources.flatMap((r) => actions.map((a) => can(role, r, a)))
    // a row is all-or-nothing for its resources × actions
    expect(new Set(results).size).toBe(1)
    return results[0]!
  }
const userRow =
  (targets: Role[], actions: UserAction[]): Check =>
  (role) => {
    const results = targets.flatMap((t) =>
      actions.map((a) =>
        canActOnUser(role, a, { targetRole: t, targetIsLastOwner: false, isSelf: false }),
      ),
    )
    expect(new Set(results).size).toBe(1)
    return results[0]!
  }
const SAME = ['invite', 'suspend', 'revokeSessions', 'resetMfa'] as UserAction[]

// Every contract row must appear here, mapped to the code it governs.
const ROW_MAP: Record<string, Check> = {
  'pages/services/courses: read, create, update draft': res(
    ['pages', 'services', 'courses'],
    ['read', 'create', 'updateDraft'],
  ),
  'pages/services/courses: publish, unpublish, restore': res(
    ['pages', 'services', 'courses'],
    ['publish', 'unpublish', 'restore'],
  ),
  'pages/services/courses: delete': res(['pages', 'services', 'courses'], ['delete']),
  'evidence: set `verified`': res(['evidence'], ['verify']),
  'media: read, upload, update (alt, focal point)': res(['media'], ['read', 'upload', 'update']),
  'media: delete': res(['media'], ['delete']),
  'navigation, banner: read': res(['navigation', 'banner'], ['read']),
  'navigation, banner: create, update draft': res(
    ['navigation', 'banner'],
    ['create', 'updateDraft'],
  ),
  'navigation, banner: publish, unpublish': res(['navigation', 'banner'], ['publish', 'unpublish']),
  'navigation, banner: delete': res(['navigation', 'banner'], ['delete']),
  'redirects: read': res(['redirects'], ['read']),
  'redirects: create, update, delete': res(['redirects'], ['create', 'update', 'delete']),
  'site-settings: read': res(['site-settings'], ['read']),
  'site-settings: update, publish': res(['site-settings'], ['update', 'publish']),
  'enquiries: read, export, delete': res(['enquiries'], ['read', 'export', 'delete']),
  'audit-events: read, export': res(['audit-events'], ['read', 'export']),
  'users: read directory (never authentication secrets)': res(['users'], ['read']),
  'users: invite, suspend, revoke sessions, reset MFA (editor/publisher targets)': userRow(
    ['editor', 'publisher'],
    SAME,
  ),
  'users: same actions on administrator targets': userRow(['administrator'], SAME),
  'users: same actions on owner targets': userRow(['owner'], SAME),
  'users: change role': (role) =>
    canActOnUser(role, 'changeRole', {
      targetRole: 'editor',
      newRole: 'publisher',
      targetIsLastOwner: false,
      isSelf: false,
    }),
  'own account: password, MFA, sessions (recent re-auth)': res(['own-account'], ['update']),
  'security settings (session timeouts, lockout thresholds)': res(
    ['security-settings'],
    ['update'],
  ),
}

describe('contract ↔ code matrix (drift detection)', () => {
  const rows = parseContract()

  it('maps every contract row, and only contract rows', () => {
    expect(rows.map((r) => r.label).sort()).toEqual(Object.keys(ROW_MAP).sort())
  })

  for (const row of rows) {
    for (const role of ROLES) {
      const expected = allowedIn(row.cells[role])
      it(`${row.label} — ${role}: ${expected ? 'allowed' : 'denied'}`, () => {
        expect(ROW_MAP[row.label]!(role)).toBe(expected)
      })
    }
  }
})

describe('users: qualifiers and invariants (FR-038)', () => {
  const t = (targetRole: Role, extra: Partial<Parameters<typeof canActOnUser>[2]> = {}) => ({
    targetRole,
    targetIsLastOwner: false,
    isSelf: false,
    ...extra,
  })

  it('administrators change roles only to ≤ publisher, and only on editor/publisher targets', () => {
    expect(canActOnUser('administrator', 'changeRole', t('editor', { newRole: 'publisher' }))).toBe(
      true,
    )
    expect(canActOnUser('administrator', 'changeRole', t('publisher', { newRole: 'editor' }))).toBe(
      true,
    )
    expect(
      canActOnUser('administrator', 'changeRole', t('editor', { newRole: 'administrator' })),
    ).toBe(false)
    expect(canActOnUser('administrator', 'changeRole', t('editor', { newRole: 'owner' }))).toBe(
      false,
    )
    expect(
      canActOnUser('administrator', 'changeRole', t('administrator', { newRole: 'editor' })),
    ).toBe(false)
    expect(canActOnUser('administrator', 'changeRole', t('owner', { newRole: 'editor' }))).toBe(
      false,
    )
  })

  it('owners may invite any role including owner; others only strictly below their own', () => {
    for (const target of ROLES) expect(canActOnUser('owner', 'invite', t(target))).toBe(true)
    expect(canActOnUser('administrator', 'invite', t('administrator'))).toBe(false)
    expect(canActOnUser('publisher', 'invite', t('editor'))).toBe(false)
  })

  it.each(ROLES)('no %s can raise themselves', (role) => {
    for (const newRole of ROLES) {
      if (ROLES.indexOf(newRole) <= ROLES.indexOf(role)) continue
      expect(canActOnUser(role, 'changeRole', t(role, { isSelf: true, newRole }))).toBe(false)
    }
  })

  it.each(ROLES)('no %s can grant a role above their own to anyone', (role) => {
    for (const newRole of ROLES) {
      if (ROLES.indexOf(newRole) <= ROLES.indexOf(role)) continue
      for (const target of ROLES)
        expect(canActOnUser(role, 'changeRole', t(target, { newRole }))).toBe(false)
    }
  })

  it('the last owner cannot be demoted, suspended, have sessions revoked or MFA reset by anyone', () => {
    for (const action of ['suspend', 'revokeSessions', 'resetMfa'] as UserAction[])
      expect(canActOnUser('owner', action, t('owner', { targetIsLastOwner: true }))).toBe(false)
    expect(
      canActOnUser(
        'owner',
        'changeRole',
        t('owner', { targetIsLastOwner: true, newRole: 'administrator' }),
      ),
    ).toBe(false)
    expect(
      canActOnUser(
        'owner',
        'changeRole',
        t('owner', { targetIsLastOwner: true, isSelf: true, newRole: 'editor' }),
      ),
    ).toBe(false)
  })

  it('editors and publishers cannot manage any account', () => {
    for (const actor of ['editor', 'publisher'] as Role[])
      for (const action of [...SAME, 'changeRole'] as UserAction[])
        for (const target of ROLES)
          expect(canActOnUser(actor, action, t(target, { newRole: 'editor' }))).toBe(false)
  })
})

describe('unknown inputs are denied (deny by default)', () => {
  it.each([
    ['unknown role', 'superuser', 'pages', 'read'],
    ['case-variant role', 'Owner', 'pages', 'read'],
    ['padded role', 'owner ', 'pages', 'read'],
    ['unknown resource', 'owner', 'users-table', 'read'],
    ['unknown action', 'owner', 'pages', 'impersonate'],
    ['prototype key', 'owner', '__proto__', 'read'],
    ['unlisted (users delete via matrix)', 'owner', 'users', 'delete'],
  ])('%s', (_l, role, resource, action) => {
    expect(can(role as Role, resource as Resource, action as Action)).toBe(false)
  })
})

describe('Payload access wrappers (requireAuth + requireMfa + matrix)', () => {
  const access = allow('pages', 'publish')
  const call = (user: unknown) => access({ req: { user } } as never)

  it('denies anonymous requests', () => expect(call(undefined)).toBe(false))
  it('denies a password-only session (MFA not completed)', () =>
    expect(call({ id: 1, role: 'owner', mfaVerified: false })).toBe(false))
  it('denies a missing MFA flag', () => expect(call({ id: 1, role: 'owner' })).toBe(false))
  it('denies truthy-but-not-true MFA flags', () =>
    expect(call({ id: 1, role: 'owner', mfaVerified: 'true' })).toBe(false))
  it('denies an unknown role even with MFA', () =>
    expect(call({ id: 1, role: 'root', mfaVerified: true })).toBe(false))
  it('denies an editor publishing (FR-024)', () =>
    expect(call({ id: 1, role: 'editor', mfaVerified: true })).toBe(false))
  it('allows a publisher with MFA', () =>
    expect(call({ id: 1, role: 'publisher', mfaVerified: true })).toBe(true))
})
