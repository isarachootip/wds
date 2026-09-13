import { describe, it, expect } from 'vitest'

// Pure rate limit logic — testable without Next.js
type Entry = { count: number; resetAt: number }

function slidingWindow(store: Map<string, Entry>, key: string, max: number, windowMs: number, now: number): { allowed: boolean; remaining: number } {
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1 }
  }
  entry.count++
  const allowed = entry.count <= max
  return { allowed, remaining: Math.max(0, max - entry.count) }
}

describe('Rate limit sliding window', () => {
  it('allows up to max requests', () => {
    const store = new Map<string, Entry>()
    for (let i = 0; i < 5; i++) {
      const r = slidingWindow(store, 'ip:test', 5, 60_000, 1000)
      expect(r.allowed).toBe(true)
    }
  })

  it('blocks on max+1 request', () => {
    const store = new Map<string, Entry>()
    for (let i = 0; i < 5; i++) slidingWindow(store, 'ip:test', 5, 60_000, 1000)
    const r = slidingWindow(store, 'ip:test', 5, 60_000, 1000)
    expect(r.allowed).toBe(false)
    expect(r.remaining).toBe(0)
  })

  it('resets after window expires', () => {
    const store = new Map<string, Entry>()
    for (let i = 0; i < 5; i++) slidingWindow(store, 'ip:test', 5, 60_000, 1000)
    // Advance time past window
    const r = slidingWindow(store, 'ip:test', 5, 60_000, 1000 + 60_001)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(4)
  })

  it('different keys are independent', () => {
    const store = new Map<string, Entry>()
    for (let i = 0; i < 5; i++) slidingWindow(store, 'ip:a', 5, 60_000, 1000)
    const r = slidingWindow(store, 'ip:b', 5, 60_000, 1000)
    expect(r.allowed).toBe(true)
  })
})
