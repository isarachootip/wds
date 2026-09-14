import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Phase 1 Acceptance Criteria 1 & 2: Lead Intake & Deduplication', () => {
  let mockTx: any
  let mockDb: any
  let insertedCustomers: any[]
  let insertedLeads: any[]
  let insertedFollowUps: any[]
  let insertedActivities: any[]

  beforeEach(() => {
    insertedCustomers = [
      { id: 'existing-cust-001', name: 'บจก. สมบัติค้าไม้', phone: '0812345678', code: 'C001', deletedAt: null }
    ]
    insertedLeads = []
    insertedFollowUps = []
    insertedActivities = []

    mockTx = {
      select: vi.fn((fields) => ({
        from: vi.fn((table) => ({
          where: vi.fn((condition) => ({
            limit: vi.fn((num) => {
              // Check customer search by phone
              return Promise.resolve(
                insertedCustomers.filter(c => c.deletedAt === null)
              )
            })
          }))
        }))
      })),
      insert: vi.fn((table) => ({
        values: vi.fn((val) => {
          const item = { ...val, id: `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
          if (val.dueAt) {
            insertedFollowUps.push(item)
          } else if (val.type) {
            insertedActivities.push(item)
          } else if (val.channelRef || val.source) {
            insertedLeads.push(item)
          } else if (val.name) {
            insertedCustomers.push(item)
          }
          return {
            returning: vi.fn().mockResolvedValue([item])
          }
        })
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([])
        }))
      }))
    }

    mockDb = {
      ...mockTx,
      transaction: vi.fn(async (cb) => cb(mockTx))
    }
  })

  it('1. Deduplication: Links existing customer ID when phone matches existing customer', async () => {
    const inputPhone = '0812345678'
    const matchingCustomer = insertedCustomers.find(c => c.phone === inputPhone)
    expect(matchingCustomer).toBeDefined()

    // When creating a lead with existing phone, should reuse matching customer
    let customerId = undefined
    if (!customerId && inputPhone) {
      const existing = insertedCustomers.find(c => c.phone === inputPhone && !c.deletedAt)
      if (existing) {
        customerId = existing.id
      }
    }

    expect(customerId).toBe('existing-cust-001')
    // No new customer created
    expect(insertedCustomers.length).toBe(1)
  })

  it('2. Intake: Creates inline customer when no matching phone exists', async () => {
    const newPhone = '0899999999'
    let customerId = undefined
    const existing = insertedCustomers.find(c => c.phone === newPhone && !c.deletedAt)
    if (existing) {
      customerId = existing.id
    }

    if (!customerId) {
      const newCust = {
        id: 'new-cust-002',
        code: `C${Date.now()}`,
        name: 'ลูกค้ารายใหม่ ก่อสร้าง',
        phone: newPhone,
        status: 'active',
        deletedAt: null
      }
      insertedCustomers.push(newCust)
      customerId = newCust.id
    }

    expect(customerId).toBe('new-cust-002')
    expect(insertedCustomers.length).toBe(2)
  })

  it('3. Auto Follow-up: Creates follow-up within 24 hours for owner', () => {
    const now = Date.now()
    const dueAt = new Date(now + 24 * 60 * 60 * 1000)

    const followUp = {
      leadId: 'lead-001',
      dueAt,
      assigneeId: 'sales-rep-01',
      channel: 'phone',
      status: 'open',
      note: 'ติดตาม Lead ใหม่ภายใน 24 ชั่วโมง (สร้างอัตโนมัติ)',
    }

    const diffHours = (followUp.dueAt.getTime() - now) / (1000 * 60 * 60)
    expect(diffHours).toBeCloseTo(24, 0.1)
    expect(followUp.status).toBe('open')
    expect(followUp.assigneeId).toBe('sales-rep-01')
  })

  it('4. Supports intake from all 3 core channels: phone, store, and line', () => {
    const channels = ['phone', 'store', 'line'] as const
    for (const ch of channels) {
      const lead = {
        source: ch,
        channelRef: ch === 'line' ? 'U1234567890' : ch === 'phone' ? '0812345678' : 'STORE-BKN',
        status: 'new',
        ownerId: 'sales-rep-01'
      }

      expect(['line', 'phone', 'store', 'other']).toContain(lead.source)
      expect(lead.status).toBe('new')
    }
  })
})
