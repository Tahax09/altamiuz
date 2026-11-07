// T140 (FR-096): docs/api.md must list exactly the interfaces the code exposes.
import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  BEGIN,
  DOC,
  END,
  appRoutes,
  blockedPaths,
  renderInventory,
} from '../../../scripts/api-docs'

describe('docs/api.md (FR-096)', () => {
  it('matches the generated inventory (run `pnpm docs:api` after changing endpoints)', async () => {
    const config = await (await import('../../../src/payload.config')).default
    const doc = fs.readFileSync(DOC, 'utf8')
    const current = doc.slice(doc.indexOf(BEGIN), doc.indexOf(END) + END.length)
    expect(current).toBe(renderInventory(config))
  }, 60_000)

  it('lists the project route handlers and the proxy-blocked built-ins', () => {
    const routes = Object.fromEntries(appRoutes())
    expect(routes['/api/health']).toEqual(['GET'])
    expect(routes['/api/health/ready']).toEqual(['GET'])
    expect(routes['/api/ops/expire-public-cache']).toEqual(['POST'])
    const b = blockedPaths()
    expect(b.exact).toContain('/api/users/forgot-password')
    expect(b.prefixes).toContain('/api/users/verify/')
  })
})
