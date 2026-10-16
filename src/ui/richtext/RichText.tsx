// Safe rich-text renderer (T083, FR-013c/d, D-22, D-24). Walks its own allow-list instead of
// Payload's default converters: unknown nodes render nothing, disallowed URLs render as text,
// no inline styles, and Latin runs inside RTL text are isolated with <bdi>. Used by preview and
// (US1) the public site, so both produce identical markup.
import { Fragment, type ReactNode } from 'react'
import { safeHref } from '@/modules/content'

type N = {
  type?: string
  children?: N[]
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  direction?: string | null
  fields?: {
    url?: unknown
    newTab?: boolean
    linkType?: string
    doc?: { relationTo?: string; value?: unknown }
  }
}

const LATIN_RUN = /([A-Za-z0-9][A-Za-z0-9 .,:;/@+\-_()#%&]*[A-Za-z0-9)%])/g
const dirOf = (n: N, inherited: 'rtl' | 'ltr' | 'auto') =>
  n.direction === 'rtl' || n.direction === 'ltr' ? n.direction : inherited

function textWithBdi(text: string, rtl: boolean): ReactNode {
  if (!rtl) return text
  const parts = text.split(LATIN_RUN)
  return parts.map((p, i) =>
    i % 2 === 1 ? <bdi key={i}>{p}</bdi> : <Fragment key={i}>{p}</Fragment>,
  )
}

export type InternalHref = (relationTo: string, value: unknown) => string | null

// Matches the write-time policy (LIMITS.depth) with headroom; stored data deeper than this was
// never written through the CMS, so it is dropped rather than risking unbounded recursion.
const MAX_DEPTH = 20

function render(
  n: N,
  key: number,
  dir: 'rtl' | 'ltr' | 'auto',
  internalHref?: InternalHref,
  depth = 0,
): ReactNode {
  if (!n || typeof n !== 'object' || depth > MAX_DEPTH) return null
  const kids = (d = dir) =>
    Array.isArray(n.children)
      ? n.children.map((c, i) => render(c, i, d, internalHref, depth + 1))
      : null
  switch (n.type) {
    case 'text': {
      if (typeof n.text !== 'string') return null
      const f = typeof n.format === 'number' ? n.format : 0
      let out: ReactNode = textWithBdi(n.text, dir === 'rtl')
      if (f & 2) out = <em>{out}</em>
      if (f & 1) out = <strong>{out}</strong>
      return <Fragment key={key}>{out}</Fragment>
    }
    case 'linebreak':
      return <br key={key} />
    case 'paragraph': {
      const d = dirOf(n, dir)
      return (
        <p key={key} dir={d}>
          {kids(d)}
        </p>
      )
    }
    case 'heading': {
      const d = dirOf(n, dir)
      const Tag = n.tag === 'h3' ? 'h3' : n.tag === 'h4' ? 'h4' : 'h2'
      return (
        <Tag key={key} dir={d}>
          {kids(d)}
        </Tag>
      )
    }
    case 'quote': {
      const d = dirOf(n, dir)
      return (
        <blockquote key={key} dir={d}>
          {kids(d)}
        </blockquote>
      )
    }
    case 'list': {
      const d = dirOf(n, dir)
      return n.listType === 'number' ? (
        <ol key={key} dir={d}>
          {kids(d)}
        </ol>
      ) : (
        <ul key={key} dir={d}>
          {kids(d)}
        </ul>
      )
    }
    case 'listitem':
      return <li key={key}>{kids()}</li>
    case 'link':
    case 'autolink': {
      const href =
        n.fields?.linkType === 'internal'
          ? n.fields.doc?.relationTo && internalHref
            ? internalHref(n.fields.doc.relationTo, n.fields.doc.value)
            : null
          : safeHref(n.fields?.url)
      if (!href) return <span key={key}>{kids()}</span>
      const newTab = n.fields?.newTab === true && /^https?:/.test(href)
      return (
        <a
          key={key}
          href={href}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {kids()}
        </a>
      )
    }
    default:
      return null // unknown or disallowed node: never rendered
  }
}

export function RichText({
  value,
  dir = 'auto',
  internalHref,
}: {
  value: unknown
  dir?: 'rtl' | 'ltr' | 'auto'
  internalHref?: InternalHref
}) {
  const root = (value as { root?: N } | null)?.root
  if (!root || root.type !== 'root' || !Array.isArray(root.children)) return null
  return <>{root.children.map((c, i) => render(c, i, dir, internalHref))}</>
}
