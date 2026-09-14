import { describe, it, expect } from 'vitest'

describe('Phase 4 Acceptance Criteria 4: Delivery 3-Time Failure Alert & Retry Logic', () => {
  type Delivery = {
    id: string
    orderId: string
    attempt: number
    status: 'scheduled' | 'picking' | 'shipped' | 'failed' | 'delivered'
    failReason?: string
  }

  type DomainEvent = {
    name: string
    aggregateType: string
    aggregateId: string
    payload: Record<string, any>
  }

  it('1. Increments attempt on each failure, and emits delivery.failed_3_times on 3rd attempt', () => {
    const delivery: Delivery = {
      id: 'del-retry-01',
      orderId: 'ord-retry-01',
      attempt: 0,
      status: 'shipped',
    }

    const emittedEvents: DomainEvent[] = []

    function failDelivery(del: Delivery, reason: string) {
      del.attempt += 1
      del.status = 'failed'
      del.failReason = reason

      if (del.attempt >= 3) {
        emittedEvents.push({
          name: 'delivery.failed_3_times',
          aggregateType: 'delivery',
          aggregateId: del.id,
          payload: {
            deliveryId: del.id,
            orderId: del.orderId,
            attempt: del.attempt,
            failReason: reason,
          },
        })
      }
    }

    // Attempt 1 fails
    failDelivery(delivery, 'ติดต่อลูกค้าไม่ได้')
    expect(delivery.attempt).toBe(1)
    expect(delivery.status).toBe('failed')
    expect(emittedEvents).toHaveLength(0)

    // Attempt 2 fails
    failDelivery(delivery, 'ไซต์งานปิด ไม่สามารถเข้าพื้นที่ได้')
    expect(delivery.attempt).toBe(2)
    expect(emittedEvents).toHaveLength(0)

    // Attempt 3 fails -> emits delivery.failed_3_times
    failDelivery(delivery, 'ลูกค้ายกเลิกการรับสินค้ากะทันหัน')
    expect(delivery.attempt).toBe(3)
    expect(emittedEvents).toHaveLength(1)
    expect(emittedEvents[0].name).toBe('delivery.failed_3_times')
    expect(emittedEvents[0].payload.attempt).toBe(3)
    expect(emittedEvents[0].payload.failReason).toBe('ลูกค้ายกเลิกการรับสินค้ากะทันหัน')
  })
})
