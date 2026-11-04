'use client'
// UX only: sends sessions that have not completed MFA to the second-factor page. Enforcement is
// server-side (requireMfa in every access function), so bypassing this changes nothing.
// Checked on every admin route change, not only on mount: the provider mounts on the login page
// (signed out) and stays mounted when the login form navigates client-side to /admin, so a
// mount-only check left freshly signed-in users on an empty dashboard.
import { usePathname } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

export function MfaGate({ children }: { children?: ReactNode }) {
  const pathname = usePathname()
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
  }, [pathname])
  return <>{children}</>
}
