'use client'
// Admin login page (after the password form): passwordless sign-in with a passkey (ADR-012).
import { PasskeySignIn } from '../ui/forms'

export function PasskeyLogin() {
  return (
    <div style={{ marginBlockStart: 'var(--base, 1.5rem)' }}>
      <PasskeySignIn />
    </div>
  )
}
