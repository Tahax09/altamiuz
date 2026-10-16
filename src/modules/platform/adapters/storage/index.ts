// Storage port (D-12, D-14). Local disk for development; S3-compatible (R2, proposed) in Phase 4.
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>
  get(key: string): Promise<Buffer | null>
  exists(key: string): Promise<boolean>
  delete(key: string): Promise<void>
}

export class StorageKeyError extends Error {
  constructor() {
    super('Invalid storage key')
    this.name = 'StorageKeyError'
  }
}

const SEGMENT = /^[a-z0-9][a-z0-9._-]*$/i

/** Keys are relative, slash-separated, with no traversal, encoding tricks or empty segments. */
export function assertSafeKey(key: string): void {
  if (!key || key.length > 512 || key.includes('\\') || key.includes('%'))
    throw new StorageKeyError()
  const parts = key.split('/')
  if (parts.some((p) => !SEGMENT.test(p) || p === '.' || p === '..')) throw new StorageKeyError()
}

export function createLocalStorage(root: string): StorageAdapter {
  const resolve = (key: string) => {
    assertSafeKey(key)
    const full = path.resolve(root, key)
    if (!full.startsWith(path.resolve(root) + path.sep)) throw new StorageKeyError()
    return full
  }
  return {
    async put(key, data) {
      const full = resolve(key)
      await mkdir(path.dirname(full), { recursive: true })
      await writeFile(full, data, { flag: 'w' })
    },
    async get(key) {
      try {
        return await readFile(resolve(key))
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw e
      }
    },
    async exists(key) {
      try {
        return (await stat(resolve(key))).isFile()
      } catch {
        return false
      }
    },
    async delete(key) {
      await rm(resolve(key), { force: true })
    },
  }
}
