// T044 (FR-032)
import { describe, expect, it } from 'vitest'
import { checkPassword } from '@/modules/auth'

describe('password policy', () => {
  it.each([
    ['11 characters', 'abcdefghijk', 'too_short'],
    ['common 12+ password', 'qwertyuiopasdfgh', 'common'],
    ['common, different case', 'QWERTYUIOPASDFGH', 'common'],
    ['contains the e-mail name', 'my samira.k password', 'contains_email'],
    ['too long', 'x'.repeat(257), 'too_long'],
    ['not a string', 12345678901234, 'too_short'],
  ])('rejects %s', (_l, pw, problem) => {
    expect(checkPassword(pw, { email: 'samira.k@example.ly' })).toBe(problem)
  })

  it.each([
    'correct horse battery staple', // no composition rules: lower-case words are fine
    'كلمة مرور عربية طويلة جداً',
    'Zq8!vT2m#L9x',
  ])('accepts %j (no composition rules)', (pw) => {
    expect(checkPassword(pw)).toBeNull()
  })

  it('permits passwords of 64 and 256 characters (ASVS V6.2.9)', () => {
    expect(checkPassword('a1 '.repeat(22).slice(0, 64))).toBeNull()
    expect(checkPassword('long passphrase '.repeat(16))).toBeNull()
  })

  it('counts characters, not bytes (12 Arabic letters pass)', () => {
    expect(checkPassword('أبتثجحخدذرزس')).toBeNull()
  })
})
