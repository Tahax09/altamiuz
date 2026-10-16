// Finds every rich-text value and link group in an arbitrary document (any locale shape) and
// checks them with the policy. Used after saves (all locales) and by scan:richtext.
import { checkRichText, classifyUrl, type RichTextIssue } from './policy'

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export const isRichTextValue = (v: unknown): v is { root: unknown } =>
  isObject(v) && isObject(v.root) && (v.root as { type?: unknown }).type === 'root'

/** A shared `link` group (data-model): has a `linkType` key. */
const isLinkGroup = (v: unknown): v is Record<string, unknown> =>
  isObject(v) && 'linkType' in v && ('url' in v || 'email' in v || 'tel' in v || 'doc' in v)

export function linkGroupIssues(link: Record<string, unknown>, path: string): RichTextIssue[] {
  const t = link.linkType
  if (t === 'internal' || t === undefined || t === null) return []
  const value =
    t === 'external'
      ? link.url
      : t === 'email'
        ? `mailto:${String(link.email ?? '')}`
        : t === 'tel'
          ? `tel:${String(link.tel ?? '')}`
          : null
  if (value === null) return [{ path: `${path}.linkType`, code: 'attribute' }]
  const raw =
    t === 'external' ? link.url : t === 'email' ? link.email : t === 'tel' ? link.tel : null
  if (raw === undefined || raw === null || raw === '') return [] // incomplete draft; required on publish
  const v = classifyUrl(value)
  return v.ok ? [] : [{ path: `${path}.${t === 'external' ? 'url' : String(t)}`, code: v.code }]
}

export function findContentIssues(doc: unknown, path = '$'): RichTextIssue[] {
  const issues: RichTextIssue[] = []
  const visit = (v: unknown, p: string, depth: number) => {
    if (depth > 40) return
    if (isRichTextValue(v)) {
      for (const i of checkRichText(v)) issues.push({ path: `${p}.${i.path}`, code: i.code })
      return
    }
    if (Array.isArray(v)) return v.forEach((x, i) => visit(x, `${p}.${i}`, depth + 1))
    if (!isObject(v)) return
    if (isLinkGroup(v)) issues.push(...linkGroupIssues(v, p))
    for (const [k, x] of Object.entries(v)) visit(x, `${p}.${k}`, depth + 1)
  }
  visit(doc, path, 0)
  return issues
}
