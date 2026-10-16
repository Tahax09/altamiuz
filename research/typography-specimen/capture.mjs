// R-B capture: screenshots + rendering measurements of specimen.html.
// Research only. Uses the Playwright install inside ../payload-rtl-poc (no new dependency anywhere).
// Run from research/payload-rtl-poc:  node ../typography-specimen/capture.mjs
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.join(here, '../payload-rtl-poc/package.json'))
const { chromium, webkit } = require('@playwright/test')
const url = 'file://' + path.join(here, 'specimen.html')
const out = path.join(here, 'evidence')
fs.mkdirSync(out, { recursive: true })
const results = {}

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch()
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const fontBytes = {}
    page.on('response', async (r) => {
      if (r.url().endsWith('.woff2')) {
        try { fontBytes[r.url().split('/').slice(-2).join('/')] = (await r.body()).length } catch {}
      }
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(out, `${name}-${width}.png`), fullPage: true })
    const m = await page.evaluate(() => {
      const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`)
      const used = (sel) => {
        const el = document.querySelector(sel)
        return el ? getComputedStyle(el).fontFamily : null
      }
      // diacritics clipping heuristic: compare ink box of a line with diacritics to its line box
      const range = document.createRange()
      const d = document.querySelector('.diacritics')
      range.selectNodeContents(d)
      const ink = range.getBoundingClientRect()
      const box = d.getBoundingClientRect()
      // x-height / size match: render probe glyphs at 100px
      const probe = (txt, fam) => {
        const c = document.createElement('canvas').getContext('2d')
        c.font = `400 100px ${fam}`
        const t = c.measureText(txt)
        return { ascent: +t.actualBoundingBoxAscent.toFixed(1), descent: +t.actualBoundingBoxDescent.toFixed(1) }
      }
      return {
        loadedFaces: loaded,
        arHeadingFont: used('h1:lang(ar)'),
        arBodyFont: used('.p16:lang(ar)'),
        enHeadingFont: used('h1:lang(en)'),
        enBodyFont: used('.p16:lang(en)'),
        diacriticsLine: { inkTop: ink.top, inkBottom: ink.bottom, boxTop: box.top, boxBottom: box.bottom },
        metrics: {
          interX: probe('x', 'Inter'),
          manropeX: probe('x', 'Manrope'),
          plexArabicLatinX: probe('x', '"IBM Plex Sans Arabic"'),
          plexArabicAlef: probe('ا', '"IBM Plex Sans Arabic"'),
          plexArabicBeh: probe('ب', '"IBM Plex Sans Arabic"'),
          interCapH: probe('H', 'Inter'),
        },
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      }
    })
    results[`${name}-${width}`] = { ...m, woff2BytesFetched: fontBytes }
    await page.close()
  }
  await browser.close()
}
fs.writeFileSync(path.join(out, 'measurements.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 1).slice(0, 4000))
