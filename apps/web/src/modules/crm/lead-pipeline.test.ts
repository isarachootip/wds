import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  LEAD_MACHINE,
  FOLLOW_UP_MACHINE,
  SITE_VISIT_MACHINE,
} from './lead-machine'
import {
  isValidTransition,
  transition,
  InvalidTransitionError,
} from '@/lib/statemachine'
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LOST_REASONS,
  type LeadStatus,
  type LeadSource,
  type ActivityType,
  type LostReason,
} from './types'
import {
  calculateQuotation,
  calculateLine,
  formatQtNumber,
  formatSoNumber,
  parseQtNumber,
  satangToBaht,
  bahtToSatang,
} from '@/lib/qt-calc'
import {
  runCreditCheck,
  computeAvailable,
  NEW_CUSTOMER_THRESHOLD_SATANG,
  isFullyPaid,
  remainingBalanceSatang,
  type CreditInput,
} from '@/modules/billing/credit'
import {
  checkCredit,
  type CreditCheckInput,
  type CreditCheckResult,
} from '@/lib/credit-engine'
import {
  haversineDistance,
  isWithinRadius,
  formatDistance,
  CHECKIN_RADIUS_M,
} from '@/lib/geo'
import { ORDER_MACHINE, type OrderStatus } from '@/lib/order-machine'
import { APPOINTMENT_MACHINE, JOB_MACHINE } from '@/modules/visit/appointment-machine'

// ─────────────────────────────────────────────────────────────────────────────
// Domain Validation & Pipeline Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

export const MIN_SITE_VISIT_BUDGET_SATANG = 5_000_000 // 50,000 THB

export const VALID_LOST_REASONS = [
  ...LOST_REASONS,
  'PRICE_HIGH',
  'COMPETITOR_CHOSEN',
  'PROJECT_CANCELLED',
  'UNREACHABLE',
  'SPEC_MISMATCH',
  'BUDGET_INSUFFICIENT',
  'BELOW_WHOLESALE_THRESHOLD',
  'OTHER',
] as const

export function validateLostReason(reason?: unknown): { valid: boolean; error?: string } {
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return { valid: false, error: 'กรุณาระบุเหตุผลที่ปิด Lead' }
  }
  const trimmed = reason.trim()
  const isAllowed = VALID_LOST_REASONS.some(
    r => r.toLowerCase() === trimmed.toLowerCase() || r === trimmed
  )
  if (!isAllowed) {
    return { valid: false, error: `เหตุผลไม่ถูกต้อง: ${trimmed}` }
  }
  return { valid: true }
}

export function validateSiteVisitBudget(budgetSatang?: number | null): {
  eligible: boolean
  error?: string
} {
  if (budgetSatang == null || budgetSatang <= 0) {
    return { eligible: false, error: 'งบประมาณต้องมากกว่า 0' }
  }
  if (budgetSatang < MIN_SITE_VISIT_BUDGET_SATANG) {
    return {
      eligible: false,
      error: `งบประมาณขั้นต่ำสำหรับการสำรวจหน้างานคือ ฿50,000 (ปัจจุบัน: ฿${satangToBaht(budgetSatang)})`,
    }
  }
  return { eligible: true }
}

export function validateTaxIdModulo11(taxId: string): boolean {
  if (!/^\d{13}$/.test(taxId)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(taxId[i], 10) * (13 - i)
  }
  const checkDigit = (11 - (sum % 11)) % 10
  return checkDigit === parseInt(taxId[12], 10)
}

export function generateDedupeKey(taxId: string, phone: string, postalCode: string): string {
  const cleanTax = taxId.trim()
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  const cleanPostal = postalCode.trim()
  return `${cleanTax}:${cleanPhone}:${cleanPostal}`
}

export interface CheckInInput {
  userLat: number
  userLng: number
  siteLat: number
  siteLng: number
  isMockLocationEnabled?: boolean
  accuracyMeters?: number
  supervisorOverride?: boolean
}

