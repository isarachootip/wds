import { describe, it, expect } from 'vitest'
import { isValidTransition, type StateMachineConfig } from '@/lib/statemachine'
import { LEAD_MACHINE, FOLLOW_UP_MACHINE, SITE_VISIT_MACHINE } from '@/modules/crm/lead-machine'
import { APPOINTMENT_MACHINE, JOB_MACHINE } from '@/modules/visit/appointment-machine'
import { QUOTATION_MACHINE, ORDER_MACHINE } from '@/modules/ordering/quotation-machine'
import { DELIVERY_MACHINE } from '@/modules/billing/delivery-machine'
import {
  runCreditCheck,
  computeAvailable,
  isFullyPaid,
  remainingBalanceSatang,
} from '@/modules/billing/credit'
import {
  calculateLine,
  calculateQuotation,
} from '@/lib/qt-calc'

describe('Phase 6 Coverage: State Machines, Credit Engine, and Tax Calculations (≥90%)', () => {
  // ─── 1. Generic State Machine Runner ──────────────────────────────────────
  describe('Generic State Machine Engine (lib/statemachine.ts)', () => {
    const testConfig: StateMachineConfig = {
      entity: 'widget',
      transitions: [
        { from: 'idle', to: 'running' },
        { from: 'running', to: 'stopped' },
        { from: 'stopped', to: 'idle' },
      ],
    }

    it('validates transitions accurately', () => {
      expect(isValidTransition(testConfig, 'idle', 'running')).toBe(true)
      expect(isValidTransition(testConfig, 'running', 'stopped')).toBe(true)
      expect(isValidTransition(testConfig, 'stopped', 'idle')).toBe(true)
      expect(isValidTransition(testConfig, 'idle', 'stopped')).toBe(false)
    })
  })

  // ─── 2. Lead State Machine ────────────────────────────────────────────────
  describe('Lead State Machine (lead-machine.ts)', () => {
    it('covers all valid transitions from new to won or lost', () => {
      expect(isValidTransition(LEAD_MACHINE, 'new', 'contacted')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'qualified')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'qualified', 'site_visit_requested')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'quoted')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'quoted', 'won')).toBe(true)

      // Alternate branch: lost
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'lost')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'qualified', 'lost')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, 'quoted', 'lost')).toBe(true)
    })

    it('rejects invalid transitions out of terminal states', () => {
      expect(isValidTransition(LEAD_MACHINE, 'won', 'contacted')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'lost', 'quoted')).toBe(false)
    })

    it('covers follow-up and site visit state transitions', () => {
      expect(isValidTransition(FOLLOW_UP_MACHINE, 'open', 'done')).toBe(true)
      expect(isValidTransition(FOLLOW_UP_MACHINE, 'open', 'skipped')).toBe(true)

      expect(isValidTransition(SITE_VISIT_MACHINE, 'requested', 'scheduled')).toBe(true)
      expect(isValidTransition(SITE_VISIT_MACHINE, 'scheduled', 'done')).toBe(true)
    })
  })

  // ─── 3. Appointment & Job State Machines ─────────────────────────────────
  describe('Appointment & Job State Machines (appointment-machine.ts)', () => {
    it('covers full appointment lifecycle: requested -> scheduled -> in_progress -> completed', () => {
      expect(isValidTransition(APPOINTMENT_MACHINE, 'requested', 'scheduled')).toBe(true)
      expect(isValidTransition(APPOINTMENT_MACHINE, 'scheduled', 'in_progress')).toBe(true)
      expect(isValidTransition(APPOINTMENT_MACHINE, 'in_progress', 'completed')).toBe(true)

      // Cancellation and rejection
      expect(isValidTransition(APPOINTMENT_MACHINE, 'requested', 'rejected')).toBe(true)
      expect(isValidTransition(APPOINTMENT_MACHINE, 'scheduled', 'cancelled')).toBe(true)
      expect(isValidTransition(APPOINTMENT_MACHINE, 'scheduled', 'no_show')).toBe(true)
    })

    it('covers full job lifecycle: pending -> checked_in -> in_progress -> checked_out -> closed', () => {
      expect(isValidTransition(JOB_MACHINE, 'pending', 'checked_in')).toBe(true)
      expect(isValidTransition(JOB_MACHINE, 'checked_in', 'in_progress')).toBe(true)
      expect(isValidTransition(JOB_MACHINE, 'in_progress', 'checked_out')).toBe(true)
      expect(isValidTransition(JOB_MACHINE, 'checked_out', 'closed')).toBe(true)
      expect(isValidTransition(JOB_MACHINE, 'pending', 'closed')).toBe(false)
    })
  })

  // ─── 4. Quotation & Order State Machines ─────────────────────────────────
  describe('Quotation & Order State Machines (quotation-machine.ts)', () => {
    it('covers full quotation progression: draft -> sent -> viewed -> accepted -> converted', () => {
      expect(isValidTransition(QUOTATION_MACHINE, 'draft', 'sent')).toBe(true)
      expect(isValidTransition(QUOTATION_MACHINE, 'sent', 'viewed')).toBe(true)
      expect(isValidTransition(QUOTATION_MACHINE, 'viewed', 'accepted')).toBe(true)
      expect(isValidTransition(QUOTATION_MACHINE, 'accepted', 'converted')).toBe(true)

      // Alternate branch: rejection and expiration
      expect(isValidTransition(QUOTATION_MACHINE, 'sent', 'expired')).toBe(true)
      expect(isValidTransition(QUOTATION_MACHINE, 'viewed', 'rejected')).toBe(true)
    })

    it('covers full order progression: new -> awaiting_payment -> ready -> delivering -> delivered -> closed', () => {
      expect(isValidTransition(ORDER_MACHINE, 'new', 'awaiting_payment')).toBe(true)
      expect(isValidTransition(ORDER_MACHINE, 'awaiting_payment', 'ready')).toBe(true)
      expect(isValidTransition(ORDER_MACHINE, 'ready', 'delivering')).toBe(true)
      expect(isValidTransition(ORDER_MACHINE, 'delivering', 'delivered')).toBe(true)
      expect(isValidTransition(ORDER_MACHINE, 'delivered', 'closed')).toBe(true)

      // Credit hold path
      expect(isValidTransition(ORDER_MACHINE, 'new', 'credit_hold')).toBe(true)
      expect(isValidTransition(ORDER_MACHINE, 'credit_hold', 'awaiting_payment')).toBe(true)
    })
  })

  // ─── 5. Delivery State Machine ───────────────────────────────────────────
  describe('Delivery State Machine (delivery-machine.ts)', () => {
    it('covers full delivery progression: pending -> scheduled -> picking -> shipped -> delivered', () => {
      expect(isValidTransition(DELIVERY_MACHINE, 'pending', 'scheduled')).toBe(true)
      expect(isValidTransition(DELIVERY_MACHINE, 'scheduled', 'picking')).toBe(true)
      expect(isValidTransition(DELIVERY_MACHINE, 'picking', 'shipped')).toBe(true)
      expect(isValidTransition(DELIVERY_MACHINE, 'shipped', 'delivered')).toBe(true)

      // Failure with retry
      expect(isValidTransition(DELIVERY_MACHINE, 'shipped', 'failed')).toBe(true)
      expect(isValidTransition(DELIVERY_MACHINE, 'failed', 'scheduled')).toBe(true)
      expect(isValidTransition(DELIVERY_MACHINE, 'delivered', 'returned')).toBe(true)
    })
  })

  // ─── 6. Credit Engine ────────────────────────────────────────────────────
  describe('Credit Engine & Calculation Functions (credit.ts)', () => {
    it('calculates available balance correctly in Satang', () => {
      const available = computeAvailable(200_000_00, 120_000_00)
      expect(available).toBe(80_000_00)

      // When outstanding exceeds limit, available is floored at 0
      const negativeAvailable = computeAvailable(100_000_00, 150_000_00)
      expect(negativeAvailable).toBe(0)
    })

    it('evaluates credit on_hold reject branch', () => {
      const result = runCreditCheck({
        onHold: true,
        creditLimitSatang: 1_000_000_00,
        outstandingSatang: 0,
        orderTotalSatang: 50_000_00,
        overdueAmountSatang: 0,
        hasPriorHistory: true,
      })
      expect(result.decision).toBe('reject')
      expect(result.reason).toContain('ถูก hold')
    })

    it('evaluates credit overdue hold branch', () => {
      const result = runCreditCheck({
        onHold: false,
        creditLimitSatang: 500_000_00,
        outstandingSatang: 10_000_00,
        orderTotalSatang: 20_000_00,
        overdueAmountSatang: 5_000_00,
        hasPriorHistory: true,
      })
      expect(result.decision).toBe('hold')
      expect(result.reason).toContain('มียอดค้างชำระเกินกำหนด')
    })

    it('evaluates credit limit exceeded hold branch', () => {
      const result = runCreditCheck({
        onHold: false,
        creditLimitSatang: 100_000_00,
        outstandingSatang: 80_000_00,
        orderTotalSatang: 30_000_00, // exceeds available 20k
        overdueAmountSatang: 0,
        hasPriorHistory: true,
      })
      expect(result.decision).toBe('hold')
      expect(result.reason).toContain('เกินวงเงินคงเหลือ')
    })

    it('evaluates new customer first order threshold hold branch (>50k)', () => {
      const result = runCreditCheck({
        onHold: false,
        creditLimitSatang: 1_000_000_00,
        outstandingSatang: 0,
        orderTotalSatang: 55_000_00, // > 50,000 THB
        overdueAmountSatang: 0,
        hasPriorHistory: false,
      })
      expect(result.decision).toBe('hold')
      expect(result.reason).toContain('ลูกค้าใหม่')
    })

    it('evaluates passing credit check', () => {
      const result = runCreditCheck({
        onHold: false,
        creditLimitSatang: 500_000_00,
        outstandingSatang: 50_000_00,
        orderTotalSatang: 40_000_00,
        overdueAmountSatang: 0,
        hasPriorHistory: true,
      })
      expect(result.decision).toBe('pass')
    })

    it('verifies payment completeness with isFullyPaid and remaining balance', () => {
      expect(isFullyPaid(100_000_00, 100_000_00)).toBe(true)
      expect(isFullyPaid(100_000_00, 105_000_00)).toBe(true)
      expect(isFullyPaid(100_000_00, 99_999_99)).toBe(false)
      expect(remainingBalanceSatang(100_000_00, 60_000_00)).toBe(40_000_00)
    })
  })

  // ─── 7. Quotation & VAT Calculations ──────────────────────────────────────
  describe('Quotation & VAT Math Engine (qt-calc.ts)', () => {
    it('calculates line item amounts with quantity and discount', () => {
      const line = calculateLine({ qty: 5, unitPriceSatang: 100_00, discountSatang: 10_00 })
      expect(line.grossSatang).toBe(500_00)
      expect(line.amountSatang).toBe(490_00)
    })

    it('calculates quotation totals in VAT exclusive mode', () => {
      const items = [
        { qty: 2, unitPriceSatang: 1_000_00, discountSatang: 200_00 },
        { qty: 1, unitPriceSatang: 500_00, discountSatang: 0 },
      ]
      const calc = calculateQuotation(items, 100_00, 7, 'exclusive')

      expect(calc.subtotalSatang).toBe(2300_00)
      expect(calc.billDiscountSatang).toBe(100_00)
      expect(calc.vatAmountSatang).toBe(154_00)
      expect(calc.totalSatang).toBe(2354_00)
    })

    it('calculates quotation totals in VAT inclusive mode', () => {
      const items = [{ qty: 1, unitPriceSatang: 107_00, discountSatang: 0 }]
      const calc = calculateQuotation(items, 0, 7, 'inclusive')

      expect(calc.totalSatang).toBe(107_00)
      expect(calc.vatAmountSatang).toBe(7_00)
    })
  })
})
