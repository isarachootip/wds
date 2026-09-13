import { describe, it, expect } from 'vitest'
import { isValidTransition, InvalidTransitionError } from '@/lib/statemachine'
import { APPOINTMENT_MACHINE, JOB_MACHINE } from './appointment-machine'

describe('Appointment Machine', () => {
  // Valid
  it('requested → scheduled', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'requested', 'scheduled')).toBe(true))
  it('requested → rejected', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'requested', 'rejected')).toBe(true))
  it('scheduled → in_progress', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'scheduled', 'in_progress')).toBe(true))
  it('scheduled → cancelled', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'scheduled', 'cancelled')).toBe(true))
  it('scheduled → no_show', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'scheduled', 'no_show')).toBe(true))
  it('in_progress → completed', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'in_progress', 'completed')).toBe(true))
  it('in_progress → cancelled', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'in_progress', 'cancelled')).toBe(true))

  // Invalid
  it('completed → cancelled (terminal)', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'completed', 'cancelled')).toBe(false))
  it('rejected → scheduled (terminal)', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'rejected', 'scheduled')).toBe(false))
  it('requested → completed (skip)', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'requested', 'completed')).toBe(false))
  it('no_show → in_progress', () => expect(isValidTransition(APPOINTMENT_MACHINE, 'no_show', 'in_progress')).toBe(false))
})

describe('Job Machine', () => {
  it('pending → checked_in', () => expect(isValidTransition(JOB_MACHINE, 'pending', 'checked_in')).toBe(true))
  it('checked_in → in_progress', () => expect(isValidTransition(JOB_MACHINE, 'checked_in', 'in_progress')).toBe(true))
  it('in_progress → checked_out', () => expect(isValidTransition(JOB_MACHINE, 'in_progress', 'checked_out')).toBe(true))
  it('checked_out → closed', () => expect(isValidTransition(JOB_MACHINE, 'checked_out', 'closed')).toBe(true))
  it('pending → checked_out (skip)', () => expect(isValidTransition(JOB_MACHINE, 'pending', 'checked_out')).toBe(false))
  it('closed → pending (terminal)', () => expect(isValidTransition(JOB_MACHINE, 'closed', 'pending')).toBe(false))
})
