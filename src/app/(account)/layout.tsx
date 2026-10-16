import type { ReactNode } from 'react'
import './account.css'

export const metadata = { title: 'Altamiuz CMS account', robots: { index: false, follow: false } }

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main className="account">{children}</main>
      </body>
    </html>
  )
}
