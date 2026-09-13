import { unstable_noStore as noStore } from 'next/cache'
import { sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'

export interface DashboardToday {
  new_leads_today: number
  overdue_followups: number
  pending_site_visits: number
  pending_appointments: number
  pending_quotations: number
  pending_payments_count: number
  pending_payments_satang: number
  pending_deliveries: number
}

export async function getDashboardToday(): Promise<DashboardToday> {
  noStore()
  const db = getDb()
  const [row] = await db.execute(sql`SELECT * FROM public.v_dashboard_today`)
  return (row as unknown as DashboardToday) ?? {
    new_leads_today: 0, overdue_followups: 0, pending_site_visits: 0,
    pending_appointments: 0, pending_quotations: 0, pending_payments_count: 0,
    pending_payments_satang: 0, pending_deliveries: 0,
  }
}

export interface FunnelRow {
  total_leads: number
  sv_count: number
  sv_rate_pct: number
  sv_avg_days: number
  qt_count: number
  qt_rate_pct: number
  qt_avg_days: number
  order_count: number
  order_rate_pct: number
  paid_count: number
  paid_rate_pct: number
}

export async function getFunnelReport(): Promise<FunnelRow | null> {
  noStore()
  const db = getDb()
  const [row] = await db.execute(sql`SELECT * FROM public.v_funnel`)
  return (row as unknown as FunnelRow) ?? null
}

export interface ChannelRow {
  source: string
  lead_count: number
  won_count: number
  win_rate_pct: number
  avg_order_satang: number
}

export async function getChannelReport(): Promise<ChannelRow[]> {
  noStore()
  const db = getDb()
  const rows = await db.execute(sql`SELECT * FROM public.v_channel_report`)
  return rows as unknown as ChannelRow[]
}

export interface TechnicianRow {
  user_id: string
  full_name: string
  total_jobs: number
  completed_jobs: number
  on_time_pct: number
  flagged_jobs: number
}

export async function getTechnicianReport(): Promise<TechnicianRow[]> {
  noStore()
  const db = getDb()
  const rows = await db.execute(sql`SELECT * FROM public.v_technician_performance`)
  return rows as unknown as TechnicianRow[]
}

export interface ArAgingRow {
  customer_id: string
  customer_name: string
  bucket_0_30: number
  bucket_31_60: number
  bucket_61_90: number
  bucket_90plus: number
  total_outstanding: number
}

export async function getArAgingReport(): Promise<ArAgingRow[]> {
  noStore()
  const db = getDb()
  const rows = await db.execute(sql`SELECT * FROM public.v_ar_aging`)
  return rows as unknown as ArAgingRow[]
}
