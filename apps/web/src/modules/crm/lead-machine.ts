import type { StateMachineConfig } from '@/lib/statemachine'

export const LEAD_MACHINE: StateMachineConfig = {
  entity: 'lead',
  transitions: [
    { from: 'new', to: 'contacted' },
    { from: 'new', to: 'lost' },
    { from: 'contacted', to: 'qualified' },
    { from: 'contacted', to: 'lost' },
    { from: 'qualified', to: 'site_visit_requested' },
    { from: 'qualified', to: 'quoted' },
    { from: 'qualified', to: 'lost' },
    { from: 'site_visit_requested', to: 'quoted' },
    { from: 'site_visit_requested', to: 'lost' },
    { from: 'quoted', to: 'won' },
    { from: 'quoted', to: 'lost' },
  ],
}

export const FOLLOW_UP_MACHINE: StateMachineConfig = {
  entity: 'follow_up',
  transitions: [
    { from: 'open', to: 'done' },
    { from: 'open', to: 'skipped' },
  ],
}

export const SITE_VISIT_MACHINE: StateMachineConfig = {
  entity: 'site_visit',
  transitions: [
    { from: 'requested', to: 'scheduled' },
    { from: 'requested', to: 'cancelled' },
    { from: 'scheduled', to: 'done' },
    { from: 'scheduled', to: 'cancelled' },
  ],
}
