// Owner-only security settings (T068) with enforced safe bounds. Defaults follow A-6/A-8.
import type { GlobalConfig, Payload } from 'payload'
import { allow, isMfaVerified, roleOf } from '../access'

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
export type SecuritySettings = { -readonly [K in keyof typeof SECURITY_DEFAULTS]: number }

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
    update: ({ req }) => isMfaVerified(req.user) && roleOf(req.user) === 'owner',
  },
  fields: [
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
  const value = { ...SECURITY_DEFAULTS } as SecuritySettings
  for (const k of Object.keys(SECURITY_BOUNDS) as (keyof SecuritySettings)[]) {
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
