// Find elements extending far outside the viewport in the Arabic-UI edit view.
import 'dotenv/config'
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, baseURL: 'http://localhost:3100' })
await ctx.addCookies([{ name: 'payload-lng', value: 'ar', url: 'http://localhost:3100' }])
await ctx.request.post('/api/users/login', { data: { email: process.env.POC_ADMIN_EMAIL, password: process.env.POC_ADMIN_PASSWORD } })
const p = await ctx.newPage()
const res = {}
for (const [name, url] of [['edit', '/admin/collections/poc-pages/1?locale=ar'], ['list', '/admin/collections/poc-pages?locale=ar'], ['dashboard', '/admin'], ['media', '/admin/collections/poc-media/1?locale=ar']]) {
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1000)
  res[name] = await p.evaluate(() => ({
    scrollWidth: document.scrollingElement.scrollWidth,
    culprits: [...document.querySelectorAll('body *')]
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.left < -500 || r.right > innerWidth + 500)
      .slice(0, 5)
      .map(({ e, r }) => ({ el: `${e.tagName}.${String(e.className).slice(0, 60)}`, left: Math.round(r.left), width: Math.round(r.width), pos: getComputedStyle(e).position })),
  }))
}
fs.writeFileSync('evidence/rtl-overflow.json', JSON.stringify(res, null, 2))
console.log(JSON.stringify(res, null, 1))
await b.close()
