// W-1 site chrome and templates: link resolution (route, internal, unsafe), header and footer
// menus, breadcrumbs, image slots, legal outline, course facts, page templates, motion tokens.
// Server-rendered markup only; every string is a fixture.
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DocumentView, SiteFooter, SiteHeader, contactLink, documentCrumbs } from '@/ui'
import { ROUTE_LINK_TARGETS } from '@/modules/content/link'
import { linkGroupIssues } from '@/modules/content/richtext/walk'
import { linkTarget, samePath } from '@/ui/lib/links'
import { internalHrefFor } from '@/ui/sections/Sections'
import { Breadcrumbs } from '@/ui/primitives/Breadcrumbs'
import { MediaSlot } from '@/ui/primitives/MediaSlot'
import { buttonVariants } from '@/ui/primitives/button'
import { firstHeading, legalOutline } from '@/ui/page/LegalToc'
import { courseFactRows } from '@/ui/page/CourseFacts'
import { ListingIndex } from '@/ui/page/ListingIndex'
import { DURATION, EASE_STANDARD, revealDelay, revealOffset, REVEAL } from '@/ui/motion/tokens'
import { clip } from '../../../src/app/(site)/seo'
import { MALICIOUS_LINK_URLS, rt } from '../../support/content'

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)
const page = (slug: string, title = slug) => ({
  relationTo: 'pages',
  value: { slug, title, _status: 'published' },
})
const heading = (h: string, p = 'text') => ({
  root: {
    type: 'root',
    children: [
      { type: 'heading', tag: 'h2', children: [{ type: 'text', text: h }] },
      ...rt(p).root.children,
    ],
  },
})

describe('link resolution', () => {
  const resolve = internalHrefFor('en')
  it('route links resolve through the route map in each language', () => {
    expect(linkTarget({ linkType: 'route', route: 'services' }, 'en', resolve)).toBe('/en/services')
    expect(linkTarget({ linkType: 'route', route: 'training' }, 'ar', internalHrefFor('ar'))).toBe(
      '/ar/ar-vocab-pending-training',
    )
    expect(linkTarget({ linkType: 'route', route: 'home' }, 'en', resolve)).toBe('/en')
    for (const route of ['admin', '/en/services', 'javascript:alert(1)', null])
      expect(linkTarget({ linkType: 'route', route }, 'en', resolve)).toBeNull()
  })
  it('internal links need a published target; unsafe URLs never resolve', () => {
    expect(linkTarget({ linkType: 'internal', doc: page('about') }, 'en', resolve)).toBe(
      '/en/about',
    )
    expect(
      linkTarget(
        {
          linkType: 'internal',
          doc: { relationTo: 'pages', value: { slug: 'x', _status: 'draft' } },
        },
        'en',
        resolve,
      ),
    ).toBeNull()
    for (const url of MALICIOUS_LINK_URLS)
      expect(linkTarget({ linkType: 'external', url }, 'en', resolve), url).toBeNull()
  })
  it('the stored-content check accepts exactly the route targets', () => {
    for (const route of ROUTE_LINK_TARGETS)
      expect(linkGroupIssues({ linkType: 'route', route }, '$')).toEqual([])
    expect(linkGroupIssues({ linkType: 'route', route: 'admin' }, '$')).toEqual([
      { path: '$.route', code: 'attribute' },
    ])
    expect(linkGroupIssues({ linkType: 'route', route: null }, '$')).toEqual([])
  })
  it('compares paths without trailing slash or encoding differences', () => {
    expect(samePath('/ar/%D9%85%D9%86', '/ar/من/')).toBe(true)
    expect(samePath('/en/services', '/en/services/x')).toBe(false)
  })
})

