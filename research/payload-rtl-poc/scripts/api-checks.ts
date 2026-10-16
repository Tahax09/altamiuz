// R-A semantics checks via Local API / REST on a separate document (does not touch page 1).
import fs from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const out: Record<string, unknown> = {}
const run = async (name: string, fn: () => Promise<unknown>) => {
  try {
    out[name] = await fn()
  } catch (e) {
    out[name] = { blocked: String(e).slice(0, 400) }
  }
}

// 11 per-locale publish semantics (experimental localizeStatus)
await run('11-locale-publish', async () => {
  const doc = await payload.create({
    collection: 'poc-pages', locale: 'ar', draft: true, data: { title: 'صفحة للنشر' },
  })
  await payload.update({
    collection: 'poc-pages', id: doc.id, locale: 'en', draft: true, data: { title: 'Page to publish' },
  })
  await payload.update({
    collection: 'poc-pages', id: doc.id, locale: 'ar', data: { _status: 'published' },
    // @ts-expect-error option name verified at runtime
    publishSpecificLocale: 'ar',
  })
  const pubAr = await payload.findByID({ collection: 'poc-pages', id: doc.id, locale: 'ar', draft: false })
  const pubEn = await payload.findByID({ collection: 'poc-pages', id: doc.id, locale: 'en', draft: false })
  const all = await payload.findByID({ collection: 'poc-pages', id: doc.id, locale: 'all', draft: false })
  const publicEnQuery = await payload.find({
    collection: 'poc-pages', locale: 'en', draft: false,
    where: { and: [{ id: { equals: doc.id } }, { _status: { equals: 'published' } }] },
  })
  return {
    docId: doc.id,
    publishedAr: { title: pubAr.title, status: pubAr._status },
    publishedEn: { title: pubEn.title, status: pubEn._status },
    statusAllLocales: (all as Record<string, unknown>)._status,
    enPublishedQueryCount: publicEnQuery.totalDocs,
  }
})

// 12 version restore semantics
await run('12-version-restore', async () => {
  const id = (out['11-locale-publish'] as { docId: number }).docId
  await payload.update({
    collection: 'poc-pages', id, locale: 'ar', draft: true, data: { title: 'مسودة لاحقة' },
  })
  const versions = await payload.findVersions({
    collection: 'poc-pages', where: { parent: { equals: id } }, sort: 'createdAt', locale: 'all',
  })
  const first = versions.docs[0]
  const restored = await payload.restoreVersion({ collection: 'poc-pages', id: first.id })
  const after = await payload.findVersions({
    collection: 'poc-pages', where: { parent: { equals: id } }, sort: '-createdAt', limit: 1, locale: 'all',
  })
  return {
    versionCountBefore: versions.totalDocs,
    restoredFrom: first.id,
    restoredDocStatus: (restored as Record<string, unknown>)._status,
    newestVersionStatus: (after.docs[0]?.version as Record<string, unknown>)?._status,
    newestIsLatest: after.docs[0]?.latest,
  }
})

// R-C preview: are sessions revocable via logout (useSessions default)?
await run('rc-session-logout', async () => {
  const base = 'http://localhost:3100'
  const login = await fetch(`${base}/api/users/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: process.env.POC_EDITOR_EMAIL, password: process.env.POC_EDITOR_PASSWORD }),
  })
  const { token } = (await login.json()) as { token: string }
  const auth = { authorization: `JWT ${token}` }
  const before = (await fetch(`${base}/api/users/me`, { headers: auth }).then((r) => r.json())) as { user: unknown }
  await fetch(`${base}/api/users/logout`, { method: 'POST', headers: auth })
  const after = (await fetch(`${base}/api/users/me`, { headers: auth }).then((r) => r.json())) as { user: unknown }
  const user = await payload.find({ collection: 'users', where: { email: { equals: process.env.POC_EDITOR_EMAIL } }, showHiddenFields: true })
  return {
    meBeforeLogout: !!before.user,
    sameTokenAfterLogout: !!after.user,
    sessionsFieldPresent: Array.isArray((user.docs[0] as Record<string, unknown>).sessions),
  }
})

fs.mkdirSync('evidence', { recursive: true })
fs.writeFileSync('evidence/api-checks.json', JSON.stringify(out, null, 2))
payload.logger.info(JSON.stringify(out))
process.exit(0)
