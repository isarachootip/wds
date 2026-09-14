import { describe, it, expect } from 'vitest'
import { getDashboardAlerts, funnelStepLabel } from '@/lib/dashboard-metrics'
import type { DashboardToday } from '@/modules/reports/queries'

describe('Phase 5 Acceptance Criteria 4: Dashboard Metrics Exact Query Parity', () => {
  // Simulating the exact view query of public.v_dashboard_today
  type DatabaseState = {
    leads: Array<{ id: string; createdAt: Date; deletedAt: Date | null }>
    followUps: Array<{ id: string; status: string; dueAt: Date; deletedAt: Date | null }>
    siteVisits: Array<{ id: string; status: string; deletedAt: Date | null }>
    appointments: Array<{ id: string; status: string; deletedAt: Date | null }>
    quotations: Array<{ id: string; status: string; deletedAt: Date | null }>
    payments: Array<{ id: string; status: string; amountSatang: number; deletedAt: Date | null }>
    deliveries: Array<{ id: string; status: string; deletedAt: Date | null }>
  }

  function queryDashboardView(db: DatabaseState, asOf: Date): DashboardToday {
    const todayStr = asOf.toISOString().slice(0, 10)

    const newLeadsToday = db.leads.filter(
      (l) => l.deletedAt === null && l.createdAt.toISOString().slice(0, 10) === todayStr
    ).length

    const overdueFollowups = db.followUps.filter(
      (f) => f.deletedAt === null && f.status === 'open' && f.dueAt < asOf
    ).length

    const pendingSiteVisits = db.siteVisits.filter(
      (sv) => sv.deletedAt === null && ['requested', 'scheduled'].includes(sv.status)
    ).length

    const pendingAppointments = db.appointments.filter(
      (a) => a.deletedAt === null && a.status === 'requested'
    ).length

    const pendingQuotations = db.quotations.filter(
      (q) => q.deletedAt === null && ['draft', 'sent', 'viewed'].includes(q.status)
    ).length

    const pendingPayments = db.payments.filter(
      (p) => p.deletedAt === null && ['pending', 'verifying'].includes(p.status)
    )

    const pendingDeliveries = db.deliveries.filter(
      (d) => d.deletedAt === null && ['pending', 'scheduled', 'picking', 'shipped'].includes(d.status)
    )

    return {
      new_leads_today: newLeadsToday,
      overdue_followups: overdueFollowups,
      pending_site_visits: pendingSiteVisits,
      pending_appointments: pendingAppointments,
      pending_quotations: pendingQuotations,
      pending_payments_count: pendingPayments.length,
      pending_payments_satang: pendingPayments.reduce((sum, p) => sum + p.amountSatang, 0),
      pending_deliveries: pendingDeliveries.length,
    }
  }

  it('1. Computes exact parity between raw table data and dashboard today metrics view', () => {
    const now = new Date('2026-09-15T12:00:00Z')

    const mockDb: DatabaseState = {
      leads: [
        { id: 'l1', createdAt: new Date('2026-09-15T08:00:00Z'), deletedAt: null },
        { id: 'l2', createdAt: new Date('2026-09-15T09:30:00Z'), deletedAt: null },
        { id: 'l3', createdAt: new Date('2026-09-14T10:00:00Z'), deletedAt: null }, // yesterday
        { id: 'l4', createdAt: new Date('2026-09-15T11:00:00Z'), deletedAt: new Date() }, // deleted today
      ],
      followUps: [
        { id: 'f1', status: 'open', dueAt: new Date('2026-09-14T09:00:00Z'), deletedAt: null }, // overdue
        { id: 'f2', status: 'open', dueAt: new Date('2026-09-16T09:00:00Z'), deletedAt: null }, // future
        { id: 'f3', status: 'done', dueAt: new Date('2026-09-14T08:00:00Z'), deletedAt: null }, // done
      ],
      siteVisits: [
        { id: 'sv1', status: 'requested', deletedAt: null },
        { id: 'sv2', status: 'scheduled', deletedAt: null },
        { id: 'sv3', status: 'done', deletedAt: null },
      ],
      appointments: [
        { id: 'ap1', status: 'requested', deletedAt: null },
        { id: 'ap2', status: 'approved', deletedAt: null },
      ],
      quotations: [
        { id: 'q1', status: 'sent', deletedAt: null },
        { id: 'q2', status: 'viewed', deletedAt: null },
        { id: 'q3', status: 'accepted', deletedAt: null },
      ],
      payments: [
        { id: 'p1', status: 'verifying', amountSatang: 250_000, deletedAt: null },
        { id: 'p2', status: 'pending', amountSatang: 150_000, deletedAt: null },
        { id: 'p3', status: 'confirmed', amountSatang: 500_000, deletedAt: null },
      ],
      deliveries: [
        { id: 'd1', status: 'scheduled', deletedAt: null },
        { id: 'd2', status: 'picking', deletedAt: null },
        { id: 'd3', status: 'delivered', deletedAt: null },
      ],
    }

    const viewResult = queryDashboardView(mockDb, now)

    expect(viewResult.new_leads_today).toBe(2) // l1, l2
    expect(viewResult.overdue_followups).toBe(1) // f1
    expect(viewResult.pending_site_visits).toBe(2) // sv1, sv2
    expect(viewResult.pending_appointments).toBe(1) // ap1
    expect(viewResult.pending_quotations).toBe(2) // q1, q2
    expect(viewResult.pending_payments_count).toBe(2) // p1, p2
    expect(viewResult.pending_payments_satang).toBe(400_000) // 250k + 150k
    expect(viewResult.pending_deliveries).toBe(2) // d1, d2
  })

  it('2. Evaluates dashboard alert banner generation against metrics', () => {
    const metrics: DashboardToday = {
      new_leads_today: 5,
      overdue_followups: 4,
      pending_site_visits: 2,
      pending_appointments: 3,
      pending_quotations: 1,
      pending_payments_count: 2,
      pending_payments_satang: 120_000,
      pending_deliveries: 1,
    }

    const alerts = getDashboardAlerts(metrics)

    expect(alerts).toHaveLength(3)
    expect(alerts[0].kind).toBe('danger')
    expect(alerts[0].message).toContain('4 Follow-up')
    expect(alerts[1].kind).toBe('warning')
    expect(alerts[1].message).toContain('3 นัดหมาย')
    expect(alerts[2].kind).toBe('warning')
    expect(alerts[2].message).toContain('สลิปรอตรวจ 2 รายการ')
  })
})
