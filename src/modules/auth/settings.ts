// Owner-only security settings (T068) with enforced safe bounds. Defaults follow A-6/A-8.
import type { GlobalConfig, Payload } from 'payload'
import { allow, isMfaVerified, roleOf } from '../access'
import { recordAudit } from '../audit'
import { hasRecentReauth } from './reauth'

export const SECURITY_DEFAULTS = {
  idleMinutes: 30,
  absoluteHours: 12,
  lockoutThreshold: 5,
  lockoutMinutes: 15,
} as const
export const SECURITY_BOUNDS = {
  idleMinutes: [5, 60],
  absoluteHours: [1, 12],
  lockoutThreshold: [3, 10],
  lockoutMinutes: [5, 60],
} as const
type Numeric = { -readonly [K in keyof typeof SECURITY_DEFAULTS]: number }
/** `requireMfa`: when false (the default; owner decision 2026-11-14, FR-033 as amended, ADR-012),
 * an account without an authenticator app completes sign-in with its password or a passkey alone;
 * an account that set one up is always asked for the code. When true, every account must complete
 * a second step (authenticator code, recovery code, or a passkey after the password). */
export type SecuritySettings = Numeric & { requireMfa: boolean }
export const REQUIRE_MFA_DEFAULT = false

const bounded = (name: keyof typeof SECURITY_BOUNDS) => ({
  name,
  type: 'number' as const,
  required: true,
  defaultValue: SECURITY_DEFAULTS[name],
  min: SECURITY_BOUNDS[name][0],
  max: SECURITY_BOUNDS[name][1],
})

export const securitySettings: GlobalConfig = {
  slug: 'security-settings',
  admin: { group: 'Security' },
  access: {
    read: allow('security-settings', 'update'),
    // Owner only, with a completed sign-in and recent re-authentication (FR-039).
    update: ({ req }) =>
      isMfaVerified(req.user) && roleOf(req.user) === 'owner' && hasRecentReauth(req.user),
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        resetSecuritySettingsCache()
        await recordAudit(req.payload, {
          actor: req.user ? `user:${req.user.id}` : 'system',
          action: 'settings.change',
          target: { type: 'global', id: 'security-settings' },
          outcome: 'success',
          meta: { global: 'security-settings' },
        })
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'requireMfa',
      type: 'checkbox',
      defaultValue: REQUIRE_MFA_DEFAULT,
      label: 'Require two-factor authentication for every account',
      admin: {
        description:
          'Off (default): accounts without an authenticator app complete sign-in with their password or a passkey alone; anyone can add an authenticator app or passkeys under Account security. On: every sign-in needs a second step (authenticator code, recovery code, or a passkey after the password); accounts without one are asked to set up an authenticator app at their next sign-in. Other server instances apply a change within 30 seconds.',
      },
    },
    bounded('idleMinutes'),
    bounded('absoluteHours'),
    bounded('lockoutThreshold'),
    bounded('lockoutMinutes'),
  ],
}

let cache: { at: number; value: SecuritySettings } | undefined

export async function getSecuritySettings(payload: Payload): Promise<SecuritySettings> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value
  const doc = (await payload
    .findGlobal({ slug: 'security-settings' as never, overrideAccess: true })
    .catch(() => ({}))) as Partial<SecuritySettings>
  const value = {
    ...SECURITY_DEFAULTS,
    requireMfa: typeof doc.requireMfa === 'boolean' ? doc.requireMfa : REQUIRE_MFA_DEFAULT,
  } as SecuritySettings
  for (const k of Object.keys(SECURITY_BOUNDS) as (keyof Numeric)[]) {
    const v = doc[k]
    const [lo, hi] = SECURITY_BOUNDS[k]
    if (typeof v === 'number' && Number.isFinite(v)) value[k] = Math.min(hi, Math.max(lo, v))
  }
  cache = { at: Date.now(), value }
  return value
}

export function resetSecuritySettingsCache() {
  cache = undefined
}
