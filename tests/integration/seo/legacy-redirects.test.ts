// T119 (FR-065, SC-012, CD-12): the legacy redirect seed refuses an unapproved map (PENDING
// targets, missing approval, placeholder sources, placeholder Arabic route segments, unpublished
// or external targets) and writes nothing; with an approved map it creates `legacy` redirects
// once, updates them in place on re-run, keeps `/` for the A-3 language redirect and never touches
// redirects of another source.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootPayload, type TestPayload } from '../../support/payload'
import { pageData } from '../../support/content'
import {
  applyLegacyRedirects,
  LegacyRedirectError,
  parseRedirectMap,
  planLegacyRedirects,
} from '../../../scripts/legacy-redirects'

let t: TestPayload
beforeAll(async () => {
  t = await bootPayload()
  const page = (await t.payload.create({
    collection: 'pages',
    locale: 'en',
    draft: true,
    data: pageData('legacy-target', 'Legacy target') as never,
    overrideAccess: true,
  })) as unknown as { id: number }
  await t.payload.update({
    collection: 'pages',
    id: page.id,
    locale: 'en',
    data: { _status: 'published' } as never,
    publishSpecificLocale: 'en',
    overrideAccess: true,
  })
  await t.payload.create({
    collection: 'pages',
    locale: 'en',
    draft: true,
    data: pageData('legacy-draft-only', 'Draft only') as never,
    overrideAccess: true,
  })
}, 240_000)
afterAll(async () => t?.close())

const table = (rows: [string, string, string, string][]) =>
  [
    '| Legacy path | v1 target | Type | Approved by / date |',
    '| --- | --- | --- | --- |',
    ...rows.map(([f, to, type, by]) => `| \`${f}\` | ${to} | ${type} | ${by} |`),
  ].join('\n')

const redirectsFor = async (from: string) =>
  (
    await t.payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      depth: 0,
      overrideAccess: true,
    })
  ).docs as unknown as { to: string; type: string; source: string }[]

describe('legacy redirect map (T119)', () => {
  it('parses only code-quoted legacy rows and refuses an unknown type', () => {
    const rows = parseRedirectMap(
      table([
        ['/about/', '`/en/legacy-target`', '301', 'Owner 2026-11-11'],
        ['/blog/', 'PENDING (closest relevant v1 page)', '301', ''],
      ]),
    )
    expect(rows.map((r) => [r.from, r.to, r.type, r.approvedBy])).toEqual([
      ['/about/', '/en/legacy-target', '301', 'Owner 2026-11-11'],
      ['/blog/', 'PENDING (closest relevant v1 page)', '301', ''],
    ])
    expect(() => parseRedirectMap(table([['/x', '/en', '303', 'x']]))).toThrow(LegacyRedirectError)
  })

  it('the committed map is still pending and is refused as a whole', async () => {
    const fs = await import('node:fs')
    const rows = parseRedirectMap(fs.readFileSync('docs/content/legacy-redirect-map.md', 'utf8'))
    expect(rows.length).toBeGreaterThan(5)
    await expect(planLegacyRedirects(t.payload, rows)).rejects.toThrow(/CD-12/)
  })

  it('refuses every unsafe or unapproved row and names it', async () => {
    const rows = parseRedirectMap(
      table([
        ['/a/', '`/en/legacy-target`', '301', ''],
        ['/b/', 'PENDING', '301', 'x'],
        ['/training_courses/<Arabic slug 1>', '`/en/legacy-target`', '301', 'x'],
        ['/c/', '`https://evil.example/`', '301', 'x'],
        ['/d/', '`/legacy-target`', '301', 'x'],
        ['/e/', '`/ar/ar-vocab-pending-services`', '301', 'x'],
        ['/f/', '`/en/legacy-draft-only`', '301', 'x'],
        ['/g/', '`/en/no-such-page`', '301', 'x'],
        ['/', '`/en`', '301', 'x'],
      ]),
    )
    const err = await planLegacyRedirects(t.payload, rows).catch((e: Error) => e)
    expect(err).toBeInstanceOf(LegacyRedirectError)
    const msg = (err as Error).message
    for (const needle of [
      '(/a/): no "Approved by / date"',
      '(/b/): target is PENDING',
      'placeholder; supply the exact URL',
      '(/c/): target "https://evil.example/" is not an internal site path',
      '(/d/): target "/legacy-target" must start with a locale',
      '(/e/): target "/ar/ar-vocab-pending-services" uses a placeholder Arabic route segment (CD-13)',
      '(/f/): target "/en/legacy-draft-only" is not a published page',
      '(/g/): target "/en/no-such-page" is not a published page',
      '(/): "/" is the A-3 language redirect',
    ])
      expect(msg).toContain(needle)
    expect(await redirectsFor('/a')).toEqual([])
  })

  it('an approved map is applied once, updated in place, and leaves other sources alone', async () => {
    await t.payload.create({
      collection: 'redirects',
      data: {
        from: '/t119-manual',
        to: '/en/legacy-target',
        type: '301',
        source: 'manual',
      } as never,
      overrideAccess: true,
    })
    const approved = (type: string) =>
      parseRedirectMap(
        table([
          ['/', 'A-3 (language redirect, no stored redirect)', '301', 'Owner 2026-11-11'],
          ['/t119-about/', '`/en/legacy-target`', type, 'Owner 2026-11-11'],
          ['/t119-services/', '`/en/services`', '301', 'Owner 2026-11-11'],
          ['/t119-%D8%AF%D9%88%D8%B1%D8%A9/', '`/en`', '301', 'Owner 2026-11-11'],
        ]),
      )
    const plan = await planLegacyRedirects(t.payload, approved('301'))
    expect(plan.skipped.map((r) => r.from)).toEqual(['/'])
    expect(plan.create.map((r) => r.from)).toEqual(['/t119-about', '/t119-services', '/t119-دورة'])
    await applyLegacyRedirects(t.payload, plan)
    expect(await redirectsFor('/t119-about')).toMatchObject([
      { to: '/en/legacy-target', type: '301', source: 'legacy' },
    ])
    expect(await redirectsFor('/t119-دورة')).toMatchObject([{ to: '/en', source: 'legacy' }])
    // Re-run: nothing to create; a changed type is an in-place update.
    const again = await planLegacyRedirects(t.payload, approved('302'))
    expect(again.create).toEqual([])
    expect(again.update.map((r) => r.from)).toEqual(['/t119-about'])
    expect(again.unchanged.length).toBe(2)
    await applyLegacyRedirects(t.payload, again)
    expect(await redirectsFor('/t119-about')).toMatchObject([{ type: '302', source: 'legacy' }])
    expect((await redirectsFor('/t119-about')).length).toBe(1)
    // A manual redirect for a mapped path is reported, not overwritten.
    const clash = parseRedirectMap(table([['/t119-manual', '`/en`', '301', 'x']]))
    await expect(planLegacyRedirects(t.payload, clash)).rejects.toThrow(
      /manual redirect already exists/,
    )
    expect(await redirectsFor('/t119-manual')).toMatchObject([{ to: '/en/legacy-target' }])
  })
})
