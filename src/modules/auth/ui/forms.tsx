'use client'
// Account forms (T061, FR-080). English UI; labelled fields, errors announced and focused.
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

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
  passkey_required:
    'This account has a passkey. Confirm the sign-in with your passkey first, then set up an authenticator app.',
  too_many: 'This account already has the maximum number of passkeys. Remove one first.',
  already_registered: 'That passkey is already registered.',
  not_found: 'Not found.',
  not_allowed: 'A passkey sign-in cannot use a passkey as its second step.',
  not_enrolled: 'Nothing is set up for that yet.',
  cancelled: 'The passkey request was cancelled or timed out.',
  unsupported: 'This browser or device does not support passkeys.',
}

const post = async (url: string, body?: unknown) => {
  const r = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { ok: r.ok, body: (await r.json().catch(() => ({}))) as Record<string, unknown> }
}

/** GET a JSON body, or null on any non-2xx. An unread error body is cancelled: left open it keeps
 *  the request pending in the browser (the page never reaches network idle). */
const getJson = async <T,>(url: string): Promise<T | null> => {
  const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
  if (r.ok) return (await r.json()) as T
  await r.body?.cancel().catch(() => undefined)
  return null
}

/** Runs one WebAuthn ceremony: options → browser → verify. Returns the verify body or an error. */
async function ceremony(
  kind: 'register' | 'authenticate',
  base: string,
  extra: Record<string, unknown> = {},
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; error: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential)
    return { ok: false, error: 'unsupported' }
  const opts = await post(`${base}/options`)
  if (!opts.ok) return { ok: false, error: String(opts.body.error ?? 'invalid') }
  let response: unknown
  try {
    const optionsJSON = opts.body.options as never
    response =
      kind === 'register'
        ? await startRegistration({ optionsJSON })
        : await startAuthentication({ optionsJSON })
  } catch {
    return { ok: false, error: 'cancelled' }
  }
  const done = await post(`${base}/verify`, {
    challengeId: opts.body.challengeId,
    response,
    ...extra,
  })
  return done.ok
    ? { ok: true, body: done.body }
    : { ok: false, error: String(done.body.error ?? 'invalid') }
}

function Message({ text, error }: { text: string; error: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (text) ref.current?.focus()
  }, [text])
  return (
    <p
      ref={ref}
      tabIndex={-1}
      role={error ? 'alert' : 'status'}
      className={`message${error ? ' error' : ''}`}
    >
      {text}
    </p>
  )
}

/**
 * Passwordless sign-in with a passkey (admin login page and account pages). A passkey replaces
 * the password; it is not a second factor. Where a second step is still required, the next page
 * asks for it.
 */
