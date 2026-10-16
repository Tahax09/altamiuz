import { MfaFlow } from '@/modules/auth'
export const dynamic = 'force-dynamic'
export default function Page() {
  return (
    <>
      <h1>Two-factor authentication</h1>
      <MfaFlow />
    </>
  )
}
