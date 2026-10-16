import { TokenForm } from '@/modules/auth'
export const dynamic = 'force-dynamic'
export default function Page() {
  return (
    <>
      <h1>Accept your invitation</h1>
      <TokenForm
        endpoint="/api/invitations/accept"
        withName
        submit="Create account"
        successText="Account created. Sign in to set up two-factor authentication."
      />
    </>
  )
}
