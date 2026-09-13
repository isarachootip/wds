// types.ts — no external deps
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'site_visit_requested' | 'quoted' | 'won' | 'lost'
export type LeadSource = 'line' | 'phone' | 'store' | 'other'
export type ActivityType = 'call' | 'line' | 'visit' | 'note' | 'quote_sent' | 'status_change'
export type FollowUpStatus = 'open' | 'done' | 'skipped'
export type SiteVisitStatus = 'requested' | 'scheduled' | 'done' | 'cancelled'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  qualified: 'คุณสมบัติผ่าน',
  site_visit_requested: 'ขอสำรวจหน้างาน',
  quoted: 'เสนอราคาแล้ว',
  won: 'ปิดการขาย',
  lost: 'สูญเสีย',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  line: 'LINE',
  phone: 'โทรศัพท์',
  store: 'หน้าร้าน',
  other: 'อื่นๆ',
}

export const LOST_REASONS = [
  'ราคาสูงเกินไป',
  'เลือกคู่แข่ง',
  'ยกเลิกโครงการ',
  'ติดต่อไม่ได้',
  'ไม่ตรงความต้องการ',
  'งบประมาณไม่เพียงพอ',
  'อื่นๆ',
] as const

export type LostReason = (typeof LOST_REASONS)[number]

export interface CreateLeadInput {
  customerId?: string
  customerName?: string
  customerPhone?: string
  source: LeadSource
  channelRef?: string
  interest?: Record<string, unknown>
  budgetRangeMinSatang?: number
  budgetRangeMaxSatang?: number
  ownerId: string
}

export interface RequestSiteVisitInput {
  leadId: string
  addressId?: string
  purpose: string
  scope?: Record<string, unknown>
}

export interface CreateFollowUpInput {
  leadId: string
  dueAt: string  // ISO datetime
  assigneeId: string
  channel: 'phone' | 'line' | 'email' | 'visit'
  note?: string
}
