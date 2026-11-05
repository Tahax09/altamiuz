// L-4: per-client budget for missing public paths.
import { describe, expect, it } from 'vitest'
import { createMissLimiter } from '@/modules/security'

describe('miss limiter', () => {
  it('blocks a client after the limit within the window and releases it afterwards', () => {
    let t = 0
    const l = createMissLimiter({ limit: 3, windowMs: 10_000, now: () => t })
    for (let i = 0; i < 3; i++) {
      expect(l.blockedFor('198.51.100.7')).toBe(0)
      l.recordMiss('198.51.100.7')
    }
    expect(l.blockedFor('198.51.100.7')).toBe(10)
    expect(l.blockedFor('198.51.100.8')).toBe(0) // other clients are unaffected
    t = 4_000
    expect(l.blockedFor('198.51.100.7')).toBe(6)
    t = 10_000
    expect(l.blockedFor('198.51.100.7')).toBe(0)
  })

  it('never blocks the shared fallback keys, so one client cannot throttle everyone', () => {
    const l = createMissLimiter({ limit: 1 })
    for (const shared of ['unidentified', 'invalid', ''])
      for (let i = 0; i < 5; i++) {
        l.recordMiss(shared)
        expect(l.blockedFor(shared)).toBe(0)
      }
  })

  it('keeps memory bounded by evicting the oldest clients', () => {
    const l = createMissLimiter({ limit: 1, maxClients: 2 })
    l.recordMiss('203.0.113.1')
    l.recordMiss('203.0.113.2')
    l.recordMiss('203.0.113.3')
    expect(l.blockedFor('203.0.113.1')).toBe(0) // evicted
    expect(l.blockedFor('203.0.113.3')).toBeGreaterThan(0)
  })
})
