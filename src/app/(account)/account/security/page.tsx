import { SecurityPanel } from '@/modules/auth'
export const dynamic = 'force-dynamic'
export default function Page() {
  return (
    <>
      <h1>Account security</h1>
      <SecurityPanel />
    </>
  )
}
