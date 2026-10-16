// Rich-text allow-list policy (D-22, contracts/rich-text.md). Pure and dependency-free: used at
// write time (assertSafeRichText in field hooks, Phase 4) and render time (safeHref).
// Anything not explicitly allowed is rejected. Issues carry a path and code, never the value.

export const POLICY_VERSION = 1

export type RichTextIssueCode =
  | 'node_type'
  | 'attribute'
  | 'format'
  | 'style'
  | 'url_scheme'
  | 'url_malformed'
  | 'limit'
  | 'link_text'

export type RichTextIssue = { path: string; code: RichTextIssueCode }

export class RichTextPolicyError extends Error {
  readonly issues: RichTextIssue[]
  constructor(issues: RichTextIssue[]) {
    super(
      `Rich text rejected by policy v${POLICY_VERSION}: ${issues.map((i) => `${i.path} (${i.code})`).join(', ')}`,
    )
    this.name = 'RichTextPolicyError'
    this.issues = issues
  }
}

export const LIMITS = { depth: 10, nodes: 5_000, textLength: 10_000, urlLength: 2_048 } as const

const BOLD = 1
const ITALIC = 2
const ALLOWED_FORMAT_BITS = BOLD | ITALIC
const INTERNAL_RELATIONS = new Set(['pages', 'services', 'courses'])

const ELEMENT_ATTRS = [
  'type',
  'version',
  'children',
  'direction',
  'format',
  'indent',
  'textFormat',
  'textStyle',
]
const NODE_ATTRS: Record<string, string[]> = {
  root: ELEMENT_ATTRS,
  paragraph: ELEMENT_ATTRS,
  quote: ELEMENT_ATTRS,
  heading: [...ELEMENT_ATTRS, 'tag'],
  list: [...ELEMENT_ATTRS, 'listType', 'start', 'tag'],
  listitem: [...ELEMENT_ATTRS, 'value', 'checked'],
  link: [...ELEMENT_ATTRS, 'fields', 'id'],
  autolink: [...ELEMENT_ATTRS, 'fields', 'id'],
  text: ['type', 'version', 'text', 'format', 'style', 'mode', 'detail'],
  linebreak: ['type', 'version'],
}
const LEAF = new Set(['text', 'linebreak'])
const LINK_FIELDS = new Set(['linkType', 'url', 'doc', 'newTab'])

export type UrlPolicyOptions = { allowedHttpHosts?: readonly string[] }

