// One resolver for the shared `link` group (FR-014, D-5): internal documents through the typed
// route map (published targets only), fixed routes (home, listings), and URL, e-mail and phone
// through safeHref. Returns null for anything unsafe or unpublished, which callers omit.
import { safeHref } from '@/modules/content'
import { href, type Locale } from '@/modules/i18n'
import type { InternalHref } from '../richtext/RichText'

export type CmsLink = {
  linkType?: string | null
  url?: string | null
  email?: string | null
  tel?: string | null
  route?: string | null
  label?: string | null
  newTab?: boolean | null
  doc?: { relationTo?: string; value?: unknown } | null
}

const ROUTES = new Set(['home', 'services', 'training'])

export function linkTarget(
  link: CmsLink | null | undefined,
  locale: Locale,
  resolve: InternalHref,
): string | null {
  if (!link) return null
  switch (link.linkType) {
    case 'internal':
      return link.doc?.relationTo ? resolve(link.doc.relationTo, link.doc.value) : null
    case 'route':
      return typeof link.route === 'string' && ROUTES.has(link.route)
        ? href(link.route as 'home', locale)
        : null
    case 'external':
      return safeHref(link.url ?? undefined)
    case 'email':
      return safeHref(`mailto:${link.email ?? ''}`)
    case 'tel':
      return safeHref(`tel:${link.tel ?? ''}`)
    default:
      return null
  }
}

/** Opens in a new tab only for http(s) targets the editor marked so. */
export const newTabProps = (link: CmsLink | null | undefined, target: string) =>
  link?.newTab === true && /^https?:/.test(target)
    ? ({ target: '_blank', rel: 'noopener noreferrer' } as const)
    : {}

/** Same path, ignoring a trailing slash and percent-encoding differences. */
export function samePath(a: string, b: string): boolean {
  const norm = (p: string) => {
    let s = p.split(/[?#]/)[0] ?? ''
    try {
      s = decodeURIComponent(s)
    } catch {
      /* keep as is */
    }
    return s.normalize('NFC').replace(/\/+$/, '') || '/'
  }
  return norm(a) === norm(b)
}
