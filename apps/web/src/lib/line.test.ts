import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { verifyLineSignature } from './line'

const SECRET = 'test-channel-secret'

function makeSignature(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64')
}

describe('verifyLineSignature', () => {
  it('valid signature → true', () => {
    const body = JSON.stringify({ events: [] })
    const sig = makeSignature(body, SECRET)
    expect(verifyLineSignature(body, sig, SECRET)).toBe(true)
  })

  it('tampered body → false', () => {
    const body = JSON.stringify({ events: [] })
    const sig = makeSignature(body, SECRET)
    expect(verifyLineSignature(body + ' ', sig, SECRET)).toBe(false)
  })

  it('wrong secret → false', () => {
    const body = JSON.stringify({ events: [] })
    const sig = makeSignature(body, SECRET)
    expect(verifyLineSignature(body, sig, 'wrong-secret')).toBe(false)
  })

  it('empty inputs → false', () => {
    expect(verifyLineSignature('', '', '')).toBe(false)
    expect(verifyLineSignature('body', '', SECRET)).toBe(false)
    expect(verifyLineSignature('', 'sig', SECRET)).toBe(false)
  })
})
