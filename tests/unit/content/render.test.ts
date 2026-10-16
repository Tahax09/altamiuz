// T072 (FR-013c/d): stored rich text that bypassed write-time checks (legacy data, a compromised
// import) still renders safely. T073: bidi handling and one renderer for preview and public pages.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DocumentView, RichText, Sections } from '@/ui'
import {
  doc,
  link,
  MALICIOUS_LINK_URLS,
  MALICIOUS_RICH_TEXT,
  para,
  rt,
  text,
} from '../../support/content'

const html = (value: unknown, dir: 'rtl' | 'ltr' = 'ltr') =>
  renderToStaticMarkup(createElement(RichText, { value, dir }))

const DANGEROUS = [
  /javascript:/i,
  /vbscript:/i,
  /data:/i,
  /<script/i,
  /\son[a-z]+=/i,
  /style=/i,
  /href="\/\//,
  /href="http:/,
  /<img/i,
  /<h1/i,
  /<code/i,
  /target="_top"/,
  /rel="opener"/,
]

describe('T072 stored malicious rich text renders inert', () => {
  for (const [name, value] of Object.entries(MALICIOUS_RICH_TEXT))
    it(name, () => {
      const out = html(value)
      for (const re of DANGEROUS) expect(out, `${name}: ${re}`).not.toMatch(re)
    })

  it('an unsafe link keeps its text but loses the link', () => {
    const out = html(doc(para(link('javascript:alert(1)', 'Read more'))))
    expect(out).toBe('<p dir="ltr"><span>Read more</span></p>')
  })

  it('safe links render; new-tab links get noopener noreferrer', () => {
    const out = html(doc(para(link('https://example.org/', 'x', { newTab: true }))))
    expect(out).toContain('href="https://example.org/"')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
    expect(html(doc(para(link('mailto:a@example.org', 'm', { newTab: true }))))).not.toContain(
      'target=',
    )
  })

  it('text is escaped, never parsed as markup', () => {
    const out = html(rt('<img src=x onerror=alert(1)> & "q"'))
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; ')
    expect(out).not.toMatch(/<img/)
  })

  it('pathologically deep or malformed trees render without throwing', () => {
    let deep: Record<string, unknown> = text('bottom')
    for (let i = 0; i < 5_000; i++) deep = { ...para(), children: [deep] }
    expect(() => html(doc(deep))).not.toThrow()
    for (const v of [null, 1, 'x', { root: null }, { root: { type: 'root', children: [null, 7] } }])
      expect(() => html(v)).not.toThrow()
  })

  it('link groups in sections never emit unsafe hrefs', () => {
    for (const url of MALICIOUS_LINK_URLS) {
      const out = renderToStaticMarkup(
        createElement(Sections, {
          dir: 'ltr',
          sections: [
            { blockType: 'cta', heading: 'Go', link: { linkType: 'external', url, label: 'Go' } },
          ],
        }),
      )
      expect(out, url).not.toContain('href=')
      expect(out).toContain('Go')
    }
  })

  it('hidden sections and invalid anchor ids are not rendered', () => {
    const out = renderToStaticMarkup(
      createElement(Sections, {
        dir: 'ltr',
        sections: [
          { blockType: 'richText', hidden: true, content: rt('secret draft section') },
          { blockType: 'richText', anchorId: '"><script>', content: rt('visible') },
        ],
      }),
    )
    expect(out).not.toContain('secret draft section')
    expect(out).toContain('visible')
    expect(out).not.toContain('id=')
  })
})

describe('T073 bidirectional text', () => {
  it('Arabic paragraphs carry dir=rtl and Latin runs are isolated with <bdi>', () => {
    const out = html(rt('نقدم اختبار الاختراق وفق ISO 27001 في ليبيا'), 'rtl')
    expect(out).toContain('<p dir="rtl">')
    expect(out).toContain('<bdi>ISO 27001</bdi>')
  })

  it('an explicit node direction wins over the inherited one', () => {
    const v = doc({ ...para(text('English inside Arabic page')), direction: 'ltr' })
    expect(html(v, 'rtl')).toContain('<p dir="ltr">')
  })

  it('English pages do not add <bdi> wrappers', () => {
    expect(html(rt('Penetration testing ISO 27001'), 'ltr')).not.toContain('<bdi>')
  })

  it('DocumentView sets lang and dir from the locale', () => {
    const d = { title: 'عنوان', sections: [{ blockType: 'richText', content: rt('نص') }] }
    const ar = renderToStaticMarkup(createElement(DocumentView, { doc: d, locale: 'ar' }))
    expect(ar).toMatch(/<article[^>]*lang="ar"[^>]*dir="rtl"|<article[^>]*dir="rtl"[^>]*lang="ar"/)
    const en = renderToStaticMarkup(createElement(DocumentView, { doc: d, locale: 'en' }))
    expect(en).toMatch(/lang="en"/)
    expect(en).toMatch(/dir="ltr"/)
  })
})
