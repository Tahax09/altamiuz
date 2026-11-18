// Contact-page map (OfficeMap): the vendored MapLibre worker must be the installed package's own
// file, at the version in its name, and the public CSP allows only the map tiles origin and blob
// workers beyond the existing sources.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { WORKER_URL } from '@/ui/site/OfficeMap'
import { buildCsp } from '@/modules/security'

const require = createRequire(import.meta.url)

describe('office map', () => {
  it('serves the installed MapLibre worker unchanged, named by version', () => {
    const pkg = require('maplibre-gl/package.json') as { version: string }
    expect(WORKER_URL).toBe(`/vendor/maplibre-gl-worker-${pkg.version}.mjs`)
    const installed = readFileSync(
      path.join(
        path.dirname(require.resolve('maplibre-gl/package.json')),
        'dist/maplibre-gl-worker.mjs',
      ),
    )
    const vendored = readFileSync(path.join(process.cwd(), 'public', WORKER_URL))
    expect(vendored.equals(installed)).toBe(true)
  })

  it('public CSP: map tiles origin for connections, blob: workers, nothing else new', () => {
    const csp = buildCsp({
      kind: 'public',
      nonce: 'nonce123',
      dev: false,
      upgradeInsecureRequests: false,
    })
    expect(csp).toContain("connect-src 'self' https://tiles.openfreemap.org")
    expect(csp).toContain("worker-src 'self' blob:")
    expect(csp).not.toMatch(/script-src[^;]*openfreemap/)
  })
})
