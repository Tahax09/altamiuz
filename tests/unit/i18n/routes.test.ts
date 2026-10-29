// T095 (FR-002, D-5, CD-13): typed route map. Every route key × locale builds a path; static
// segments are unique per locale and never reserved; Arabic vocabulary is a publication gate.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  href,
  LOCALES,
  matchRoute,
  RESERVED_SEGMENTS,
  ROUTE_KEYS,
  routeVocabularyPending,
  STATIC_SEGMENTS,
} from '@/modules/i18n'

describe('href()', () => {
  it('builds a path for every route key in every locale', () => {
    for (const locale of LOCALES)
      for (const key of ROUTE_KEYS) {
        const p = href(key, locale, { slug: 'example' })
        expect(p, `${key}/${locale}`).toMatch(new RegExp(`^/${locale}(/|$)`))
        expect(p).not.toMatch(/[()\s]/)
      }
    expect(href('home', 'en')).toBe('/en')
    expect(href('page', 'en', { slug: 'about' })).toBe('/en/about')
    expect(href('services', 'en')).toBe('/en/services')
    expect(href('service', 'en', { slug: 'pentest' })).toBe('/en/services/pentest')
    expect(href('training', 'en')).toBe('/en/training')
    expect(href('course', 'en', { slug: 'iso' })).toBe('/en/training/iso')
  })

  it('percent-encodes slugs (Arabic slugs included) and refuses unsafe ones', () => {
    expect(href('page', 'ar', { slug: 'من-نحن' })).toBe(`/ar/${encodeURIComponent('من-نحن')}`)
    for (const slug of ['a/b', '..', '', 'a b', 'x?y', '%2F'])
      expect(() => href('page', 'en', { slug }), slug).toThrow()
  })

  it('requires a slug for detail routes', () => {
    expect(() => href('service', 'en')).toThrow()
  })
})

describe('static segments', () => {
  it('are unique per locale, never reserved, never a locale code', () => {
    for (const locale of LOCALES) {
      const segs = Object.values(STATIC_SEGMENTS[locale])
      expect(new Set(segs).size).toBe(segs.length)
      for (const s of segs) {
        expect(RESERVED_SEGMENTS).not.toContain(s)
        expect(LOCALES as readonly string[]).not.toContain(s)
        expect(s).toMatch(/^[\p{L}\p{N}-]+$/u)
      }
    }
  })

  it('matchRoute inverts href and rejects other-locale segments (cross-locale → no match)', () => {
    for (const locale of LOCALES)
      for (const key of ROUTE_KEYS) {
        const p = href(key, locale, { slug: 'x-1' })
        expect(matchRoute(p.split('/').filter(Boolean).map(decodeURIComponent))).toMatchObject({
          key,
          locale,
        })
      }
    // Another locale's static segment never resolves (no cross-language URLs).
    expect(matchRoute(['en', STATIC_SEGMENTS.ar.services, 'x'])).toMatchObject({ key: 'notFound' })
    expect(matchRoute(['ar', STATIC_SEGMENTS.en.services])).toMatchObject({ key: 'notFound' })
    expect(matchRoute(['en', 'a', 'b', 'c'])).toMatchObject({ key: 'notFound' })
    expect(matchRoute(['fr', 'x'])).toMatchObject({ key: 'notFound' })
  })
})

describe('CD-13 Arabic route vocabulary gate', () => {
  it('reports pending while any placeholder remains', () => {
    expect(routeVocabularyPending()).toBe(true)
  })

  it('pnpm check:route-vocab exits non-zero while placeholders remain', () => {
    let status = 0
    try {
      execFileSync('pnpm', ['-s', 'check:route-vocab'], { stdio: 'pipe' })
    } catch (e) {
      status = (e as { status: number }).status
    }
    expect(status).toBe(1)
  })
})

describe('CD-13 gate: one shared check for config, script and production build', () => {
  const approved = {
    en: { services: 'services', training: 'training' },
    ar: { services: 'approved-services', training: 'approved-training' },
  }

  it('throws on placeholder vocabulary and passes approved vocabulary', async () => {
    const { assertRouteVocabularyApproved } = await import('@/modules/i18n')
    expect(() => assertRouteVocabularyApproved()).toThrow(/CD-13/)
    expect(() => assertRouteVocabularyApproved(approved)).not.toThrow()
    expect(routeVocabularyPending(approved)).toBe(false)
  })

  it('a production build fails on placeholder vocabulary before compiling', () => {
    let out = ''
    let status = 0
    try {
      execFileSync('pnpm', ['-s', 'exec', 'next', 'build'], {
        env: { ...process.env, APP_ENV: 'production' },
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 120_000,
      })
    } catch (e) {
      status = (e as { status: number }).status
      out = `${(e as { stdout?: string }).stdout ?? ''}${(e as { stderr?: string }).stderr ?? ''}`
    }
    expect(status).not.toBe(0)
    expect(out).toMatch(/CD-13/)
  }, 150_000)

  it('non-production builds are not gated (development, test, preview)', async () => {
    const { productionBuildGate } = await import('@/modules/i18n')
    for (const appEnv of ['development', 'test', 'preview'])
      expect(() => productionBuildGate(appEnv)).not.toThrow()
    expect(() => productionBuildGate('production')).toThrow(/CD-13/)
    expect(() => productionBuildGate('production', approved)).not.toThrow()
  })

  it('fails closed: a build without a recognised non-production APP_ENV is gated', async () => {
    // A host that builds without APP_ENV (or with a typo) must not ship placeholder routes.
    const { productionBuildGate } = await import('@/modules/i18n')
    for (const appEnv of [undefined, '', 'prod', 'Production', 'staging'])
      expect(() => productionBuildGate(appEnv), String(appEnv)).toThrow(/CD-13/)
    expect(() => productionBuildGate(undefined, approved)).not.toThrow()
  })

  it('pnpm check:route-vocab exits 0 once the vocabulary is approved', () => {
    // Runs the real script against a copy of the i18n module whose Arabic segments are approved,
    // so the passing path of the release gate is exercised without editing the source.
    const dir = mkdtempSync(path.join(tmpdir(), 'route-vocab-'))
    try {
      cpSync('src/modules/i18n', path.join(dir, 'src/modules/i18n'), { recursive: true })
      cpSync('scripts/check-route-vocab.ts', path.join(dir, 'scripts/check-route-vocab.ts'))
      const routes = path.join(dir, 'src/modules/i18n/routes.ts')
      const src = readFileSync(routes, 'utf8')
      const patched = src.replace(
        "ar: { services: 'ar-vocab-pending-services', training: 'ar-vocab-pending-training' },",
        "ar: { services: 'approved-services', training: 'approved-training' },",
      )
      expect(patched).not.toBe(src) // the placeholder line is where the test expects it
      writeFileSync(routes, patched)
      const tsx = path.resolve('node_modules/.bin/tsx')
      const out = execFileSync(tsx, ['scripts/check-route-vocab.ts'], {
        cwd: dir,
        encoding: 'utf8',
        stdio: 'pipe',
      })
      expect(out).toMatch(/CD-13: route vocabulary approved/)
      // ...and the unpatched copy still fails, so the pass above is due to the vocabulary.
      writeFileSync(routes, src)
      let status = 0
      try {
        execFileSync(tsx, ['scripts/check-route-vocab.ts'], { cwd: dir, stdio: 'pipe' })
      } catch (e) {
        status = (e as { status: number }).status
      }
      expect(status).toBe(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 60_000)
})
