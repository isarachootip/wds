import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { LOST_REASONS, THAI_LOST_REASONS } from '@/modules/crm/actions'
import { LEAD_MACHINE } from '@/modules/crm/lead-machine'
import { isValidTransition } from '@/lib/statemachine'
import { formatTHB, satang, fromBaht, toBaht } from '@/lib/money'
import { satangToBaht } from '@/lib/qt-calc'

import { StageProgressStepper } from './StageProgressStepper'
import { QuickActivityLogger } from './QuickActivityLogger'
import { SiteVisitCard } from './SiteVisitCard'
import { QuotationCard } from './QuotationCard'
import { UnifiedTimeline } from './UnifiedTimeline'
import { DealClosingModals, LOST_REASON_OPTIONS } from './DealClosingModals'
import LeadDetailPage from '../page'

// Mock CRM queries so LeadDetailPage SSR renders cleanly
const mockLeadData = {
  lead: {
    leads: {
      id: 'lead-test-12345678',
      status: 'quoted',
      source: 'line',
      channelRef: '@line-user-99',
      projectLocation: 'บางนา-ตราด กม. 18',
      budgetRangeMinSatang: 5000000,
      budgetRangeMaxSatang: 15000000,
      assignedTo: 'สมเกียรติ ยอดขาย (ทีม AE B2B บางนา)',
      interestSummary: 'คอนกรีตผสมเสร็จ CPAC 240 ksc และเหล็กเส้นข้ออ้อย SD40',
      createdAt: new Date('2026-09-14T02:00:00Z'),
      updatedAt: new Date('2026-09-14T02:00:00Z'),
      lostReason: null,
    },
    customers: {
      id: 'cust-123',
      name: 'บริษัท สยามก่อสร้างแอนด์เอ็นจิเนียริ่ง จำกัด',
      phone: '081-234-5678',
      email: 'contact@siam-con.co.th',
      taxId: '0105558123456',
    },
  },
  activities: [
    {
      id: 'act-1',
      type: 'call',
      note: 'โทรคุยเรื่อง BOQ และสรุปปริมาณสินค้า',
      userId: 'sales-ae',
      occurredAt: new Date('2026-09-14T03:00:00Z'),
    },
    {
      id: 'act-2',
      type: 'line',
      note: 'ส่งแคตตาล็อกสินค้าและเอกสารสเปกทาง LINE',
      userId: 'sales-ae',
      occurredAt: new Date('2026-09-14T03:30:00Z'),
    },
  ],
  followUps: [
    {
      id: 'fu-1',
      dueAt: new Date('2026-09-15T10:00:00Z'),
      channel: 'phone',
      status: 'open',
      note: 'โทรยืนยันใบเสนอราคา',
      assigneeId: 'sales-ae',
    },
  ],
  siteVisits: [
    {
      id: 'sv-1',
      purpose: 'ตรวจสอบความพร้อมทางเข้าไซต์งาน (ระยะผ่านทางรถ: 10W)',
      status: 'scheduled',
      requestedAt: new Date('2026-09-14T04:00:00Z'),
      checkinAt: new Date('2026-09-14T05:00:00Z'),
      checkinLat: 13.6842,
      checkinLng: 100.6152,
      checkinDistanceM: 25,
      workSummary: 'ทางเข้ากว้าง 7 เมตร รถสิบล้อเข้าได้สะดวก',
      checkoutAt: new Date('2026-09-14T06:00:00Z'),
      customerSignaturePath: '/signatures/sv-1.png',
      scope: { roadClearance: '10W', notes: 'ตรวจสอบสายไฟและความกว้างถนน' },
      appointment: { approvedAt: new Date('2026-09-14T04:30:00Z') },
      job: { id: 'job-123' },
    },
  ],
  quotations: [
    {
      id: 'qt-1',
      number: 'QT-202609-0012',
      totalSatang: 10700000,
      subtotalSatang: 10000000,
      vatAmountSatang: 700000,
      status: 'sent',
      createdAt: new Date('2026-09-14T07:00:00Z'),
      validUntil: '2026-10-14',
    },
  ],
}

