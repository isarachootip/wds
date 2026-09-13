import { describe, it, expect, vi } from 'vitest'
import { isValidTransition, InvalidTransitionError } from '@/lib/statemachine'
import { LEAD_MACHINE } from './lead-machine'

describe('Lead State Machine', () => {
  // Valid transitions
  it('new → contacted is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'new', 'contacted')).toBe(true)
  })
  it('new → lost is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'new', 'lost')).toBe(true)
  })
  it('contacted → qualified is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'contacted', 'qualified')).toBe(true)
  })
  it('contacted → lost is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'contacted', 'lost')).toBe(true)
  })
  it('qualified → site_visit_requested is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'qualified', 'site_visit_requested')).toBe(true)
  })
  it('qualified → quoted is valid (skip site visit)', () => {
    expect(isValidTransition(LEAD_MACHINE, 'qualified', 'quoted')).toBe(true)
  })
  it('qualified → lost is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'qualified', 'lost')).toBe(true)
  })
  it('site_visit_requested → quoted is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'quoted')).toBe(true)
  })
  it('site_visit_requested → lost is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'lost')).toBe(true)
  })
  it('quoted → won is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'quoted', 'won')).toBe(true)
  })
  it('quoted → lost is valid', () => {
    expect(isValidTransition(LEAD_MACHINE, 'quoted', 'lost')).toBe(true)
  })

  // Invalid transitions — should return false
  it('new → qualified is INVALID', () => {
    expect(isValidTransition(LEAD_MACHINE, 'new', 'qualified')).toBe(false)
  })
  it('new → site_visit_requested is INVALID', () => {
    expect(isValidTransition(LEAD_MACHINE, 'new', 'site_visit_requested')).toBe(false)
  })
  it('new → won is INVALID', () => {
    expect(isValidTransition(LEAD_MACHINE, 'new', 'won')).toBe(false)
  })
  it('contacted → won is INVALID', () => {
    expect(isValidTransition(LEAD_MACHINE, 'contacted', 'won')).toBe(false)
  })
  it('contacted → new is INVALID (no going back)', () => {
    expect(isValidTransition(LEAD_MACHINE, 'contacted', 'new')).toBe(false)
  })
  it('won → lost is INVALID (terminal state)', () => {
    expect(isValidTransition(LEAD_MACHINE, 'won', 'lost')).toBe(false)
  })
  it('lost → new is INVALID (terminal state)', () => {
    expect(isValidTransition(LEAD_MACHINE, 'lost', 'new')).toBe(false)
  })
  it('quoted → new is INVALID', () => {
    expect(isValidTransition(LEAD_MACHINE, 'quoted', 'new')).toBe(false)
  })
  it('site_visit_requested → contacted is INVALID', () => {
    expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'contacted')).toBe(false)
  })

  // InvalidTransitionError thrown in transition()
  it('throws InvalidTransitionError for invalid transition', async () => {
    const mockDb = {
      insert: () => ({ values: () => Promise.resolve([]) }),
    } as any

    const { transition } = await import('@/lib/statemachine')
    await expect(
      transition(mockDb, {}, LEAD_MACHINE, 'lead-uuid', 'new', 'won', 'actor-uuid')
    ).rejects.toThrow(InvalidTransitionError)
  })

  it('does NOT write audit_log when transition is invalid', async () => {
    const insertMock = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
    const mockDb = { insert: insertMock } as any

    const { transition } = await import('@/lib/statemachine')
    try {
      await transition(mockDb, {}, LEAD_MACHINE, 'lead-uuid', 'new', 'quoted', 'actor-uuid')
    } catch {}
    expect(insertMock).not.toHaveBeenCalled()
  })
})
