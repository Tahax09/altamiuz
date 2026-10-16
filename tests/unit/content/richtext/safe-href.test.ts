// T028: render-time allow-list. Anything not explicitly allowed yields null (rendered as text).
import { describe, expect, it } from 'vitest'
import { safeHref } from '@/modules/content'

describe('safeHref', () => {
  it.each([
    ['https://www.iso.org/standard/27001', 'https://www.iso.org/standard/27001'],
    ['HTTPS://EXAMPLE.COM/Path', 'https://example.com/Path'],
    ['/ar/contact', '/ar/contact'],
    ['#services', '#services'],
    ['mailto:info@example.ly', 'mailto:info@example.ly'],
    ['tel:+218210000000', 'tel:+218210000000'],
  ])('allows %s', (input, expected) => {
    expect(safeHref(input)).toBe(expected)
  })

  it('allows http only for allow-listed hosts', () => {
    expect(safeHref('http://legacy.example.ly/x')).toBeNull()
    expect(
      safeHref('http://legacy.example.ly/x', { allowedHttpHosts: ['legacy.example.ly'] }),
    ).toBe('http://legacy.example.ly/x')
  })

  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'vbscript:x',
    'data:text/html,x',
    'file:///etc/passwd',
    'ftp://x.example',
    'blob:https://x',
    'about:blank',
    '//evil.example',
    '/\\evil.example',
    'https:\\\\evil.example',
    'https://user:pw@example.com',
    'mailto:a@b.ly?cc=c@d.ly',
    '',
    '   ',
    `https://example.com/${'a'.repeat(2050)}`,
  ])('rejects %j', (input) => {
    expect(safeHref(input)).toBeNull()
  })

  it.each([undefined, null, 42, {}, []])('rejects non-string %j', (input) => {
    expect(safeHref(input as unknown)).toBeNull()
  })
})
