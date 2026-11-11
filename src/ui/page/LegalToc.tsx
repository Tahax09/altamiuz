// Legal pages (W-1): an "On this page" outline built from the first heading of each visible
// rich-text section. Sections without a valid anchor get a stable one (`legal-N`), so every entry
// links to its section. Plain links: works without JavaScript; sticky beside the text on wide
// screens, above it on narrow ones.
import { t, type Locale } from '@/modules/i18n'

type Block = Record<string, unknown> & { blockType?: string; hidden?: boolean; anchorId?: string }
type Node = { type?: string; text?: unknown; children?: unknown }
export type OutlineEntry = { id: string; label: string }

const ANCHOR = /^[a-z0-9-]{1,64}$/

function textOf(node: Node, depth = 0): string {
  if (depth > 20 || !node || typeof node !== 'object') return ''
  if (node.type === 'text' && typeof node.text === 'string') return node.text
  return Array.isArray(node.children)
    ? (node.children as Node[]).map((c) => textOf(c, depth + 1)).join('')
    : ''
}

/** First heading text of a rich-text value, or '' when it has none. */
export function firstHeading(value: unknown): string {
  const root = (value as { root?: Node } | null)?.root
  const children = Array.isArray(root?.children) ? (root!.children as Node[]) : []
  const h = children.find((n) => n?.type === 'heading')
  return h ? textOf(h).replace(/\s+/g, ' ').trim() : ''
}

export function legalOutline(sections: unknown): { sections: Block[]; outline: OutlineEntry[] } {
  const list = Array.isArray(sections) ? (sections as Block[]) : []
  const outline: OutlineEntry[] = []
  let n = 0
  const out = list.map((b) => {
    if (!b || b.hidden || b.blockType !== 'richText') return b
    const label = firstHeading(b.content)
    if (!label) return b
    n += 1
    const id = typeof b.anchorId === 'string' && ANCHOR.test(b.anchorId) ? b.anchorId : `legal-${n}`
    outline.push({ id, label })
    return { ...b, anchorId: id }
  })
  return { sections: out, outline }
}

export function LegalToc({ locale, outline }: { locale: Locale; outline: OutlineEntry[] }) {
  return (
    <aside className="legal-toc">
      <nav aria-labelledby="legal-toc-title">
        <p id="legal-toc-title" className="legal-toc__title">
          {t(locale, 'onThisPage')}
        </p>
        <ol className="legal-toc__list">
          {outline.map((e) => (
            <li key={e.id}>
              <a href={`#${e.id}`}>{e.label}</a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  )
}
