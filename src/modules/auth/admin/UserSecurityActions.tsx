'use client'
// Account security actions on the user edit view (T065). Every action is re-checked on the
// server (role rules, MFA, recent re-authentication) and audited; this component only calls it.
import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

const ACTIONS = [
  { id: 'revoke-sessions', label: 'End all sessions' },
  { id: 'reset-mfa', label: 'Reset two-factor authentication' },
] as const

export function UserSecurityActions() {
  const { id } = useDocumentInfo()
  const [message, setMessage] = useState('')
  if (!id) return null
  const run = async (action: string) => {
    setMessage('Working…')
    const res = await fetch(`/api/users/${id}/${action}`, {
      method: 'POST',
      credentials: 'same-origin',
    })
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    setMessage(
      res.ok
        ? 'Done.'
        : body.error === 'reauth_required'
          ? 'Confirm your password on /account/security first, then retry.'
          : 'Not permitted.',
    )
  }
  return (
    <fieldset style={{ border: 0, padding: 0, margin: '1rem 0' }}>
      <legend>Account security</legend>
      {ACTIONS.map((a) => (
        <button
          key={a.id}
          type="button"
          className="btn btn--style-secondary"
          onClick={() => run(a.id)}
        >
          {a.label}
        </button>
      ))}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </fieldset>
  )
}