describe('header and footer', () => {
  const nav = {
    items: [
      { link: { linkType: 'route', route: 'services', label: 'Services' } },
      {
        link: { linkType: 'internal', doc: page('about'), label: 'About' },
        children: [
          { link: { linkType: 'internal', doc: page('team'), label: 'Team' } },
          { link: { linkType: 'external', url: 'javascript:alert(1)', label: 'Bad' } },
        ],
      },
      {
        link: {
          linkType: 'internal',
          doc: { relationTo: 'pages', value: 7 },
          label: 'Unpublished',
        },
      },
    ],
  }
  const header = (currentPath = '/en/services', contact = null as ReturnType<typeof contactLink>) =>
    html(
      createElement(SiteHeader, {
        locale: 'en',
        nav,
        siteName: 'Fixture',
        alternates: { ar: '/ar' },
        currentPath,
        contact,
      }),
    )

  it('renders route links, a disclosure for children, and drops unsafe or unpublished targets', () => {
    const out = header()
    expect(out).toContain('href="/en/services" class="site-nav__link" aria-current="page"')
    expect(out).toMatch(/<details class="site-nav__group" data-disclosure="">/)
    expect(out).toContain('href="/en/team"')
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('Unpublished')
    expect(out).not.toContain('Bad')
  })
  it('has one language switcher and a no-JS mobile menu', () => {
    const out = header()
    expect(out.match(/class="language-switcher"/g)).toHaveLength(1)
    expect(out).toContain('<details class="site-menu" data-disclosure="">')
    expect(out.match(/aria-label="Main navigation"/g)).toHaveLength(2) // one shown per breakpoint
  })
  it('shows the contact action only for a published contact page', () => {
    const settings = { contactPage: { slug: 'contact', title: 'Contact us' } }
    const c = contactLink(settings, 'en')
    expect(c).toEqual({ label: 'Contact us', href: '/en/contact', link: {} })
    expect(contactLink({ contactPage: 12 }, 'en')).toBeNull()
    expect(contactLink(null, 'en')).toBeNull()
    expect(header('/en/contact', c)).toContain('href="/en/contact" aria-current="page"')
  })
  it('footer shows only stored settings; menu groups become columns', () => {
    const out = html(
      createElement(SiteFooter, {
        locale: 'en',
        nav,
        settings: { companyName: 'Fixture Co', email: 'info@example.org', phone: '+218911234567' },
        year: 2026,
      }),
    )
    expect(out).toContain('© <bdi>2026</bdi> <bdi>Fixture Co</bdi>')
    expect(out).toContain('href="mailto:info@example.org"')
    expect(out).toContain('+218 91 123 4567')
    expect(out).toContain('class="site-footer__heading"><a href="/en/about">About</a>')
    const bare = html(createElement(SiteFooter, { locale: 'en', nav: null, settings: null }))
    expect(bare).not.toContain('©')
    expect(bare).not.toContain('<address')
  })

  // CD-09: logos from site settings replace the text name; transparent artwork never falls back
  // to a JPEG variant; a decorative logo keeps the company name as the link's accessible name.
  const logo = (over: Record<string, unknown> = {}) => {
    const id = 'b'.repeat(32)
    return {
      filename: `${id}.png`,
      alt: 'Fixture Co logo',
      width: 1200,
      height: 300,
      sizes: Object.fromEntries(
        [480, 768, 1024].flatMap((w) =>
          ['avif', 'webp', 'jpeg'].map((f) => [
            `w${w}_${f}`,
            { filename: `${id}-${w}x${w / 4}.${f === 'jpeg' ? 'jpg' : f}`, width: w },
          ]),
        ),
      ),
      ...over,
    }
  }
  it('header and footer show the brand logo when chosen, else the company name as text', () => {
    const withLogo = html(
      createElement(SiteHeader, {
        locale: 'en',
        nav: null,
        siteName: 'Fixture Co',
        logo: logo(),
        alternates: {},
      }),
    )
    expect(withLogo).toContain('class="media media--contain site-header__logo"')
    expect(withLogo).toContain('alt="Fixture Co logo"')
    expect(withLogo).toContain('type="image/avif"')
    expect(withLogo).not.toContain('.jpg')
    expect(withLogo).not.toContain('type="image/webp"') // WebP is the <img> fallback itself
    expect(withLogo).toContain('loading="eager"')
    const decorative = html(
      createElement(SiteHeader, {
        locale: 'en',
        nav: null,
        siteName: 'Fixture Co',
        logo: logo({ decorative: true }),
        alternates: {},
      }),
    )
    expect(decorative).toContain('<span class="sr-only">Fixture Co</span>')
    const text = html(
      createElement(SiteHeader, {
        locale: 'en',
        nav: null,
        siteName: 'Fixture Co',
        alternates: {},
      }),
    )
    // No published logo: the supplied emblem marks the home link, the name beside it.
    expect(text).toContain('class="site-header__home" href="/en"><img src="/icon.svg" alt=""')
    expect(text).toContain('<span>Fixture Co</span></a>')
    const unnamed = html(createElement(SiteHeader, { locale: 'en', nav: null, alternates: {} }))
    expect(unnamed).toContain('<span class="sr-only">Home</span>')
    const footer = html(
      createElement(SiteFooter, {
        locale: 'en',
        nav: null,
        settings: { companyName: 'Fixture Co', brand: { logoInverse: logo({ alt: 'Inverse' }) } },
      }),
    )
    expect(footer).toContain('site-footer__logo')
    expect(footer).toContain('alt="Inverse"')
    expect(footer).toContain('<bdi>Fixture Co</bdi>') // copyright keeps the text name
  })
})

