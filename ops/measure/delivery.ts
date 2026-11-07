// SC-010 measurement (docs/runbooks/monitoring.md#sc-010). Run with ops/measure/delivery.sh, which
// gives it a disposable migrated database. Real path end to end: submitEnquiry (stores + queues in
// one transaction) → scheduler tick every 60 s (the Vercel Cron cadence, `* * * * *`) →
// payload.jobs.run → SMTP → Mailpit. Latency = Mailpit receipt time − enquiry createdAt.
// Phase A: N enquiries submitted at random moments over SPREAD_S seconds (random cron phase).
// Phase B: email outage (every send fails) for OUTAGE_TICKS ticks while M enquiries arrive; then
// recovery; every one must be stored during the outage and delivered after it.
import { mkdirSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import pg from 'pg'
import {
  setCaptchaForTests,
  setEnquiryMailerForTests,
  submitEnquiry,
} from '../../src/modules/enquiries'
import { createEmailAdapter, getConfig } from '../../src/modules/platform'
import { createTestCaptcha } from '../../src/modules/platform/adapters/captcha'

const N = Number(process.env.SC010_N ?? 100)
const SPREAD_S = Number(process.env.SC010_SPREAD_S ?? 180)
const M = Number(process.env.SC010_OUTAGE_N ?? 10)
const OUTAGE_TICKS = Number(process.env.SC010_OUTAGE_TICKS ?? 2)
const TICK_MS = 60_000
const MAILPIT = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025'

const payload = await getPayload({ config })
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
const cfg = getConfig()
const smtp = createEmailAdapter({
  driver: 'smtp',
  from: cfg.email.from,
  smtpUrl: cfg.email.smtpUrl ?? '',
})
let outage = false
setEnquiryMailerForTests({
  async send(m) {
    if (outage) throw new Error('simulated provider outage')
    await smtp.send(m)
  },
})
setCaptchaForTests(createTestCaptcha('1x0000000000000000000000000000000AA'))
await payload.updateGlobal({
  slug: 'site-settings' as never,
  locale: 'en',
  data: {
    defaultSeo: { title: 'Site', description: 'SC-010 measurement' },
    enquiryRecipients: [{ email: 'staff@sc010.invalid' }],
    enquiryTopics: [{ label: 'Training' }],
    _status: 'published',
  } as never,
  publishSpecificLocale: 'en',
  overrideAccess: true,
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let ip = 0
async function submit(): Promise<number> {
  const h = new Headers({
    origin: cfg.siteUrl,
    'x-forwarded-for': `10.${(ip >> 16) & 255}.${(ip >> 8) & 255}.${ip++ & 255}`,
  })
  const r = await submitEnquiry(
    payload,
    {
      name: 'Measurement',
      email: 'visitor@sc010.invalid',
      topic: 'Training',
      message: 'SC-010 latency probe',
      consent: 'true',
      locale: 'en',
      turnstileToken: `sc010-${ip}-${Math.random()}`,
    },
    h,
  )
  if (r.status !== 200) throw new Error(`submit failed: ${JSON.stringify(r)}`)
  return (r as { id: number }).id
}

const ticks: string[] = []
let stop = false
const scheduler = (async () => {
  while (!stop) {
    ticks.push(new Date().toISOString())
    await payload.jobs.run({ limit: 50, overrideAccess: true, silent: true }).catch(() => undefined)
    // Drain: the 50-job limit per tick is the production setting too (src/modules/enquiries/jobs.ts).
    await sleep(TICK_MS)
  }
})()

type Probe = { id: number; phase: 'A' | 'B' }
const probes: Probe[] = []
const started = new Date()

// Phase A
const offsets = Array.from({ length: N }, () => Math.random() * SPREAD_S * 1000).sort(
  (a, b) => a - b,
)
const t0 = Date.now()
for (const o of offsets) {
  await sleep(Math.max(0, t0 + o - Date.now()))
  probes.push({ id: await submit(), phase: 'A' })
}
// Phase A must drain before the outage starts, or its first attempts would fail too.
const drainBy = Date.now() + 5 * 60_000
while (Date.now() < drainBy) {
  const ids = probes.map((p) => p.id)
  const r = await db.query<{ n: number }>(
    `select count(*)::int n from enquiries where id = any($1) and delivery_status <> 'sent'`,
    [ids],
  )
  if (r.rows[0]!.n === 0) break
  await sleep(2_000)
}
// Phase B
outage = true
const outageStart = new Date().toISOString()
for (let i = 0; i < M; i++) {
  probes.push({ id: await submit(), phase: 'B' })
  await sleep((OUTAGE_TICKS * TICK_MS) / M)
}
const storedDuringOutage = M
outage = false
const outageEnd = new Date().toISOString()

// Wait for delivery (cap 20 minutes after recovery)
const deadline = Date.now() + 20 * 60_000
const status = async () =>
  db.query<{ s: string; n: number }>(
    `select delivery_status as s, count(*)::int as n from enquiries group by 1`,
  )
while (Date.now() < deadline) {
  const rows = (await status()).rows
  if (rows.every((r) => r.s === 'sent' || r.s === 'failed')) break
  await sleep(5_000)
}
stop = true
await scheduler.catch(() => undefined)

// Mailpit receipt times, matched by the "Reference: <id>" line in the body
type Msg = { ID: string; Created: string }
const list = (await (await fetch(`${MAILPIT}/api/v1/messages?limit=1000`)).json()) as {
  messages: Msg[]
}
const received = new Map<number, number>()
for (const m of list.messages.filter((m) => new Date(m.Created) >= started)) {
  const full = (await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json()) as { Text: string }
  const ref = /Reference: (\d+)/.exec(full.Text)?.[1]
  if (ref) received.set(Number(ref), new Date(m.Created).getTime())
}
const created = new Map<number, number>()
const rows = await db.query<{ id: number; created_at: string; delivery_status: string }>(
  `select id, created_at, delivery_status from enquiries`,
)
for (const r of rows.rows) created.set(Number(r.id), new Date(r.created_at).getTime())

const lat = (phase: 'A' | 'B') =>
  probes
    .filter((p) => p.phase === phase)
    .map((p) => (received.has(p.id) ? (received.get(p.id)! - created.get(p.id)!) / 1000 : Infinity))
    .sort((a, b) => a - b)
const pct = (xs: number[], q: number) => xs[Math.min(xs.length - 1, Math.ceil(q * xs.length) - 1)]
const a = lat('A')
const b = lat('B')
const report = {
  measurement: 'SC-010 enquiry email delivery latency',
  environment:
    'local: production build not used; Payload Local API + jobs queue on Postgres 17 (Docker), SMTP to Mailpit, scheduler tick every 60 s',
  startedAt: started.toISOString(),
  finishedAt: new Date().toISOString(),
  schedulerTicks: ticks.length,
  phaseA: {
    enquiries: a.length,
    delivered: a.filter(Number.isFinite).length,
    within120s: a.filter((x) => x <= 120).length,
    shareWithin120s: a.filter((x) => x <= 120).length / a.length,
    seconds: { min: a[0], p50: pct(a, 0.5), p95: pct(a, 0.95), p99: pct(a, 0.99), max: a.at(-1) },
  },
  phaseB: {
    outageStart,
    outageEnd,
    enquiriesDuringOutage: storedDuringOutage,
    storedInInbox: b.length,
    deliveredAfterRecovery: b.filter(Number.isFinite).length,
    seconds: { min: b[0], max: b.at(-1) },
    finalStatuses: rows.rows
      .filter((r) => probes.some((p) => p.phase === 'B' && p.id === Number(r.id)))
      .reduce<Record<string, number>>(
        (acc, r) => ({ ...acc, [r.delivery_status]: (acc[r.delivery_status] ?? 0) + 1 }),
        {},
      ),
  },
}
mkdirSync('test-results/ops', { recursive: true })
const file = `test-results/ops/sc010-${started.toISOString().replace(/[:.]/g, '')}.json`
writeFileSync(file, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
console.log(`report: ${file}`)
await db.end()
process.exit(0)
