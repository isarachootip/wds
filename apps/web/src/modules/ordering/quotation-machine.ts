import type { StateMachineConfig } from '@/lib/statemachine'

export const QUOTATION_MACHINE: StateMachineConfig = {
  entity: 'quotation',
  transitions: [
    { from: 'draft', to: 'sent' },
    { from: 'sent', to: 'viewed' },
    { from: 'sent', to: 'expired' },
    { from: 'viewed', to: 'accepted' },
    { from: 'viewed', to: 'rejected' },
    { from: 'viewed', to: 'expired' },
    { from: 'accepted', to: 'converted' },
  ],
}

export const ORDER_MACHINE: StateMachineConfig = {
  entity: 'order',
  transitions: [
    { from: 'new', to: 'awaiting_payment' },
    { from: 'new', to: 'credit_hold' },
    { from: 'new', to: 'cancelled' },
    { from: 'credit_hold', to: 'awaiting_payment' },
    { from: 'credit_hold', to: 'cancelled' },
    { from: 'awaiting_payment', to: 'ready' },
    { from: 'awaiting_payment', to: 'cancelled' },
    { from: 'paid', to: 'ready' },
    { from: 'ready', to: 'delivering' },
    { from: 'delivering', to: 'delivered' },
    { from: 'delivered', to: 'closed' },
  ],
}