describe('breadcrumbs and page templates', () => {
  it('breadcrumbs mark the current page and are omitted for a single item', () => {
    const items = documentCrumbs('services', 'en', 'Pen test')
    expect(items.map((c) => c.href)).toEqual(['/en', '/en/services', undefined])
    const out = html(createElement(Breadcrumbs, { locale: 'en', items }))
    expect(out).toContain('aria-label="Breadcrumb"')
    expect(out).toContain('<span aria-current="page" class="text-ink-muted">Pen test</span>')
    expect(html(createElement(Breadcrumbs, { locale: 'en', items: [{ label: 'Home' }] }))).toBe('')
    expect(documentCrumbs('courses', 'ar', 'دورة')[1]).toEqual({
      label: 'التدريب',
      href: '/ar/ar-vocab-pending-training',
    })
  })
  it('a default page has one h1, its summary as the lead, and breadcrumbs', () => {
    const out = html(
      createElement(DocumentView, {
        doc: {
          title: 'About',
          summary: 'Lead text',
          sections: [{ blockType: 'richText', content: rt('Body') }],
        },
        locale: 'en',
      }),
    )
    expect(out.match(/<h1/g)).toHaveLength(1)
    expect(out).toContain('<p class="lead">Lead text</p>')
    expect(out).toContain('aria-label="Breadcrumb"')
  })
  it('a course page shows its facts in the header', () => {
    const doc = {
      title: 'Course',
      audience: 'All staff',
      duration: { value: 2, unit: 'days' },
      deliveryFormat: 'online',
      sections: [],
    }
    expect(courseFactRows(doc, 'en')).toEqual([
      ['Audience', 'All staff'],
      ['Duration', '2 days'],
      ['Format', 'Online'],
    ])
    const out = html(createElement(DocumentView, { doc, locale: 'en', collection: 'courses' }))
    expect(out).toContain('class="course-facts"')
    expect(out.indexOf('course-facts')).toBeLessThan(out.indexOf('</header>'))
  })
  it('legal pages get an outline linking to each headed section', () => {
    const sections = [
      { blockType: 'richText', content: heading('First') },
      { blockType: 'richText', hidden: true, content: heading('Hidden') },
      { blockType: 'richText', anchorId: 'own-anchor', content: heading('Second') },
      { blockType: 'richText', content: rt('No heading') },
    ]
    expect(firstHeading(heading('  Spaced   title '))).toBe('Spaced title')
    const { outline } = legalOutline(sections)
    expect(outline).toEqual([
      { id: 'legal-1', label: 'First' },
      { id: 'own-anchor', label: 'Second' },
    ])
    const out = html(
      createElement(DocumentView, {
        doc: { title: 'Terms', template: 'legal', sections },
        locale: 'ar',
      }),
    )
    expect(out).toContain('<a href="#legal-1">First</a>')
    expect(out).toContain('id="legal-1"')
    expect(out).toContain('في هذه الصفحة')
    expect(out).not.toContain('Hidden')
  })
  it('listing rows link each published item; nothing renders without items', () => {
    const items = [
      { title: 'A', slug: 'a', summary: 'Sa' },
      { title: 'Draft', slug: 'd', _status: 'draft' },
    ]
    const out = html(createElement(ListingIndex, { items, kind: 'service', locale: 'en' }))
    expect(out).toContain('<a href="/en/services/a">A</a>')
    expect(out).not.toContain('Draft')
    expect(html(createElement(ListingIndex, { items: [], kind: 'course', locale: 'en' }))).toBe('')
  })
})

