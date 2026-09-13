import { describe, it, expect } from 'vitest'
import { getDashboardAlerts, funnelStepLabel } from './dashboard-metrics'
import type { DashboardToday } from '@/modules/reports/queries'

const BASE: DashboardToday = {
  new_leads_today: 0, overdue_followups: 0, pending_site_visits: 0,
  pending_appointments: 0, pending_quotations: 0, pending_payments_count: 0,
  pending_payments_satang: 0, pending_deliveries: 0,
}

describe('getDashboardAlerts', () => {
  it('no issues → empty alerts', () => {
    expect(getDashboardAlerts(BASE)).toHaveLength(0)
  })

  it('overdue follow-ups → danger alert', () => {
    const alerts = getDashboardAlerts({ ...BASE, overdue_followups: 3 })
    expect(alerts).toHaveLength(1)
    expect(alerts[0].kind).toBe('danger')
    expect(alerts[0].message).toContain('3')
  })

  it('pending appointments → warning', () => {
    const alerts = getDashboardAlerts({ ...BASE, pending_appointments: 2 })
    expect(alerts.some(a => a.kind === 'warning')).toBe(true)
  })

  it('multiple issues → multiple alerts', () => {
    const alerts = getDashboardAlerts({
      ...BASE,
      overdue_followups: 1,
      pending_appointments: 1,
      pending_payments_count: 2,
      pending_payments_satang: 10_000_000,
    })
    expect(alerts.length).toBeGreaterThanOrEqual(3)
  })
})

describe('funnelStepLabel', () => {
  it('with rate', () => {
    expect(funnelStepLabel('QT', 20, 40)).toBe('QT: 20 (40%)')
  })
  it('without rate', () => {
    expect(funnelStepLabel('Lead', 100, null)).toBe('Lead: 100')
  })
})
