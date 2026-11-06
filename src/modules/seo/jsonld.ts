// Structured data (T116, FR-063, D-16). Only published content, and organization facts only when
// their evidence is verified (FR-016); unverified or missing facts are omitted, never guessed.
// Output is serialised for an inline `application/ld+json` data block with `<` escaped.
import type { Locale } from '../i18n'

type Thing = Record<string, unknown>

export type VerifiedOrg = { name?: string; address?: string } // only verified values
export const orgId = (siteUrl: string) => new URL('/#organization', siteUrl).toString()

export function organization(siteUrl: string, org: VerifiedOrg): Thing | null {
  if (!org.name) return null // the legal name is the minimum (CD-01)
  return {
    '@type': 'Organization',
    '@id': orgId(siteUrl),
    name: org.name,
    url: new URL('/', siteUrl).toString(),
    ...(org.address ? { address: org.address } : {}),
  }
}

export function website(siteUrl: string, locale: Locale, name?: string): Thing {
  return {
    '@type': 'WebSite',
    '@id': new URL(`/${locale}#website`, siteUrl).toString(),
    url: new URL(`/${locale}`, siteUrl).toString(),
    inLanguage: locale,
    ...(name ? { name, publisher: { '@id': orgId(siteUrl) } } : {}),
  }
}

export function breadcrumbs(
  siteUrl: string,
  items: { name: string; path: string }[],
): Thing | null {
  if (items.length < 2) return null
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: new URL(it.path, siteUrl).toString(),
    })),
  }
}

/** Plain text of a Lexical rich-text value (text nodes only; line breaks between blocks). */
export function richTextToPlain(value: unknown, depth = 0): string {
  if (depth > 40 || !value || typeof value !== 'object') return ''
  const node = value as { root?: unknown; text?: unknown; children?: unknown }
  if (node.root) return richTextToPlain(node.root, depth + 1).trim()
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  const parts = node.children.map((c) => richTextToPlain(c, depth + 1))
  const block = (node as { type?: unknown }).type
  return block === 'root' ? parts.join('\n') : parts.join('')
}

export function faqPage(sections: unknown): Thing | null {
  if (!Array.isArray(sections)) return null
  const qa: Thing[] = []
  for (const s of sections as { blockType?: string; hidden?: boolean; items?: unknown }[]) {
    if (s?.blockType !== 'faq' || s.hidden || !Array.isArray(s.items)) continue
    for (const it of s.items as { question?: unknown; answer?: unknown; hidden?: boolean }[]) {
      const q = typeof it?.question === 'string' ? it.question.trim() : ''
      const a = richTextToPlain(it?.answer)
      if (q && a && !it.hidden)
        qa.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })
    }
  }
  return qa.length ? { '@type': 'FAQPage', mainEntity: qa } : null
}

export function offering(
  kind: 'Service' | 'Course',
  siteUrl: string,
  doc: { title?: unknown; summary?: unknown; provider?: unknown },
  path: string,
  hasOrg: boolean,
): Thing | null {
  const name = typeof doc.title === 'string' ? doc.title.trim() : ''
  if (!name) return null
  const description =
    typeof doc.summary === 'string' && doc.summary.trim() ? doc.summary.trim() : undefined
  const base: Thing = {
    '@type': kind,
    name,
    url: new URL(path, siteUrl).toString(),
    ...(description ? { description } : {}),
  }
  if (kind === 'Service')
    return { ...base, ...(hasOrg ? { provider: { '@id': orgId(siteUrl) } } : {}) }
  // Course provider is the editor's free-text provider name (not an accreditation claim).
  const provider =
    typeof doc.provider === 'string' && doc.provider.trim() ? doc.provider.trim() : null
  return {
    ...base,
    ...(provider
      ? { provider: { '@type': 'Organization', name: provider } }
      : hasOrg
        ? { provider: { '@id': orgId(siteUrl) } }
        : {}),
  }
}

export function serialiseGraph(nodes: (Thing | null)[]): string | null {
  const graph = nodes.filter((n): n is Thing => !!n)
  if (!graph.length) return null
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
