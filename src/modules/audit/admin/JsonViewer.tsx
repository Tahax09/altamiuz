'use client'
// Read-only JSON viewer for audit metadata (closes F-1). Payload's default JSON field mounts the
// Monaco editor, whose loader fetches scripts and workers from cdn.jsdelivr.net; that put
// third-party code in the authenticated admin. Audit events are append-only, so the field only
// ever needs to be read: this renders the value as escaped text, with no editor and no network.
import { FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'

const MAX_CHARS = 20_000

export function format(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  let text: string
  try {
    text = typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? '')
  } catch {
    text = '[unreadable value]'
  }
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n… (truncated)` : text
}

export const JsonViewer: JSONFieldClientComponent = ({ field, path }) => {
  const { value } = useField<unknown>({ path: path ?? field.name })
  const text = format(value)
  const id = `field-${(path ?? field.name).replace(/\./g, '__')}`
  return (
    <div className="field-type json-field read-only altamiuz-json-viewer">
      <FieldLabel label={field.label ?? field.name} path={path} htmlFor={id} />
      {text ? (
        <pre id={id} tabIndex={0} aria-readonly="true" data-testid="json-viewer">
          {text}
        </pre>
      ) : (
        <p id={id} data-testid="json-viewer">
          (none)
        </p>
      )}
    </div>
  )
}
