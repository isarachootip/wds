import type { StateMachineConfig } from '@/lib/statemachine'

export const APPOINTMENT_MACHINE: StateMachineConfig = {
  entity: 'appointment',
  transitions: [
    { from: 'requested', to: 'scheduled' },    // coordinator approve
    { from: 'requested', to: 'rejected' },     // coordinator reject
    { from: 'scheduled', to: 'in_progress' },  // tech check-in
    { from: 'scheduled', to: 'cancelled' },
    { from: 'scheduled', to: 'no_show' },
    { from: 'in_progress', to: 'completed' },  // tech checkout
    { from: 'in_progress', to: 'cancelled' },
  ],
}

export const JOB_MACHINE: StateMachineConfig = {
  entity: 'job',
  transitions: [
    { from: 'pending', to: 'checked_in' },
    { from: 'checked_in', to: 'in_progress' },
    { from: 'in_progress', to: 'checked_out' },
    { from: 'checked_out', to: 'closed' },
  ],
}
