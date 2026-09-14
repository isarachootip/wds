import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted Mocks ───────────────────────────────────────────────────────────
const {
  mockTransition,
  mockEmit,
  mockRunAutoCreditCheckAction,
  mockDbState,
  mockDb,
} = vi.hoisted(() => {
  const mockTransition = vi.fn().mockResolvedValue(undefined)
  const mockEmit = vi.fn().mockResolvedValue(undefined)
  const mockRunAutoCreditCheckAction = vi.fn().mockResolvedValue({
    decision: 'pass',
    reason: 'Passed standard credit evaluation',
  })

  const mockDbState = {
    leads: [] as any[],
    customers: [] as any[],
    leadActivities: [] as any[],
    followUps: [] as any[],
    siteVisits: [] as any[],
    appointments: [] as any[],
    jobs: [] as any[],
    quotations: [] as any[],
    orders: [] as any[],
    creditChecks: [] as any[],
  }

  const mockDb = {
    select: vi.fn((selection?: any) => ({
      from: vi.fn((table: any) => ({
        leftJoin: vi.fn((joinTable: any, condition: any) => ({
          where: vi.fn((whereCondition: any) => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn((limitVal: number) => ({
                offset: vi.fn(() => []),
              })),
            })),
          })),
          leftJoin: vi.fn((thirdTable: any, thirdCond: any) => ({
            where: vi.fn((whereCond: any) => {
              return mockDbState.appointments.map(a => ({
                appointment: a,
                job: mockDbState.jobs.find(j => j.appointmentId === a.id) ?? null,
              }))
            }),
          })),
        })),
        where: vi.fn((whereCondition: any) => ({
          orderBy: vi.fn((orderCond?: any) => ({
            limit: vi.fn((limitNum: number) => {
              return mockDbState.quotations.filter(q => !q.deletedAt).slice(0, limitNum)
            }),
            then: (resolve: any) => resolve(mockDbState.siteVisits),
          })),
          limit: vi.fn((lim: number) => []),
          then: (resolve: any) => resolve([]),
        })),
      })),
    })),
    insert: vi.fn((table: any) => ({
      values: vi.fn((values: any) => ({
        returning: vi.fn((returningFields?: any) => {
          const id = 'gen-' + Date.now()
          const record = { id, ...values }
          return [record]
        }),
      })),
    })),
    update: vi.fn((table: any) => ({
      set: vi.fn((values: any) => ({
        where: vi.fn((cond: any) => Promise.resolve([values])),
      })),
    })),
  }

  return {
    mockTransition,
    mockEmit,
    mockRunAutoCreditCheckAction,
    mockDbState,
    mockDb,
  }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  unstable_noStore: vi.fn(),
}))

vi.mock('@/lib/statemachine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/statemachine')>()
  return {
    ...actual,
    transition: mockTransition,
  }
})

vi.mock('@/lib/events', () => ({
  emit: mockEmit,
}))

vi.mock('@/modules/billing/actions', () => ({
  runAutoCreditCheckAction: mockRunAutoCreditCheckAction,
}))

vi.mock('@/lib/db', () => ({
  getDb: () => mockDb,
}))

vi.mock('@/modules/shared/with-transaction', () => ({
  withTransaction: async (db: any, callback: (tx: any) => Promise<any>) => {
    return callback(mockDb)
  },
}))

