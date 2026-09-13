/**
 * Order state machine
 * new / credit_hold → awaiting_payment → paid → ready → delivering → delivered → closed
 *                                                                   ↘ returned
 */

export type OrderStatus =
  | 'new'
  | 'credit_hold'
  | 'awaiting_payment'
  | 'paid'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'returned'
  | 'closed'
  | 'cancelled'

type OrderTransitions = Partial<Record<OrderStatus, Partial<Record<OrderStatus, boolean>>>>

export const ORDER_MACHINE: OrderTransitions = {
  new:                { awaiting_payment: true, cancelled: true },
  credit_hold:        { awaiting_payment: true, cancelled: true },
  awaiting_payment:   { paid: true, cancelled: true },
  paid:               { ready: true, cancelled: true },
  ready:              { delivering: true, cancelled: true },
  delivering:         { delivered: true, returned: true },
  delivered:          { closed: true },
  returned:           { awaiting_payment: true, cancelled: true },
  closed:             {},
  cancelled:          {},
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new:              'ใหม่',
  credit_hold:      '🔴 รอตรวจสินเชื่อ',
  awaiting_payment: 'รอชำระเงิน',
  paid:             '✅ ชำระแล้ว',
  ready:            'คลังเตรียมสินค้า',
  delivering:       '🚚 จัดส่งแล้ว',
  delivered:        '✅ ส่งมอบแล้ว',
  returned:         'คืนสินค้า',
  closed:           '✔ ปิดงาน',
  cancelled:        'ยกเลิก',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new:              'bg-blue-100 text-blue-700',
  credit_hold:      'bg-red-100 text-red-700',
  awaiting_payment: 'bg-yellow-100 text-yellow-700',
  paid:             'bg-green-100 text-green-700',
  ready:            'bg-purple-100 text-purple-700',
  delivering:       'bg-indigo-100 text-indigo-700',
  delivered:        'bg-teal-100 text-teal-700',
  returned:         'bg-orange-100 text-orange-700',
  closed:           'bg-gray-100 text-gray-600',
  cancelled:        'bg-gray-100 text-gray-400',
}
