// Homepage (Direction A, Institutional Precision): every section is a CMS block rendered on the
// server in the stored order, hideable, in both languages, with links only through safeHref or
// published internal targets. No business content lives in code: every string below is a fixture.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DocumentView, Sections } from '@/ui'
import { MALICIOUS_LINK_URLS, MALICIOUS_RICH_TEXT, rt } from '../../support/content'

const render = (sections: unknown[], dir: 'ltr' | 'rtl' = 'ltr') =>
  renderToStaticMarkup(createElement(Sections, { sections, dir }))
const order = (out: string) => [...out.matchAll(/data-block="([a-zA-Z]+)"/g)].map((m) => m[1])
const published = (slug: string) => ({
  relationTo: 'pages',
  value: { slug, _status: 'published' },
})

/** The approved section sequence after the site chrome (banner, header) and before the footer. */
const HOME = [
  { blockType: 'hero', eyebrow: 'Fixture eyebrow', heading: 'Fixture hero' },
  {
    blockType: 'credentials',
    heading: 'Fixture credentials',
    items: [{ name: 'Fixture certificate', issuer: 'Fixture body' }],
  },
  { blockType: 'textMedia', heading: 'Fixture introduction', body: rt('Fixture body text') },
  { blockType: 'serviceList', heading: 'Fixture services', mode: 'selected', services: [] },
  {
    blockType: 'featureGrid',
    heading: 'Fixture why',
    items: [{ icon: 'shield', title: 'Fixture reason' }],
  },
  {
    blockType: 'process',
    heading: 'Fixture approach',
    steps: ['One', 'Two', 'Three', 'Four'].map((title) => ({ title })),
  },
  { blockType: 'standards', heading: 'Fixture standards', items: [{ name: 'Fixture framework' }] },
  { blockType: 'stats', heading: 'Fixture experience', items: [{ value: '1', label: 'Fixture' }] },
  { blockType: 'resourceList', heading: 'Fixture insights', items: [{ title: 'Fixture note' }] },
  { blockType: 'cta', heading: 'Fixture contact' },
]
const SEQUENCE = HOME.map((b) => b.blockType)

