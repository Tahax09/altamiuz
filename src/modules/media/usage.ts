// Media usage (FR-056, FR-057, T111/T112). Usage is derived from the content itself on demand, not
// stored, so it cannot drift from what pages actually reference:
//   - published uses: the main (published) document of a page/service/course that is published in
//     at least one locale, ignoring hidden sections and items (they are never rendered);
//   - draft uses: the latest version of every document (what editors are working on).
// The public set (media ids with at least one published use) gates anonymous file delivery and
// public population. It is cached per server process for at most PUBLIC_TTL_MS and dropped on every
// content or media write in this process, like the page cache (T106).
import type { Block, Field, Payload } from 'payload'

export const MEDIA = 'media'
export const USAGE_COLLECTIONS = ['pages', 'services', 'courses'] as const
export type UsageCollection = (typeof USAGE_COLLECTIONS)[number]
export const PUBLIC_TTL_MS = 60_000

export type MediaUse = {
  collection: UsageCollection
  id: number
  title: string
  /** Referenced by the published document (any locale). */
  published: boolean
  /** Referenced by the latest draft. */
  draft: boolean
}

const idOf = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isInteger(v)) return v
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v)
  if (v && typeof v === 'object' && 'id' in v) return idOf((v as { id: unknown }).id)
  return null
}

const LOCALES = new Set(['ar', 'en'])
/** A localized value read with `locale: 'all'` is `{ ar, en }`; anything else is used as is. */
const perLocale = (v: unknown): unknown[] =>
  v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  !('id' in v) &&
  Object.keys(v).length > 0 &&
  Object.keys(v).every((k) => LOCALES.has(k))
    ? Object.values(v as Record<string, unknown>)
    : [v]

/**
 * Every media id referenced by `data` under `fields` (upload/relationship to media, through groups,
 * rows, collapsibles, tabs, arrays and blocks). With `skipHidden`, items marked `hidden` are skipped.
 */
export function collectMediaRefs(
  fields: Field[],
  data: unknown,
  opts: { skipHidden?: boolean } = {},
  out = new Set<number>(),
  depth = 0,
): Set<number> {
  if (depth > 32 || !data || typeof data !== 'object') return out
  const obj = data as Record<string, unknown>
  for (const field of fields) {
    const f = field as Field & {
      name?: string
      relationTo?: string | string[]
      fields?: Field[]
      blocks?: Block[]
      tabs?: { name?: string; fields: Field[] }[]
    }
    const named = 'name' in f && typeof f.name === 'string' ? f.name : null
    switch (f.type) {
      case 'upload':
      case 'relationship': {
        if (!named || f.relationTo !== MEDIA) break
        for (const v of perLocale(obj[named]))
          for (const item of Array.isArray(v) ? v : [v]) {
            const id = idOf(item)
            if (id !== null) out.add(id)
          }
        break
      }
      case 'group':
        for (const v of named ? perLocale(obj[named]) : [obj])
          collectMediaRefs(f.fields ?? [], v, opts, out, depth + 1)
        break
      case 'row':
      case 'collapsible':
        collectMediaRefs(f.fields ?? [], obj, opts, out, depth + 1)
        break
      case 'tabs':
        for (const tab of f.tabs ?? [])
          for (const v of tab.name ? perLocale(obj[tab.name]) : [obj])
            collectMediaRefs(tab.fields, v, opts, out, depth + 1)
        break
      case 'array':
      case 'blocks': {
        if (!named) break
        for (const v of perLocale(obj[named])) {
          if (!Array.isArray(v)) continue
          for (const item of v) {
            if (!item || typeof item !== 'object') continue
            if (opts.skipHidden && (item as { hidden?: unknown }).hidden === true) continue
            const sub =
              f.type === 'array'
                ? f.fields
                : f.blocks?.find((b) => b.slug === (item as { blockType?: unknown }).blockType)
                    ?.fields
            if (sub) collectMediaRefs(sub, item, opts, out, depth + 1)
          }
        }
        break
      }
      default:
        break
    }
  }
  return out
}

const isPublishedAnywhere = (status: unknown) =>
  status === 'published' ||
  (!!status &&
    typeof status === 'object' &&
    Object.values(status as Record<string, unknown>).includes('published'))

type Doc = Record<string, unknown> & { id: number; _status?: unknown; title?: unknown }

async function allDocs(payload: Payload, collection: UsageCollection, draft: boolean) {
  const res = await payload.find({
    collection,
    draft,
    locale: 'all',
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  return res.docs as unknown as Doc[]
}

const fieldsOf = (payload: Payload, c: UsageCollection) =>
  payload.collections[c]!.config.fields as Field[]

const titleOf = (t: unknown): string => {
  const v = perLocale(t).find((x) => typeof x === 'string' && x.trim())
  return typeof v === 'string' ? v : ''
}

/** Every page, service and course that uses `mediaId`, published or in its latest draft. */
export async function findMediaUsage(payload: Payload, mediaId: number): Promise<MediaUse[]> {
  const uses = new Map<string, MediaUse>()
  for (const collection of USAGE_COLLECTIONS) {
    const fields = fieldsOf(payload, collection)
    for (const draft of [false, true]) {
      for (const doc of await allDocs(payload, collection, draft)) {
        if (!draft && !isPublishedAnywhere(doc._status)) continue
        if (!collectMediaRefs(fields, doc, { skipHidden: !draft }).has(mediaId)) continue
        const key = `${collection}:${doc.id}`
        const use = uses.get(key) ?? {
          collection,
          id: doc.id,
          title: titleOf(doc.title),
          published: false,
          draft: false,
        }
        if (draft) use.draft = true
        else use.published = true
        uses.set(key, use)
      }
    }
  }
  return [...uses.values()].sort((a, b) => a.collection.localeCompare(b.collection) || a.id - b.id)
}

/** Media ids with at least one published, visible use (FR-056). */
export async function computePublicMediaIds(payload: Payload): Promise<Set<number>> {
  const ids = new Set<number>()
  for (const collection of USAGE_COLLECTIONS) {
    const fields = fieldsOf(payload, collection)
    for (const doc of await allDocs(payload, collection, false))
      if (isPublishedAnywhere(doc._status)) collectMediaRefs(fields, doc, { skipHidden: true }, ids)
  }
  return ids
}

let cache: { ids: Promise<Set<number>>; at: number; generation: number } | null = null
let generation = 0

export function invalidatePublicMedia(): void {
  generation++
  cache = null
}

export async function publicMediaIds(payload: Payload, now = Date.now()): Promise<Set<number>> {
  if (cache && cache.generation === generation && now - cache.at < PUBLIC_TTL_MS) return cache.ids
  const entry = { ids: computePublicMediaIds(payload), at: now, generation }
  cache = entry
  entry.ids.catch(() => {
    if (cache === entry) cache = null
  })
  return entry.ids
}
