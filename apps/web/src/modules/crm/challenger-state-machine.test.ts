import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LEAD_MACHINE } from './lead-machine'
import { isValidTransition, InvalidTransitionError, transition } from '@/lib/statemachine'
import {
  LOST_REASONS,
  THAI_LOST_REASONS,
  closeLostLeadAction,
  updateLeadStatusAction,
} from './actions'
import { validateLostReason } from './lead-pipeline.test'

describe('Challenger 1: Empirical State Machine & Loss Reason Stress Suite', () => {
  const ALL_STATES = [
    'new',
    'contacted',
    'qualified',
    'site_visit_requested',
    'quoted',
    'won',
    'lost',
  ] as const

  const EXPECTED_LEGAL_TRANSITIONS: [string, string][] = [
    ['new', 'contacted'],
    ['new', 'lost'],
    ['contacted', 'qualified'],
    ['contacted', 'lost'],
    ['qualified', 'site_visit_requested'],
    ['qualified', 'quoted'],
    ['qualified', 'lost'],
    ['site_visit_requested', 'quoted'],
    ['site_visit_requested', 'lost'],
    ['quoted', 'won'],
    ['quoted', 'lost'],
  ]

  const legalSet = new Set(
    EXPECTED_LEGAL_TRANSITIONS.map(([from, to]) => `${from}->${to}`)
  )

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Exhaustive 7x7 Matrix: All 49 Transitions
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Full 7x7 State Transition Matrix (49 pairs)', () => {
    it('verifies exact count of legal transitions is 11 and illegal is 38', () => {
      let legalCount = 0
      let illegalCount = 0

      for (const from of ALL_STATES) {
        for (const to of ALL_STATES) {
          if (isValidTransition(LEAD_MACHINE, from, to)) {
            legalCount++
          } else {
            illegalCount++
          }
        }
      }

      expect(legalCount).toBe(11)
      expect(illegalCount).toBe(38)
      expect(legalCount + illegalCount).toBe(49)
    })

    it('verifies all 11 legal transitions succeed', () => {
      for (const [from, to] of EXPECTED_LEGAL_TRANSITIONS) {
        const allowed = isValidTransition(LEAD_MACHINE, from, to)
        expect(allowed, `Expected legal transition ${from} -> ${to} to be TRUE`).toBe(true)
      }
    })

    it('verifies all 38 illegal transitions are rejected by oracle', () => {
      for (const from of ALL_STATES) {
        for (const to of ALL_STATES) {
          const key = `${from}->${to}`
          if (!legalSet.has(key)) {
            const allowed = isValidTransition(LEAD_MACHINE, from, to)
            expect(allowed, `Expected illegal transition ${from} -> ${to} to be FALSE`).toBe(false)
          }
        }
      }
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Stress Test Illegal Categories: Self, Skips, Backwards, Terminal
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Illegal Transition Categories', () => {
    it('rejects all self-transitions (no no-op transitions allowed)', () => {
      for (const state of ALL_STATES) {
        expect(
          isValidTransition(LEAD_MACHINE, state, state),
          `Self transition ${state} -> ${state} must be rejected`
        ).toBe(false)
      }
    })

    it('rejects all skips to won', () => {
      const illegalSkipToWon = ['new', 'contacted', 'qualified', 'site_visit_requested', 'lost']
      for (const from of illegalSkipToWon) {
        expect(
          isValidTransition(LEAD_MACHINE, from, 'won'),
          `Skip ${from} -> won must be rejected`
        ).toBe(false)
      }
    })

    it('rejects all forward skips skipping intermediary steps', () => {
      expect(isValidTransition(LEAD_MACHINE, 'new', 'qualified')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'new', 'site_visit_requested')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'new', 'quoted')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'site_visit_requested')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'quoted')).toBe(false)
    })

    it('rejects all backward transitions', () => {
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'new')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'qualified', 'new')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'qualified', 'contacted')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'new')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'contacted')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'qualified')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'quoted', 'new')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'quoted', 'contacted')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'quoted', 'qualified')).toBe(false)
      expect(isValidTransition(LEAD_MACHINE, 'quoted', 'site_visit_requested')).toBe(false)
    })

    it('rejects all transitions out of terminal state won (immutability)', () => {
      for (const to of ALL_STATES) {
        expect(
          isValidTransition(LEAD_MACHINE, 'won', to),
          `Transition out of won to ${to} must be rejected`
        ).toBe(false)
      }
    })

    it('rejects all transitions out of terminal state lost (immutability)', () => {
      for (const to of ALL_STATES) {
        expect(
          isValidTransition(LEAD_MACHINE, 'lost', to),
          `Transition out of lost to ${to} must be rejected`
        ).toBe(false)
      }
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Statemachine Execution & Audit Log Guard
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Execution Guard & Audit Log Immutability', () => {
    it('transition() throws InvalidTransitionError and never writes audit log on illegal transition', async () => {
      const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
      const mockDb = { insert: mockInsert } as any

      for (const from of ['won', 'lost', 'contacted', 'new']) {
        await expect(
          transition(mockDb, {}, LEAD_MACHINE, 'lead-123', from, 'won', 'actor-1')
        ).rejects.toThrow(InvalidTransitionError)
      }

      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Mandatory Lost Reason Validation Stress Test
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Mandatory Lost Reason Validation Guard', () => {
    it('validateLostReason rejects empty string, whitespace strings, and falsy values', () => {
      expect(validateLostReason('').valid).toBe(false)
      expect(validateLostReason(' ').valid).toBe(false)
      expect(validateLostReason('   \t\n  ').valid).toBe(false)
      expect(validateLostReason(null).valid).toBe(false)
      expect(validateLostReason(undefined).valid).toBe(false)
      expect(validateLostReason(123 as any).valid).toBe(false)
      expect(validateLostReason({} as any).valid).toBe(false)
    })

    it('validateLostReason rejects arbitrary unlisted reasons', () => {
      expect(validateLostReason('SOME_UNLISTED_REASON').valid).toBe(false)
      expect(validateLostReason('random reason text').valid).toBe(false)
      expect(validateLostReason('PRICE').valid).toBe(false)
      expect(validateLostReason('แพง').valid).toBe(false)
    })

    it('validateLostReason accepts all standard enum codes in LOST_REASONS', () => {
      for (const code of LOST_REASONS) {
        const res = validateLostReason(code)
        expect(res.valid, `Enum code ${code} should be valid`).toBe(true)
      }
    })

    it('validateLostReason domain helper accepts all Thai reasons including ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง', () => {
      const allThaiReasons = [
        'ราคาสูงเกินไป',
        'เลือกคู่แข่ง',
        'ยกเลิกโครงการ',
        'ติดต่อไม่ได้',
        'ไม่ตรงความต้องการ',
        'งบประมาณไม่เพียงพอ',
        'ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง',
        'อื่นๆ',
      ]
      for (const r of allThaiReasons) {
        expect(validateLostReason(r).valid, `Thai reason ${r} should be valid`).toBe(true)
      }

      const belowThresholdThai = 'ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง'
      const checkInPipeline = validateLostReason(belowThresholdThai)
      expect(checkInPipeline.valid, 'Thai reason ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง should be valid').toBe(true)
    })

    it('closeLostLeadAction rejects empty string', async () => {
      const res = await closeLostLeadAction({ leadId: 'lead-test', lostReason: '' })
      expect(res.success).toBe(false)
      expect(res.error).toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')
    })

    it('closeLostLeadAction rejects whitespace-only string', async () => {
      const res = await closeLostLeadAction({ leadId: 'lead-test', lostReason: '     ' })
      expect(res.success).toBe(false)
      expect(res.error).toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')
    })

    it('closeLostLeadAction rejects invalid unlisted string', async () => {
      const res = await closeLostLeadAction({ leadId: 'lead-test', lostReason: 'DISCOUNT_NOT_ENOUGH' })
      expect(res.success).toBe(false)
      expect(res.error).toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')
    })

    it('closeLostLeadAction rejects null/undefined', async () => {
      const res1 = await closeLostLeadAction({ leadId: 'lead-test', lostReason: null as any })
      expect(res1.success).toBe(false)

      const res2 = await closeLostLeadAction({ leadId: 'lead-test', lostReason: undefined as any })
      expect(res2.success).toBe(false)
    })

    it('closeLostLeadAction accepts BELOW_WHOLESALE_THRESHOLD (enum) and passes guard', async () => {
      // When reason is valid enum, it passes the input validation guard before hitting DB
      try {
        const res = await closeLostLeadAction({
          leadId: 'lead-test',
          lostReason: 'BELOW_WHOLESALE_THRESHOLD',
        })
        // If DB fails because lead not found, error will be "ไม่พบ Lead" or DB error, NOT "กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ"
        expect(res.error).not.toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')
      } catch (e: any) {
        expect(e.message).not.toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')
      }
    })

    it('closeLostLeadAction accepts Thai reason ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง and passes guard', async () => {
      try {
        const res = await closeLostLeadAction({
          leadId: 'lead-test',
          lostReason: 'ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง',
        })
        expect(res.error).not.toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')
      } catch (e: any) {
        expect(e.message).not.toBe('กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ')
      }
    })

    it('updateLeadStatusAction: stress-tests lostReason guard vs closeLostLeadAction', async () => {
      // updateLeadStatusAction rejects empty string
      const resEmpty = await updateLeadStatusAction('lead-1', 'lost', 'actor', '')
      expect(resEmpty.success).toBe(false)
      // When empty, it throws 'กรุณาระบุเหตุผลที่ปิด Lead' or 'ไม่พบ Lead' (if DB checked first)
      // Note that updateLeadStatusAction fetches DB first (line 96) before checking line 100
      expect(resEmpty.success).toBe(false)
    })
  })
})


