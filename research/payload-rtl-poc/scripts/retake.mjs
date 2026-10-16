// Retake screenshots that were captured before paint; verify stored rich text.
import 'dotenv/config'
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, baseURL: 'http://localhost:3100' })
await ctx.addCookies([{ name: 'payload-lng', value: 'ar', url: 'http://localhost:3100' }])
await ctx.request.post('/api/users/login', { data: { email: process.env.POC_ADMIN_EMAIL, password: process.env.POC_ADMIN_PASSWORD } })
const p = await ctx.newPage()
for (const [url, name] of [['/admin/collections/poc-pages/1?locale=ar', 'C1-04-edit-1440-retake'], ['/admin/collections/poc-pages/create?locale=ar', 'F-ar-14-validation-retake']]) {
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForSelector('#field-title')
  await p.waitForTimeout(1500)
  if (name.includes('validation')) { await p.keyboard.press('Meta+s'); await p.waitForTimeout(1500) }
  await p.screenshot({ path: `evidence/chromium/${name}.png` })
}
const doc = await (await ctx.request.get('/api/poc-pages/1?locale=ar&draft=true&depth=0')).json()
const links = []
const walk = (n) => { if (n?.type === 'link' || n?.type === 'autolink') links.push(n.fields?.url ?? n.url); (n?.children || []).forEach(walk) }
walk(doc.body?.root)
const stored = { linkUrlsInStoredBody: links, hasJavascriptScheme: links.some((u) => /^\s*javascript:/i.test(u || '')) }
fs.writeFileSync('evidence/stored-richtext-check.json', JSON.stringify(stored, null, 2))
console.log(JSON.stringify(stored))
await b.close()
