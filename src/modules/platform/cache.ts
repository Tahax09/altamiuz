// Public data-cache invalidation (WS11 finding M-1). Next 16.3.8 `revalidateTag(tag, 'max')` is
// stale-while-revalidate: the old entry is served at least once more, so an unpublished, deleted or
// replaced (possibly compromised) document stays public after the write succeeds. `{ expire: 0 }`
// marks the tag expired immediately; the next read re-fetches before responding.
// Scope: the tag manifest is per server process. A multi-instance deployment needs a shared
// cache handler before scaling out (hosting decision pending).
import { revalidateTag } from 'next/cache'

export function expireCacheTags(...tags: string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 })
    } catch {
      // outside a Next request (scripts, tests): there is no data cache to expire
    }
  }
}
