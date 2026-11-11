import type { ReactNode } from 'react'
import { fontVariables } from '@/ui/fonts'
import '../(site)/globals.css'

export const metadata = { robots: { index: false, follow: false } }

// FR-022: drafts render with the public stylesheet and typefaces, so preview looks like the
// published page. Language and direction are set on the previewed <article>.
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  )
}
