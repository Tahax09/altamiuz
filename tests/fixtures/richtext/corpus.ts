// T026 adversarial corpus for the rich-text policy (contracts/rich-text.md, FR-013b, FR-014,
// SC-018). Reused by unit tests now and by write-path/render tests in Phase 4 (T071/T072).
type Node = Record<string, unknown>

export const text = (t: string, extra: Node = {}): Node => ({
  type: 'text',
  text: t,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
  ...extra,
})
const element = (type: string, children: Node[], extra: Node = {}): Node => ({
  type,
  children,
  direction: null,
  format: '',
  indent: 0,
  version: 1,
  ...extra,
})
export const paragraph = (children: Node[], extra: Node = {}) =>
  element('paragraph', children, { textFormat: 0, textStyle: '', ...extra })
export const heading = (tag: string, children: Node[]) => element('heading', children, { tag })
export const link = (url: unknown, label = 'رابط', fields: Node = {}): Node =>
  element('link', [text(label)], {
    fields: { linkType: 'custom', url, newTab: false, ...fields },
    id: 'l1',
  })
export const doc = (...children: Node[]) => ({ root: element('root', children) })

// ---------- valid documents (must be accepted unchanged) ----------
export const validDocs: Record<string, unknown> = {
  'Arabic RTL paragraph with mixed identifiers': doc(
    paragraph([text('إدارة أمن المعلومات وفق ISO/IEC 27001:2022 و PCI DSS v4.0.1')], {
      direction: 'rtl',
    }),
  ),
  'English heading, bold+italic, quote, lists': doc(
    heading('h2', [text('Governance')]),
    paragraph([
      text('bold', { format: 1 }),
      text(' italic', { format: 2 }),
      text(' both', { format: 3 }),
    ]),
    element('quote', [text('A quote')]),
    element('list', [element('listitem', [text('one')], { value: 1 })], {
      listType: 'bullet',
      start: 1,
      tag: 'ul',
    }),
    element('list', [element('listitem', [text('first')], { value: 1 })], {
      listType: 'number',
      start: 1,
      tag: 'ol',
    }),
  ),
  'safe links: https, allow-listed paths, mailto, tel, fragment, internal doc': doc(
    paragraph([
      link('https://www.iso.org/standard/27001'),
      link('/ar/contact'),
      link('#services'),
      link('mailto:info@example.ly'),
      link('tel:+218210000000'),
      {
        ...link(undefined, 'خدماتنا'),
        fields: { linkType: 'internal', doc: { relationTo: 'services', value: 7 }, newTab: false },
      },
      { type: 'linebreak', version: 1 },
    ]),
  ),
  'empty value': null,
}

// ---------- attacks (must be rejected with the given code) ----------
type Attack = { doc: unknown; code: string }
const urlAttack = (url: unknown, code = 'url_scheme'): Attack => ({
  doc: doc(paragraph([link(url)])),
  code,
})

