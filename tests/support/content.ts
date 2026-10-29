// US2 test helpers: rich-text builders, a malicious corpus, and a REST caller that goes through
// Payload's real REST router (handleEndpoints) exactly as the Next.js catch-all route does.
import type { Payload } from 'payload'
import { userFor } from './auth'

const ORIGIN = 'http://localhost:3000'
type Node = Record<string, unknown>

export const text = (t: string, format = 0): Node => ({ type: 'text', version: 1, text: t, format })
export const para = (...children: Node[]): Node => ({
  type: 'paragraph',
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  children,
})
export const doc = (...children: Node[]) => ({
  root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children },
})
export const rt = (t: string) => doc(para(text(t)))
export const link = (url: string, label = 'click', extra: Node = {}): Node => ({
  type: 'link',
  version: 3,
  direction: null,
  format: '',
  indent: 0,
  fields: { linkType: 'custom', url, newTab: false, ...extra },
  children: [text(label)],
})

/** Values that must never be stored. Each is a complete rich-text value. */
export const MALICIOUS_RICH_TEXT: Record<string, unknown> = {
  javascriptUrl: doc(para(link('javascript:alert(1)'))),
  mixedCaseJs: doc(para(link('JaVaScRiPt:alert(1)'))),
  entityJs: doc(para(link('java\tscript:alert(1)'))),
  leadingSpaceJs: doc(para(link(' javascript:alert(1)'))),
  dataUrl: doc(para(link('data:text/html,<script>alert(1)</script>'))),
  vbscript: doc(para(link('vbscript:msgbox(1)'))),
  protocolRelative: doc(para(link('//evil.example/x'))),
  plainHttp: doc(para(link('http://evil.example/x'))),
  credentialsInUrl: doc(para(link('https://user:pw@evil.example/'))),
  fileUrl: doc(para(link('file:///etc/passwd'))),
  htmlNode: doc({ type: 'html', version: 1, html: '<img src=x onerror=alert(1)>' }),
  scriptNode: doc({ type: 'script', version: 1, children: [text('alert(1)')] }),
  eventAttribute: doc({ ...para(text('x')), onclick: 'alert(1)' }),
  inlineStyle: doc(para({ ...text('x'), style: 'background:url(javascript:alert(1))' })),
  headingH1: doc({ type: 'heading', tag: 'h1', version: 1, children: [text('x')] }),
  headingScriptTag: doc({ type: 'heading', tag: 'script', version: 1, children: [text('x')] }),
  codeFormat: doc(para(text('x', 16))),
  extraLinkField: doc(para(link('https://ok.example/', 'x', { rel: 'opener', target: '_top' }))),
  emptyLinkText: doc(para({ ...link('https://ok.example/'), children: [] })),
  badInternalRelation: doc(
    para({
      ...link('https://ok.example/'),
      fields: { linkType: 'internal', doc: { relationTo: 'users', value: 1 } },
    }),
  ),
  extraRootKey: { ...doc(para(text('x'))), __proto_payload: { x: 1 } },
  notAnObject: '<script>alert(1)</script>',
}

/** Link-group URL values that must never be stored. */
export const MALICIOUS_LINK_URLS = [
  'javascript:alert(1)',
  'JAVASCRIPT:alert(1)',
  'data:text/html,x',
  '//evil.example',
  'http://evil.example',
  'vbscript:x',
  'https://a@evil.example',
]

export async function rest(
  payload: Payload,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {},
) {
  const { handleEndpoints } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const headers = new Headers({ origin: ORIGIN, ...(opts.headers ?? {}) })
  if (opts.token) headers.set('authorization', `JWT ${opts.token}`)
  if (opts.body !== undefined) headers.set('content-type', 'application/json')
  const url = `${ORIGIN}${path}`
  const res = await handleEndpoints({
    config,
    path: new URL(url).pathname,
    request: new Request(url, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
  })
  const raw = await res.text()
  let body: Record<string, unknown> = {}
  try {
    body = JSON.parse(raw) as Record<string, unknown>
  } catch {
    body = { raw }
  }
  return { status: res.status, body, raw, headers: res.headers }
}

export const asUser = async (payload: Payload, token: string) =>
  (await userFor(payload, token)) as never

/** Minimal valid page data (fields required on publish). */
export const pageData = (slug: string, title = 'Title', extra: Record<string, unknown> = {}) => ({
  title,
  slug,
  template: 'default',
  sections: [{ blockType: 'richText', content: rt('Body') }],
  seo: { title: `${title} | SEO`.slice(0, 60), description: 'Search description' },
  ...extra,
})
