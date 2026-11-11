'use client'
// Localized error page (T104, FR-008, FR-095): never shows the error message, stack or digest.
import { useState } from 'react'
import { href, messages, type Locale } from '@/modules/i18n'
import { StatusView } from '@/ui/page/StatusView'

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  // Rendered on the client only (error boundary), so the document language is available.
  const [locale] = useState<Locale>(() =>
    typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar',
  )
  const m = messages[locale]
  return (
    <StatusView
      code={m.errorCode}
      title={m.errorTitle}
      body={<p>{m.errorBody}</p>}
      actions={
        <>
          <button type="button" className="button" onClick={() => reset()}>
            {m.tryAgain}
          </button>
          <a className="button button--secondary" href={href('home', locale)}>
            {m.backHome}
          </a>
        </>
      }
    />
  )
}
