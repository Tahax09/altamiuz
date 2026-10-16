// T027: every attack is rejected with the contract's error code and a JSON path; valid documents
// pass unchanged; errors never echo the offending URL (contracts/rich-text.md).
import { describe, expect, it } from 'vitest'
import { assertSafeRichText, checkRichText, RichTextPolicyError } from '@/modules/content'
import { attacks, validDocs } from '../../../fixtures/richtext/corpus'

describe('rich-text policy: valid documents', () => {
  for (const [name, value] of Object.entries(validDocs)) {
    it(`accepts: ${name}`, () => {
      const before = JSON.stringify(value)
      expect(checkRichText(value)).toEqual([])
      expect(() => assertSafeRichText(value)).not.toThrow()
      expect(JSON.stringify(value)).toBe(before)
    })
  }
})

describe('rich-text policy: attacks', () => {
  for (const [name, { doc, code }] of Object.entries(attacks)) {
    it(`rejects: ${name} → ${code}`, () => {
      const issues = checkRichText(doc)
      expect(issues.length).toBeGreaterThan(0)
      expect(issues.map((i) => i.code)).toContain(code)
      for (const i of issues) expect(i.path).toMatch(/^(root|\$)/)
    })
  }

  it('assertSafeRichText throws RichTextPolicyError with issues', () => {
    const { doc } = attacks['javascript: scheme']!
    expect(() => assertSafeRichText(doc)).toThrow(RichTextPolicyError)
  })

  it('error messages and issues never contain the offending URL', () => {
    const marker = 'javascript:alert("LEAK-MARKER")'
    const { doc } = attacks['javascript: scheme']!
    const json = JSON.stringify(doc).replace('javascript:alert(1)', marker.replace(/"/g, '\\"'))
    const bad = JSON.parse(json)
    try {
      assertSafeRichText(bad)
      throw new Error('expected throw')
    } catch (e) {
      expect(String((e as Error).message)).not.toContain('LEAK-MARKER')
      expect(JSON.stringify((e as RichTextPolicyError).issues)).not.toContain('LEAK-MARKER')
    }
  })

  it('reports the JSON path of the offending link URL', () => {
    const issues = checkRichText(attacks['javascript: scheme']!.doc)
    expect(issues[0]).toEqual({ path: 'root.children.0.children.0.fields.url', code: 'url_scheme' })
  })

  it('does not pollute Object.prototype', () => {
    checkRichText(attacks['prototype pollution key']!.doc)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
