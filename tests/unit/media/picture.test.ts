// Public image rendering (FR-052–FR-054): variants as <picture>, alt per locale or decorative,
// focal point as classes (no inline style under the public CSP), unsafe names never rendered.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Sections } from '@/ui'
import { Picture } from '../../../src/ui/media/Picture'

const id = 'a'.repeat(32)
const media = (over: Record<string, unknown> = {}) => ({
  id: 1,
  filename: `${id}.jpg`,
  alt: 'A lab bench',
  decorative: false,
  width: 2000,
  height: 1200,
  focalX: 20,
  focalY: 75,
  sizes: Object.fromEntries(
    [480, 768, 1024, 1440, 1920].flatMap((w) =>
      ['avif', 'webp', 'jpeg'].map((f) => [
        `w${w}_${f}`,
        { filename: `${id}-${w}x${Math.round(w * 0.6)}.${f === 'jpeg' ? 'jpg' : f}`, width: w },
      ]),
    ),
  ),
  ...over,
})
const html = (m: unknown, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(Picture, { media: m, ...props }))

describe('Picture', () => {
  it('renders AVIF and WebP sources with a JPEG fallback from the access-checked file route', () => {
    const out = html(media())
    expect(out).toContain('type="image/avif"')
    expect(out).toContain('type="image/webp"')
    expect(out).toContain(`/api/media/file/${id}-480x288.avif 480w`)
    expect(out).toContain(`src="/api/media/file/${id}-1920x1152.jpg"`)
    expect(out).toContain('alt="A lab bench"')
    expect(out).toContain('width="2000"')
    expect(out).toContain('loading="lazy"')
  })

  it('carries the focal point as classes, never as an inline style', () => {
    const out = html(media())
    expect(out).toContain('fx-20 fy-75')
    expect(out).not.toContain('style=')
    expect(html(media({ focalX: 999, focalY: -4 }))).toContain('fx-100 fy-0')
  })

  it('decorative images have empty alt and are hidden from assistive technology', () => {
    const out = html(media({ decorative: true, alt: 'ignored' }))
    expect(out).toContain('alt=""')
    expect(out).toContain('aria-hidden="true"')
  })

  it('renders nothing for unpopulated, deleted or unsafe references', () => {
    for (const m of [
      null,
      7,
      {},
      media({ filename: '../../etc/passwd' }),
      media({ filename: `${id}.svg` }),
      media({ width: 0 }),
    ])
      expect(html(m)).toBe('')
    const bad = html(
      media({ sizes: { w480_jpeg: { filename: 'javascript:alert(1)', width: 480 } } }),
    )
    expect(bad).not.toContain('javascript:')
  })

  it('Sections renders hero media, ordered gallery items and credential logos', () => {
    const out = renderToStaticMarkup(
      createElement(Sections, {
        sections: [
          { blockType: 'hero', heading: 'H', media: media() },
          {
            blockType: 'mediaGallery',
            items: [
              { media: media({ alt: 'first' }), caption: 'One' },
              { media: media({ alt: 'second' }) },
              { media: 12 },
            ],
          },
          { blockType: 'credentials', items: [{ name: 'Cert', logo: media({ alt: 'Logo' }) }] },
        ],
        dir: 'ltr',
      } as never),
    )
    expect(out.indexOf('alt="first"')).toBeLessThan(out.indexOf('alt="second"'))
    expect(out).toContain('<figcaption>One</figcaption>')
    expect(out).toContain('alt="Logo"')
    expect(out).toContain('loading="eager"') // first-section hero
    expect((out.match(/<picture/g) ?? []).length).toBe(4)
  })
})