export function PasskeySignIn() {
  const [state, setState] = useState({ text: '', error: false })
  return (
    <div className="passkey-sign-in">
      <button
        type="button"
        className="secondary"
        onClick={async () => {
          setState({ text: '', error: false })
          const r = await ceremony('authenticate', '/api/users/passkeys/login')
          if (!r.ok) {
            setState({
              text:
                r.error === 'invalid'
                  ? 'Sign-in with a passkey failed. Try again or use your password.'
                  : (MESSAGES[r.error] ?? 'Request failed.'),
              error: true,
            })
            return
          }
          window.location.assign(r.body.secondStepRequired ? '/account/mfa' : '/admin')
        }}
      >
        Sign in with a passkey
      </button>
      <Message {...state} />
    </div>
  )
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

/** QR code drawn as one SVG path from the server's module grid (black on white, 4-module quiet
 * zone), so it scans in dark mode too. */
function QrCode({ size, modules }: { size: number; modules: string }) {
  let d = ''
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (modules[y * size + x] === '1') d += `M${x + 4} ${y + 4}h1v1h-1z`
  const box = size + 8
  return (
    <svg
      role="img"
      aria-label="QR code for your authenticator app"
      viewBox={`0 0 ${box} ${box}`}
      width={220}
      height={220}
      shapeRendering="crispEdges"
    >
      <rect width={box} height={box} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  )
}

export function MfaFlow() {
  const [enrolment, setEnrolment] = useState<{
    secret: string
    otpauthUri: string
    qr?: { size: number; modules: string }
  } | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [useRecovery, setUseRecovery] = useState(false)
  const [status, setStatus] = useState<{
    enrolled?: boolean
    passkeys?: number
    signInMethod?: string
  }>({})
  const [pk, setPk] = useState({ text: '', error: false })
  useEffect(() => {
    fetch('/api/users/mfa/status', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => undefined)
  }, [])
  const done = () => window.location.assign('/admin')
  const passkeyStep = (status.passkeys ?? 0) > 0 && status.signInMethod === 'password'
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
        <p>
          Scan this code with your authenticator app (for example Google Authenticator, Microsoft
          Authenticator or 1Password), then enter the 6-digit code it shows.
        </p>
        {enrolment.qr ? <QrCode {...enrolment.qr} /> : null}
        <p>Can’t scan? Enter this setup key in the app instead.</p>
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
      {passkeyStep ? (
        <>
          <button
            type="button"
            onClick={async () => {
              const r = await ceremony('authenticate', '/api/users/passkeys/second-factor')
              if (r.ok) done()
              else
                setPk({ text: MESSAGES[r.error] ?? 'That passkey was not accepted.', error: true })
            }}
          >
            Confirm with a passkey
          </button>
          <Message {...pk} />
        </>
      ) : null}
      {status.enrolled === false ? null : useRecovery ? (
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
      {status.enrolled === false ? null : (
        <button type="button" className="secondary" onClick={() => setUseRecovery((v) => !v)}>
          {useRecovery ? 'Use authenticator code instead' : 'Use a recovery code'}
        </button>
      )}
      {status.enrolled ? null : (
        <ApiForm
          endpoint="/api/users/mfa/enrol/start"
          submit="Set up an authenticator app"
          fields={[]}
          successText="Scan the code below."
          onSuccess={(b) => setEnrolment(b as never)}
        />
      )}
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
  const [mfa, setMfa] = useState<{ enrolled?: boolean }>({})
  const [passkeys, setPasskeys] = useState<
    { id: number; name: string; createdAt: string; lastUsedAt: string | null; synced: boolean }[]
  >([])
  const [pkName, setPkName] = useState('')
  const [pkMsg, setPkMsg] = useState({ text: '', error: false })
  const loadPasskeys = async () => {
    const b = await getJson<{ passkeys: typeof passkeys }>('/api/users/passkeys')
    if (b) setPasskeys(b.passkeys)
  }
  useEffect(() => {
    fetch('/api/users/mfa/status', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => r.json())
      .then(setMfa)
      .catch(() => undefined)
    getJson<{ passkeys: typeof passkeys }>('/api/users/passkeys')
      .then((b) => b && setPasskeys(b.passkeys))
      .catch(() => undefined)
  }, [])
  const load = async () => {
    const b = await getJson<{ sessions: typeof sessions }>('/api/users/sessions')
    if (b) setSessions(b.sessions)
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
      <p>Adding or removing an authenticator app or a passkey needs this confirmation first.</p>
      <h2>Two-factor authentication (authenticator app)</h2>
      {mfa.enrolled ? (
        <>
          <p>On. Every sign-in asks for a 6-digit code from your authenticator app.</p>
          <ApiForm
            endpoint="/api/users/mfa/disable"
            submit="Turn off the authenticator app"
            fields={[]}
            successText="Turned off. Other sessions were ended."
            onSuccess={() => setMfa((m) => ({ ...m, enrolled: false }))}
          />
          <h3>Recovery codes</h3>
          <ApiForm
            endpoint="/api/users/mfa/recovery-codes"
            submit="Generate new recovery codes"
            fields={[]}
            onSuccess={(b) => setCodes(b.recoveryCodes as string[])}
          />
          {codes && <RecoveryCodes codes={codes} />}
        </>
      ) : (
        <p>
          Off. Add a 6-digit code from an authenticator app to every sign-in.{' '}
          <Link href="/account/mfa">Set up an authenticator app</Link>
        </p>
      )}
      <h2>Passkeys</h2>
      <p>
        A passkey signs you in with your device’s screen lock (fingerprint, face or PIN) instead of
        your password. On its own it is one sign-in step, not two-factor authentication: if your
        account has an authenticator app, or the owner requires two-factor authentication, you are
        still asked for the second step. After signing in with your password, a passkey can serve as
        that second step.
      </p>
      <ul>
        {passkeys.map((p) => (
          <li key={p.id}>
            {p.name} — added {new Date(p.createdAt).toLocaleDateString('en-GB')}
            {p.lastUsedAt
              ? `, last used ${new Date(p.lastUsedAt).toLocaleDateString('en-GB')}`
              : ''}
            {p.synced ? ' (synced)' : ''}{' '}
            <button
              type="button"
              className="secondary"
              onClick={async () => {
                const r = await fetch(`/api/users/passkeys/${p.id}`, {
                  method: 'DELETE',
                  credentials: 'same-origin',
                })
                const b = (await r.json().catch(() => ({}))) as { error?: string }
                setPkMsg(
                  r.ok
                    ? { text: 'Passkey removed. Other sessions were ended.', error: false }
                    : { text: MESSAGES[String(b.error)] ?? 'Request failed.', error: true },
                )
                if (r.ok) void loadPasskeys()
              }}
            >
              Remove {p.name}
            </button>
          </li>
        ))}
      </ul>
      <label htmlFor="passkey-name">Name for a new passkey (for example “Work laptop”)</label>
      <input
        id="passkey-name"
        maxLength={64}
        value={pkName}
        onChange={(e) => setPkName(e.target.value)}
      />
      <button
        type="button"
        onClick={async () => {
          const r = await ceremony('register', '/api/users/passkeys/register', { name: pkName })
          setPkMsg(
            r.ok
              ? { text: 'Passkey added.', error: false }
              : { text: MESSAGES[r.error] ?? 'Request failed.', error: true },
          )
          if (r.ok) {
            setPkName('')
            void loadPasskeys()
          }
        }}
      >
        Add a passkey
      </button>
      <Message {...pkMsg} />
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
