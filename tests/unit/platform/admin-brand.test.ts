// Payload Admin branding (CD-09). The brand scales in (payload)/custom.scss replace Payload's
// neutral and accent scales; each step must keep the relative luminance of the step it replaces,
// so every contrast pair Payload composes from them is unchanged. Re-checked against the installed
// Payload release so an upgrade that adds or retunes a step fails here, not in production.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AdminIcon, AdminLogo } from '@/modules/platform/admin/Brand'

const require = createRequire(import.meta.url)
const payloadColors = readFileSync(
  path.join(path.dirname(require.resolve('@payloadcms/ui/scss')), 'colors.scss'),
  'utf8',
)
const custom = readFileSync(path.join(process.cwd(), 'src/app/(payload)/custom.scss'), 'utf8')

const lin = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const luminance = ([r = 0, g = 0, b = 0]: number[]) =>
  0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

function scale(css: string, name: string, format: 'rgb' | 'hex'): Map<string, number[]> {
  const re =
    format === 'rgb'
      ? new RegExp(`--color-${name}-(\\d+): rgb\\((\\d+), (\\d+), (\\d+)\\)`, 'g')
      : new RegExp(`--color-${name}-(\\d+): (#[0-9a-f]{6});`, 'g')
  const out = new Map<string, number[]>()
  for (const [, step = '', a = '', g = '', b = ''] of css.matchAll(re)) {
    if (out.has(step)) continue // Payload repeats the scale for its dark theme block
    out.set(step, format === 'rgb' ? [+a, +g, +b] : hex(a))
  }
  return out
}

describe('Payload Admin brand palette', () => {
  for (const name of ['base', 'success']) {
    it(`${name} scale covers every Payload step with the same luminance`, () => {
      const original = scale(payloadColors, name, 'rgb')
      const branded = scale(custom, name, 'hex')
      expect(original.size).toBeGreaterThan(10)
      expect([...branded.keys()].sort()).toEqual([...original.keys()].sort())
      for (const [step, rgb] of original) {
        const a = luminance(rgb)
        const b = luminance(branded.get(step)!)
        // Contrast against any colour drifts under 2 % (rounding to 8-bit channels).
        expect(Math.abs((a + 0.05) / (b + 0.05) - 1), `${name}-${step}`).toBeLessThan(0.02)
      }
    })
  }

  it('the dark end of the neutral scale is brand navy', () => {
    // base-850 is the dark theme's raised surface; it must read as #14243A (within 8-bit drift).
    const step = scale(custom, 'base', 'hex').get('850')!
    hex('#14243a').forEach((c, i) => expect(Math.abs((step[i] ?? -99) - c)).toBeLessThanOrEqual(3))
  })
})

describe('Payload Admin graphics', () => {
  it('login logo shows the supplied emblem with a visible name, emblem decorative', () => {
    const html = renderToStaticMarkup(createElement(AdminLogo))
    expect(html).toContain('src="/icon.svg"')
    expect(html).toContain('alt=""')
    expect(html).toContain('Altamiuz')
  })

  it('navigation icon names the dashboard link it sits in', () => {
    const html = renderToStaticMarkup(createElement(AdminIcon))
    expect(html).toContain('src="/icon.svg"')
    expect(html).toContain('alt="Dashboard"')
  })
})
