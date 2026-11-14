import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
// "/account" itself has no content; account settings live under Account security.
export default function Page() {
  redirect('/account/security')
}