function resetMockDb() {
  mockDbState.leads = [
    {
      id: 'lead-1',
      source: 'line',
      channelRef: 'line-user-123',
      status: 'new',
      ownerId: 'user-1',
      customerId: 'cust-1',
      budgetRangeMinSatang: 1000000,
      budgetRangeMaxSatang: 5000000,
      createdAt: new Date('2026-09-10T10:00:00Z'),
      updatedAt: new Date('2026-09-10T10:00:00Z'),
      deletedAt: null,
    },
    {
      id: 'lead-quoted',
      source: 'phone',
      channelRef: '0812345678',
      status: 'quoted',
      ownerId: 'user-1',
      customerId: 'cust-1',
      budgetRangeMinSatang: 2000000,
      budgetRangeMaxSatang: 10000000,
      createdAt: new Date('2026-09-11T10:00:00Z'),
      updatedAt: new Date('2026-09-11T10:00:00Z'),
      deletedAt: null,
    },
    {
      id: 'lead-won',
      source: 'store',
      channelRef: 'branch-001',
      status: 'won',
      ownerId: 'user-1',
      customerId: 'cust-1',
      createdAt: new Date('2026-09-08T10:00:00Z'),
      updatedAt: new Date('2026-09-08T10:00:00Z'),
      deletedAt: null,
    },
  ]
  mockDbState.customers = [
    {
      id: 'cust-1',
      name: 'บริษัท ก่อสร้างรุ่งเรือง จำกัด',
      phone: '0812345678',
      taxId: '0105558123456',
      deletedAt: null,
    },
  ]
  mockDbState.leadActivities = [
    {
      id: 'act-1',
      leadId: 'lead-1',
      type: 'note',
      note: 'โทรติดต่อเบื้องต้น',
      occurredAt: new Date('2026-09-10T11:00:00Z'),
      deletedAt: null,
    },
  ]
  mockDbState.followUps = [
    {
      id: 'fu-1',
      leadId: 'lead-1',
      dueAt: new Date('2026-09-12T10:00:00Z'),
      status: 'open',
      deletedAt: null,
    },
  ]
  mockDbState.siteVisits = [
    {
      id: 'sv-1',
      leadId: 'lead-1',
      purpose: 'สำรวจพื้นที่หน้างานโครงการ A',
      status: 'scheduled',
      requestedAt: new Date('2026-09-11T09:00:00Z'),
      deletedAt: null,
    },
  ]
  mockDbState.appointments = [
    {
      id: 'appt-1',
      siteVisitId: 'sv-1',
      status: 'scheduled',
      scheduledStart: new Date('2026-09-12T09:00:00Z'),
      scheduledEnd: new Date('2026-09-12T11:00:00Z'),
      deletedAt: null,
    },
  ]
  mockDbState.jobs = [
    {
      id: 'job-1',
      appointmentId: 'appt-1',
      status: 'checked_out',
      checkinAt: new Date('2026-09-12T09:05:00Z'),
      checkinLat: 13.7563,
      checkinLng: 100.5018,
      checkinDistanceM: 45,
      checkoutAt: new Date('2026-09-12T10:30:00Z'),
      checkoutLat: 13.7564,
      checkoutLng: 100.5019,
      workSummary: 'ตรวจสอบหน้างานเรียบร้อย ขนาด 250 ตร.ม.',
      customerSignaturePath: '/signatures/sig-001.png',
      deletedAt: null,
    },
  ]
  mockDbState.quotations = [
    {
      id: 'qt-1',
      number: 'QT-202609-0001',
      leadId: 'lead-quoted',
      customerId: 'cust-1',
      status: 'sent',
      subtotalSatang: 4672897,
      vatAmountSatang: 327103,
      totalSatang: 5000000,
      validUntil: new Date('2026-09-25T00:00:00Z'),
      createdAt: new Date('2026-09-11T14:00:00Z'),
      deletedAt: null,
    },
  ]
  mockDbState.orders = []
  mockDbState.creditChecks = []
}

// ─── Import Targets ──────────────────────────────────────────────────────────
import { getLeadById } from './queries'
import {
  attachQuotationToLeadAction,
  closeWinLeadAction,
  closeLostLeadAction,
  logLeadActivityAction,
  addLeadActivityAction,
  LOST_REASONS,
} from './actions'

