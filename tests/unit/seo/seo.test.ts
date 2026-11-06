// T116/T117/T118 pure parts: redirect path normalisation, metadata (canonical, hreflang,
// x-default, Open Graph, indexing), JSON-LD builders and the robots policy.
import { describe, expect, it } from 'vitest'
import {
  breadcrumbs,
  buildMetadata,
  faqPage,
  normaliseSitePath,
  offering,
  organization,
  robotsFor,
  serialiseGraph,
  website,
} from '@/modules/seo'

const SITE = 'https://www.example.org'

describe('normaliseSitePath', () => {
  it('matches with and without trailing slash, decoded and NFC', () => {
    expect(normaliseSitePath('/about/')).toBe('/about')
    expect(normaliseSitePath('/about')).toBe('/about')
    expect(normaliseSitePath('/')).toBe('/')
    expect(normaliseSitePath('/training_courses/%D8%AF%D9%88%D8%B1%D8%A9/')).toBe(
      '/training_courses/دورة',
    )
    expect(normaliseSitePath('/x?utm=1#top')).toBe('/x')
    expect(normaliseSitePath('/é')).toBe('/é')
  })
  it('refuses open-redirect and traversal payloads and malformed input', () => {
    for (const bad of [
      '//evil.example',
      '/\\evil.example',
      '/%5Cevil.example',
      '/%2F%2Fevil.example'.replace('/', ''),
      'https://evil.example/',
      'evil',
      '/%E0%A4%A',
      '/a/../b',
      '/a//b',
      '/a b',
      '/a\u0000',
      '',
      42,
      '/' + 'a'.repeat(600),
    ])
      expect(normaliseSitePath(bad), String(bad)).toBeNull()
  })
})

describe('buildMetadata', () => {
  const base = {
    siteUrl: SITE,
    locale: 'en' as const,
    path: '/en/about',
    alternates: { en: '/en/about', ar: '/ar/حول' },
    title: 'About',
    description: 'Who we are',
    indexable: true,
  }
  it('self-canonical, reciprocal alternates, x-default and Open Graph', () => {
    const m = buildMetadata({
      ...base,
      siteName: 'Example',
      image: { url: `${SITE}/api/media/file/x.jpg`, width: 1440, height: 864, alt: 'Office' },
    })
    expect(m.alternates?.canonical).toBe(`${SITE}/en/about`)
    expect(m.alternates?.languages).toEqual({
      en: `${SITE}/en/about`,
      ar: `${SITE}/ar/%D8%AD%D9%88%D9%84`,
      'x-default': `${SITE}/`,
    })
    expect(m.robots).toBeUndefined()
    expect(m.openGraph).toMatchObject({
      url: `${SITE}/en/about`,
      locale: 'en_GB',
      alternateLocale: ['ar_LY'],
      siteName: 'Example',
    })
    expect((m.twitter as { card: string }).card).toBe('summary_large_image')
  })
  it('omits unpublished alternates; honours noindex, non-production and safe canonical overrides only', () => {
    const m = buildMetadata({ ...base, alternates: { en: '/en/about', ar: null }, noindex: true })
    expect(m.alternates?.languages).toEqual({ en: `${SITE}/en/about`, 'x-default': `${SITE}/` })
    expect(m.robots).toEqual({ index: false, follow: true })
    expect(buildMetadata({ ...base, indexable: false }).robots).toEqual({
      index: false,
      follow: false,
    })
    expect(
      buildMetadata({ ...base, canonicalOverride: '/en/original' }).alternates?.canonical,
    ).toBe(`${SITE}/en/original`)
    for (const bad of ['//evil.example', 'https://evil.example/x', '/\\evil'])
      expect(buildMetadata({ ...base, canonicalOverride: bad }).alternates?.canonical, bad).toBe(
        `${SITE}/en/about`,
      )
  })
})

describe('JSON-LD', () => {
  it('Organization only with a verified name; WebSite always; breadcrumbs need two levels', () => {
    expect(organization(SITE, {})).toBeNull()
    expect(organization(SITE, { name: 'Example Ltd', address: 'Tripoli' })).toMatchObject({
      '@type': 'Organization',
      name: 'Example Ltd',
      address: 'Tripoli',
    })
    expect(website(SITE, 'ar')).toEqual({
      '@type': 'WebSite',
      '@id': `${SITE}/ar#website`,
      url: `${SITE}/ar`,
      inLanguage: 'ar',
    })
    expect(breadcrumbs(SITE, [{ name: 'Home', path: '/en' }])).toBeNull()
    expect(
      breadcrumbs(SITE, [
        { name: 'Home', path: '/en' },
        { name: 'Services', path: '/en/services' },
      ]),
    ).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, item: `${SITE}/en` },
        { position: 2, item: `${SITE}/en/services` },
      ],
    })
  })
  it('FAQ from visible faq blocks as plain text; Service/Course from published fields', () => {
    const answer = {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'Yes, <b>always</b>.' }] },
        ],
      },
    }
    const faq = faqPage([
      {
        blockType: 'faq',
        items: [
          { question: 'Do you test?', answer },
          { question: '', answer },
        ],
      },
      { blockType: 'faq', hidden: true, items: [{ question: 'Hidden?', answer }] },
    ])
    expect(faq).toEqual({
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Do you test?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes, <b>always</b>.' },
        },
      ],
    })
    expect(faqPage([{ blockType: 'richText' }])).toBeNull()
    expect(
      offering(
        'Service',
        SITE,
        { title: 'Pen test', summary: 'Find gaps' },
        '/en/services/pen',
        true,
      ),
    ).toMatchObject({
      '@type': 'Service',
      provider: { '@id': `${SITE}/#organization` },
    })
    expect(
      offering('Service', SITE, { title: 'Pen test' }, '/en/services/pen', false),
    ).not.toHaveProperty('provider')
    expect(
      offering(
        'Course',
        SITE,
        { title: 'Awareness', provider: 'Partner' },
        '/en/training/a',
        false,
      ),
    ).toMatchObject({ provider: { name: 'Partner' } })
    expect(offering('Course', SITE, { title: '' }, '/x', true)).toBeNull()
  })
  it('serialises safely for an inline data block', () => {
    const out = serialiseGraph([
      { '@type': 'WebSite', name: '</script><script>alert(1)</script> ' },
      null,
    ])!
    expect(out).not.toContain('</script>')
    expect(out).not.toContain(' ')
    expect(JSON.parse(out)['@graph'][0].name).toBe('</script><script>alert(1)</script> ')
    expect(serialiseGraph([null])).toBeNull()
  })
})

describe('robots', () => {
  it('production: disallows admin, API, preview and account paths and lists the sitemap', () => {
    expect(robotsFor(SITE, true)).toEqual({
      rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/preview', '/account'] }],
      sitemap: `${SITE}/sitemap.xml`,
    })
  })
  it('elsewhere: disallows everything and lists no sitemap', () => {
    expect(robotsFor(SITE, false)).toEqual({ rules: [{ userAgent: '*', disallow: '/' }] })
  })
})
