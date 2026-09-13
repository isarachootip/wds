/**
 * Pure metric helpers — testable without DB
 */
import type { DashboardToday } from '@/modules/reports/queries'
import { satangToBaht } from './qt-calc'

export interface DashboardAlert {
  kind: 'danger' | 'warning' | 'info'
  message: string
}

/** Generate alerts from dashboard metrics */
export function getDashboardAlerts(metrics: DashboardToday): DashboardAlert[] {
  const alerts: DashboardAlert[] = []
  if (metrics.overdue_followups > 0)
    alerts.push({ kind: 'danger', message: `มี ${metrics.overdue_followups} Follow-up เลยกำหนดแล้ว` })
  if (metrics.pending_appointments > 0)
    alerts.push({ kind: 'warning', message: `${metrics.pending_appointments} นัดหมายรออนุมัติ` })
  if (metrics.pending_payments_count > 0)
    alerts.push({ kind: 'warning', message: `สลิปรอตรวจ ${metrics.pending_payments_count} รายการ (฿${satangToBaht(metrics.pending_payments_satang)})` })
  return alerts
}

/** Format funnel step label */
export function funnelStepLabel(step: string, count: number, rate: number | null): string {
  const rateStr = rate !== null ? ` (${rate}%)` : ''
  return `${step}: ${count}${rateStr}`
}
