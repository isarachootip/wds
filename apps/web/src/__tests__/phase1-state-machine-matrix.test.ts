import { describe, it, expect, vi } from 'vitest'
import { isValidTransition, InvalidTransitionError, transition } from '@/lib/statemachine'
import { LEAD_MACHINE } from '@/modules/crm/lead-machine'

const ALL_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'site_visit_requested',
  'quoted',
  'won',
  'lost',
] as const

const VALID_PAIRS = new Set([
  'new -> contacted',
  'new -> lost',
  'contacted -> qualified',
  'contacted -> lost',
  'qualified -> site_visit_requested',
  'qualified -> quoted',
  'qualified -> lost',
  'site_visit_requested -> quoted',
  'site_visit_requested -> lost',
  'quoted -> won',
  'quoted -> lost',
])

describe('Phase 1 Acceptance Criteria 3 & 4: State Machine Matrix & Kanban Progression', () => {
  it('1. Exhaustive 7x7 matrix test for all lead state transitions', () => {
    let testedCount = 0
    let validCount = 0
    let invalidCount = 0

    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        if (from === to) continue
        testedCount++
        const key = `${from} -> ${to}`
        const isValid = isValidTransition(LEAD_MACHINE, from, to)

        if (VALID_PAIRS.has(key)) {
          expect(isValid, `Expected transition ${key} to be VALID`).toBe(true)
          validCount++
        } else {
          expect(isValid, `Expected transition ${key} to be INVALID`).toBe(false)
          invalidCount++
        }
      }
    }

    expect(validCount).toBe(11)
    expect(invalidCount).toBe(31) // 7*6 = 42 total pairs - 11 valid = 31 invalid
    expect(testedCount).toBe(42)
  })

  it('2. Terminal states (won, lost) cannot transition to any other status', () => {
    for (const target of ALL_STATUSES) {
      if (target !== 'won') {
        expect(isValidTransition(LEAD_MACHINE, 'won', target)).toBe(false)
      }
      if (target !== 'lost') {
        expect(isValidTransition(LEAD_MACHINE, 'lost', target)).toBe(false)
      }
    }
  })

  it('3. Illegal jump (new -> won, new -> quoted) throws InvalidTransitionError', async () => {
    const mockDb = {
      insert: vi.fn(),
    } as any

    await expect(
      transition(mockDb, {}, LEAD_MACHINE, 'lead-test', 'new', 'won', 'user-ae')
    ).rejects.toThrow(InvalidTransitionError)

    await expect(
      transition(mockDb, {}, LEAD_MACHINE, 'lead-test', 'new', 'quoted', 'user-ae')
    ).rejects.toThrow(InvalidTransitionError)
  })

  it('4. Kanban drag updates record audit_log on valid transition and rolls back on invalid', async () => {
    const insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: 'audit-001' }]),
    })
    const mockDb = { insert: insertMock } as any

    // Valid transition (quoted -> won)
    await transition(mockDb, {}, LEAD_MACHINE, 'lead-test', 'quoted', 'won', 'user-ae')
    expect(insertMock).toHaveBeenCalledTimes(1)

    // Invalid transition (new -> won) should not call insert
    insertMock.mockClear()
    try {
      await transition(mockDb, {}, LEAD_MACHINE, 'lead-test', 'new', 'won', 'user-ae')
    } catch {}
    expect(insertMock).not.toHaveBeenCalled()
  })
})
