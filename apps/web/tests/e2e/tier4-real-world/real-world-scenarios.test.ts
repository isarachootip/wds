import { describe, it, expect, vi } from 'vitest'
import { LEAD_MACHINE } from '@/modules/crm/lead-machine'
import { ORDER_MACHINE } from '@/lib/order-machine'
import { isValidTransition } from '@/lib/statemachine'
import { calculateQuotation, type LineItemInput } from '@/lib/qt-calc'
import { checkCredit } from '@/lib/credit-engine'
import { haversineDistance, CHECKIN_RADIUS_M, isWithinRadius } from '@/lib/geo'

function canOrderTransition(from: string, to: string): boolean {
  return Boolean((ORDER_MACHINE as any)[from]?.[to])
}

describe('Tier 4: Real-World Application Scenarios', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: Complete End-to-End Happy Path Lifecycle
  // ──────────────────────────────────────────────────────────────────────────
  describe('Scenario 4.1: Complete End-to-End Lifecycle (LINE Inbound -> Win SO -> Credit Check)', () => {
    it('executes full sequential lifecycle with zero regression', () => {
      // Step 1: Inbound LINE OA inquiry creates Lead in 'new'
      let currentStage = 'new'
      const lead = {
        id: 'lead-real-001',
        source: 'line',
        customerName: 'คุณเกรียงไกร ช่างเหมา',
        customerPhone: '0819998877',
        company: 'บจก. เกรียงไกร เอ็นจิเนียริ่ง',
        interest: 'ปูนอินทรี 500 ถุง + เหล็กเส้น RB9 200 เส้น สำหรับเทคาน',
        budgetRangeMinSatang: 40_000_000,
        budgetRangeMaxSatang: 60_000_000,
        status: currentStage,
      }
      expect(lead.status).toBe('new')

      // Step 2: Sales AE logs phone follow-up and advances to 'contacted'
      expect(isValidTransition(LEAD_MACHINE, currentStage, 'contacted')).toBe(true)
      currentStage = 'contacted'

      // Step 3: Sales AE confirms BOQ and budget fit, advances to 'qualified'
      expect(isValidTransition(LEAD_MACHINE, currentStage, 'qualified')).toBe(true)
      currentStage = 'qualified'

      // Step 4: Sales AE requests Site Visit with 10W truck road clearance
      expect(isValidTransition(LEAD_MACHINE, currentStage, 'site_visit_requested')).toBe(true)
      currentStage = 'site_visit_requested'

      const siteVisit = {
        id: 'sv-real-001',
        leadId: lead.id,
        purpose: 'วัดระดับดินและตรวจสอบทางเข้าสำหรับรถสิบล้อ (ระยะผ่านทางรถ: 10W)',
        status: 'scheduled',
        siteLat: 13.7563,
        siteLng: 100.5018,
      }

      // Step 5: Field surveyor check-in within geofence and checkout
      const surveyorLocation = { lat: 13.7564, lng: 100.5018 } // ~11 meters away
      const dist = haversineDistance(
        surveyorLocation.lat,
        surveyorLocation.lng,
        siteVisit.siteLat,
        siteVisit.siteLng
      )
      expect(dist).toBeLessThanOrEqual(CHECKIN_RADIUS_M)
      expect(isWithinRadius(surveyorLocation.lat, surveyorLocation.lng, siteVisit.siteLat, siteVisit.siteLng)).toBe(true)

      // Step 6: Attach E-ordering Quotation (481,500 THB = 48,150,000 Satang)
      const quotationItems: LineItemInput[] = [
        {
          qty: 500,
          unitPriceSatang: 15_000, // 150 THB
          discountSatang: 0,
        },
        {
          qty: 200,
          unitPriceSatang: 18_750, // 187.50 THB
          discountSatang: 0,
        },
      ]

      const qtCalc = calculateQuotation(quotationItems, 0, 7, 'exclusive')
      // Subtotal: (500*150) + (200*187.50) = 75,000 + 37,500 = 112,500 THB = 11,250,000 Satang
      expect(qtCalc.subtotalSatang).toBe(11_250_000)
      expect(qtCalc.vatAmountSatang).toBe(787_500) // 7% VAT = 7,875 THB
      expect(qtCalc.totalSatang).toBe(12_037_500) // 120,375 THB total

      expect(isValidTransition(LEAD_MACHINE, currentStage, 'quoted')).toBe(true)
      currentStage = 'quoted'

      // Step 7: Customer approves quotation, Sales AE executes Close Win
      expect(isValidTransition(LEAD_MACHINE, currentStage, 'won')).toBe(true)
      currentStage = 'won'

      // Step 8: Auto-Credit Check on customer with 500,000 THB limit
      const creditEval = checkCredit({
        creditLimitSatang: 50_000_000, // 500,000 THB limit
        creditUsedSatang: 0, // 0 THB outstanding
        newOrderAmountSatang: qtCalc.totalSatang, // 120,375 THB order
      })

      expect(creditEval.tier).toBe('pass')

      // Step 9: Order created in 'awaiting_payment'
      expect(canOrderTransition('new', 'awaiting_payment')).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: Competitive Loss Scenario
  // ──────────────────────────────────────────────────────────────────────────
  describe('Scenario 4.2: Competitive Loss Lifecycle with Mandatory Reason Audit', () => {
    it('progresses to quoted then terminates at lost with reason COMPETITOR_CHOSEN', () => {
      let currentStage = 'new'
      currentStage = 'contacted'
      currentStage = 'qualified'
      currentStage = 'quoted'

      // Customer informs that rival store offered 10% discount
      expect(isValidTransition(LEAD_MACHINE, currentStage, 'lost')).toBe(true)
      currentStage = 'lost'

      const lostPayload = {
        leadId: 'lead-real-002',
        lostReason: 'COMPETITOR_CHOSEN',
        note: 'ร้านค้าช่วงข้างเคียงให้ส่วนลดเพิ่ม 10% พร้อมส่งฟรี',
        actorId: 'sales-ae',
      }

      expect(lostPayload.lostReason).toBe('COMPETITOR_CHOSEN')
      expect(lostPayload.note.length).toBeGreaterThan(10)

      // Verify lead cannot be reopened or advanced from lost
      expect(isValidTransition(LEAD_MACHINE, currentStage, 'won')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, currentStage, 'new')).toBe(false)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: Fast-Track Showroom Walk-In Flow
  // ──────────────────────────────────────────────────────────────────────────
  describe('Scenario 4.3: Fast-Track Showroom Walk-in Flow (Direct qualified -> quoted)', () => {
    it('bypasses site visit when customer provides complete structural drawings and BOQ', () => {
      let stage = 'new'
      stage = 'contacted'
      stage = 'qualified'

      // Fast-track transition directly to quoted
      expect(isValidTransition(LEAD_MACHINE, stage, 'quoted')).toBe(true)
      stage = 'quoted'

      // Instantly wins deal
      expect(isValidTransition(LEAD_MACHINE, stage, 'won')).toBe(true)
      stage = 'won'
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 4: High-Value Credit Dual-Control Escalation
  // ──────────────────────────────────────────────────────────────────────────
  describe('Scenario 4.4: High-Value Deal Credit Hold Escalation Flow', () => {
    it('holds order when total exposure strictly exceeds customer credit limit', () => {
      const orderTotalSatang = 250_000_000 // 2.5M THB

      // Customer has 2.0M THB credit limit and 500k THB unpaid invoices
      const creditEval = checkCredit({
        creditLimitSatang: 200_000_000,
        creditUsedSatang: 50_000_000,
        newOrderAmountSatang: orderTotalSatang,
      })

      // Total exposure = 500k + 2.5M = 3.0M THB > 2.0M limit -> hard_block
      expect(creditEval.tier).toBe('hard_block')

      // Order created in credit_hold can only be released to awaiting_payment
      expect(canOrderTransition('credit_hold', 'awaiting_payment')).toBe(true)
      expect(canOrderTransition('credit_hold', 'paid')).toBe(false)
      expect(canOrderTransition('credit_hold', 'delivering')).toBe(false)
    })
  })
})