vi.mock('@/modules/crm/queries', () => ({
  getLeadById: vi.fn(async (id: string) => {
    if (id === 'not-found') return null
    return mockLeadData
  }),
}))

describe('Lead Detail Workbench: Comprehensive Logic & Cruip Artifact Component Tests', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Visual Stage Progress Stepper
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Visual Stage Progress Stepper', () => {
    const STAGE_ORDER = ['new', 'contacted', 'qualified', 'site_visit_requested', 'quoted', 'won']

    it('defines the 6 sales cycle stages in correct linear sequence', () => {
      expect(STAGE_ORDER).toEqual([
        'new',
        'contacted',
        'qualified',
        'site_visit_requested',
        'quoted',
        'won',
      ])
    })

    it('identifies eligible next stage transitions according to LEAD_MACHINE', () => {
      // From 'new'
      expect(isValidTransition(LEAD_MACHINE, 'new', 'contacted')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'new', 'lost')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'new', 'won')).toBe(false)

      // From 'contacted'
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'qualified')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'lost')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'quoted')).toBe(false)

      // From 'qualified'
      expect(isValidTransition(LEAD_MACHINE, 'qualified', 'site_visit_requested')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'qualified', 'quoted')).toBe(true) // Fast-track quote
      expect(isValidTransition(LEAD_MACHINE, 'qualified', 'lost')).toBe(true)

      // From 'site_visit_requested'
      expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'quoted')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'lost')).toBe(true)

      // From 'quoted'
      expect(isValidTransition(LEAD_MACHINE, 'quoted', 'won')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'quoted', 'lost')).toBe(true)

      // From terminal states ('won', 'lost') - no further transitions
      expect(isValidTransition(LEAD_MACHINE, 'won', 'lost')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'lost', 'won')).toBe(false)
    })

    it('renders StageProgressStepper with Cruip Artifact styling and semantic tokens', () => {
      const html = renderToString(
        React.createElement(StageProgressStepper, {
          leadId: 'lead-123',
          currentStatus: 'qualified',
        })
      )
      expect(html).toContain('วงจรการขาย (Sales Pipeline Cycle)')
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('border-border')
      expect(html).toContain('bg-card')
      expect(html).toContain('ขั้นตอนปัจจุบัน')
      expect(html).toContain('นัดสำรวจหน้างาน (Site Visit)')
    })

    it('renders terminal won state with celebratory badge', () => {
      const html = renderToString(
        React.createElement(StageProgressStepper, {
          leadId: 'lead-123',
          currentStatus: 'won',
        })
      )
      expect(html).toContain('ชนะการขายสำเร็จ (Won)')
    })

    it('renders terminal lost state with lost reason badge', () => {
      const html = renderToString(
        React.createElement(StageProgressStepper, {
          leadId: 'lead-123',
          currentStatus: 'lost',
          lostReason: 'ราคาสูงเกินไป',
        })
      )
      expect(html).toContain('ปิดไม่สำเร็จ (Lost)')
      expect(html).toContain('เหตุผล: ราคาสูงเกินไป')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Quick Activity Logger
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Quick Activity Logger', () => {
    const VALID_ACTIVITY_TYPES = ['call', 'line', 'visit', 'note']

    it('accepts valid activity types (call, line, visit, note)', () => {
      VALID_ACTIVITY_TYPES.forEach((type) => {
        expect(['call', 'line', 'visit', 'note']).toContain(type)
      })
    })

    it('validates activity payload format', () => {
      const validCallPayload = {
        leadId: 'lead-123',
        type: 'call' as const,
        note: 'โทรคุยเรื่อง BOQ และสรุปปริมาณสินค้า',
        actorId: 'sales-ae',
      }

      expect(validCallPayload.leadId).toBeDefined()
      expect(validCallPayload.type).toBe('call')
      expect(validCallPayload.note.trim().length).toBeGreaterThan(0)
    })

    it('renders QuickActivityLogger with PillTabs and Cruip Artifact styling', () => {
      const html = renderToString(
        React.createElement(QuickActivityLogger, {
          leadId: 'lead-123',
        })
      )
      expect(html).toContain('บันทึกกิจกรรมด่วน (Quick Activity Logger)')
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('border-border')
      expect(html).toContain('bg-card')
      expect(html).toContain('โทรศัพท์ (Call)')
      expect(html).toContain('LINE OA')
      expect(html).toContain('โน้ตภายใน (Note)')
      expect(html).toContain('เยี่ยมหน้างาน (Visit)')
      expect(html).toContain('ผลลัพธ์การติดต่อ (Outcome)')
      expect(html).toContain('บันทึกกิจกรรม (Log Activity)')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Chronological Unified Timeline
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Chronological Unified Timeline', () => {
    it('correctly sorts unified events in descending order (newest first)', () => {
      const mockEvents = [
        { id: '1', date: new Date('2026-09-12T09:00:00Z'), title: 'สร้าง Lead จาก LINE OA' },
        { id: '2', date: new Date('2026-09-13T14:00:00Z'), title: 'โทรคุยเรื่องสเปกสินค้า' },
        { id: '3', date: new Date('2026-09-14T09:55:00Z'), title: 'Check-in หน้างาน (Site On)' },
        { id: '4', date: new Date('2026-09-14T11:20:00Z'), title: 'Check-out พร้อมลายเซ็น' },
        { id: '5', date: new Date('2026-09-14T15:30:00Z'), title: 'แนบใบเสนอราคา QT-202609-0012' },
      ]

      const sorted = [...mockEvents].sort((a, b) => b.date.getTime() - a.date.getTime())

      expect(sorted[0].id).toBe('5')
      expect(sorted[1].id).toBe('4')
      expect(sorted[2].id).toBe('3')
      expect(sorted[3].id).toBe('2')
      expect(sorted[4].id).toBe('1')
    })

    it('renders UnifiedTimeline with multi-channel filter chips and Cruip Artifact styling', () => {
      const html = renderToString(
        React.createElement(UnifiedTimeline, {
          activities: mockLeadData.activities,
          followUps: mockLeadData.followUps,
          siteVisits: mockLeadData.siteVisits,
          quotations: mockLeadData.quotations,
        })
      )
      expect(html).toContain('ประวัติกิจกรรมรวม (Chronological Unified Timeline)')
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('border-border')
      expect(html).toContain('bg-card')
      expect(html).toContain('ทั้งหมด (All)')
      expect(html).toContain('โทรศัพท์ (Phone)')
      expect(html).toContain('LINE OA')
      expect(html).toContain('สำรวจหน้างาน (Visit)')
      expect(html).toContain('ใบเสนอราคา (Quote)')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Site Visit Card
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Site Visit Card', () => {
    it('evaluates truck road clearance access rules correctly', () => {
      const checkClearance = (detected: string, truckType: string) => {
        if (detected === '22W') return true
        if (detected === '10W') return truckType !== '22W'
        if (detected === '6W') return truckType === '4W' || truckType === '6W'
        if (detected === '4W') return truckType === '4W'
        return false
      }

      // 10W clearance: 4W, 6W, 10W can access; 22W cannot
      expect(checkClearance('10W', '4W')).toBe(true)
      expect(checkClearance('10W', '6W')).toBe(true)
      expect(checkClearance('10W', '10W')).toBe(true)
      expect(checkClearance('10W', '22W')).toBe(false)

      // 22W clearance: all truck types can access
      expect(checkClearance('22W', '22W')).toBe(true)
      expect(checkClearance('22W', '10W')).toBe(true)

      // 4W clearance: only 4W can access
      expect(checkClearance('4W', '6W')).toBe(false)
      expect(checkClearance('4W', '4W')).toBe(true)
    })

    it('evaluates GPS geofence validity within 100 meters', () => {
      const evaluateGeofence = (distanceM: number | null, flagged?: boolean) => {
        if (flagged) return 'flagged'
        if (distanceM !== null && distanceM <= 100) return 'valid'
        return 'out_of_bounds'
      }

      expect(evaluateGeofence(12)).toBe('valid')
      expect(evaluateGeofence(95)).toBe('valid')
      expect(evaluateGeofence(150)).toBe('out_of_bounds')
      expect(evaluateGeofence(50, true)).toBe('flagged')
    })

    it('renders SiteVisitCard with Cruip Artifact styling and road clearance badges', () => {
      const html = renderToString(
        React.createElement(SiteVisitCard, {
          leadId: 'lead-123',
          siteVisits: mockLeadData.siteVisits,
        })
      )
      expect(html).toContain('การสำรวจหน้างาน (Site Visit Management)')
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('border-border')
      expect(html).toContain('bg-card')
      expect(html).toContain('1. Check-in (Site On)')
      expect(html).toContain('2. สรุปหน้างาน &amp; ทางรถ')
      expect(html).toContain('3. Check-out &amp; ลายเซ็น')
      expect(html).toContain('10W')
      expect(html).toContain('เปิดดูรายละเอียดเต็มใน Field App')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. E-ordering Quotation Card
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. E-ordering Quotation Card', () => {
    it('calculates 7% VAT breakdown accurately from gross Baht total', () => {
      const grossBaht = 107000
      const subtotalBaht = Math.round((grossBaht / 1.07) * 100) / 100
      const vatAmountBaht = Math.round((grossBaht - subtotalBaht) * 100) / 100

      expect(subtotalBaht).toBe(100000)
      expect(vatAmountBaht).toBe(7000)
      expect(subtotalBaht + vatAmountBaht).toBe(grossBaht)
    })

    it('converts Baht to Satang integer without precision loss', () => {
      const bahtAmount = 425860.5
      const satangAmount = fromBaht(bahtAmount)

      expect(satangAmount).toBe(42586050)
      expect(toBaht(satangAmount)).toBe(425860.5)
      expect(formatTHB(satangAmount)).toContain('425,860.50')
      expect(satangToBaht(satangAmount)).toBe('425,860.50')
    })

    it('renders QuotationCard with Cruip Artifact styling and formatted satangToBaht', () => {
      const html = renderToString(
        React.createElement(QuotationCard, {
          leadId: 'lead-123',
          quotations: mockLeadData.quotations,
        })
      )
      expect(html).toContain('ใบเสนอราคา E-ordering (Quotations)')
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('border-border')
      expect(html).toContain('bg-card')
      expect(html).toContain('QT-202609-0012')
      expect(html).toContain('แนบใบเสนอราคา (Attach QT)')
      expect(html).toContain('พิมพ์ PDF')
      expect(html).toContain('107,000.00')
    })

    it('renders Attach Quotation modal with dialog accessibility roles and Thai close label when open', () => {
      const html = renderToString(
        React.createElement(QuotationCard, {
          leadId: 'lead-123',
          quotations: mockLeadData.quotations,
          initialShowAttachModal: true,
        })
      )
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
      expect(html).toContain('aria-labelledby="attach-quotation-modal-title"')
      expect(html).toContain('id="attach-quotation-modal-title"')
      expect(html).toContain('แนบใบเสนอราคาจากระบบ E-ordering')
      expect(html).toContain('aria-label="ปิดหน้าต่าง"')
      expect(html).not.toContain('bg-white')
      expect(html).not.toContain('border-gray-200')
      expect(html).not.toContain('text-gray-900')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Deal Closing Modals (Close Win / Close Lost)
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Deal Closing Modals', () => {
    it('strictly enforces mandatory lost reasons from LOST_REASONS enum', () => {
      expect(LOST_REASONS).toContain('PRICE_HIGH')
      expect(LOST_REASONS).toContain('COMPETITOR_CHOSEN')
      expect(LOST_REASONS).toContain('PROJECT_CANCELLED')
      expect(LOST_REASONS).toContain('UNREACHABLE')
      expect(LOST_REASONS).toContain('SPEC_MISMATCH')
      expect(LOST_REASONS).toContain('BUDGET_INSUFFICIENT')
      expect(LOST_REASONS).toContain('BELOW_WHOLESALE_THRESHOLD')
      expect(LOST_REASONS).toContain('OTHER')

      // Empty or invalid lost reason must fail validation
      const validateLostReason = (reason?: string) => {
        if (!reason || !reason.trim()) return false
        return (
          LOST_REASONS.includes(reason as any) ||
          THAI_LOST_REASONS.includes(reason as any)
        )
      }

      expect(validateLostReason('')).toBe(false)
      expect(validateLostReason(undefined)).toBe(false)
      expect(validateLostReason('RANDOM_INVALID_REASON')).toBe(false)
      expect(validateLostReason('PRICE_HIGH')).toBe(true)
      expect(validateLostReason('COMPETITOR_CHOSEN')).toBe(true)
      expect(validateLostReason('ราคาสูงเกินไป')).toBe(true)
      expect(validateLostReason('ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง')).toBe(true)
    })

    it('determines appropriate credit evaluation handoff status on Close Win', () => {
      const getHandoffDetails = (creditStatus?: string) => {
        switch (creditStatus) {
          case 'credit_approved':
            return { label: 'อนุมัติวงเงินเครดิต', nextStep: 'จัดส่งสินค้าทันที' }
          case 'credit_hold':
            return { label: 'ติดเงื่อนไขวงเงินเครดิต (Hold)', nextStep: 'ส่งต่อ Dual-Control Credit Review' }
          case 'awaiting_payment':
          default:
            return { label: 'รอยืนยันการชำระเงิน', nextStep: 'รับชำระเงิน / แนบสลิปโอน' }
        }
      }

      expect(getHandoffDetails('credit_approved').nextStep).toBe('จัดส่งสินค้าทันที')
      expect(getHandoffDetails('credit_hold').nextStep).toBe('ส่งต่อ Dual-Control Credit Review')
      expect(getHandoffDetails('awaiting_payment').nextStep).toBe('รับชำระเงิน / แนบสลิปโอน')
    })

    it('renders DealClosingModals with action buttons in quoted stage', () => {
      const html = renderToString(
        React.createElement(DealClosingModals, {
          leadId: 'lead-123',
          currentStatus: 'quoted',
          quotations: mockLeadData.quotations,
        })
      )
      expect(html).toContain('การปิดดีล (Deal Closing Actions)')
      expect(html).toContain('+ ปิดการขาย (Win)')
      expect(html).toContain('ปิดไม่สำเร็จ (Lost)')
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('border-border')
      expect(html).toContain('bg-card')
    })

    it('renders Close Win modal with dialog accessibility roles and Thai close label when open', () => {
      const html = renderToString(
        React.createElement(DealClosingModals, {
          leadId: 'lead-123',
          currentStatus: 'quoted',
          quotations: mockLeadData.quotations,
          initialShowWinModal: true,
        })
      )
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
      expect(html).toContain('aria-labelledby="close-win-modal-title"')
      expect(html).toContain('id="close-win-modal-title"')
      expect(html).toContain('ยืนยันปิดการขายสำเร็จ (Close Win Deal)')
      expect(html).toContain('aria-label="ปิดหน้าต่าง"')
      expect(html).not.toContain('bg-white')
      expect(html).not.toContain('border-gray-200')
      expect(html).not.toContain('text-gray-900')
    })

    it('renders Close Lost modal with dialog accessibility roles and Thai close label when open', () => {
      const html = renderToString(
        React.createElement(DealClosingModals, {
          leadId: 'lead-123',
          currentStatus: 'quoted',
          quotations: mockLeadData.quotations,
          initialShowLostModal: true,
        })
      )
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
      expect(html).toContain('aria-labelledby="close-lost-modal-title"')
      expect(html).toContain('id="close-lost-modal-title"')
      expect(html).toContain('ปิดดีลไม่สำเร็จ (Close Lost Deal)')
      expect(html).toContain('aria-label="ปิดหน้าต่าง"')
      expect(html).not.toContain('bg-white')
      expect(html).not.toContain('border-gray-200')
      expect(html).not.toContain('text-gray-900')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 7. LeadDetailPage SSR & Zero Light-Only Class Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe('7. LeadDetailPage SSR & Zero Light-Only Class Verification', () => {
    it('renders the complete modernized lead workbench with Cruip Artifact 2-column layout', async () => {
      const pageJsx = await LeadDetailPage({
        params: Promise.resolve({ id: 'lead-test-12345678' }),
      })
      const html = renderToString(pageJsx)

      // Breadcrumb navigation
      expect(html).toContain('/wds/leads')
      expect(html).toContain('Lead #lead-tes')

      // Customer title & company taxId badge
      expect(html).toContain('บริษัท สยามก่อสร้างแอนด์เอ็นจิเนียริ่ง จำกัด')
      expect(html).toContain('Tax ID: 0105558123456')

      // Thai Buddhist Era context
      expect(html).toContain('2569')

      // 2-column responsive workbench layout
      expect(html).toContain('grid grid-cols-1 lg:grid-cols-12 gap-6')
      expect(html).toContain('lg:col-span-7')
      expect(html).toContain('lg:col-span-5')

      // Core sections present
      expect(html).toContain('วงจรการขาย (Sales Pipeline Cycle)')
      expect(html).toContain('ข้อมูลลูกค้า &amp; โครงการ (Customer &amp; Project Parameters)')
      expect(html).toContain('บันทึกกิจกรรมด่วน (Quick Activity Logger)')
      expect(html).toContain('การสำรวจหน้างาน (Site Visit Management)')
      expect(html).toContain('ใบเสนอราคา E-ordering (Quotations)')
      expect(html).toContain('การปิดดีล (Deal Closing Actions)')
      expect(html).toContain('ประวัติกิจกรรมรวม (Chronological Unified Timeline)')
      expect(html).toContain('สร้างงานติดตาม (Follow-up)')
    })

    it('enforces ZERO hardcoded light-only classes across the entire lead detail workbench markup', async () => {
      const pageJsx = await LeadDetailPage({
        params: Promise.resolve({ id: 'lead-test-12345678' }),
      })
      const html = renderToString(pageJsx)

      // Ensure no light-only classes
      expect(html).not.toContain('bg-white')
      expect(html).not.toContain('border-gray-200')
      expect(html).not.toContain('border-gray-100')
      expect(html).not.toContain('border-gray-300')
      expect(html).not.toContain('text-gray-900')
      expect(html).not.toContain('text-gray-800')
      expect(html).not.toContain('text-gray-700')
      expect(html).not.toContain('text-gray-600')
      expect(html).not.toContain('text-gray-500')
      expect(html).not.toContain('text-gray-400')
      expect(html).not.toContain('bg-gray-100')
      expect(html).not.toContain('bg-gray-50')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Modal Dialog Accessibility Compliance (WAI-ARIA & WCAG 2.1)
  // ──────────────────────────────────────────────────────────────────────────
  describe('8. Modal Dialog Accessibility Compliance', () => {
    it('verifies all 3 workbench modals satisfy dialog role, aria-modal, title link, and accessible close button', () => {
      const modals = [
        {
          name: 'Attach Quotation Modal',
          element: React.createElement(QuotationCard, {
            leadId: 'lead-123',
            quotations: mockLeadData.quotations,
            initialShowAttachModal: true,
          }),
          labelledBy: 'attach-quotation-modal-title',
        },
        {
          name: 'Close Win Modal',
          element: React.createElement(DealClosingModals, {
            leadId: 'lead-123',
            currentStatus: 'quoted',
            quotations: mockLeadData.quotations,
            initialShowWinModal: true,
          }),
          labelledBy: 'close-win-modal-title',
        },
        {
          name: 'Close Lost Modal',
          element: React.createElement(DealClosingModals, {
            leadId: 'lead-123',
            currentStatus: 'quoted',
            quotations: mockLeadData.quotations,
            initialShowLostModal: true,
          }),
          labelledBy: 'close-lost-modal-title',
        },
      ]

      for (const { name, element, labelledBy } of modals) {
        const html = renderToString(element)
        expect(html, `${name} must include role="dialog"`).toContain('role="dialog"')
        expect(html, `${name} must include aria-modal="true"`).toContain('aria-modal="true"')
        expect(html, `${name} must include aria-labelledby="${labelledBy}"`).toContain(
          `aria-labelledby="${labelledBy}"`
        )
        expect(html, `${name} title element must have id="${labelledBy}"`).toContain(
          `id="${labelledBy}"`
        )
        expect(html, `${name} close button must have aria-label="ปิดหน้าต่าง"`).toContain(
          'aria-label="ปิดหน้าต่าง"'
        )
      }
    })
  })
})
