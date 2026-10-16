// Password policy (FR-032): ≥12 characters, not a known-common password, no composition rules,
// no forced rotation. Offline list: data/passwords/common-12plus.txt.gz (SOURCE.md).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'

export const PASSWORD_MIN = 12
export const PASSWORD_MAX = 256
export type PasswordProblem = 'too_short' | 'too_long' | 'common' | 'contains_email'

let common: Set<string> | undefined
function commonPasswords(): Set<string> {
  if (!common) {
    const file = path.resolve(process.cwd(), 'data/passwords/common-12plus.txt.gz')
    common = new Set(gunzipSync(readFileSync(file)).toString('utf8').split('\n').filter(Boolean))
  }
  return common
}

export function checkPassword(
  password: unknown,
  context: { email?: string } = {},
): PasswordProblem | null {
  if (typeof password !== 'string') return 'too_short'
  const length = [...password].length
  if (length < PASSWORD_MIN) return 'too_short'
  if (length > PASSWORD_MAX) return 'too_long'
  const lower = password.toLowerCase()
  if (commonPasswords().has(lower)) return 'common'
  const local = context.email?.split('@')[0]?.toLowerCase()
  if (local && local.length >= 4 && lower.includes(local)) return 'contains_email'
  return null
}
