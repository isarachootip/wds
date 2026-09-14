import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateQuotation,
  calculateLine,
  formatQtNumber,
  formatSoNumber,
  parseQtNumber,
  satangToBaht,
  bahtToSatang,
  type LineItemInput,
} from '@/lib/qt-calc'
import {
  haversineDistance,
  isWithinRadius,
  formatDistance,
  CHECKIN_RADIUS_M,
  FLAGGED_RADIUS_M,
} from '@/lib/geo'
import {
  runCreditCheck,
  computeAvailable,
  NEW_CUSTOMER_THRESHOLD_SATANG,
  isFullyPaid,
  remainingBalanceSatang,
} from '@/modules/billing/credit'
import { checkCredit } from '@/lib/credit-engine'
import { ORDER_MACHINE } from '@/lib/order-machine'
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
  validateFieldCheckIn,
  validateLostReason,
  validateSiteVisitBudget,
  validateTaxIdModulo11,
  generateDedupeKey,
} from './lead-pipeline.test'

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGER 2 SUITE: Adversarial & Stress Testing
// ─────────────────────────────────────────────────────────────────────────────

describe('Challenger 2 — Empirical Integration Flow Stress Suite', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Close Win Handshake (Quotation -> Order -> Dynamic Credit Check)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. Close Win Handshake Stress Harness', () => {

    it('1.1: Only "quoted" status can legally transition to "won"', () => {
      const allLeadStatuses = [
        'new',
        'contacted',
        'qualified',
        'site_visit_requested',
        'quoted',
        'won',
        'lost',
      ] as const

      for (const status of allLeadStatuses) {
        const canTransition = isValidTransition(LEAD_MACHINE, status, 'won')
        if (status === 'quoted') {
          expect(canTransition).toBe(true)
        } else {
          expect(canTransition).toBe(false)
        }
      }
    })

    it('1.2: Terminal "won" state cannot transition anywhere else (strictly immutable)', () => {
      const targets = ['new', 'contacted', 'qualified', 'site_visit_requested', 'quoted', 'won', 'lost'] as const
      for (const target of targets) {
        expect(isValidTransition(LEAD_MACHINE, 'won', target)).toBe(false)
      }
    })

    it('1.3: Credit Check Engine handles exhaustive credit matrix on Close Win', () => {
      // Matrix of test cases for credit evaluation during deal close
      const cases = [
        {
          name: 'Healthy headroom -> PASS -> awaiting_payment',
          input: {
            onHold: false,
            creditLimitSatang: 10_000_000,
            outstandingSatang: 2_000_000,
            overdueAmountSatang: 0,
            orderTotalSatang: 3_000_000, // total exposure = 5M <= 10M
            hasPriorHistory: true,
          },
          expectedDecision: 'pass',
          expectedOrderStatus: 'awaiting_payment',
        },
        {
          name: 'Exact limit boundary -> PASS -> awaiting_payment',
          input: {
            onHold: false,
            creditLimitSatang: 10_000_000,
            outstandingSatang: 5_000_000,
            overdueAmountSatang: 0,
            orderTotalSatang: 5_000_000, // total exposure = 10M == 10M
            hasPriorHistory: true,
          },
          expectedDecision: 'pass',
          expectedOrderStatus: 'awaiting_payment',
        },
        {
          name: 'Exceeds limit by 1 satang -> HOLD -> credit_hold',
          input: {
            onHold: false,
            creditLimitSatang: 10_000_000,
            outstandingSatang: 5_000_000,
            overdueAmountSatang: 0,
            orderTotalSatang: 5_000_001, // 1 satang over
            hasPriorHistory: true,
          },
          expectedDecision: 'hold',
          expectedOrderStatus: 'credit_hold',
        },
        {
          name: 'Overdue balance of 1 satang -> HOLD -> credit_hold',
          input: {
            onHold: false,
            creditLimitSatang: 50_000_000,
            outstandingSatang: 10_000_000,
            overdueAmountSatang: 1, // 1 satang overdue
            orderTotalSatang: 1_000_000,
            hasPriorHistory: true,
          },
          expectedDecision: 'hold',
          expectedOrderStatus: 'credit_hold',
        },
        {
          name: 'Frozen account (onHold = true) -> REJECT -> credit_hold',
          input: {
            onHold: true,
            creditLimitSatang: 100_000_000,
            outstandingSatang: 0,
            overdueAmountSatang: 0,
            orderTotalSatang: 100_000,
            hasPriorHistory: true,
          },
          expectedDecision: 'reject',
          expectedOrderStatus: 'credit_hold',
        },
        {
          name: 'New customer without history under 50k THB threshold -> PASS',
          input: {
            onHold: false,
            creditLimitSatang: 10_000_000,
            outstandingSatang: 0,
            overdueAmountSatang: 0,
            orderTotalSatang: 5_000_000, // exactly 50k THB
            hasPriorHistory: false,
          },
          expectedDecision: 'pass',
          expectedOrderStatus: 'awaiting_payment',
        },
        {
          name: 'New customer without history exceeding 50k THB threshold -> HOLD',
          input: {
            onHold: false,
            creditLimitSatang: 10_000_000,
            outstandingSatang: 0,
            overdueAmountSatang: 0,
            orderTotalSatang: 5_000_001, // 50,000.01 THB
            hasPriorHistory: false,
          },
          expectedDecision: 'hold',
          expectedOrderStatus: 'credit_hold',
        },
        {
          name: 'Zero credit limit customer -> HOLD -> credit_hold',
          input: {
            onHold: false,
            creditLimitSatang: 0,
            outstandingSatang: 0,
            overdueAmountSatang: 0,
            orderTotalSatang: 100_000,
            hasPriorHistory: true,
          },
          expectedDecision: 'hold',
          expectedOrderStatus: 'credit_hold',
        },
      ]

      for (const tc of cases) {
        const result = runCreditCheck(tc.input)
        expect(result.decision, tc.name).toBe(tc.expectedDecision)
        const orderStatus = (result.decision === 'hold' || result.decision === 'reject')
          ? 'credit_hold'
          : 'awaiting_payment'
        expect(orderStatus, tc.name).toBe(tc.expectedOrderStatus)
      }
    })

    it('1.4: Order Machine allows supervisor override transition from credit_hold to awaiting_payment', () => {
      // Order created in credit_hold can only be unblocked to awaiting_payment or cancelled
      expect(ORDER_MACHINE['credit_hold']?.['awaiting_payment']).toBe(true)
      expect(ORDER_MACHINE['credit_hold']?.['cancelled']).toBe(true)
      // Cannot jump from credit_hold directly to paid or ready
      expect(ORDER_MACHINE['credit_hold']?.['paid']).toBeFalsy()
      expect(ORDER_MACHINE['credit_hold']?.['ready']).toBeFalsy()
    })

    it('1.5: formatSoNumber formats sequential numbers conforming to SO-YYYYMM-NNNN', () => {
      const d = new Date(2026, 8, 13)
      expect(formatSoNumber(1, d)).toBe('SO-202609-0001')
      expect(formatSoNumber(42, d)).toBe('SO-202609-0042')
      expect(formatSoNumber(9999, d)).toBe('SO-202609-9999')
      expect(formatSoNumber(10000, d)).toBe('SO-202609-10000')

      const parsed = parseQtNumber(formatSoNumber(123, d))
      expect(parsed?.prefix).toBe('SO')
      expect(parsed?.yearMonth).toBe('202609')
      expect(parsed?.seq).toBe(123)
    })

    it('1.6: Full Order lifecycle state machine valid transitions', () => {
      // ORDER_MACHINE: new / credit_hold -> awaiting_payment -> paid -> ready -> delivering -> delivered -> closed
      expect(ORDER_MACHINE['new']?.['awaiting_payment']).toBe(true)
      expect(ORDER_MACHINE['credit_hold']?.['awaiting_payment']).toBe(true)
      expect(ORDER_MACHINE['awaiting_payment']?.['paid']).toBe(true)
      expect(ORDER_MACHINE['paid']?.['ready']).toBe(true)
      expect(ORDER_MACHINE['ready']?.['delivering']).toBe(true)
      expect(ORDER_MACHINE['delivering']?.['delivered']).toBe(true)
      expect(ORDER_MACHINE['delivered']?.['closed']).toBe(true)

      // Invalid shortcuts rejected
      expect(ORDER_MACHINE['new']?.['delivered']).toBeFalsy()
      expect(ORDER_MACHINE['awaiting_payment']?.['delivered']).toBeFalsy()
      expect(ORDER_MACHINE['delivered']?.['new']).toBeFalsy()
    })

    it('1.7: Payment balance helper calculations', () => {
      expect(isFullyPaid(100_000, 100_000)).toBe(true)
      expect(isFullyPaid(100_000, 100_001)).toBe(true)
      expect(isFullyPaid(100_000, 99_999)).toBe(false)

      expect(remainingBalanceSatang(100_000, 40_000)).toBe(60_000)
      expect(remainingBalanceSatang(100_000, 100_000)).toBe(0)
      expect(remainingBalanceSatang(100_000, 120_000)).toBe(0) // never negative
    })

    it('1.8: computeAvailable credit headroom oracle (Math.max(0, limit - outstanding))', () => {
      expect(computeAvailable(10_000_000, 2_000_000)).toBe(8_000_000)
      expect(computeAvailable(10_000_000, 10_000_000)).toBe(0)
      expect(computeAvailable(10_000_000, 12_000_000)).toBe(0) // clamped to 0
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Site Visit GPS Geofence & Anti-Spoofing Stress Harness
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. Site Visit GPS & Anti-Spoofing Rejection Harness', () => {

    const BANGNA_LAT = 13.6682
    const BANGNA_LNG = 100.6341

    it('2.1: Haversine distance is symmetric, non-negative, and 0 for identical points', () => {
      expect(haversineDistance(BANGNA_LAT, BANGNA_LNG, BANGNA_LAT, BANGNA_LNG)).toBe(0)

      const otherLat = 13.7563
      const otherLng = 100.5018
      const d1 = haversineDistance(BANGNA_LAT, BANGNA_LNG, otherLat, otherLng)
      const d2 = haversineDistance(otherLat, otherLng, BANGNA_LAT, BANGNA_LNG)
      expect(d1).toBeGreaterThan(0)
      expect(Math.abs(d1 - d2)).toBeLessThan(0.001) // symmetric
    })

    it('2.2: Geofence radius boundary precision (300m limit)', () => {
      expect(CHECKIN_RADIUS_M).toBe(300)
      expect(FLAGGED_RADIUS_M).toBe(300)

      // Exact latitude delta for 300m along meridian (Earth radius R = 6371000m)
      const dLat300m = (300 * 180) / (Math.PI * 6371000)
      const latExact300m = BANGNA_LAT + dLat300m
      const dist300m = haversineDistance(BANGNA_LAT, BANGNA_LNG, latExact300m, BANGNA_LNG)
      expect(Math.round(dist300m)).toBe(300)
      expect(dist300m).toBeLessThanOrEqual(300.001)

      // Test within boundary helper
      expect(isWithinRadius(BANGNA_LAT, BANGNA_LNG, latExact300m, BANGNA_LNG, 300)).toBe(true)

      // 1 meter further (301m)
      const dLat301m = (301 * 180) / (Math.PI * 6371000)
      const lat301m = BANGNA_LAT + dLat301m
      expect(isWithinRadius(BANGNA_LAT, BANGNA_LNG, lat301m, BANGNA_LNG, 300)).toBe(false)
    })

    it('2.3: Anti-spoofing rejection: mock location is strictly blocked regardless of GPS coords', () => {
      // Even if userLat and userLng match site exactly (0m distance), mock location must fail
      const mockLocations = [
        { lat: BANGNA_LAT, lng: BANGNA_LNG, label: 'exact zero distance' },
        { lat: BANGNA_LAT + 0.0001, lng: BANGNA_LNG + 0.0001, label: '15m distance' },
        { lat: BANGNA_LAT + 0.002, lng: BANGNA_LNG, label: '220m distance' },
        { lat: 0, lng: 0, label: 'null island' },
      ]

      for (const loc of mockLocations) {
        const check = validateFieldCheckIn({
          userLat: loc.lat,
          userLng: loc.lng,
          siteLat: BANGNA_LAT,
          siteLng: BANGNA_LNG,
          isMockLocationEnabled: true, // SPOOFING DETECTED
        })

        expect(check.allowed, loc.label).toBe(false)
        expect(check.error, loc.label).toContain('ERR_GPS_SPOOFING_DETECTED')
      }
    })

    it('2.4: Out-of-bounds GPS distance rejects without override and flags with override', () => {
      // 1km away
      const distantLat = BANGNA_LAT + 0.009
      const distantLng = BANGNA_LNG

      const rejected = validateFieldCheckIn({
        userLat: distantLat,
        userLng: distantLng,
        siteLat: BANGNA_LAT,
        siteLng: BANGNA_LNG,
        isMockLocationEnabled: false,
        supervisorOverride: false,
      })
      expect(rejected.allowed).toBe(false)
      expect(rejected.error).toContain('GEO_DISTANCE_EXCEEDED')

      const overridden = validateFieldCheckIn({
        userLat: distantLat,
        userLng: distantLng,
        siteLat: BANGNA_LAT,
        siteLng: BANGNA_LNG,
        isMockLocationEnabled: false,
        supervisorOverride: true,
      })
      expect(overridden.allowed).toBe(true)
      expect(overridden.flagged).toBe(true)
    })

    it('2.5: Haversine stability with extreme world coordinates', () => {
      // North pole to South pole
      const poleDist = haversineDistance(90, 0, -90, 0)
      expect(poleDist).toBeGreaterThan(19_000_000) // ~20,015 km
      expect(poleDist).toBeLessThan(21_000_000)

      // Across the international date line (179.9 deg to -179.9 deg)
      const dateLineDist = haversineDistance(0, 179.99, 0, -179.99)
      expect(dateLineDist).toBeLessThan(50_000) // only ~2.2 km apart across 180° meridian!
    })

    it('2.6: Invalid coordinates (NaN, undefined) safely rejected', () => {
      const check = validateFieldCheckIn({
        userLat: NaN,
        userLng: BANGNA_LNG,
        siteLat: BANGNA_LAT,
        siteLng: BANGNA_LNG,
      })
      expect(check.allowed).toBe(false)
      expect(check.error).toContain('พิกัด GPS ไม่ถูกต้อง')
    })

    it('2.7: Format distance boundaries (<1000m vs >=1000m)', () => {
      expect(formatDistance(0)).toBe('0 ม.')
      expect(formatDistance(150)).toBe('150 ม.')
      expect(formatDistance(999)).toBe('999 ม.')
      expect(formatDistance(1000)).toBe('1.0 กม.')
      expect(formatDistance(1050)).toBe('1.1 กม.')
      expect(formatDistance(2500)).toBe('2.5 กม.')
    })

    it('2.8: Equator crossing and Prime Meridian crossing distance stability', () => {
      // 0.001 deg north to 0.001 deg south across Equator (lat 0, lng 0)
      const eqDist = haversineDistance(0.001, 0, -0.001, 0)
      expect(Math.round(eqDist)).toBe(222) // ~222 meters

      // 0.001 deg east to 0.001 deg west across Prime Meridian
      const pmDist = haversineDistance(0, 0.001, 0, -0.001)
      expect(Math.round(pmDist)).toBe(222)
    })

    it('2.9: Site visit budget qualification boundary conditions', () => {
      expect(validateSiteVisitBudget(null).eligible).toBe(false)
      expect(validateSiteVisitBudget(undefined).eligible).toBe(false)
      expect(validateSiteVisitBudget(0).eligible).toBe(false)
      expect(validateSiteVisitBudget(-500).eligible).toBe(false)
      expect(validateSiteVisitBudget(4_999_999).eligible).toBe(false)
      expect(validateSiteVisitBudget(5_000_000).eligible).toBe(true)
      expect(validateSiteVisitBudget(10_000_000).eligible).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Quotation Satang Calculations & 7% VAT Rounding Stress Harness
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. Quotation Satang & 7% VAT Rounding Oracle', () => {

    it('3.1: 7% VAT exclusive rounding boundary oracle (sweeping 1 to 100 satang)', () => {
      // For each integer satang 1..100, verify that:
      // vatAmountSatang === Math.round(satang * 0.07)
      // totalSatang === satang + vatAmountSatang
      // subtotalSatang === satang
      for (let satang = 1; satang <= 100; satang++) {
        const item: LineItemInput = { qty: 1, unitPriceSatang: satang, discountSatang: 0 }
        const res = calculateQuotation([item], 0, 7, 'exclusive')

        const expectedVat = Math.round((satang * 7) / 100)
        expect(res.vatAmountSatang).toBe(expectedVat)
        expect(res.subtotalSatang).toBe(satang)
        expect(res.totalSatang).toBe(satang + expectedVat)
      }
    })

    it('3.2: 7% VAT inclusive extraction oracle (sweeping 100 to 200 satang)', () => {
      // For VAT inclusive, vat = Math.round((amount * 7) / 107)
      // subtotalSatang === amount
      // totalSatang === amount (VAT is already included)
      for (let satang = 100; satang <= 200; satang++) {
        const item: LineItemInput = { qty: 1, unitPriceSatang: satang, discountSatang: 0 }
        const res = calculateQuotation([item], 0, 7, 'inclusive')

        const expectedVat = Math.round((satang * 7) / 107)
        expect(res.vatAmountSatang).toBe(expectedVat)
        expect(res.totalSatang).toBe(satang)
      }
    })

    it('3.3: Specific half-satang tie-breaker rounding verification', () => {
      // 50 satang * 0.07 = 3.50 satang -> Math.round(3.5) = 4 satang
      const res50 = calculateQuotation([{ qty: 1, unitPriceSatang: 50, discountSatang: 0 }], 0, 7, 'exclusive')
      expect(res50.vatAmountSatang).toBe(4)
      expect(res50.totalSatang).toBe(54)

      // 150 satang * 0.07 = 10.50 satang -> Math.round(10.5) = 11 satang
      const res150 = calculateQuotation([{ qty: 1, unitPriceSatang: 150, discountSatang: 0 }], 0, 7, 'exclusive')
      expect(res150.vatAmountSatang).toBe(11)
      expect(res150.totalSatang).toBe(161)

      // 250 satang * 0.07 = 17.50 satang -> Math.round(17.5) = 18 satang
      const res250 = calculateQuotation([{ qty: 1, unitPriceSatang: 250, discountSatang: 0 }], 0, 7, 'exclusive')
      expect(res250.vatAmountSatang).toBe(18)
      expect(res250.totalSatang).toBe(268)
    })

    it('3.4: Multi-item line discount and bill discount capping (no negative totals)', () => {
      const items: LineItemInput[] = [
        { qty: 10, unitPriceSatang: 50_000, discountSatang: 600_000 }, // gross = 500,000, discount > gross (capped at 500,000)
        { qty: 5, unitPriceSatang: 200_000, discountSatang: 100_000 },  // gross = 1,000,000, discount = 100,000 -> amount = 900,000
      ]

      // Subtotal should be 0 + 900,000 = 900,000
      const res = calculateQuotation(items, 1_500_000, 7, 'exclusive') // excessive bill discount 1.5M > 900k

      expect(res.subtotalSatang).toBe(900_000)
      expect(res.billDiscountSatang).toBe(900_000) // capped at subtotal
      expect(res.afterDiscountSatang).toBe(0)
      expect(res.vatAmountSatang).toBe(0)
      expect(res.totalSatang).toBe(0)
    })

    it('3.5: Enterprise high-value quotation (100,000,000 THB = 10,000,000,000 satang)', () => {
      // 100M THB net + 7% VAT = 107M THB
      const items: LineItemInput[] = [
        { qty: 100_000, unitPriceSatang: 1000_00, discountSatang: 0 }, // 100,000 units @ 1,000 THB = 100M THB
      ]
      const res = calculateQuotation(items, 0, 7, 'exclusive')

      expect(res.subtotalSatang).toBe(10_000_000_000)
      expect(res.vatAmountSatang).toBe(700_000_000) // 7M THB
      expect(res.totalSatang).toBe(10_700_000_000) // 107M THB
      expect(satangToBaht(res.totalSatang)).toBe('107,000,000.00')
    })

    it('3.6: VAT rate = 0 produces zero tax and total equals subtotal', () => {
      const items: LineItemInput[] = [
        { qty: 10, unitPriceSatang: 100_00, discountSatang: 0 },
      ]
      const res = calculateQuotation(items, 0, 0, 'exclusive')
      expect(res.vatAmountSatang).toBe(0)
      expect(res.totalSatang).toBe(1000_00)
    })

    it('3.7: satangToBaht and bahtToSatang conversion consistency', () => {
      expect(bahtToSatang('123.45')).toBe(12345)
      expect(bahtToSatang('0.01')).toBe(1)
      expect(bahtToSatang('0')).toBe(0)
      expect(bahtToSatang('invalid')).toBe(0)

      expect(satangToBaht(12345)).toBe('123.45')
      expect(satangToBaht(1)).toBe('0.01')
      expect(satangToBaht(0)).toBe('0.00')
    })

    it('3.8: Exhaustive boundary satang table for 7% VAT', () => {
      // Test rounding transitions:
      // 7 satang * 0.07 = 0.49 -> 0
      // 8 satang * 0.07 = 0.56 -> 1
      // 21 satang * 0.07 = 1.47 -> 1
      // 22 satang * 0.07 = 1.54 -> 2
      // 35 satang * 0.07 = 2.45 -> 2
      // 36 satang * 0.07 = 2.52 -> 3
      const boundaryPairs = [
        { satang: 7, expectedVat: 0 },
        { satang: 8, expectedVat: 1 },
        { satang: 21, expectedVat: 1 },
        { satang: 22, expectedVat: 2 },
        { satang: 35, expectedVat: 2 },
        { satang: 36, expectedVat: 3 },
        { satang: 49, expectedVat: 3 },
        { satang: 50, expectedVat: 4 },
        { satang: 64, expectedVat: 4 },
        { satang: 65, expectedVat: 5 },
      ]

      for (const bp of boundaryPairs) {
        const res = calculateQuotation([{ qty: 1, unitPriceSatang: bp.satang, discountSatang: 0 }], 0, 7, 'exclusive')
        expect(res.vatAmountSatang, `Satang ${bp.satang}`).toBe(bp.expectedVat)
        expect(res.totalSatang, `Total for ${bp.satang}`).toBe(bp.satang + bp.expectedVat)
      }
    })

    it('3.9: Strictly integer satang invariant (no floats in results)', () => {
      const randomAmounts = [13, 97, 103, 1007, 33333, 7777777]
      for (const amt of randomAmounts) {
        const excl = calculateQuotation([{ qty: 3, unitPriceSatang: amt, discountSatang: 5 }], 10, 7, 'exclusive')
        expect(Number.isInteger(excl.subtotalSatang)).toBe(true)
        expect(Number.isInteger(excl.vatAmountSatang)).toBe(true)
        expect(Number.isInteger(excl.totalSatang)).toBe(true)

        const incl = calculateQuotation([{ qty: 3, unitPriceSatang: amt, discountSatang: 5 }], 10, 7, 'inclusive')
        expect(Number.isInteger(incl.subtotalSatang)).toBe(true)
        expect(Number.isInteger(incl.vatAmountSatang)).toBe(true)
        expect(Number.isInteger(incl.totalSatang)).toBe(true)
      }
    })

    it('3.10: Zero quantity or zero unit price produces zero subtotal and VAT', () => {
      const res1 = calculateQuotation([{ qty: 0, unitPriceSatang: 1000, discountSatang: 0 }], 0, 7, 'exclusive')
      expect(res1.subtotalSatang).toBe(0)
      expect(res1.vatAmountSatang).toBe(0)
      expect(res1.totalSatang).toBe(0)

      const res2 = calculateQuotation([{ qty: 10, unitPriceSatang: 0, discountSatang: 0 }], 0, 7, 'exclusive')
      expect(res2.subtotalSatang).toBe(0)
      expect(res2.vatAmountSatang).toBe(0)
      expect(res2.totalSatang).toBe(0)
    })
  })
})

