import type { StateMachineConfig } from '@/lib/statemachine'

export const DELIVERY_MACHINE: StateMachineConfig = {
  entity: 'delivery',
  transitions: [
    { from: 'pending', to: 'scheduled' },
    { from: 'scheduled', to: 'picking' },
    { from: 'picking', to: 'shipped' },
    { from: 'shipped', to: 'delivered' },
    { from: 'shipped', to: 'failed' },
    { from: 'failed', to: 'scheduled' },
    { from: 'delivered', to: 'returned' },
  ],
}
