import { ApiForm, TokenForm } from '@/modules/auth'
export const dynamic = 'force-dynamic'
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <>
      <h1>Recover your password</h1>
      {token ? (
        <TokenForm
          endpoint="/api/users/recovery/complete"
          submit="Set new password"
          successText="Password set. Sign in again; two-factor authentication is still required."
        />
      ) : (
        <ApiForm
          endpoint="/api/users/recovery/request"
          submit="Send recovery link"
          successText="If the address belongs to an account, a link has been sent."
          fields={[
            { name: 'email', label: 'E-mail address', type: 'email', autoComplete: 'email' },
          ]}
        />
      )}
    </>
  )
}
