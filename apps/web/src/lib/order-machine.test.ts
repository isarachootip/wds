import { describe, it, expect } from 'vitest'
import { ORDER_MACHINE } from './order-machine'

function canTransition(from: string, to: string): boolean {
  return Boolean((ORDER_MACHINE as any)[from]?.[to])
}

describe('ORDER_MACHINE transitions', () => {
  describe('new / credit_hold → awaiting_payment', () => {
    it('new → awaiting_payment', () => expect(canTransition('new', 'awaiting_payment')).toBe(true))
    it('credit_hold → awaiting_payment', () => expect(canTransition('credit_hold', 'awaiting_payment')).toBe(true))
    it('new → paid is invalid', () => expect(canTransition('new', 'paid')).toBe(false))
  })

  describe('awaiting_payment → paid', () => {
    it('valid', () => expect(canTransition('awaiting_payment', 'paid')).toBe(true))
    it('awaiting_payment → delivering is invalid', () => expect(canTransition('awaiting_payment', 'delivering')).toBe(false))
  })

  describe('paid → ready → delivering', () => {
    it('paid → ready', () => expect(canTransition('paid', 'ready')).toBe(true))
    it('ready → delivering', () => expect(canTransition('ready', 'delivering')).toBe(true))
    it('paid → delivering skip is invalid', () => expect(canTransition('paid', 'delivering')).toBe(false))
  })

  describe('delivering → delivered | returned', () => {
    it('delivering → delivered', () => expect(canTransition('delivering', 'delivered')).toBe(true))
    it('delivering → returned', () => expect(canTransition('delivering', 'returned')).toBe(true))
  })

  describe('delivered → closed', () => {
    it('valid', () => expect(canTransition('delivered', 'closed')).toBe(true))
    it('delivered → cancelled is invalid', () => expect(canTransition('delivered', 'cancelled')).toBe(false))
  })

  describe('cancellation paths', () => {
    it('new → cancelled', () => expect(canTransition('new', 'cancelled')).toBe(true))
    it('credit_hold → cancelled', () => expect(canTransition('credit_hold', 'cancelled')).toBe(true))
    it('paid → cancelled', () => expect(canTransition('paid', 'cancelled')).toBe(true))
    it('closed → cancelled is invalid', () => expect(canTransition('closed', 'cancelled')).toBe(false))
    it('closed → any is invalid', () => {
      expect(canTransition('closed', 'new')).toBe(false)
      expect(canTransition('closed', 'paid')).toBe(false)
    })
  })
})
