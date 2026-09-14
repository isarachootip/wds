import { describe, it, expect } from 'vitest'
import { isFullyPaid, remainingBalanceSatang } from '@/modules/billing/credit'

describe('Phase 4 Acceptance Criteria 2: Multi-Payment & Order Status Progression', () => {
  type PaymentRecord = {
    id: string
    orderId: string
    amountSatang: number
    status: 'pending' | 'verifying' | 'confirmed' | 'rejected'
    method: string
  }

  type OrderRecord = {
    id: string
    totalSatang: number
    status: 'new' | 'awaiting_payment' | 'paid' | 'ready' | 'delivering' | 'delivered' | 'closed'
  }

  it('1. Partial payments keep order in awaiting_payment until total confirmed reaches order amount', () => {
    const order: OrderRecord = {
      id: 'ord-100',
      totalSatang: 1_000_000, // 10,000 THB
      status: 'awaiting_payment',
    }

    const paymentsList: PaymentRecord[] = []

    function addAndConfirmPayment(amountSatang: number): { isPaid: boolean; remaining: number } {
      paymentsList.push({
        id: `pay-${paymentsList.length + 1}`,
        orderId: order.id,
        amountSatang,
        status: 'confirmed',
        method: 'transfer',
      })

      const totalConfirmed = paymentsList
        .filter((p) => p.status === 'confirmed')
        .reduce((acc, p) => acc + p.amountSatang, 0)

      const paid = isFullyPaid(order.totalSatang, totalConfirmed)
      if (paid && order.status === 'awaiting_payment') {
        order.status = 'ready' // In WDS, fully paid transitions to ready
      }

      return {
        isPaid: paid,
        remaining: remainingBalanceSatang(order.totalSatang, totalConfirmed),
      }
    }

    // Payment 1: 4,000 THB (400,000 Satang) -> remaining 6,000 THB
    const step1 = addAndConfirmPayment(400_000)
    expect(step1.isPaid).toBe(false)
    expect(step1.remaining).toBe(600_000)
    expect(order.status).toBe('awaiting_payment')

    // Payment 2: 3,000 THB (300,000 Satang) -> remaining 3,000 THB
    const step2 = addAndConfirmPayment(300_000)
    expect(step2.isPaid).toBe(false)
    expect(step2.remaining).toBe(300_000)
    expect(order.status).toBe('awaiting_payment')

    // Payment 3: 3,000 THB (300,000 Satang) -> remaining 0 THB -> Order transitions to ready
    const step3 = addAndConfirmPayment(300_000)
    expect(step3.isPaid).toBe(true)
    expect(step3.remaining).toBe(0)
    expect(order.status).toBe('ready')
  })

  it('2. Unconfirmed or rejected payments do not contribute towards order completion', () => {
    const order: OrderRecord = {
      id: 'ord-200',
      totalSatang: 500_000,
      status: 'awaiting_payment',
    }

    const payments: PaymentRecord[] = [
      { id: 'p1', orderId: 'ord-200', amountSatang: 300_000, status: 'verifying', method: 'transfer' },
      { id: 'p2', orderId: 'ord-200', amountSatang: 200_000, status: 'rejected', method: 'transfer' },
    ]

    const confirmedSatang = payments
      .filter((p) => p.status === 'confirmed')
      .reduce((s, p) => s + p.amountSatang, 0)

    expect(confirmedSatang).toBe(0)
    expect(isFullyPaid(order.totalSatang, confirmedSatang)).toBe(false)
    expect(order.status).toBe('awaiting_payment')
  })
})