export const attacks: Record<string, Attack> = {
  'javascript: scheme': urlAttack('javascript:alert(1)'),
  'JaVaScRiPt: mixed case': urlAttack('JaVaScRiPt:alert(1)'),
  'leading space before javascript:': urlAttack(' javascript:alert(1)', 'url_malformed'),
  'tab inside scheme': urlAttack('java\tscript:alert(1)', 'url_malformed'),
  'newline inside scheme': urlAttack('java\nscript:alert(1)', 'url_malformed'),
  'NUL byte': urlAttack('https://example.com/\u0000', 'url_malformed'),
  'percent-encoded scheme %6A': urlAttack('%6Aavascript:alert(1)', 'url_malformed'),
  'HTML-entity colon': urlAttack('javascript&colon;alert(1)', 'url_malformed'),
  'javascript:// with encoded newline': urlAttack('javascript://example.com/%0aalert(1)'),
  'vbscript:': urlAttack('vbscript:msgbox(1)'),
  'data:text/html': urlAttack('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='),
  'data:image/svg+xml': urlAttack('data:image/svg+xml,<svg onload=alert(1)>', 'url_malformed'),
  'file:': urlAttack('file:///etc/passwd'),
  'ftp:': urlAttack('ftp://files.example.com/x'),
  'blob:': urlAttack('blob:https://example.com/uuid'),
  'about:': urlAttack('about:blank'),
  'protocol-relative //host': urlAttack('//evil.example/x'),
  'backslash host \\\\evil': urlAttack('\\\\evil.example', 'url_malformed'),
  'https:\\\\evil': urlAttack('https:\\\\evil.example', 'url_malformed'),
  'http to non-allow-listed host': urlAttack('http://example.com'),
  'credentials in URL': urlAttack('https://user:pass@example.com', 'url_malformed'),
  'over-long URL': urlAttack(`https://example.com/${'a'.repeat(2050)}`, 'url_malformed'),
  'non-string URL': urlAttack({ toString: 'javascript:alert(1)' }, 'url_malformed'),
  'mailto with injected header': urlAttack('mailto:a@b.ly?bcc=victim@example.com', 'url_malformed'),
  'tel with letters': urlAttack('tel:+218abc', 'url_malformed'),
  'empty link text': {
    doc: doc(paragraph([link('https://example.com', '   ')])),
    code: 'link_text',
  },
  'unknown node html': {
    doc: doc({ type: 'html', html: '<script>alert(1)</script>', version: 1 }),
    code: 'node_type',
  },
  'unknown node upload': {
    doc: doc({ type: 'upload', value: 1, relationTo: 'media', version: 1 }),
    code: 'node_type',
  },
  'unknown node relationship': {
    doc: doc({ type: 'relationship', value: 1, relationTo: 'users', version: 1 }),
    code: 'node_type',
  },
  'unknown node block': {
    doc: doc({ type: 'block', fields: { blockType: 'x' }, version: 1 }),
    code: 'node_type',
  },
  'unknown node code': { doc: doc(element('code', [text('x')])), code: 'node_type' },
  'unknown node horizontalrule': {
    doc: doc({ type: 'horizontalrule', version: 1 }),
    code: 'node_type',
  },
  'unknown node iframe': {
    doc: doc({ type: 'iframe', src: 'https://evil.example', version: 1 }),
    code: 'node_type',
  },
  'heading h1': { doc: doc(heading('h1', [text('x')])), code: 'attribute' },
  'heading h5': { doc: doc(heading('h5', [text('x')])), code: 'attribute' },
  'inline CSS on text': { doc: doc(paragraph([text('x', { style: 'color:red' })])), code: 'style' },
  'inline CSS on paragraph': {
    doc: doc(paragraph([text('x')], { textStyle: 'background:url(x)' })),
    code: 'style',
  },
  'code mark (16)': { doc: doc(paragraph([text('x', { format: 16 })])), code: 'format' },
  'strikethrough mark (4)': { doc: doc(paragraph([text('x', { format: 4 })])), code: 'format' },
  'underline mark (8)': { doc: doc(paragraph([text('x', { format: 8 })])), code: 'format' },
  'subscript mark (32)': { doc: doc(paragraph([text('x', { format: 32 })])), code: 'format' },
  'superscript mark (64)': { doc: doc(paragraph([text('x', { format: 64 })])), code: 'format' },
  'onClick attribute': {
    doc: doc(paragraph([text('x')], { onClick: 'alert(1)' })),
    code: 'attribute',
  },
  'className attribute': {
    doc: doc(paragraph([text('x')], { className: 'x' })),
    code: 'attribute',
  },
  'href on paragraph': {
    doc: doc(paragraph([text('x')], { href: 'javascript:alert(1)' })),
    code: 'attribute',
  },
  'direction value injection': {
    doc: doc(paragraph([text('x')], { direction: 'rtl;x' })),
    code: 'attribute',
  },
  'indent too deep': { doc: doc(paragraph([text('x')], { indent: 9 })), code: 'attribute' },
  'text mode token': { doc: doc(paragraph([text('x', { mode: 'token' })])), code: 'attribute' },
  'extra link field': {
    doc: doc(paragraph([link('https://example.com', 'x', { rel: 'opener' })])),
    code: 'attribute',
  },
  'link doc to users': {
    doc: doc(
      paragraph([
        {
          ...link(undefined),
          fields: { linkType: 'internal', doc: { relationTo: 'users', value: 1 } },
        },
      ]),
    ),
    code: 'attribute',
  },
  'linkType raw': {
    doc: doc(paragraph([link('https://example.com', 'x', { linkType: 'raw' })])),
    code: 'attribute',
  },
  'internal link without doc': {
    doc: doc(paragraph([{ ...link(undefined), fields: { linkType: 'internal' } }])),
    code: 'attribute',
  },
  'depth 11': {
    doc: (() => {
      let n: Node = text('deep')
      for (let i = 0; i < 11; i++) n = element('quote', [n])
      return doc(n)
    })(),
    code: 'limit',
  },
  '5,001 nodes': {
    doc: doc(paragraph(Array.from({ length: 5001 }, () => text('x')))),
    code: 'limit',
  },
  'text over 10,000 chars': { doc: doc(paragraph([text('x'.repeat(10_001))])), code: 'limit' },
  'two roots / extra top-level key': {
    doc: { ...(doc(paragraph([text('x')])) as object), html: '<b>x</b>' },
    code: 'attribute',
  },
  'root not an object': { doc: { root: 'x' }, code: 'node_type' },
  'children not an array': {
    doc: { root: { ...element('root', []), children: { 0: text('x') } } },
    code: 'attribute',
  },
  'prototype pollution key': {
    doc: JSON.parse(
      '{"root":{"type":"root","children":[],"direction":null,"format":"","indent":0,"version":1,"__proto__":{"polluted":true}}}',
    ),
    code: 'attribute',
  },
}
