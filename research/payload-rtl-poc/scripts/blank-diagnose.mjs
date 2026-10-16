// Diagnose blank Arabic-UI edit captures: overflow, scroll offset, element at viewport centre.
import 'dotenv/config'
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const b = await chromium.launch()
const out = {}
for (const lng of ['ar', 'en']) for (const width of [1440, 768]) {
  const ctx = await b.newContext({ viewport: { width, height: 900 }, baseURL: 'http://localhost:3100' })
  await ctx.addCookies([{ name: 'payload-lng', value: lng, url: 'http://localhost:3100' }])
  await ctx.request.post('/api/users/login', { data: { email: process.env.POC_ADMIN_EMAIL, password: process.env.POC_ADMIN_PASSWORD } })
  const p = await ctx.newPage()
  await p.goto('/admin/collections/poc-pages/1?locale=ar', { waitUntil: 'networkidle' })
  await p.waitForSelector('#field-title')
  const samples = []
  for (const t of [0, 1000, 3000, 6000]) {
    await p.waitForTimeout(t ? t - (samples.at(-1)?.t ?? 0) : 0)
    samples.push({ t, ...(await p.evaluate(() => {
      const se = document.scrollingElement
      const c = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
      const title = document.querySelector('#field-title')?.getBoundingClientRect()
      return {
        scrollX: se.scrollLeft, scrollWidth: se.scrollWidth, clientWidth: se.clientWidth,
        centreEl: c ? `${c.tagName}.${String(c.className).slice(0, 50)}` : null,
        titleRect: title && { x: Math.round(title.x), y: Math.round(title.y), w: Math.round(title.width) },
        bodyOpacity: getComputedStyle(document.body).opacity,
        overlays: [...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return (s.position === 'fixed' || s.position === 'absolute') && r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 && s.visibility !== 'hidden' && s.display !== 'none' }).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)} bg=${getComputedStyle(e).backgroundColor}`).slice(0, 3),
      }
    })) })
  }
  await p.screenshot({ path: `evidence/chromium/D-${lng}-edit-${width}.png` })
  out[`${lng}-${width}`] = samples
  await ctx.close()
}
fs.writeFileSync('evidence/blank-diagnose.json', JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 1))
await b.close()
