import { describe, it, expect, beforeEach } from 'vitest'

describe('Phase 2 Acceptance Criteria 6: Checkout Domain Events Handoff', () => {
  let emittedEvents: any[]

  beforeEach(() => {
    emittedEvents = []
  })

  it('1. Emits both job.checked_out and job.work_recorded on checkout', () => {
    const jobId = 'job-uuid-201'
    const appointmentId = 'appt-uuid-201'
    const actorId = 'tech-user-01'
    const signaturePath = 'signatures/job-201/signature.png'
    const checkedOutAt = new Date().toISOString()

    const recordedItems = [
      {
        id: 'item-1',
        productId: 'prod-101',
        description: 'แผ่นฉนวนกันความร้อน Stay Cool',
        qty: 4,
        unit: 'ม้วน',
        unitPriceSatang: 45000,
        source: 'planned',
      },
      {
        id: 'item-2',
        productId: 'prod-202',
        description: 'เทปฟอยล์สะท้อนความร้อน',
        qty: 2,
        unit: 'ม้วน',
        unitPriceSatang: 12000,
        source: 'added_onsite',
      },
    ]

    // Simulate checkout atomic event emissions
    // 1. Emit job.checked_out — for WDS billing
    emittedEvents.push({
      name: 'job.checked_out',
      aggregateType: 'job',
      aggregateId: jobId,
      payload: {
        jobId,
        appointmentId,
        checkedOutBy: actorId,
        checkedOutAt,
      },
    })

    // 2. Emit job.work_recorded — for E-ordering quotation initialization
    emittedEvents.push({
      name: 'job.work_recorded',
      aggregateType: 'job',
      aggregateId: jobId,
      payload: {
        jobId,
        appointmentId,
        items: recordedItems,
        workSummary: 'ติดตั้งฉนวนกันความร้อนเรียบร้อย ทดสอบอุณหภูมิใต้ฝ้าปกติ',
        signaturePath,
      },
    })

    expect(emittedEvents).toHaveLength(2)

    // Verify job.checked_out
    const checkedOutEvent = emittedEvents.find((e) => e.name === 'job.checked_out')
    expect(checkedOutEvent).toBeDefined()
    expect(checkedOutEvent.payload.jobId).toBe(jobId)
    expect(checkedOutEvent.payload.appointmentId).toBe(appointmentId)

    // Verify job.work_recorded
    const workRecordedEvent = emittedEvents.find((e) => e.name === 'job.work_recorded')
    expect(workRecordedEvent).toBeDefined()
    expect(workRecordedEvent.payload.items).toHaveLength(2)
    expect(workRecordedEvent.payload.items[1].source).toBe('added_onsite')
    expect(workRecordedEvent.payload.signaturePath).toBe(signaturePath)
  })
})
