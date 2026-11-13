// V-2 components (docs/design/v2.md): CMS-aware rendering. A list section with nothing to list
// renders nothing; optional images appear only when chosen (a preview shows the slot); team
// members without a photo get their initials, never an empty box; contact details come only from
// published settings; the team block is an evidence-gated claim like statistics.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Sections } from '@/ui'
import { CLAIM_BLOCKS, unverifiedClaims } from '@/modules/content/evidence'

const render = (
  sections: unknown[],
  opts: Record<string, unknown> = {},
  dir: 'ltr' | 'rtl' = 'ltr',
) =>
  renderToStaticMarkup(
    createElement(Sections, {
      sections,
      dir,
      ctx: { locale: dir === 'rtl' ? 'ar' : 'en', ...opts },
    }),
  )
const id = 'c'.repeat(32)
const media = {
  id: 9,
  filename: `${id}.jpg`,
  alt: 'Fixture photo',
  width: 1200,
  height: 1500,
  sizes: { w768_jpeg: { filename: `${id}-768x960.jpg`, width: 768 } },
}

describe('CMS-aware sections', () => {
  it('list sections with no items render nothing, header included', () => {
    for (const b of [
      { blockType: 'serviceList', heading: 'H', mode: 'selected', services: [] },
      { blockType: 'serviceList', heading: 'H', mode: 'all' }, // no published services
      { blockType: 'stats', heading: 'H', items: [] },
      { blockType: 'team', heading: 'H', members: [] },
      { blockType: 'credentials', heading: 'H', display: 'logos', items: [] },
      { blockType: 'resourceList', heading: 'H', items: [] },
      { blockType: 'featureGrid', heading: 'H', items: [] },
      { blockType: 'standards', heading: 'H', items: [] },
      { blockType: 'process', heading: 'H', steps: [] },
      { blockType: 'mediaGallery', heading: 'H', items: [{ media: 7 }] }, // unpopulated image
    ])
      expect(render([b]), b.blockType).toBe('')
    // Unpublished selected services do not count.
    expect(
      render([
        {
          blockType: 'serviceList',
          heading: 'H',
          mode: 'selected',
          services: [{ title: 'Draft', slug: 'draft', _status: 'draft' }],
        },
      ]),
    ).toBe('')
  })

  it('offer cards show an image only when chosen, otherwise the icon', () => {
    const items = [
      { title: 'A', slug: 'a', icon: 'audit', _status: 'published' },
      { title: 'B', slug: 'b', image: media, _status: 'published' },
    ]
    const out = render([
      { blockType: 'serviceList', heading: 'S', mode: 'selected', services: items },
    ])
    expect(out).toContain('href="/en/services/a"')
    expect(out.match(/class="slot /g)).toHaveLength(1)
    expect(out.match(/<svg class="icon"/g)).toHaveLength(1)
    const preview = render(
      [{ blockType: 'serviceList', heading: 'S', mode: 'selected', services: items }],
      { preview: true },
    )
    expect(preview.match(/data-slot-placeholder/g)).toHaveLength(1)
  })

  it('article cards carry category, a machine-readable date and an optional image', () => {
    const out = render([
      {
        blockType: 'resourceList',
        heading: 'I',
        items: [
          { kind: 'Guide', title: 'One', summary: 'S', date: '2026-09-10T00:00:00.000Z' },
          { title: 'Two', date: 'not a date' },
        ],
      },
    ])
    expect(out).toContain('<span class="badge">Guide</span>')
    expect(out).toContain('<time dateTime="2026-09-10">')
    expect(out.match(/<time/g)).toHaveLength(1)
    expect(out).not.toContain('class="slot')
  })

  it('team members: photo when chosen, otherwise initials; nothing empty', () => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const out = render(
        [
          {
            blockType: 'team',
            heading: 'T',
            members: [
              { name: 'Fixture Person', role: 'Role', bio: 'Bio', photo: media },
              { name: dir === 'rtl' ? 'شخص تجريبي' : 'Second Fixture' },
            ],
          },
        ],
        {},
        dir,
      )
      expect(out).toContain('alt="Fixture photo"')
      expect(out).toContain('<h3 class="team__name">Fixture Person</h3>')
      expect(out).toContain('class="team__monogram" aria-hidden="true"')
      expect(out).toContain(dir === 'rtl' ? 'ش‌ت' : 'S‌F')
      expect(out).not.toContain('data-slot-placeholder')
    }
  })

  it('the contact section shows only published contact details', () => {
    const block = [{ blockType: 'contactBlock', heading: 'Contact', intro: 'Intro' }]
    expect(render(block)).not.toContain('<address')
    const out = render(block, { settings: { email: 'info@example.org', hours: 'Sun–Thu' } })
    expect(out).toContain('href="mailto:info@example.org"')
    expect(out).toContain('Sun–Thu')
    expect(out).not.toContain('tel:')
  })

  it('statistics render as their own band; credentials as logos render as a trust strip', () => {
    expect(render([{ blockType: 'stats', items: [{ value: '1', label: 'L' }] }])).toContain(
      'class="section stats-band"',
    )
    expect(
      render([{ blockType: 'credentials', display: 'logos', items: [{ name: 'N' }] }]),
    ).toContain('class="section trust"')
  })
})

describe('team evidence gate', () => {
  it('the team block is a claim block over names, roles, biographies and photos', () => {
    const spec = CLAIM_BLOCKS.team as { field: string; rows: { name: string }[] }
    expect(spec.field).toBe('members')
    expect(spec.rows.map((r) => r.name)).toEqual(['name', 'role', 'bio', 'photo'])
    expect(
      unverifiedClaims({ sections: [{ blockType: 'team', members: [{ name: 'X' }] }] }),
    ).toEqual(['$.sections.0.evidence'])
    expect(
      unverifiedClaims({
        sections: [{ blockType: 'team', members: [], evidence: { status: 'verified' } }],
      }),
    ).toEqual([])
  })
})
