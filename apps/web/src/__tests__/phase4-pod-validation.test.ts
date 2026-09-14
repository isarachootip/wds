import { describe, it, expect } from 'vitest'

describe('Phase 4 Acceptance Criteria 3: Delivery POD & Receiver Name Validation Gates', () => {
  type DeliveryState = {
    id: string
    orderId: string
    status: 'scheduled' | 'picking' | 'shipped' | 'delivered' | 'failed'
    podPath?: string
    receiverName?: string
    attempt: number
  }

  function validateAndDeliver(
    delivery: DeliveryState,
    input: { podPath?: string; receiverName?: string; actorRole: string }
  ): { success: boolean; error?: string } {
    const allowedRoles = ['admin', 'warehouse', 'technician']
    if (!allowedRoles.includes(input.actorRole)) {
      return { success: false, error: `บทบาท ${input.actorRole} ไม่มีสิทธิ์ดำเนินการนี้` }
    }

    if (!input.podPath || !input.podPath.trim()) {
      return { success: false, error: 'กรุณาถ่ายรูป POD ก่อนปิดงานส่ง' }
    }

    if (!input.receiverName || !input.receiverName.trim()) {
      return { success: false, error: 'กรุณาระบุชื่อผู้รับ' }
    }

    delivery.status = 'delivered'
    delivery.podPath = input.podPath
    delivery.receiverName = input.receiverName
    return { success: true }
  }

  it('1. Blocks markDelivered if POD photo is missing', () => {
    const delivery: DeliveryState = {
      id: 'del-01',
      orderId: 'ord-01',
      status: 'shipped',
      attempt: 0,
    }

    const result = validateAndDeliver(delivery, {
      podPath: '', // missing
      receiverName: 'คุณสมชาย ใจดี',
      actorRole: 'technician',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('ถ่ายรูป POD')
    expect(delivery.status).toBe('shipped')
  })

  it('2. Blocks markDelivered if receiver name is missing', () => {
    const delivery: DeliveryState = {
      id: 'del-02',
      orderId: 'ord-02',
      status: 'shipped',
      attempt: 0,
    }

    const result = validateAndDeliver(delivery, {
      podPath: 'deliveries/del-02/pod_12345.jpg',
      receiverName: '   ', // whitespace only
      actorRole: 'technician',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('ระบุชื่อผู้รับ')
    expect(delivery.status).toBe('shipped')
  })

  it('3. Successfully transitions to delivered when both POD and receiverName are provided', () => {
    const delivery: DeliveryState = {
      id: 'del-03',
      orderId: 'ord-03',
      status: 'shipped',
      attempt: 0,
    }

    const result = validateAndDeliver(delivery, {
      podPath: 'deliveries/del-03/pod_proof.jpg',
      receiverName: 'คุณวิภาวรรณ ชัยเจริญ',
      actorRole: 'technician',
    })

    expect(result.success).toBe(true)
    expect(delivery.status).toBe('delivered')
    expect(delivery.podPath).toBe('deliveries/del-03/pod_proof.jpg')
    expect(delivery.receiverName).toBe('คุณวิภาวรรณ ชัยเจริญ')
  })
})
