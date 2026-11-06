// F-1 guard: Payload's JSON and code fields mount Monaco, whose loader is inlined in Payload's
// prebuilt client bundle and fetches from cdn.jsdelivr.net. The admin CSP now refuses that, so a
// default JSON/code field would render broken. Every such field must use a project component.
import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

function codeFields(fields: Field[], at: string, out: string[] = []): string[] {
  for (const f of fields as (Field & {
    name?: string
    fields?: Field[]
    blocks?: { slug: string; fields: Field[] }[]
    tabs?: { name?: string; fields: Field[] }[]
    admin?: { components?: { Field?: unknown } }
  })[]) {
    const here = `${at}.${f.name ?? f.type}`
    if ((f.type === 'json' || f.type === 'code') && !f.admin?.components?.Field) out.push(here)
    if (f.fields) codeFields(f.fields, here, out)
    for (const b of f.blocks ?? []) codeFields(b.fields, `${here}[${b.slug}]`, out)
    for (const t of f.tabs ?? []) codeFields(t.fields, `${here}.${t.name ?? 'tab'}`, out)
  }
  return out
}

describe('admin code editors (F-1)', () => {
  it('no JSON or code field uses the default (Monaco) editor', async () => {
    const config = await (await import('../../../src/payload.config')).default
    // Payload's internal collections are never shown in the admin; prove it rather than assume.
    const internal = config.collections.filter((c) => c.slug.startsWith('payload-'))
    for (const c of internal) expect(c.admin?.hidden, c.slug).toBe(true)
    const found = [
      ...config.collections
        .filter((c) => !c.slug.startsWith('payload-'))
        .flatMap((c) => codeFields(c.fields, c.slug)),
      ...(config.globals ?? []).flatMap((g) => codeFields(g.fields, g.slug)),
    ]
    expect(found).toEqual([])
  })
})
