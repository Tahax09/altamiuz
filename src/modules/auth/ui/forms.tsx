'use client'
// Account forms (T061, FR-080). English UI; labelled fields, errors announced and focused.
import { useRef, useState, type FormEvent, type ReactNode } from 'react'

type Field = {
  name: string
  label: string
  type?: string
  autoComplete?: string
  inputMode?: 'numeric' | 'text'
}

const MESSAGES: Record<string, string> = {
  invalid: 'That code or link is not valid.',
  invalid_or_expired: 'This link is invalid, already used or expired.',
  rate_limited: 'Too many attempts. Wait a few minutes and try again.',
  too_short: 'Use at least 12 characters.',
  too_long: 'Use at most 256 characters.',
  common: 'That password is too common. Choose another.',
  contains_email: 'Do not include your e-mail name in the password.',
  reauth_required: 'Confirm your password first.',
  mfa_required: 'Complete two-factor authentication first.',
  unauthenticated: 'Sign in first.',
  expired: 'Enrolment expired. Start again.',
}

export function ApiForm(props: {
  endpoint: string
  fields: Field[]
  submit: string
  extra?: Record<string, string>
  onSuccess?: (body: Record<string, unknown>) => void
  successText?: string
  children?: ReactNode
}) {
  const [state, setState] = useState<{ text: string; error: boolean }>({ text: '', error: false })
  const msg = useRef<HTMLParagraphElement>(null)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const res = await fetch(props.endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...data, ...props.extra }),
    })
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (res.ok) {
      setState({ text: props.successText ?? 'Done.', error: false })
      props.onSuccess?.(body)
    } else {
      setState({ text: MESSAGES[String(body.error)] ?? 'Request failed.', error: true })
    }
    requestAnimationFrame(() => msg.current?.focus())
  }
  return (
    <form onSubmit={submit} noValidate>
      {props.children}
      {props.fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`f-${f.name}`}>{f.label}</label>
          <input
            id={`f-${f.name}`}
            name={f.name}
            type={f.type ?? 'text'}
            autoComplete={f.autoComplete}
            inputMode={f.inputMode}
            required
            aria-invalid={state.error || undefined}
            aria-describedby="form-message"
          />
        </div>
      ))}
      <button type="submit">{props.submit}</button>
      <p
        id="form-message"
        ref={msg}
        tabIndex={-1}
        role={state.error ? 'alert' : 'status'}
        className={`message${state.error ? ' error' : ''}`}
      >
        {state.text}
      </p>
    </form>
  )
}

export function RecoveryCodes({ codes }: { codes: string[] }) {
  return (
    <section aria-labelledby="codes-h">
      <h2 id="codes-h">Recovery codes</h2>
      <p>Store these now. Each works once. They will not be shown again.</p>
      <ul className="codes">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </section>
  )
}

export function MfaFlow() {
  const [enrolment, setEnrolment] = useState<{ secret: string; otpauthUri: string } | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [useRecovery, setUseRecovery] = useState(false)
  const done = () => window.location.assign('/admin')
  if (codes)
    return (
      <>
        <RecoveryCodes codes={codes} />
        <button type="button" onClick={done}>
          Continue to the CMS
        </button>
      </>
    )
  if (enrolment)
    return (
      <>
        <p>Add this account to your authenticator app, then enter the 6-digit code it shows.</p>
        <label htmlFor="secret">Setup key</label>
        <code id="secret">{enrolment.secret}</code>
        <ApiForm
          endpoint="/api/users/mfa/enrol/confirm"
          submit="Confirm"
          fields={[
            {
              name: 'code',
              label: '6-digit code',
              autoComplete: 'one-time-code',
              inputMode: 'numeric',
            },
          ]}
          onSuccess={(b) => setCodes(b.recoveryCodes as string[])}
        />
      </>
    )
  return (
    <>
      {useRecovery ? (
        <ApiForm
          endpoint="/api/users/mfa/recovery"
          submit="Use recovery code"
          fields={[{ name: 'code', label: 'Recovery code', autoComplete: 'off' }]}
          onSuccess={done}
        />
      ) : (
        <ApiForm
          endpoint="/api/users/mfa/verify"
          submit="Verify"
          fields={[
            {
              name: 'code',
              label: '6-digit code from your authenticator app',
              autoComplete: 'one-time-code',
              inputMode: 'numeric',
            },
          ]}
          onSuccess={done}
        />
      )}
      <button type="button" className="secondary" onClick={() => setUseRecovery((v) => !v)}>
        {useRecovery ? 'Use authenticator code instead' : 'Use a recovery code'}
      </button>
      <button
        type="button"
        className="secondary"
        onClick={async () => {
          const r = await fetch('/api/users/mfa/enrol/start', {
            method: 'POST',
            credentials: 'same-origin',
          })
          if (r.ok) setEnrolment(await r.json())
        }}
      >
        Set up two-factor authentication (first sign-in)
      </button>
    </>
  )
}

export function TokenForm(props: {
  endpoint: string
  withName?: boolean
  submit: string
  successText: string
}) {
  const token =
    typeof window === 'undefined'
      ? ''
      : (new URLSearchParams(window.location.search).get('token') ?? '')
  return (
    <ApiForm
      endpoint={props.endpoint}
      submit={props.submit}
      successText={props.successText}
      extra={{ token }}
      fields={[
        ...(props.withName ? [{ name: 'name', label: 'Full name', autoComplete: 'name' }] : []),
        {
          name: 'password',
          label: 'New password (at least 12 characters)',
          type: 'password',
          autoComplete: 'new-password',
        },
      ]}
    />
  )
}

export function SecurityPanel() {
  const [codes, setCodes] = useState<string[] | null>(null)
  const [sessions, setSessions] = useState<{ id: string; createdAt: string; current: boolean }[]>(
    [],
  )
  const load = async () => {
    const r = await fetch('/api/users/sessions', { credentials: 'same-origin' })
    if (r.ok) setSessions(((await r.json()) as { sessions: typeof sessions }).sessions)
  }
  return (
    <>
      <h2>Confirm it’s you</h2>
      <ApiForm
        endpoint="/api/users/reauth"
        submit="Confirm password"
        successText="Confirmed for 5 minutes."
        fields={[
          {
            name: 'password',
            label: 'Current password',
            type: 'password',
            autoComplete: 'current-password',
          },
        ]}
      />
      <h2>Change password</h2>
      <ApiForm
        endpoint="/api/users/password"
        submit="Change password"
        successText="Password changed. All sessions were ended; sign in again."
        fields={[
          {
            name: 'password',
            label: 'New password',
            type: 'password',
            autoComplete: 'new-password',
          },
        ]}
      />
      <h2>Recovery codes</h2>
      <ApiForm
        endpoint="/api/users/mfa/recovery-codes"
        submit="Generate new recovery codes"
        fields={[]}
        onSuccess={(b) => setCodes(b.recoveryCodes as string[])}
      />
      {codes && <RecoveryCodes codes={codes} />}
      <h2>Sessions</h2>
      <button type="button" className="secondary" onClick={load}>
        Show my sessions
      </button>
      <ul>
        {sessions.map((s) => (
          <li key={s.id}>
            Signed in {new Date(s.createdAt).toLocaleString('en-GB')}{' '}
            {s.current ? '(this session)' : ''}
          </li>
        ))}
      </ul>
    </>
  )
}