// Control characters (C0, DEL, C1), any whitespace, and backslashes are never allowed in a URL.
const FORBIDDEN_URL_CHARS = /[\u0000-\u001F\u007F-\u009F\s\\]/u
const FRAGMENT = /^#[\p{L}\p{N}_-]{1,128}$/u
const MAILTO = /^mailto:[^@\s?#&,;:/]+@[^@\s?#&,;:/]+\.[^@\s?#&,;:/]+$/i
const TEL = /^tel:\+[0-9]{6,15}$/
const BASE = 'https://relative.invalid'

type UrlVerdict = { ok: true; href: string } | { ok: false; code: 'url_scheme' | 'url_malformed' }

/** Classifies a custom link URL against the allow-list. */
export function classifyUrl(input: unknown, opts: UrlPolicyOptions = {}): UrlVerdict {
  if (typeof input !== 'string' || input.length === 0 || input.length > LIMITS.urlLength)
    return { ok: false, code: 'url_malformed' }
  if (FORBIDDEN_URL_CHARS.test(input)) return { ok: false, code: 'url_malformed' }

  if (input.startsWith('#'))
    return FRAGMENT.test(input) ? { ok: true, href: input } : { ok: false, code: 'url_malformed' }

  if (input.startsWith('/')) {
    if (input.startsWith('//')) return { ok: false, code: 'url_scheme' } // protocol-relative
    let u: URL
    try {
      u = new URL(input, BASE)
    } catch {
      return { ok: false, code: 'url_malformed' }
    }
    return u.origin === BASE ? { ok: true, href: input } : { ok: false, code: 'url_scheme' }
  }

  let u: URL
  try {
    u = new URL(input)
  } catch {
    return { ok: false, code: 'url_malformed' }
  }
  const scheme = u.protocol.toLowerCase()
  if (scheme === 'mailto:')
    return MAILTO.test(input) ? { ok: true, href: input } : { ok: false, code: 'url_malformed' }
  if (scheme === 'tel:')
    return TEL.test(input) ? { ok: true, href: input } : { ok: false, code: 'url_malformed' }
  if (scheme === 'https:' || scheme === 'http:') {
    if (u.username || u.password) return { ok: false, code: 'url_malformed' }
    if (!u.hostname || !u.hostname.includes('.')) return { ok: false, code: 'url_malformed' }
    if (scheme === 'http:' && !(opts.allowedHttpHosts ?? []).includes(u.hostname.toLowerCase()))
      return { ok: false, code: 'url_scheme' }
    return { ok: true, href: u.toString() }
  }
  return { ok: false, code: 'url_scheme' }
}

/** Render-time guard: the href to emit, or null to render the link as plain text. */
export function safeHref(input: unknown, opts: UrlPolicyOptions = {}): string | null {
  const v = classifyUrl(input, opts)
  return v.ok ? v.href : null
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const ownKeys = (o: Record<string, unknown>) => Reflect.ownKeys(o).map(String)

function textContent(node: Record<string, unknown>): string {
  if (node.type === 'text' && typeof node.text === 'string') return node.text
  return Array.isArray(node.children)
    ? node.children.map((c) => (isObject(c) ? textContent(c) : '')).join('')
    : ''
}

/** Returns every policy violation (empty array when the value is safe). */
export function checkRichText(value: unknown, opts: UrlPolicyOptions = {}): RichTextIssue[] {
  if (value === null || value === undefined) return []
  const issues: RichTextIssue[] = []
  const add = (path: string, code: RichTextIssueCode) => issues.push({ path, code })
  if (!isObject(value)) return [{ path: '$', code: 'node_type' }]
  for (const k of ownKeys(value)) if (k !== 'root') add('$', 'attribute')
  if (!isObject(value.root) || value.root.type !== 'root') {
    add('root', 'node_type')
    return issues
  }

  let count = 0
  const visit = (node: unknown, path: string, depth: number): void => {
    if (++count > LIMITS.nodes) {
      if (count === LIMITS.nodes + 1) add(path, 'limit')
      return
    }
    if (depth > LIMITS.depth) {
      add(path, 'limit')
      return
    }
    if (!isObject(node) || typeof node.type !== 'string' || !(node.type in NODE_ATTRS)) {
      add(path, 'node_type')
      return
    }
    const type = node.type
    const allowed = NODE_ATTRS[type]!
    for (const k of ownKeys(node)) if (!allowed.includes(k)) add(path, 'attribute')

    if (type === 'text') {
      if (typeof node.text !== 'string') add(path, 'attribute')
      else if (node.text.length > LIMITS.textLength) add(path, 'limit')
      if (typeof node.format !== 'number' || (node.format & ~ALLOWED_FORMAT_BITS) !== 0)
        add(path, 'format')
      if (node.style !== undefined && node.style !== '') add(path, 'style')
      if (node.mode !== undefined && node.mode !== 'normal') add(path, 'attribute')
      if (node.detail !== undefined && node.detail !== 0) add(path, 'attribute')
      return
    }
    if (type === 'linebreak') return

    // element nodes
    if (
      node.direction !== undefined &&
      node.direction !== null &&
      node.direction !== 'ltr' &&
      node.direction !== 'rtl'
    )
      add(path, 'attribute')
    if (
      node.format !== undefined &&
      !['', 'start', 'end', 'center'].includes(node.format as string)
    )
      add(path, 'attribute')
    if (
      node.indent !== undefined &&
      !(
        Number.isInteger(node.indent) &&
        (node.indent as number) >= 0 &&
        (node.indent as number) <= 3
      )
    )
      add(path, 'attribute')
    if (node.textStyle !== undefined && node.textStyle !== '') add(path, 'style')
    if (
      node.textFormat !== undefined &&
      (typeof node.textFormat !== 'number' || (node.textFormat & ~ALLOWED_FORMAT_BITS) !== 0)
    )
      add(path, 'format')
    if (type === 'heading' && !['h2', 'h3', 'h4'].includes(node.tag as string))
      add(path, 'attribute')
    if (type === 'list') {
      if (!['bullet', 'number'].includes(node.listType as string)) add(path, 'attribute')
      if (node.tag !== undefined && !['ul', 'ol'].includes(node.tag as string))
        add(path, 'attribute')
      if (
        node.start !== undefined &&
        !(Number.isInteger(node.start) && (node.start as number) >= 1)
      )
        add(path, 'attribute')
    }
    if (type === 'link' || type === 'autolink') checkLink(node, path, add, opts)

    if (!Array.isArray(node.children)) {
      add(path, 'attribute')
      return
    }
    if (LEAF.has(type)) return
    node.children.forEach((child, i) => visit(child, `${path}.children.${i}`, depth + 1))
  }

  visit(value.root, 'root', 0)
  return issues
}

function checkLink(
  node: Record<string, unknown>,
  path: string,
  add: (path: string, code: RichTextIssueCode) => void,
  opts: UrlPolicyOptions,
) {
  const fields = node.fields
  if (!isObject(fields)) {
    add(`${path}.fields`, 'attribute')
    return
  }
  for (const k of ownKeys(fields)) if (!LINK_FIELDS.has(k)) add(`${path}.fields`, 'attribute')
  if (fields.newTab !== undefined && typeof fields.newTab !== 'boolean')
    add(`${path}.fields.newTab`, 'attribute')
  if (fields.linkType === 'custom') {
    const v = classifyUrl(fields.url, opts)
    if (!v.ok) add(`${path}.fields.url`, v.code)
  } else if (fields.linkType === 'internal') {
    const d = fields.doc
    if (
      !isObject(d) ||
      !INTERNAL_RELATIONS.has(d.relationTo as string) ||
      d.value === undefined ||
      d.value === null
    )
      add(`${path}.fields.doc`, 'attribute')
    if (fields.url !== undefined && fields.url !== null && fields.url !== '')
      add(`${path}.fields.url`, 'attribute')
  } else {
    add(`${path}.fields.linkType`, 'attribute')
  }
  if (textContent(node).trim().length === 0) add(path, 'link_text')
}

/** Throws RichTextPolicyError when the value violates the policy. */
export function assertSafeRichText(value: unknown, opts: UrlPolicyOptions = {}): void {
  const issues = checkRichText(value, opts)
  if (issues.length) throw new RichTextPolicyError(issues)
}
