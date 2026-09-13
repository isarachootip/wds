export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted'
export type OrderStatus = 'new' | 'credit_hold' | 'awaiting_payment' | 'paid' | 'ready' | 'delivering' | 'delivered' | 'closed' | 'cancelled'

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'ร่าง',
  sent: 'ส่งแล้ว',
  viewed: 'ลูกค้าเปิดดูแล้ว',
  accepted: 'ยอมรับแล้ว',
  rejected: 'ปฏิเสธ',
  expired: 'หมดอายุ',
  converted: 'ออก Order แล้ว',
}

export const QUOTATION_STATUS_COLORS: Record<QuotationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
  converted: 'bg-teal-100 text-teal-700',
}