describe('homepage sections', () => {
  it('render in the stored order, and in the new order after a reorder', () => {
    expect(order(render(HOME))).toEqual(SEQUENCE)
    expect(order(render([...HOME].reverse()))).toEqual([...SEQUENCE].reverse())
  })

  it('every section is optional: hidden sections and empty headers render nothing', () => {
    const out = render(HOME.map((b, i) => (i % 2 ? { ...b, hidden: true } : b)))
    expect(order(out)).toEqual(SEQUENCE.filter((_, i) => i % 2 === 0))
    const bare = render([{ blockType: 'process', steps: [{ title: 'Only step' }] }])
    expect(bare).not.toContain('section__head')
    expect(bare).not.toContain('<h2></h2>')
    // Without a section heading, item titles take the h2 level (no skipped heading levels).
    expect(bare).toContain('<h2>Only step</h2>')
  })

  it('approach steps are an ordered list with decorative Western-digit indices, in Arabic too', () => {
    const steps = HOME.find((b) => b.blockType === 'process')!
    for (const dir of ['ltr', 'rtl'] as const) {
      const out = render([steps], dir)
      expect(out).toMatch(/<ol class="process">/)
      expect(out.match(/<li /g)).toHaveLength(4)
      expect(out).toContain('<span class="process__index" aria-hidden="true">01</span>')
      expect(out).toContain('<h3>Four</h3>')
    }
  })

  it('an approach illustration renders between the header and the steps, with its alt text', () => {
    const id = 'b'.repeat(32)
    const media = {
      id: 7,
      filename: `${id}.png`,
      alt: 'Fixture sequence illustration',
      width: 2400,
      height: 800,
      sizes: { w768_avif: { filename: `${id}-768x256.avif`, width: 768 } },
    }
    const out = render([{ blockType: 'process', heading: 'H', media, steps: [{ title: 'One' }] }])
    expect(out).toContain('media--process')
    expect(out).toContain('alt="Fixture sequence illustration"')
    expect(out.indexOf('media--process')).toBeGreaterThan(out.indexOf('<h2>H</h2>'))
    expect(out.indexOf('media--process')).toBeLessThan(out.indexOf('<ol class="process">'))
    expect(render([{ blockType: 'process', steps: [{ title: 'One' }] }])).not.toContain(
      'media--process',
    )
  })

  it('section header fields render as eyebrow, h2 and intro', () => {
    const out = render([
      { blockType: 'standards', eyebrow: 'E', heading: 'H', intro: 'I', items: [{ name: 'N' }] },
    ])
    expect(out).toContain('<p class="eyebrow">E</p><h2>H</h2><p class="section__intro">I</p>')
    expect(out).toContain('<h3>N</h3>')
  })

  it('resource cards and "more" links never emit unsafe hrefs', () => {
    for (const url of MALICIOUS_LINK_URLS) {
      const out = render([
        {
          blockType: 'resourceList',
          heading: 'R',
          items: [{ title: 'Item', link: { linkType: 'external', url } }],
          moreLink: { linkType: 'external', url, label: 'All' },
        },
        {
          blockType: 'serviceList',
          mode: 'selected',
          services: [],
          moreLink: { linkType: 'external', url, label: 'Services' },
        },
      ])
      expect(out, url).not.toContain('href=')
      expect(out).toContain('Item')
    }
  })

  it('internal links resolve only to published targets; external new-tab links are isolated', () => {
    const out = render([
      {
        blockType: 'resourceList',
        items: [
          { title: 'Live', link: { linkType: 'internal', doc: published('guide') } },
          {
            title: 'Draft',
            link: {
              linkType: 'internal',
              doc: { relationTo: 'pages', value: { slug: 'x', _status: 'draft' } },
            },
          },
          {
            title: 'Out',
            link: { linkType: 'external', url: 'https://example.org/', newTab: true },
          },
        ],
      },
    ])
    expect(out).toMatch(/<a href="\/en\/[^"]*guide">Live<\/a>/)
    expect(out).toContain('<span>Draft</span>')
    expect(out).toContain('target="_blank" rel="noopener noreferrer">Out</a>')
  })

  it('text and media rich text stays inert', () => {
    for (const [name, value] of Object.entries(MALICIOUS_RICH_TEXT)) {
      const out = render([{ blockType: 'textMedia', heading: 'T', body: value }])
      expect(out, name).not.toMatch(/<script|javascript:|\son[a-z]+=|<img/i)
    }
  })

  it('credentials can show partners as a logo wall; feature icons are decorative', () => {
    const logos = render([
      { blockType: 'credentials', display: 'logos', items: [{ name: 'Fixture partner' }] },
    ])
    expect(logos).toContain('class="logo-wall"')
    expect(logos).toContain('Fixture partner')
    const features = render([
      {
        blockType: 'featureGrid',
        items: [
          { icon: 'shield', title: 'A' },
          { icon: 'x', title: 'B' },
        ],
      },
    ])
    expect(features.match(/<svg/g)).toHaveLength(1)
    expect(features).toContain('aria-hidden="true" focusable="false"')
  })

  it('a hero-led home keeps one h1 (the title) and sets lang/dir per language', () => {
    for (const locale of ['en', 'ar'] as const) {
      const out = renderToStaticMarkup(
        createElement(DocumentView, {
          doc: { title: 'Fixture title', template: 'home', sections: HOME },
          locale,
        }),
      )
      expect(out.match(/<h1/g)).toHaveLength(1)
      expect(out).toContain('<h1 class="sr-only">Fixture title</h1>')
      expect(out).toContain(`lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`)
      expect(out).toContain('data-template="home"')
    }
  })
})