// ─── Test Suite ──────────────────────────────────────────────────────────────
describe('Worker M1 CRM Backend Handshake', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockDb()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 1. getLeadById Query Extension
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. getLeadById Query Extension', () => {
    it('returns null when lead is not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          leftJoin: () => ({
            where: () => [],
          }),
        }),
      } as any)

      const res = await getLeadById('non-existent')
      expect(res).toBeNull()
    })

    it('returns lead with linked quotations and site visits including job check-in metrics', async () => {
      mockDb.select
        // 1. lead + customer
        .mockReturnValueOnce({
          from: () => ({
            leftJoin: () => ({
              where: () => [{
                leads: mockDbState.leads[1],
                customers: mockDbState.customers[0],
              }],
            }),
          }),
        } as any)
        // 2. activities
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: () => mockDbState.leadActivities,
            }),
          }),
        } as any)
        // 3. followUps
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: () => mockDbState.followUps,
            }),
          }),
        } as any)
        // 4. siteVisits
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: () => mockDbState.siteVisits,
            }),
          }),
        } as any)
        // 5. appointments & jobs join
        .mockReturnValueOnce({
          from: () => ({
            leftJoin: () => ({
              where: () => [{
                appointment: mockDbState.appointments[0],
                job: mockDbState.jobs[0],
              }],
            }),
          }),
        } as any)
        // 6. quotations
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: () => mockDbState.quotations,
            }),
          }),
        } as any)

      const result = await getLeadById('lead-quoted')
      expect(result).not.toBeNull()
      expect(result?.lead.leads.id).toBe('lead-quoted')
      expect(result?.lead.customers?.name).toBe('บริษัท ก่อสร้างรุ่งเรือง จำกัด')

      // Assert quotations
      expect(result?.quotations).toBeDefined()
      expect(result?.quotations.length).toBe(1)
      expect(result?.quotations[0].number).toBe('QT-202609-0001')
      expect(result?.quotations[0].totalSatang).toBe(5000000)

      // Assert siteVisits with appointment & job
      expect(result?.siteVisits).toBeDefined()
      expect(result?.siteVisits.length).toBe(1)
      const sv = result?.siteVisits[0]
      expect(sv?.purpose).toBe('สำรวจพื้นที่หน้างานโครงการ A')
      expect(sv?.checkinDistanceM).toBe(45)
      expect(sv?.workSummary).toContain('250 ตร.ม.')
      expect(sv?.customerSignaturePath).toBe('/signatures/sig-001.png')
      expect(sv?.appointment?.status).toBe('scheduled')
    })

    it('handles null-safe fallback when quotations or visits tables throw or are empty', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: () => ({
            leftJoin: () => ({
              where: () => [{
                leads: mockDbState.leads[0],
                customers: null,
              }],
            }),
          }),
        } as any)
        .mockImplementationOnce(() => { throw new Error('DB activity table error') })
        .mockImplementationOnce(() => { throw new Error('DB followups table error') })
        .mockImplementationOnce(() => { throw new Error('DB siteVisits table error') })
        .mockImplementationOnce(() => { throw new Error('DB quotations table error') })

      const result = await getLeadById('lead-1')
      expect(result).not.toBeNull()
      expect(result?.activities).toEqual([])
      expect(result?.followUps).toEqual([])
      expect(result?.siteVisits).toEqual([])
      expect(result?.quotations).toEqual([])
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 2. attachQuotationToLeadAction
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. attachQuotationToLeadAction', () => {
    it('validates required inputs: leadId, quotationNumber, totalSatang', async () => {
      const res1 = await attachQuotationToLeadAction({
        leadId: '',
        quotationNumber: 'QT-202609-0002',
        totalSatang: 1000000,
      })
      expect(res1.success).toBe(false)
      expect(res1.error).toContain('leadId')

      const res2 = await attachQuotationToLeadAction({
        leadId: 'lead-1',
        quotationNumber: '   ',
        totalSatang: 1000000,
      })
      expect(res2.success).toBe(false)
      expect(res2.error).toContain('เลขที่ใบเสนอราคา')

      const res3 = await attachQuotationToLeadAction({
        leadId: 'lead-1',
        quotationNumber: 'QT-202609-0002',
        totalSatang: -500,
      })
      expect(res3.success).toBe(false)
      expect(res3.error).toContain('ยอดรวม')
    })

    it('returns error if lead not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => [],
        }),
      } as any)

      const res = await attachQuotationToLeadAction({
        leadId: 'missing-lead',
        quotationNumber: 'QT-202609-0002',
        totalSatang: 1000000,
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain('ไม่พบ Lead')
    })

    it('attaches quotation to lead, transitions status to quoted, logs quote_sent, and emits events', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: () => ({
            where: () => [{ id: 'lead-1', status: 'qualified', customerId: 'cust-1' }],
          }),
        } as any)
        .mockReturnValueOnce({
          from: () => ({
            where: () => [],
          }),
        } as any)

      mockDb.insert.mockReturnValue({
        values: (val: any) => ({
          returning: () => [{ id: 'qt-new-123' }],
        }),
      } as any)

      const res = await attachQuotationToLeadAction({
        leadId: 'lead-1',
        quotationNumber: 'QT-202609-9999',
        totalSatang: 15113750,
        validUntil: '2026-09-30T00:00:00Z',
      }, 'user-sales-1')

      expect(res.success).toBe(true)
      expect(res.quotationId).toBeDefined()

      expect(mockTransition).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'lead-1',
        'qualified',
        'quoted',
        'user-sales-1'
      )

      expect(mockEmit).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'quotation.attached',
        'quotation',
        expect.any(String),
        expect.objectContaining({
          quotationNumber: 'QT-202609-9999',
          leadId: 'lead-1',
          totalSatang: 15113750,
        })
      )
      expect(mockEmit).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'lead.updated',
        'lead',
        'lead-1',
        expect.objectContaining({
          status: 'quoted',
        })
      )
    })

    it('supports positional argument signature (leadId, data, actorId)', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: () => ({
            where: () => [{ id: 'lead-1', status: 'qualified', customerId: 'cust-1' }],
          }),
        } as any)
        .mockReturnValueOnce({
          from: () => ({
            where: () => [{ id: 'existing-qt-id', status: 'draft' }],
          }),
        } as any)

      const res = await attachQuotationToLeadAction(
        'lead-1',
        {
          quotationNumber: 'QT-202609-0001',
          totalSatang: 2000000,
        },
        'user-ae-2'
      )

      expect(res.success).toBe(true)
      expect(res.quotationId).toBe('existing-qt-id')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 3. closeWinLeadAction
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. closeWinLeadAction', () => {
    it('validates leadId presence', async () => {
      const res = await closeWinLeadAction({ leadId: '' })
      expect(res.success).toBe(false)
      expect(res.error).toContain('leadId')
    })

    it('rejects close win if lead is not in quoted status (e.g. contacted or won)', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => [{ id: 'lead-1', status: 'contacted', customerId: 'cust-1' }],
        }),
      } as any)

      const res = await closeWinLeadAction('lead-1')
      expect(res.success).toBe(false)
      expect(res.error).toContain('quoted')
    })

    it('executes close win: transitions lead to won, creates Sales Order, runs credit check, and logs activity', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: () => ({
            where: () => [{
              id: 'lead-quoted',
              status: 'quoted',
              customerId: 'cust-1',
              budgetRangeMaxSatang: 5000000,
            }],
          }),
        } as any)
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => [mockDbState.quotations[0]],
              }),
            }),
          }),
        } as any)

      mockDb.insert.mockReturnValue({
        values: (val: any) => ({
          returning: () => [{ id: 'order-so-001', number: 'SO-1726234567890' }],
        }),
      } as any)

      const res = await closeWinLeadAction({
        leadId: 'lead-quoted',
        actorId: 'ae-user-1',
      })

      expect(res.success).toBe(true)
      expect(res.orderId).toBe('order-so-001')
      expect(res.orderNumber).toContain('SO-')
      expect(res.creditStatus).toBe('awaiting_payment')

      expect(mockTransition).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'lead-quoted',
        'quoted',
        'won',
        'ae-user-1'
      )

      expect(mockRunAutoCreditCheckAction).toHaveBeenCalledWith(
        'order-so-001',
        'cust-1',
        5000000
      )

      expect(mockEmit).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'lead.won',
        'lead',
        'lead-quoted',
        expect.objectContaining({ orderId: 'order-so-001' })
      )
      expect(mockEmit).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'order.created',
        'order',
        'order-so-001',
        expect.objectContaining({ number: 'SO-1726234567890' })
      )
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 4. closeLostLeadAction
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. closeLostLeadAction', () => {
    it('rejects if lostReason is missing, empty, or invalid', async () => {
      const res1 = await closeLostLeadAction({ leadId: 'lead-1', lostReason: '' })
      expect(res1.success).toBe(false)
      expect(res1.error).toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')

      const res2 = await closeLostLeadAction('lead-1', 'INVALID_REASON_NOT_IN_ENUM')
      expect(res2.success).toBe(false)
      expect(res2.error).toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')
    })

    it('accepts valid enum lostReason (e.g. PRICE_HIGH, COMPETITOR_CHOSEN)', async () => {
      for (const reason of LOST_REASONS) {
        mockDb.select.mockReturnValueOnce({
          from: () => ({
            where: () => [{ id: 'lead-1', status: 'contacted' }],
          }),
        } as any)

        const res = await closeLostLeadAction({
          leadId: 'lead-1',
          lostReason: reason,
          note: 'สู้ราคาเจ้าอื่นไม่ไหว',
        })
        expect(res.success).toBe(true)
      }
    })

    it('accepts valid Thai lostReason (e.g. ราคาสูงเกินไป)', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => [{ id: 'lead-1', status: 'qualified' }],
        }),
      } as any)

      const res = await closeLostLeadAction('lead-1', 'ราคาสูงเกินไป', 'เกินงบประมาณ 20%', 'ae-1')
      expect(res.success).toBe(true)
      expect(mockTransition).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'lead-1',
        'qualified',
        'lost',
        'ae-1'
      )
    })

    it('rejects if lead is in terminal won state', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => [{ id: 'lead-won', status: 'won' }],
        }),
      } as any)

      const res = await closeLostLeadAction({
        leadId: 'lead-won',
        lostReason: 'PROJECT_CANCELLED',
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain('ไม่สามารถปิดสถานะ lost จากสถานะ won')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 5. logLeadActivityAction & addLeadActivityAction
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. logLeadActivityAction', () => {
    it('validates leadId, type, and non-empty note', async () => {
      const res1 = await logLeadActivityAction({ leadId: '', type: 'call', note: 'test' })
      expect(res1.success).toBe(false)
      expect(res1.error).toContain('leadId')

      const res2 = await logLeadActivityAction({
        leadId: 'lead-1',
        type: 'invalid_type' as any,
        note: 'test',
      })
      expect(res2.success).toBe(false)
      expect(res2.error).toContain('ประเภทกิจกรรมไม่ถูกต้อง')

      const res3 = await logLeadActivityAction({
        leadId: 'lead-1',
        type: 'call',
        note: '   ',
      })
      expect(res3.success).toBe(false)
      expect(res3.error).toContain('รายละเอียดกิจกรรม')
    })

    it('inserts activity into leadActivities and updates leads updatedAt', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => [{ id: 'lead-1' }],
        }),
      } as any)

      mockDb.insert.mockReturnValue({
        values: (val: any) => ({
          returning: () => [{ id: 'act-new-999' }],
        }),
      } as any)

      const res = await logLeadActivityAction({
        leadId: 'lead-1',
        type: 'call',
        note: 'คุยกับผู้รับเหมา นัดดูไซต์งานสัปดาห์หน้า',
        actorId: 'ae-user-1',
      })

      expect(res.success).toBe(true)
      expect(res.activityId).toBe('act-new-999')
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('addLeadActivityAction alias works identically with positional arguments', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => [{ id: 'lead-1' }],
        }),
      } as any)

      mockDb.insert.mockReturnValue({
        values: (val: any) => ({
          returning: () => [{ id: 'act-new-888' }],
        }),
      } as any)

      const res = await addLeadActivityAction(
        'lead-1',
        'line',
        'ส่งโบร์ชัวร์สินค้าเหล็กและปูนทาง LINE',
        'ae-user-2'
      )

      expect(res.success).toBe(true)
      expect(res.activityId).toBe('act-new-888')
    })
  })
})