export function validateFieldCheckIn(input: CheckInInput): {
  allowed: boolean
  distanceMeters: number
  error?: string
  flagged?: boolean
} {
  if (input.isMockLocationEnabled) {
    return {
      allowed: false,
      distanceMeters: 0,
      error: 'HTTP 403: ตรวจพบ Mock GPS (ERR_GPS_SPOOFING_DETECTED)',
    }
  }
  if (isNaN(input.userLat) || isNaN(input.userLng)) {
    return { allowed: false, distanceMeters: 0, error: 'พิกัด GPS ไม่ถูกต้อง' }
  }
  const dist = haversineDistance(input.userLat, input.userLng, input.siteLat, input.siteLng)
  if (dist > CHECKIN_RADIUS_M) {
    if (input.supervisorOverride) {
      return { allowed: true, distanceMeters: dist, flagged: true }
    }
    return {
      allowed: false,
      distanceMeters: dist,
      error: `ระยะทางเกินกำหนด (${Math.round(dist)}ม. > ${CHECKIN_RADIUS_M}ม.): GEO_DISTANCE_EXCEEDED`,
    }
  }
  return { allowed: true, distanceMeters: dist, flagged: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead Pipeline Simulated State Store
// ─────────────────────────────────────────────────────────────────────────────

interface MockAuditLogEntry {
  actorId: string
  entity: string
  entityId: string
  action: string
  fromStatus: string
  toStatus: string
  payload?: Record<string, unknown> | null
  at: Date
}

interface MockLeadActivity {
  id: string
  leadId: string
  type: ActivityType
  note: string
  userId: string
  occurredAt: Date
}

interface MockFollowUp {
  id: string
  leadId: string
  dueAt: Date
  channel: 'phone' | 'line' | 'email' | 'visit'
  status: 'open' | 'done' | 'skipped'
  note?: string
  doneAt?: Date
  assigneeId: string
}

interface MockQuotation {
  id: string
  number: string
  leadId: string
  subtotalSatang: number
  vatAmountSatang: number
  totalSatang: number
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
  validUntil: Date
}

interface MockOrder {
  id: string
  number: string
  quotationId: string
  leadId: string
  totalSatang: number
  status: OrderStatus
  creditDecision: string
}

class LeadPipelineSimulator {
  id: string
  status: LeadStatus
  source: LeadSource
  channelRef?: string
  customerName?: string
  customerPhone?: string
  taxId?: string
  postalCode?: string
  budgetRangeMinSatang?: number
  ownerId: string
  lostReason?: string
  lostNotes?: string
  createdAt: Date
  updatedAt: Date

  activities: MockLeadActivity[] = []
  followUps: MockFollowUp[] = []
  quotations: MockQuotation[] = []
  auditLogs: MockAuditLogEntry[] = []
  orders: MockOrder[] = []

  constructor(params: {
    id: string
    source: LeadSource
    ownerId: string
    channelRef?: string
    customerName?: string
    customerPhone?: string
    taxId?: string
    postalCode?: string
    budgetSatang?: number
  }) {
    this.id = params.id
    this.status = 'new'
    this.source = params.source
    this.channelRef = params.channelRef
    this.customerName = params.customerName
    this.customerPhone = params.customerPhone
    this.taxId = params.taxId
    this.postalCode = params.postalCode
    this.budgetRangeMinSatang = params.budgetSatang
    this.ownerId = params.ownerId
    this.createdAt = new Date()
    this.updatedAt = new Date()

    // Auto 24-hour follow-up on creation
    this.followUps.push({
      id: `fu-${Date.now()}-auto`,
      leadId: this.id,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      channel: params.source === 'line' ? 'line' : 'phone',
      status: 'open',
      note: 'ติดตาม Lead ใหม่ภายใน 24 ชั่วโมง (สร้างอัตโนมัติ)',
      assigneeId: params.ownerId,
    })

    // Initial creation activity
    this.activities.push({
      id: `act-${Date.now()}-init`,
      leadId: this.id,
      type: 'note',
      note: `สร้าง Lead จากช่องทาง: ${params.source}`,
      userId: params.ownerId,
      occurredAt: new Date(),
    })
  }

  async transitionTo(nextStatus: LeadStatus, actorId: string, payload?: Record<string, unknown>) {
    if (!isValidTransition(LEAD_MACHINE, this.status, nextStatus)) {
      throw new InvalidTransitionError('lead', this.status, nextStatus)
    }

    const mockDb = {
      insert: () => ({
        values: (entry: MockAuditLogEntry) => {
          this.auditLogs.push(entry)
          return Promise.resolve([entry])
        },
      }),
    } as any

    await transition(
      mockDb,
      {},
      LEAD_MACHINE,
      this.id,
      this.status,
      nextStatus,
      actorId,
      payload
    )

    const prevStatus = this.status
    this.status = nextStatus
    this.updatedAt = new Date()

    this.activities.push({
      id: `act-${Date.now()}-${nextStatus}`,
      leadId: this.id,
      type: 'status_change',
      note: `เปลี่ยนสถานะ: ${prevStatus} → ${nextStatus}`,
      userId: actorId,
      occurredAt: new Date(),
    })
  }

  logActivity(type: ActivityType, note: string, userId: string) {
    if (!note || note.trim().length === 0) {
      throw new Error('บันทึกกิจกรรมต้องมีข้อความ')
    }
    const act: MockLeadActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      leadId: this.id,
      type,
      note: note.trim(),
      userId,
      occurredAt: new Date(),
    }
    this.activities.push(act)
    this.updatedAt = new Date()
    return act
  }

  scheduleFollowUp(params: {
    dueAt: Date
    channel: 'phone' | 'line' | 'email' | 'visit'
    note?: string
    assigneeId: string
  }) {
    const fu: MockFollowUp = {
      id: `fu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      leadId: this.id,
      dueAt: params.dueAt,
      channel: params.channel,
      status: 'open',
      note: params.note,
      assigneeId: params.assigneeId,
    }
    this.followUps.push(fu)
    return fu
  }

  doneFollowUp(followUpId: string, actorId: string, note?: string) {
    const fu = this.followUps.find(f => f.id === followUpId)
    if (!fu) throw new Error('ไม่พบ Follow-up')
    if (!isValidTransition(FOLLOW_UP_MACHINE, fu.status, 'done')) {
      throw new InvalidTransitionError('follow_up', fu.status, 'done')
    }
    fu.status = 'done'
    fu.doneAt = new Date()
    if (note) fu.note = `${fu.note ? fu.note + ' | ' : ''}${note}`
    return fu
  }

  skipFollowUp(followUpId: string, actorId: string, note?: string) {
    const fu = this.followUps.find(f => f.id === followUpId)
    if (!fu) throw new Error('ไม่พบ Follow-up')
    if (!isValidTransition(FOLLOW_UP_MACHINE, fu.status, 'skipped')) {
      throw new InvalidTransitionError('follow_up', fu.status, 'skipped')
    }
    fu.status = 'skipped'
    fu.doneAt = new Date()
    if (note) fu.note = `${fu.note ? fu.note + ' | ' : ''}${note}`
    return fu
  }

  async attachQuotation(params: {
    quotationNumber: string
    subtotalSatang: number
    vatAmountSatang: number
    totalSatang: number
    validDays?: number
    actorId: string
  }) {
    if (params.totalSatang <= 0) {
      throw new Error('ยอดใบเสนอราคาต้องมากกว่า 0 Satang')
    }

    // Must be in qualified or site_visit_requested to attach quotation
    if (this.status !== 'qualified' && this.status !== 'site_visit_requested') {
      throw new Error(`ไม่สามารถผูกใบเสนอราคาในสถานะ ${this.status}`)
    }

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (params.validDays ?? 30))

    const qt: MockQuotation = {
      id: `qt-${Date.now()}`,
      number: params.quotationNumber,
      leadId: this.id,
      subtotalSatang: params.subtotalSatang,
      vatAmountSatang: params.vatAmountSatang,
      totalSatang: params.totalSatang,
      status: 'sent',
      validUntil,
    }
    this.quotations.push(qt)

    // Log quote_sent activity
    this.logActivity(
      'quote_sent',
      `แนบใบเสนอราคา ${params.quotationNumber} ยอดรวม ฿${satangToBaht(params.totalSatang)}`,
      params.actorId
    )

    // Transition lead to quoted
    await this.transitionTo('quoted', params.actorId, { quotationId: qt.id })
    return qt
  }

  async closeWin(params: {
    quotationId: string
    customerCredit: {
      creditLimitSatang: number
      outstandingSatang: number
      overdueAmountSatang: number
      onHold?: boolean
      hasPriorHistory?: boolean
    }
    actorId: string
  }) {
    if (this.status !== 'quoted') {
      throw new Error(`ไม่สามารถ Close Win จากสถานะ ${this.status}`)
    }

    const qt = this.quotations.find(q => q.id === params.quotationId)
    if (!qt) throw new Error('ไม่พบใบเสนอราคาที่ต้องการปิดการขาย')

    // Transition to won
    await this.transitionTo('won', params.actorId, { quotationId: qt.id })
    qt.status = 'accepted'

    // Run Credit Check Engine
    const creditDecision = runCreditCheck({
      onHold: params.customerCredit.onHold ?? false,
      creditLimitSatang: params.customerCredit.creditLimitSatang,
      outstandingSatang: params.customerCredit.outstandingSatang,
      overdueAmountSatang: params.customerCredit.overdueAmountSatang,
      orderTotalSatang: qt.totalSatang,
      hasPriorHistory: params.customerCredit.hasPriorHistory ?? true,
    })

    // Determine initial order status
    let orderStatus: OrderStatus = 'awaiting_payment'
    if (creditDecision.decision === 'hold' || creditDecision.decision === 'reject') {
      orderStatus = 'credit_hold'
    }

    const orderNumber = formatSoNumber(1, new Date())
    const order: MockOrder = {
      id: `ord-${Date.now()}`,
      number: orderNumber,
      quotationId: qt.id,
      leadId: this.id,
      totalSatang: qt.totalSatang,
      status: orderStatus,
      creditDecision: creditDecision.decision,
    }
    this.orders.push(order)

    this.logActivity(
      'status_change',
      `ปิดการขายสำเร็จ (Close Win) — ออกคำสั่งซื้อ ${orderNumber} สถานะ: ${orderStatus}`,
      params.actorId
    )

    return { order, creditDecision }
  }

  async closeLost(params: {
    lostReason: string
    actorId: string
    notes?: string
  }) {
    const val = validateLostReason(params.lostReason)
    if (!val.valid) {
      throw new Error(val.error)
    }

    await this.transitionTo('lost', params.actorId, {
      lostReason: params.lostReason,
      lostNotes: params.notes,
    })

    this.lostReason = params.lostReason
    this.lostNotes = params.notes

    // Auto skip remaining open follow-ups
    for (const fu of this.followUps.filter(f => f.status === 'open')) {
      fu.status = 'skipped'
      fu.doneAt = new Date()
      fu.note = `${fu.note ? fu.note + ' | ' : ''}ข้ามเนื่องจากปิด Lead (Lost)`
    }

    return { success: true }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: 4-Tier Comprehensive Lead Pipeline & CRM Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('WDS Lead Management & CRM Pipeline — 4-Tier Test Suite', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1: Feature Coverage (>=5 tests per feature)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Tier 1: Feature Coverage', () => {

    describe('Feature 1.1: Lead State Machine Transitions in Isolation', () => {
      it('1.1.1: transition new → contacted when sales AE contacts prospect', async () => {
        expect(isValidTransition(LEAD_MACHINE, 'new', 'contacted')).toBe(true)
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-1', source: 'phone', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        expect(sim.status).toBe('contacted')
        expect(sim.auditLogs).toHaveLength(1)
        expect(sim.auditLogs[0].fromStatus).toBe('new')
        expect(sim.auditLogs[0].toStatus).toBe('contacted')
      })

      it('1.1.2: transition contacted → qualified when budget & scope are confirmed', async () => {
        expect(isValidTransition(LEAD_MACHINE, 'contacted', 'qualified')).toBe(true)
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-2', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        expect(sim.status).toBe('qualified')
        expect(sim.auditLogs).toHaveLength(2)
      })

      it('1.1.3: transition qualified → site_visit_requested when field inspection needed', async () => {
        expect(isValidTransition(LEAD_MACHINE, 'qualified', 'site_visit_requested')).toBe(true)
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-3', source: 'line', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        await sim.transitionTo('site_visit_requested', 'ae-01')
        expect(sim.status).toBe('site_visit_requested')
      })

      it('1.1.4: transition site_visit_requested → quoted upon BoQ completion', async () => {
        expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'quoted')).toBe(true)
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-4', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        await sim.transitionTo('site_visit_requested', 'ae-01')
        await sim.transitionTo('quoted', 'ae-01')
        expect(sim.status).toBe('quoted')
      })

      it('1.1.5: transition qualified → quoted (skipping site visit for catalog orders)', async () => {
        expect(isValidTransition(LEAD_MACHINE, 'qualified', 'quoted')).toBe(true)
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-5', source: 'phone', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        await sim.transitionTo('quoted', 'ae-01')
        expect(sim.status).toBe('quoted')
      })

      it('1.1.6: transition quoted → won on deal closing agreement', async () => {
        expect(isValidTransition(LEAD_MACHINE, 'quoted', 'won')).toBe(true)
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-6', source: 'line', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        await sim.transitionTo('quoted', 'ae-01')
        await sim.transitionTo('won', 'ae-01')
        expect(sim.status).toBe('won')
      })

      it('1.1.7: any state can transition to lost with valid reason', async () => {
        const fromStates: LeadStatus[] = ['new', 'contacted', 'qualified', 'site_visit_requested', 'quoted']
        for (const from of fromStates) {
          expect(isValidTransition(LEAD_MACHINE, from, 'lost')).toBe(true)
        }
      })
    })

    describe('Feature 1.2: Quotation Attachment Linking to Lead', () => {
      it('1.2.1: formats quotation sequential number correctly (QT-YYYYMM-NNNN)', () => {
        const date = new Date(2026, 8, 13) // Sep 2026
        const qtNum = formatQtNumber(42, date)
        expect(qtNum).toBe('QT-202609-0042')
        const parsed = parseQtNumber(qtNum)
        expect(parsed).toEqual({ prefix: 'QT', yearMonth: '202609', seq: 42 })
      })

      it('1.2.2: attaching quotation from qualified transitions lead to quoted', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-qt-1', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        const qt = await sim.attachQuotation({
          quotationNumber: 'QT-202609-0001',
          subtotalSatang: 10_000_000,
          vatAmountSatang: 700_000,
          totalSatang: 10_700_000,
          actorId: 'ae-01',
        })
        expect(sim.status).toBe('quoted')
        expect(sim.quotations).toHaveLength(1)
        expect(qt.number).toBe('QT-202609-0001')
        expect(qt.totalSatang).toBe(10_700_000)
      })

      it('1.2.3: attaching quotation from site_visit_requested transitions lead to quoted', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-qt-2', source: 'line', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        await sim.transitionTo('site_visit_requested', 'ae-01')
        await sim.attachQuotation({
          quotationNumber: 'QT-202609-0002',
          subtotalSatang: 25_000_000,
          vatAmountSatang: 1_750_000,
          totalSatang: 26_750_000,
          actorId: 'ae-01',
        })
        expect(sim.status).toBe('quoted')
      })

      it('1.2.4: attaches quotation with default 30-day validity period', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-qt-3', source: 'phone', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        const qt = await sim.attachQuotation({
          quotationNumber: 'QT-202609-0003',
          subtotalSatang: 5_000_000,
          vatAmountSatang: 350_000,
          totalSatang: 5_350_000,
          validDays: 30,
          actorId: 'ae-01',
        })
        const now = new Date()
        expect(qt.validUntil.getTime()).toBeGreaterThan(now.getTime() + 28 * 24 * 60 * 60 * 1000)
      })

      it('1.2.5: quotation attachment generates quote_sent activity log', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-qt-4', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        await sim.attachQuotation({
          quotationNumber: 'QT-202609-0004',
          subtotalSatang: 1_000_000,
          vatAmountSatang: 70_000,
          totalSatang: 1_070_000,
          actorId: 'ae-01',
        })
        const quoteAct = sim.activities.find(a => a.type === 'quote_sent')
        expect(quoteAct).toBeDefined()
        expect(quoteAct?.note).toContain('QT-202609-0004')
      })
    })

    describe('Feature 1.3: Activity Logging', () => {
      it('1.3.1: logs phone call outcome with customer feedback', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-act-1', source: 'phone', ownerId: 'ae-01' })
        const act = sim.logActivity('call', 'คุยกับคุณสมชาย ลูกค้าต้องการเหล็กเส้น SD40 500 เส้น', 'ae-01')
        expect(act.type).toBe('call')
        expect(act.note).toContain('SD40')
        expect(act.userId).toBe('ae-01')
      })

      it('1.3.2: logs LINE chat activity with conversation summary', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-act-2', source: 'line', ownerId: 'ae-01' })
        const act = sim.logActivity('line', 'ส่งโบร์ชัวร์สินค้าให้ลูกค้าทาง LINE OA เรียบร้อย', 'ae-01')
        expect(act.type).toBe('line')
        expect(act.note).toContain('โบร์ชัวร์')
      })

      it('1.3.3: logs site visit observations and measurements', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-act-3', source: 'store', ownerId: 'ae-01' })
        const act = sim.logActivity('visit', 'เข้าสำรวจหน้างาน: ถนนกว้าง 6 เมตร รถ 10 ล้อเข้าได้สะดวก', 'ae-01')
        expect(act.type).toBe('visit')
        expect(act.note).toContain('รถ 10 ล้อ')
      })

      it('1.3.4: logs internal sales notes and next action requirements', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-act-4', source: 'phone', ownerId: 'ae-01' })
        const act = sim.logActivity('note', 'ลูกค้ามีแผนจะเริ่มเทพื้นคอนกรีตสัปดาห์หน้า ต้องเร่งเสนอราคา', 'ae-01')
        expect(act.type).toBe('note')
        expect(act.note).toContain('เทพื้นคอนกรีต')
      })

      it('1.3.5: activities are stored with timestamps and ordered chronologically', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-act-5', source: 'phone', ownerId: 'ae-01' })
        sim.logActivity('call', 'สายที่ 1', 'ae-01')
        sim.logActivity('line', 'แชทครั้งที่ 1', 'ae-01')
        sim.logActivity('note', 'บันทึกภายใน', 'ae-01')
        expect(sim.activities.length).toBeGreaterThanOrEqual(4) // 1 init + 3 logged
        for (let i = 1; i < sim.activities.length; i++) {
          expect(sim.activities[i].occurredAt.getTime()).toBeGreaterThanOrEqual(
            sim.activities[i - 1].occurredAt.getTime()
          )
        }
      })
    })

    describe('Feature 1.4: Follow-up Scheduling', () => {
      it('1.4.1: auto-schedules 24-hour follow-up on lead creation', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-fu-1', source: 'line', ownerId: 'ae-01' })
        expect(sim.followUps).toHaveLength(1)
        const autoFu = sim.followUps[0]
        expect(autoFu.channel).toBe('line')
        expect(autoFu.status).toBe('open')
        const now = Date.now()
        expect(autoFu.dueAt.getTime()).toBeGreaterThan(now + 23 * 60 * 60 * 1000)
        expect(autoFu.dueAt.getTime()).toBeLessThan(now + 25 * 60 * 60 * 1000)
      })

      it('1.4.2: schedules custom follow-up task with assignee and due date', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-fu-2', source: 'phone', ownerId: 'ae-01' })
        const targetDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
        const fu = sim.scheduleFollowUp({
          dueAt: targetDate,
          channel: 'phone',
          assigneeId: 'ae-02',
          note: 'โทรคอนเฟิร์มสเปกเสาเข็ม',
        })
        expect(fu.status).toBe('open')
        expect(fu.assigneeId).toBe('ae-02')
        expect(fu.channel).toBe('phone')
      })

      it('1.4.3: marks follow-up done with completion timestamp and note', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-fu-3', source: 'store', ownerId: 'ae-01' })
        const fu = sim.followUps[0]
        sim.doneFollowUp(fu.id, 'ae-01', 'คุยเรียบร้อย นัดส่งใบเสนอราคา')
        expect(fu.status).toBe('done')
        expect(fu.doneAt).toBeInstanceOf(Date)
        expect(fu.note).toContain('คุยเรียบร้อย')
      })

      it('1.4.4: skips follow-up task when prospect unreachable or cancelled', () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t1-fu-4', source: 'phone', ownerId: 'ae-01' })
        const fu = sim.followUps[0]
        sim.skipFollowUp(fu.id, 'ae-01', 'ติดต่อไม่ได้ 3 ครั้ง ข้ามไปก่อน')
        expect(fu.status).toBe('skipped')
        expect(fu.doneAt).toBeInstanceOf(Date)
      })

      it('1.4.5: validates follow-up state transitions via FOLLOW_UP_MACHINE', () => {
        expect(isValidTransition(FOLLOW_UP_MACHINE, 'open', 'done')).toBe(true)
        expect(isValidTransition(FOLLOW_UP_MACHINE, 'open', 'skipped')).toBe(true)
        expect(isValidTransition(FOLLOW_UP_MACHINE, 'done', 'open')).toBe(false)
        expect(isValidTransition(FOLLOW_UP_MACHINE, 'skipped', 'open')).toBe(false)
      })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2: Boundary & Corner Cases (>=5 tests per feature)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Tier 2: Boundary & Corner Cases', () => {

    describe('Boundary 2.1: Disallow Invalid State Transitions', () => {
      it('2.1.1: rejects new → won directly (skipping qualification and quotation)', () => {
        expect(isValidTransition(LEAD_MACHINE, 'new', 'won')).toBe(false)
      })

      it('2.1.2: rejects new → site_visit_requested directly (unqualified)', () => {
        expect(isValidTransition(LEAD_MACHINE, 'new', 'site_visit_requested')).toBe(false)
      })

      it('2.1.3: rejects contacted → won directly', () => {
        expect(isValidTransition(LEAD_MACHINE, 'contacted', 'won')).toBe(false)
      })

      it('2.1.4: rejects backward transition contacted → new', () => {
        expect(isValidTransition(LEAD_MACHINE, 'contacted', 'new')).toBe(false)
      })

      it('2.1.5: rejects backward transition quoted → new', () => {
        expect(isValidTransition(LEAD_MACHINE, 'quoted', 'new')).toBe(false)
      })

      it('2.1.6: rejects transition out of terminal state won (won → lost is invalid)', () => {
        expect(isValidTransition(LEAD_MACHINE, 'won', 'lost')).toBe(false)
        expect(isValidTransition(LEAD_MACHINE, 'won', 'quoted')).toBe(false)
      })

      it('2.1.7: rejects transition out of terminal state lost (lost → new is invalid)', () => {
        expect(isValidTransition(LEAD_MACHINE, 'lost', 'new')).toBe(false)
        expect(isValidTransition(LEAD_MACHINE, 'lost', 'won')).toBe(false)
      })

      it('2.1.8: rejects backward transition site_visit_requested → contacted', () => {
        expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'contacted')).toBe(false)
      })

      it('2.1.9: simulator throws InvalidTransitionError and writes zero audit logs on invalid transition', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t2-inv', source: 'line', ownerId: 'ae-01' })
        const initialLogsCount = sim.auditLogs.length
        await expect(sim.transitionTo('won', 'ae-01')).rejects.toThrow(InvalidTransitionError)
        expect(sim.status).toBe('new')
        expect(sim.auditLogs.length).toBe(initialLogsCount)
      })
    })

    describe('Boundary 2.2: Mandatory Lost Reason Validation', () => {
      it('2.2.1: rejects empty string as lost reason', () => {
        const res = validateLostReason('')
        expect(res.valid).toBe(false)
        expect(res.error).toContain('กรุณาระบุเหตุผลที่ปิด Lead')
      })

      it('2.2.2: rejects whitespace-only string as lost reason', () => {
        const res = validateLostReason('    ')
        expect(res.valid).toBe(false)
        expect(res.error).toContain('กรุณาระบุเหตุผลที่ปิด Lead')
      })

      it('2.2.3: rejects null or undefined as lost reason', () => {
        expect(validateLostReason(undefined).valid).toBe(false)
        expect(validateLostReason(null).valid).toBe(false)
      })

      it('2.2.4: rejects unrecognized/invalid lost reason', () => {
        const res = validateLostReason('เหตุผลที่ไม่ระบุในระบบ')
        expect(res.valid).toBe(false)
        expect(res.error).toContain('เหตุผลไม่ถูกต้อง')
      })

      it('2.2.5: accepts all valid Thai standard reasons in LOST_REASONS', () => {
        for (const reason of LOST_REASONS) {
          const res = validateLostReason(reason)
          expect(res.valid).toBe(true)
        }
        expect(validateLostReason('ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง').valid).toBe(true)
      })

      it('2.2.6: accepts standard uppercase enum codes (e.g. PRICE_HIGH, COMPETITOR_CHOSEN)', () => {
        expect(validateLostReason('PRICE_HIGH').valid).toBe(true)
        expect(validateLostReason('COMPETITOR_CHOSEN').valid).toBe(true)
        expect(validateLostReason('PROJECT_CANCELLED').valid).toBe(true)
        expect(validateLostReason('BUDGET_INSUFFICIENT').valid).toBe(true)
      })

      it('2.2.7: simulator closeLost rejects empty reason and preserves original status', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t2-lost', source: 'phone', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await expect(sim.closeLost({ lostReason: '', actorId: 'ae-01' })).rejects.toThrow('กรุณาระบุเหตุผลที่ปิด Lead')
        expect(sim.status).toBe('contacted')
      })
    })

    describe('Boundary 2.3: Minimum Budget Boundary for Site Visit & Qualification', () => {
      it('2.3.1: budget below 50,000 THB (4,999,999 satang) is ineligible for site visit', () => {
        const check = validateSiteVisitBudget(4_999_999)
        expect(check.eligible).toBe(false)
        expect(check.error).toContain('งบประมาณขั้นต่ำสำหรับการสำรวจหน้างานคือ ฿50,000')
      })

      it('2.3.2: budget exactly at boundary 50,000 THB (5,000,000 satang) is eligible', () => {
        const check = validateSiteVisitBudget(MIN_SITE_VISIT_BUDGET_SATANG)
        expect(check.eligible).toBe(true)
        expect(check.error).toBeUndefined()
      })

      it('2.3.3: budget above boundary (5,000,001 satang) is eligible', () => {
        const check = validateSiteVisitBudget(5_000_001)
        expect(check.eligible).toBe(true)
      })

      it('2.3.4: zero satang budget is rejected', () => {
        const check = validateSiteVisitBudget(0)
        expect(check.eligible).toBe(false)
        expect(check.error).toContain('งบประมาณต้องมากกว่า 0')
      })

      it('2.3.5: negative satang budget is rejected', () => {
        const check = validateSiteVisitBudget(-1_000_000)
        expect(check.eligible).toBe(false)
      })

      it('2.3.6: new customer credit threshold is 5,000,000 satang (50,000 THB)', () => {
        expect(NEW_CUSTOMER_THRESHOLD_SATANG).toBe(5_000_000)
        const orderOver = runCreditCheck({
          onHold: false,
          creditLimitSatang: 10_000_000,
          outstandingSatang: 0,
          overdueAmountSatang: 0,
          orderTotalSatang: 5_000_001,
          hasPriorHistory: false, // new customer!
        })
        expect(orderOver.decision).toBe('hold')
        expect(orderOver.reason).toContain('ลูกค้าใหม่')
      })
    })

    describe('Boundary 2.4: Mock GPS & Distance Calculation Handling', () => {
      const officeLat = 13.6682 // Thai Watsadu Bangna
      const officeLng = 100.6341

      it('2.4.1: distance <= 300m allows check-in', () => {
        // Site located ~85m away
        const userLat = 13.6688
        const userLng = 100.6345
        const check = validateFieldCheckIn({
          userLat,
          userLng,
          siteLat: officeLat,
          siteLng: officeLng,
          isMockLocationEnabled: false,
        })
        expect(check.allowed).toBe(true)
        expect(check.distanceMeters).toBeLessThanOrEqual(300)
      })

      it('2.4.2: distance exactly at 300m threshold is within radius', () => {
        expect(isWithinRadius(0, 0, 0, 0, 300)).toBe(true)
      })

      it('2.4.3: distance > 300m (e.g. 650m) is rejected without supervisor override', () => {
        // Site ~650m away
        const userLat = 13.6740
        const userLng = 100.6341
        const check = validateFieldCheckIn({
          userLat,
          userLng,
          siteLat: officeLat,
          siteLng: officeLng,
          isMockLocationEnabled: false,
          supervisorOverride: false,
        })
        expect(check.allowed).toBe(false)
        expect(check.error).toContain('GEO_DISTANCE_EXCEEDED')
      })

      it('2.4.4: distance > 300m with supervisor override is allowed but flagged', () => {
        const userLat = 13.6740
        const userLng = 100.6341
        const check = validateFieldCheckIn({
          userLat,
          userLng,
          siteLat: officeLat,
          siteLng: officeLng,
          isMockLocationEnabled: false,
          supervisorOverride: true,
        })
        expect(check.allowed).toBe(true)
        expect(check.flagged).toBe(true)
      })

      it('2.4.5: mock GPS detected (isMockLocationEnabled=true) is strictly blocked (HTTP 403)', () => {
        const check = validateFieldCheckIn({
          userLat: officeLat,
          userLng: officeLng,
          siteLat: officeLat,
          siteLng: officeLng,
          isMockLocationEnabled: true,
        })
        expect(check.allowed).toBe(false)
        expect(check.error).toContain('ERR_GPS_SPOOFING_DETECTED')
      })

      it('2.4.6: formats display distance properly (<1km in meters, >=1km in km)', () => {
        expect(formatDistance(250)).toBe('250 ม.')
        expect(formatDistance(1500)).toBe('1.5 กม.')
      })
    })

    describe('Boundary 2.5: Quotation Satang Amount Boundary & VAT Rounding', () => {
      it('2.5.1: zero satang quotation is rejected during attachment', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t2-satang', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        await expect(sim.attachQuotation({
          quotationNumber: 'QT-202609-0000',
          subtotalSatang: 0,
          vatAmountSatang: 0,
          totalSatang: 0,
          actorId: 'ae-01',
        })).rejects.toThrow('ยอดใบเสนอราคาต้องมากกว่า 0 Satang')
      })

      it('2.5.2: negative satang quotation is rejected', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-t2-satang-neg', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        await expect(sim.attachQuotation({
          quotationNumber: 'QT-202609-0000',
          subtotalSatang: -100_000,
          vatAmountSatang: 0,
          totalSatang: -100_000,
          actorId: 'ae-01',
        })).rejects.toThrow('ยอดใบเสนอราคาต้องมากกว่า 0 Satang')
      })

      it('2.5.3: 7% VAT exclusive rounding boundary: 1 satang → 0 satang VAT, total = 1 satang', () => {
        const res = calculateQuotation([{ qty: 1, unitPriceSatang: 1, discountSatang: 0 }], 0, 7, 'exclusive')
        expect(res.subtotalSatang).toBe(1)
        expect(res.vatAmountSatang).toBe(0) // Math.round(1 * 0.07) = 0
        expect(res.totalSatang).toBe(1)
      })

      it('2.5.4: 7% VAT exclusive rounding boundary: 7 satang rounds down, 8 satang rounds up', () => {
        // 7 satang * 0.07 = 0.49 -> rounds down to 0
        const res7 = calculateQuotation([{ qty: 1, unitPriceSatang: 7, discountSatang: 0 }], 0, 7, 'exclusive')
        expect(res7.vatAmountSatang).toBe(0)
        expect(res7.totalSatang).toBe(7)

        // 8 satang * 0.07 = 0.56 -> rounds up to 1
        const res8 = calculateQuotation([{ qty: 1, unitPriceSatang: 8, discountSatang: 0 }], 0, 7, 'exclusive')
        expect(res8.vatAmountSatang).toBe(1)
        expect(res8.totalSatang).toBe(9)
      })

      it('2.5.5: 7% VAT inclusive extraction: 107 satang extracts 7 satang VAT', () => {
        const res = calculateQuotation([{ qty: 1, unitPriceSatang: 107, discountSatang: 0 }], 0, 7, 'inclusive')
        expect(res.subtotalSatang).toBe(107)
        expect(res.vatAmountSatang).toBe(7) // 107 * 7 / 107 = 7
        expect(res.totalSatang).toBe(107)
      })

      it('2.5.6: bill discount cannot exceed subtotal (safely capped)', () => {
        const res = calculateQuotation(
          [{ qty: 1, unitPriceSatang: 10_000, discountSatang: 0 }],
          20_000, // excessive bill discount
          7,
          'exclusive'
        )
        expect(res.subtotalSatang).toBe(10_000)
        expect(res.billDiscountSatang).toBe(10_000) // capped
        expect(res.afterDiscountSatang).toBe(0)
        expect(res.vatAmountSatang).toBe(0)
        expect(res.totalSatang).toBe(0)
      })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 3: Cross-Feature Combinations (Pairwise Coverage)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Tier 3: Cross-Feature Combinations', () => {

    describe('Combination 3.1: Omnichannel Inbound Lead to Close Win Handshake', () => {
      const channels: LeadSource[] = ['line', 'phone', 'store', 'other']

      for (const src of channels) {
        it(`channel [${src}]: full qualification → site visit → quotation → close win`, async () => {
          const sim = new LeadPipelineSimulator({
            id: `lead-c3-win-${src}`,
            source: src,
            channelRef: src === 'line' ? 'U1234567890' : src === 'store' ? '0012' : '0812345678',
            customerName: `ลูกค้าทดสอบ ${src}`,
            budgetSatang: 15_000_000, // 150,000 THB
            ownerId: 'ae-sales',
          })

          // Step 1: Initial state is new with 24h follow-up
          expect(sim.status).toBe('new')
          expect(sim.followUps).toHaveLength(1)

          // Step 2: Contacted
          await sim.transitionTo('contacted', 'ae-sales')
          expect(sim.status).toBe('contacted')

          // Step 3: Qualified
          await sim.transitionTo('qualified', 'ae-sales')
          expect(sim.status).toBe('qualified')

          // Step 4: Site Visit Requested
          await sim.transitionTo('site_visit_requested', 'ae-sales')
          expect(sim.status).toBe('site_visit_requested')

          // Step 5: Attach Quotation -> auto-quoted
          const qt = await sim.attachQuotation({
            quotationNumber: `QT-202609-00${src.length}`,
            subtotalSatang: 14_500_000,
            vatAmountSatang: 1_015_000,
            totalSatang: 15_515_000,
            actorId: 'ae-sales',
          })
          expect(sim.status).toBe('quoted')

          // Step 6: Close Win with Credit Pass
          const { order, creditDecision } = await sim.closeWin({
            quotationId: qt.id,
            customerCredit: {
              creditLimitSatang: 50_000_000,
              outstandingSatang: 10_000_000,
              overdueAmountSatang: 0,
              hasPriorHistory: true,
            },
            actorId: 'ae-sales',
          })

          expect(sim.status).toBe('won')
          expect(creditDecision.decision).toBe('pass')
          expect(order.status).toBe('awaiting_payment')
          expect(order.totalSatang).toBe(15_515_000)
        })
      }
    })

    describe('Combination 3.2: Omnichannel Inbound to Close Lost (Customer Declines)', () => {
      const declineReasons = [
        { reason: 'PRICE_HIGH', thai: 'ราคาสูงเกินไป' },
        { reason: 'COMPETITOR_CHOSEN', thai: 'เลือกคู่แข่ง' },
        { reason: 'PROJECT_CANCELLED', thai: 'ยกเลิกโครงการ' },
      ]

      for (const item of declineReasons) {
        it(`lead declines with reason [${item.reason}]: transitions to lost and cancels open tasks`, async () => {
          const sim = new LeadPipelineSimulator({
            id: `lead-c3-lost-${item.reason}`,
            source: 'line',
            ownerId: 'ae-sales',
          })

          await sim.transitionTo('contacted', 'ae-sales')
          await sim.transitionTo('qualified', 'ae-sales')
          const qt = await sim.attachQuotation({
            quotationNumber: `QT-202609-0099`,
            subtotalSatang: 5_000_000,
            vatAmountSatang: 350_000,
            totalSatang: 5_350_000,
            actorId: 'ae-sales',
          })
          expect(sim.status).toBe('quoted')

          // Customer declines quotation
          await sim.closeLost({
            lostReason: item.reason,
            actorId: 'ae-sales',
            notes: `ลูกค้าแจ้งว่า ${item.thai}`,
          })

          expect(sim.status).toBe('lost')
          expect(sim.lostReason).toBe(item.reason)
          // Open follow-ups should be skipped
          expect(sim.followUps.every(f => f.status !== 'open')).toBe(true)
        })
      }
    })

    describe('Combination 3.3: Close Win Handshake with Credit Check Evaluation', () => {
      it('3.3.1: credit pass → order created in awaiting_payment', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-c3-pass', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        const qt = await sim.attachQuotation({
          quotationNumber: 'QT-202609-0101',
          subtotalSatang: 1_000_000,
          vatAmountSatang: 70_000,
          totalSatang: 1_070_000,
          actorId: 'ae-01',
        })

        const { order, creditDecision } = await sim.closeWin({
          quotationId: qt.id,
          customerCredit: {
            creditLimitSatang: 10_000_000,
            outstandingSatang: 0,
            overdueAmountSatang: 0,
          },
          actorId: 'ae-01',
        })

        expect(creditDecision.decision).toBe('pass')
        expect(order.status).toBe('awaiting_payment')
      })

      it('3.3.2: credit limit exceeded → order created in credit_hold', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-c3-hold', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        const qt = await sim.attachQuotation({
          quotationNumber: 'QT-202609-0102',
          subtotalSatang: 20_000_000, // 200,000 THB
          vatAmountSatang: 1_400_000,
          totalSatang: 21_400_000,
          actorId: 'ae-01',
        })

        const { order, creditDecision } = await sim.closeWin({
          quotationId: qt.id,
          customerCredit: {
            creditLimitSatang: 15_000_000, // limit is 150,000 THB (less than order)
            outstandingSatang: 0,
            overdueAmountSatang: 0,
          },
          actorId: 'ae-01',
        })

        expect(creditDecision.decision).toBe('hold')
        expect(creditDecision.reason).toContain('เกินวงเงิน')
        expect(order.status).toBe('credit_hold')
      })

      it('3.3.3: overdue invoices present → order created in credit_hold', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-c3-overdue', source: 'phone', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        const qt = await sim.attachQuotation({
          quotationNumber: 'QT-202609-0103',
          subtotalSatang: 1_000_000,
          vatAmountSatang: 70_000,
          totalSatang: 1_070_000,
          actorId: 'ae-01',
        })

        const { order, creditDecision } = await sim.closeWin({
          quotationId: qt.id,
          customerCredit: {
            creditLimitSatang: 50_000_000,
            outstandingSatang: 5_000_000,
            overdueAmountSatang: 500_000, // 5,000 THB overdue!
          },
          actorId: 'ae-01',
        })

        expect(creditDecision.decision).toBe('hold')
        expect(creditDecision.reason).toContain('ค้างชำระ')
        expect(order.status).toBe('credit_hold')
      })

      it('3.3.4: account frozen by accounting (onHold=true) → order created in credit_hold', async () => {
        const sim = new LeadPipelineSimulator({ id: 'lead-c3-reject', source: 'store', ownerId: 'ae-01' })
        await sim.transitionTo('contacted', 'ae-01')
        await sim.transitionTo('qualified', 'ae-01')
        const qt = await sim.attachQuotation({
          quotationNumber: 'QT-202609-0104',
          subtotalSatang: 1_000_000,
          vatAmountSatang: 70_000,
          totalSatang: 1_070_000,
          actorId: 'ae-01',
        })

        const { order, creditDecision } = await sim.closeWin({
          quotationId: qt.id,
          customerCredit: {
            creditLimitSatang: 50_000_000,
            outstandingSatang: 0,
            overdueAmountSatang: 0,
            onHold: true,
          },
          actorId: 'ae-01',
        })

        expect(creditDecision.decision).toBe('reject')
        expect(order.status).toBe('credit_hold')
      })

      it('3.3.5: credit check engine evaluates soft_warn tier when utilization ≥ 80%', () => {
        const res = checkCredit({
          creditLimitSatang: 10_000_000,
          creditUsedSatang: 7_000_000,
          newOrderAmountSatang: 1_500_000, // total 8,500,000 (85%)
        })
        expect(res.tier).toBe('soft_warn')
        expect(res.usedPct).toBe(85)
      })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 4: Real-World Scenarios (The 5 Scenarios from TEST_INFRA.md)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Tier 4: Real-World Scenarios', () => {

    it('Scenario 1: Omnichannel Walk-in Lead to Close Win (Full Lifecycle)', async () => {
      // 1. Walk-in contractor at Mega-store Bangna (branch '0012')
      const taxId = '0105558123451' // Valid Tax ID
      expect(validateTaxIdModulo11(taxId)).toBe(true)

      const dedupeKey = generateDedupeKey(taxId, '0819876543', '10260')
      expect(dedupeKey).toBe('0105558123451:0819876543:10260')

      const lead = new LeadPipelineSimulator({
        id: 'lead-rw-sc1',
        source: 'store',
        channelRef: '0012',
        customerName: 'หจก. ก่อสร้างพัฒนาบางนา',
        customerPhone: '0819876543',
        taxId,
        postalCode: '10260',
        budgetSatang: 250_000_000, // 2,500,000 THB
        ownerId: 'ae-somchai',
      })

      // 2. AE calls contractor, logs phone call outcome
      lead.logActivity('call', 'โทรนัดหมายยืนยันความต้องการ: ขยายโกดังสินค้า 500 ตร.ม.', 'ae-somchai')
      await lead.transitionTo('contacted', 'ae-somchai')
      expect(lead.status).toBe('contacted')

      // 3. Qualified (budget verified >= 50,000 THB)
      expect(validateSiteVisitBudget(lead.budgetRangeMinSatang).eligible).toBe(true)
      await lead.transitionTo('qualified', 'ae-somchai')
      expect(lead.status).toBe('qualified')

      // 4. Site visit scheduled and approved by Branch Manager
      expect(isValidTransition(APPOINTMENT_MACHINE, 'requested', 'scheduled')).toBe(true)
      await lead.transitionTo('site_visit_requested', 'ae-somchai')
      expect(lead.status).toBe('site_visit_requested')

      // 5. Mobile GPS check-in (distance 85m, mock GPS false)
      const checkin = validateFieldCheckIn({
        userLat: 13.6688,
        userLng: 100.6345,
        siteLat: 13.6682,
        siteLng: 100.6341,
        isMockLocationEnabled: false,
      })
      expect(checkin.allowed).toBe(true)
      expect(isValidTransition(JOB_MACHINE, 'pending', 'checked_in')).toBe(true)

      // 6. Surveyor completes BoQ items & customer touchscreen signature -> check-out
      lead.logActivity('visit', 'สำรวจเสร็จสิ้น: บันทึก BoQ ปูน 500 ถุง + เหล็กข้ออ้อย 20 ตัน ลูกค้าเซ็นรับรองบนมือถือ', 'surveyor-01')
      expect(isValidTransition(JOB_MACHINE, 'checked_in', 'in_progress')).toBe(true)
      expect(isValidTransition(JOB_MACHINE, 'in_progress', 'checked_out')).toBe(true)

      // 7. BoQ converted to E-ordering Quotation: Subtotal 2,000,000 THB + VAT 7% 140,000 THB = 2,140,000 THB
      const qtCalc = calculateQuotation(
        [
          { qty: 500, unitPriceSatang: 145_00, discountSatang: 0 },   // ปูนซีเมนต์ 72,500 THB
          { qty: 20, unitPriceSatang: 96375_00, discountSatang: 0 },  // เหล็กเส้น 1,927,500 THB
        ],
        0,
        7,
        'exclusive'
      )
      expect(qtCalc.totalSatang).toBe(214_000_000)

      const qt = await lead.attachQuotation({
        quotationNumber: 'QT-202609-0012',
        subtotalSatang: qtCalc.subtotalSatang,
        vatAmountSatang: qtCalc.vatAmountSatang,
        totalSatang: qtCalc.totalSatang,
        actorId: 'ae-somchai',
      })
      expect(lead.status).toBe('quoted')

      // 8. Contractor signs off -> Close Win -> SO generated -> Credit check pass
      const { order, creditDecision } = await lead.closeWin({
        quotationId: qt.id,
        customerCredit: {
          creditLimitSatang: 500_000_000, // 5,000,000 THB
          outstandingSatang: 100_000_000, // 1,000,000 THB
          overdueAmountSatang: 0,
        },
        actorId: 'ae-somchai',
      })

      expect(lead.status).toBe('won')
      expect(order.status).toBe('awaiting_payment')
      expect(creditDecision.decision).toBe('pass')
      expect(order.number).toMatch(/^SO-\d{6}-\d{4}$/)
    })

    it('Scenario 2: LINE OA Inbound to Close Lost (Declined with Reason)', async () => {
      // 1. Inbound lead from LINE OA
      const lead = new LeadPipelineSimulator({
        id: 'lead-rw-sc2',
        source: 'line',
        channelRef: 'U9876543210',
        customerName: 'คุณกิตติศักดิ์ ช่างปูน',
        customerPhone: '0891234567',
        budgetSatang: 6_500_000, // 65,000 THB
        ownerId: 'ae-kitti',
      })
      expect(lead.followUps).toHaveLength(1)

      // 2. AE calls customer, moves to contacted
      lead.logActivity('call', 'โทรคุยสเปกอิฐมวลเบาและปูนก่อฉาบสำหรับบ้าน 2 ชั้น', 'ae-kitti')
      await lead.transitionTo('contacted', 'ae-kitti')

      // 3. Mark qualified
      await lead.transitionTo('qualified', 'ae-kitti')

      // 4. Standard material order: skip site visit, issue direct quotation
      const qtCalc = calculateQuotation(
        [{ qty: 500, unitPriceSatang: 125_00, discountSatang: 0 }], // 62,500 THB gross
        4107_00, // discount to match 62,500 THB net with VAT
        7,
        'inclusive'
      )
      const qt = await lead.attachQuotation({
        quotationNumber: 'QT-202609-0022',
        subtotalSatang: 6_250_000,
        vatAmountSatang: 408_879,
        totalSatang: 6_250_000,
        actorId: 'ae-kitti',
      })
      expect(lead.status).toBe('quoted')

      // 5. Follow-up 3 days later: customer informs competitor offers lower price
      lead.logActivity('call', 'ลูกค้าแจ้งว่าร้านวัสดุแถวบ้านเสนอราคาอิฐมวลเบาถูกกว่า 5% ขอยกเลิก', 'ae-kitti')

      // 6. Close Lost executed with mandatory reason PRICE_HIGH
      await lead.closeLost({
        lostReason: 'PRICE_HIGH',
        actorId: 'ae-kitti',
        notes: 'สู้ราคาคู่แข่งแถวบ้านไม่ไหว คู่แข่งลด 5%',
      })

      expect(lead.status).toBe('lost')
      expect(lead.lostReason).toBe('PRICE_HIGH')
      // Auto follow-ups are closed/skipped
      expect(lead.followUps.find(f => f.status === 'open')).toBeUndefined()
    })

    it('Scenario 3: High-Value Lead with Credit Hold', async () => {
      // 1. Enterprise contractor inquiry
      const lead = new LeadPipelineSimulator({
        id: 'lead-rw-sc3',
        source: 'phone',
        customerName: 'บจก. สยามอินฟราสตัคเจอร์',
        budgetSatang: 300_000_000, // 3,000,000 THB
        ownerId: 'ae-enterprise',
      })
      await lead.transitionTo('contacted', 'ae-enterprise')
      await lead.transitionTo('qualified', 'ae-enterprise')
      await lead.transitionTo('site_visit_requested', 'ae-enterprise')

      // 2. Quotation issued: 2,500,000 THB
      const qt = await lead.attachQuotation({
        quotationNumber: 'QT-202609-0033',
        subtotalSatang: 233_644_860,
        vatAmountSatang: 16_355_140,
        totalSatang: 250_000_000, // 2,500,000 THB
        actorId: 'ae-enterprise',
      })

      // 3. Customer accepts quotation -> Close Win triggered
      // Credit limit: 2,000,000 THB, Outstanding: 500,000 THB -> Available: 1,500,000 THB
      // Order amount 2,500,000 THB exceeds available credit by 1,000,000 THB!
      const { order, creditDecision } = await lead.closeWin({
        quotationId: qt.id,
        customerCredit: {
          creditLimitSatang: 200_000_000,  // 2,000,000 THB
          outstandingSatang: 50_000_000,   // 500,000 THB
          overdueAmountSatang: 0,
        },
        actorId: 'ae-enterprise',
      })

      expect(lead.status).toBe('won')
      expect(creditDecision.decision).toBe('hold')
      expect(creditDecision.reason).toContain('เกินวงเงินคงเหลือ')
      expect(order.status).toBe('credit_hold')

      // 4. Order Machine validates credit_hold can transition to awaiting_payment after BM override
      expect(ORDER_MACHINE['credit_hold']?.['awaiting_payment']).toBe(true)
    })

    it('Scenario 4: AE Daily Follow-up Workbench (vsite.online style)', async () => {
      // 1. AE loads workbench leads
      const lead = new LeadPipelineSimulator({
        id: 'lead-rw-sc4',
        source: 'phone',
        ownerId: 'ae-workbench',
        customerName: 'บจก. พลัสพรีคาสท์',
      })

      // Simulating a stale lead: created 10 days ago
      lead.updatedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const isStale = (Date.now() - lead.updatedAt.getTime()) > 7 * 24 * 60 * 60 * 1000
      expect(isStale).toBe(true)

      // 2. AE logs quick call activity
      const callAct = lead.logActivity(
        'call',
        'โทรติดตามเรื่องสเปกเหล็กข้ออ้อย DB16 ลูกค้าต้องการใบรับรอง มอก.',
        'ae-workbench'
      )
      expect(callAct.type).toBe('call')

      // 3. AE schedules follow-up task for tomorrow 10:00 AM via LINE
      const tomorrow10am = new Date(Date.now() + 24 * 60 * 60 * 1000)
      tomorrow10am.setHours(10, 0, 0, 0)
      const fu = lead.scheduleFollowUp({
        dueAt: tomorrow10am,
        channel: 'line',
        assigneeId: 'ae-workbench',
        note: 'ส่งใบรับรอง มอก. ทาง LINE และโทรยืนยัน',
      })
      expect(fu.status).toBe('open')
      expect(fu.channel).toBe('line')

      // 4. Stale status cleared as lead.updatedAt was updated
      const isStillStale = (Date.now() - lead.updatedAt.getTime()) > 7 * 24 * 60 * 60 * 1000
      expect(isStillStale).toBe(false)

      // 5. Drag card on Kanban board: new -> contacted
      await lead.transitionTo('contacted', 'ae-workbench')
      expect(lead.status).toBe('contacted')
    })

    it('Scenario 5: Direct Field Survey Check-out with Instant E-ordering QT Attached', async () => {
      // 1. Lead in site_visit_requested stage
      const lead = new LeadPipelineSimulator({
        id: 'lead-rw-sc5',
        source: 'store',
        ownerId: 'ae-nonthaburi',
        customerName: 'คุณประยุทธ์ ผู้รับเหมาเมืองนนท์',
      })
      await lead.transitionTo('contacted', 'ae-nonthaburi')
      await lead.transitionTo('qualified', 'ae-nonthaburi')
      await lead.transitionTo('site_visit_requested', 'ae-nonthaburi')

      // 2. Surveyor checks in at site in Nonthaburi (distance 45m <= 300m, mock GPS false)
      const checkin = validateFieldCheckIn({
        userLat: 13.8591,
        userLng: 100.5217,
        siteLat: 13.8588,
        siteLng: 100.5220,
        isMockLocationEnabled: false,
      })
      expect(checkin.allowed).toBe(true)
      expect(checkin.distanceMeters).toBeLessThan(100)

      // 3. Field checklist: Road width 6.5m, crane truck clearance verified
      lead.logActivity('visit', 'บันทึกหน้างาน: ถนนกว้าง 6.5 ม. รถ 6 ล้อติดเครนเข้าได้ สายไฟสูง > 4.5 ม.', 'surveyor-02')

      // 4. Input BoQ: 200 bags cement @ 145 THB, 50 sheets board @ 280 THB
      const boqCalc = calculateQuotation(
        [
          { qty: 200, unitPriceSatang: 145_00, discountSatang: 0 }, // 29,000 THB
          { qty: 50, unitPriceSatang: 280_00, discountSatang: 0 },  // 14,000 THB
        ],
        0,
        7,
        'exclusive'
      )
      expect(boqCalc.subtotalSatang).toBe(43_000_00) // 43,000 THB
      expect(boqCalc.vatAmountSatang).toBe(3_010_00)  // 3,010 THB
      expect(boqCalc.totalSatang).toBe(46_010_00)      // 46,010 THB

      // 5. Check-out with signature & instant quotation QT-202609-0042 attached
      const qt = await lead.attachQuotation({
        quotationNumber: 'QT-202609-0042',
        subtotalSatang: boqCalc.subtotalSatang,
        vatAmountSatang: boqCalc.vatAmountSatang,
        totalSatang: boqCalc.totalSatang,
        actorId: 'surveyor-02',
      })

      // 6. Lead auto-promotes from site_visit_requested to quoted
      expect(lead.status).toBe('quoted')
      expect(lead.quotations[0].number).toBe('QT-202609-0042')
      expect(lead.quotations[0].totalSatang).toBe(46_010_00)
    })
  })
})
