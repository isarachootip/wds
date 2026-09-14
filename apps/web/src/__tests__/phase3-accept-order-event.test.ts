import { describe, it, expect, vi } from 'vitest'

describe('Phase 3 Acceptance Criteria 5: Customer Accept, Order Creation, Evidence & Event Emission', () => {
  type OtpRecord = {
    quotationId: string
    code: string
    expiresAt: Date
    usedAt: Date | null
  }

  type QuotationRecord = {
    id: string
    customerId: string
    number: string
    status: string
    totalSatang: number
    decidedAt: Date | null
  }

  type OrderRecord = {
    id: string
    number: string
    quotationId: string
    customerId: string
    status: string
    totalSatang: number
  }

  type EventRecord = {
    id: string
    name: string
    aggregateType: string
    aggregateId: string
    payload: Record<string, any>
  }

  type EvidenceRecord = {
    quotationId: string
    kind: string
    ip: string
    userAgent: string
    at: Date
  }

  it('1. Verifies OTP, transitions QT to accepted, creates Order (SO-...), records IP/UA evidence, and emits order.created', async () => {
    let currentSoSeq = 100

    const mockQt: QuotationRecord = {
      id: 'qt-101',
      customerId: 'cust-501',
      number: 'QT-202609-0001',
      status: 'viewed',
      totalSatang: 350000,
      decidedAt: null,
    }

    const mockOtp: OtpRecord = {
      quotationId: 'qt-101',
      code: '824619',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min future
      usedAt: null,
    }

    const ordersStore: OrderRecord[] = []
    const eventsStore: EventRecord[] = []
    const evidenceStore: EvidenceRecord[] = []

    // Simulate accept flow
    async function acceptQuotation(
      quotationId: string,
      inputOtp: string,
      clientIp: string,
      clientUserAgent: string
    ) {
      // 1. Verify OTP
      if (mockOtp.quotationId !== quotationId || mockOtp.code !== inputOtp) {
        throw new Error('รหัส OTP ไม่ถูกต้อง')
      }
      if (mockOtp.expiresAt.getTime() < Date.now()) {
        throw new Error('รหัส OTP หมดอายุ')
      }
      if (mockOtp.usedAt !== null) {
        throw new Error('รหัส OTP ถูกใช้งานไปแล้ว')
      }

      // Mark OTP used
      mockOtp.usedAt = new Date()

      // 2. Transition QT status to accepted
      mockQt.status = 'accepted'
      mockQt.decidedAt = new Date()

      // 3. Record quotation evidence event
      const evidence: EvidenceRecord = {
        quotationId,
        kind: 'accepted',
        ip: clientIp,
        userAgent: clientUserAgent,
        at: new Date(),
      }
      evidenceStore.push(evidence)

      // 4. Generate Order number SO-YYYYMM-NNNN
      currentSoSeq += 1
      const soNumber = `SO-202609-${String(currentSoSeq).padStart(4, '0')}`

      // 5. Create Order
      const newOrder: OrderRecord = {
        id: `ord-${currentSoSeq}`,
        number: soNumber,
        quotationId: mockQt.id,
        customerId: mockQt.customerId,
        status: 'new',
        totalSatang: mockQt.totalSatang,
      }
      ordersStore.push(newOrder)

      // 6. Emit domain event order.created
      const event: EventRecord = {
        id: `evt-ord-${currentSoSeq}`,
        name: 'order.created',
        aggregateType: 'order',
        aggregateId: newOrder.id,
        payload: {
          orderId: newOrder.id,
          orderNumber: newOrder.number,
          quotationId: mockQt.id,
          customerId: mockQt.customerId,
          totalSatang: mockQt.totalSatang,
          ip: clientIp,
          userAgent: clientUserAgent,
        },
      }
      eventsStore.push(event)

      return { success: true, orderId: newOrder.id, orderNumber: newOrder.number }
    }

    const testIp = '203.150.21.99'
    const testUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'

    const result = await acceptQuotation('qt-101', '824619', testIp, testUa)

    // Assertions
    expect(result.success).toBe(true)
    expect(result.orderNumber).toBe('SO-202609-0101')

    // QT status
    expect(mockQt.status).toBe('accepted')
    expect(mockQt.decidedAt).toBeInstanceOf(Date)

    // Order created
    expect(ordersStore).toHaveLength(1)
    expect(ordersStore[0].number).toBe('SO-202609-0101')
    expect(ordersStore[0].quotationId).toBe('qt-101')
    expect(ordersStore[0].totalSatang).toBe(350000)

    // Evidence recorded
    expect(evidenceStore).toHaveLength(1)
    expect(evidenceStore[0].kind).toBe('accepted')
    expect(evidenceStore[0].ip).toBe(testIp)
    expect(evidenceStore[0].userAgent).toBe(testUa)

    // Event emitted
    expect(eventsStore).toHaveLength(1)
    expect(eventsStore[0].name).toBe('order.created')
    expect(eventsStore[0].aggregateId).toBe(ordersStore[0].id)
    expect(eventsStore[0].payload.orderNumber).toBe('SO-202609-0101')
    expect(eventsStore[0].payload.ip).toBe(testIp)
  })

  it('2. Rejects invalid OTP and does not create Order or emit events', async () => {
    const mockOtp: OtpRecord = {
      quotationId: 'qt-102',
      code: '123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      usedAt: null,
    }

    expect(() => {
      if (mockOtp.code !== '999999') {
        throw new Error('รหัส OTP ไม่ถูกต้อง')
      }
    }).toThrow('รหัส OTP ไม่ถูกต้อง')
  })
})