describe('image slots', () => {
  const media = {
    filename: '0123456789abcdef0123456789abcdef.jpg',
    width: 1600,
    height: 1200,
    alt: 'Fixture alt',
    sizes: {},
  }
  it('reserve the aspect ratio around the CMS image, with its per-language alt text', () => {
    const out = html(
      createElement(MediaSlot, { media, ratio: 'landscape', sizes: '50vw', locale: 'en' }),
    )
    expect(out).toMatch(/^<div class="slot slot--landscape">/)
    expect(out).toContain('alt="Fixture alt"')
  })
  it('render nothing publicly without an image; a labelled placeholder in preview', () => {
    expect(
      html(createElement(MediaSlot, { media: null, ratio: 'wide', sizes: '1', locale: 'en' })),
    ).toBe('')
    const preview = html(
      createElement(MediaSlot, {
        media: null,
        ratio: 'wide',
        sizes: '1',
        locale: 'ar',
        preview: true,
      }),
    )
    expect(preview).toContain('data-slot-placeholder')
    expect(preview).toContain('صورة ستُضاف (16:9)')
  })
  it('hero and text sections show placeholders only in preview', () => {
    const doc = {
      title: 'P',
      sections: [{ blockType: 'textMedia', heading: 'T', body: rt('b') }],
    }
    expect(html(createElement(DocumentView, { doc, locale: 'en' }))).not.toContain('slot')
    expect(
      html(createElement(DocumentView, { doc, locale: 'en', ctx: { preview: true } })),
    ).toContain('slot slot--empty slot--landscape')
  })
})

describe('buttons, motion tokens and metadata helpers', () => {
  it('button variants map to the shared .button classes', () => {
    expect(buttonVariants()).toBe('button')
    expect(buttonVariants({ variant: 'inverse', size: 'sm', arrow: true })).toBe(
      'button button--inverse button--sm button--arrow',
    )
  })
  it('CSS and Motion use the same timing tokens', () => {
    const css = readFileSync('src/app/(site)/site.css', 'utf8')
    const ms = (name: string) => Number(new RegExp(`--duration-${name}: (\\d+)ms`).exec(css)?.[1])
    expect(ms('fast') / 1000).toBe(DURATION.fast)
    expect(ms('base') / 1000).toBe(DURATION.base)
    expect(ms('slow') / 1000).toBe(DURATION.slow)
    expect(css).toContain(`--ease-standard: cubic-bezier(${EASE_STANDARD.join(', ')})`)
  })
  it('entrances follow the reading direction and cap the stagger', () => {
    expect(revealOffset('block', 'rtl')).toEqual({ x: 0, y: REVEAL.distance })
    expect(revealOffset('inline', 'ltr').x).toBe(REVEAL.distance)
    expect(revealOffset('inline', 'rtl').x).toBe(-REVEAL.distance)
    expect(revealDelay(0)).toBe(0)
    expect(revealDelay(50)).toBe(REVEAL.maxStaggerSteps * REVEAL.stagger)
  })
  it('clips descriptions at a word boundary', () => {
    expect(clip('short', 160)).toBe('short')
    const long = 'word '.repeat(60)
    const out = clip(long, 160)
    expect(out.length).toBeLessThanOrEqual(160)
    expect(out.endsWith('word…')).toBe(true)
  })
})
