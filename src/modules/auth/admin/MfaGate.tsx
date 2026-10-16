'use client'
// UX only: sends sessions that have not completed MFA to the second-factor page. Enforcement is
// server-side (requireMfa in every access function), so bypassing this changes nothing.
import { useEffect, type ReactNode } from 'react'

export function MfaGate({ children }: { children?: ReactNode }) {
  useEffect(() => {
    let cancelled = false
    fetch('/api/users/mfa/status', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => r.json())
      .then((s: { authenticated: boolean; mfaVerified: boolean }) => {
        if (!cancelled && s.authenticated && !s.mfaVerified) window.location.assign('/account/mfa')
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  return <>{children}</>
}
