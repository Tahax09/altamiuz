'use client'
// Localized error page (T104, FR-008, FR-095): never shows the error message, stack or digest.
import { useState } from 'react'
import { href, messages, type Locale } from '@/modules/i18n'

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  // Rendered on the client only (error boundary), so the document language is available.
  const [locale] = useState<Locale>(() =>
    typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar',
  )
  const m = messages[locale]
  return (
    <section className="status-page">
      <h1>{m.errorTitle}</h1>
      <p>{m.errorBody}</p>
      <p>
        <button type="button" onClick={() => reset()}>
          {m.tryAgain}
        </button>{' '}
        <a href={href('home', locale)}>{m.backHome}</a>
      </p>
    </section>
  )
}
