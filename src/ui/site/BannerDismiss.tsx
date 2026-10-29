'use client'
// Per-visitor banner dismissal (FR-036). Stored in localStorage under the server-computed
// dismissKey, which changes when the banner content changes. Without JavaScript the banner
// simply stays visible.
import { useEffect, useRef } from 'react'

const STORAGE = 'altamiuz-banner-dismissed'

export function BannerDismiss({ dismissKey, label }: { dismissKey: string; label: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const banner = () => ref.current?.closest<HTMLElement>('[data-dismiss-key]') ?? null
  useEffect(() => {
    try {
      const el = banner()
      if (el && localStorage.getItem(STORAGE) === dismissKey) el.hidden = true
    } catch {
      // storage unavailable: keep showing the banner
    }
  }, [dismissKey])
  return (
    <button
      ref={ref}
      type="button"
      className="site-banner__dismiss"
      onClick={() => {
        try {
          localStorage.setItem(STORAGE, dismissKey)
        } catch {
          // ignore
        }
        const el = banner()
        if (el) el.hidden = true
      }}
    >
      {label}
    </button>
  )
}
