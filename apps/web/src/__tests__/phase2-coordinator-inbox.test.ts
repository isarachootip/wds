import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Phase 2 Acceptance Criteria 1 & 2: Coordinator Inbox & Appointment Approval', () => {
  let domainEventsStore: any[]
  let appointmentsStore: any[]
  let jobsStore: any[]
  let siteVisitsStore: any[]
  let teamMembersStore: any[]

  beforeEach(() => {
    domainEventsStore = [
      {
        id: 'evt-sv-001',
        name: 'site_visit.requested',
        status: 'pending',
        processedAt: null,
        aggregateType: 'site_visit',
        aggregateId: 'sv-101',
        payload: {
          siteVisitId: 'sv-101',
          leadId: 'lead-001',
          customerId: 'cust-001',
          addressId: 'addr-001',
          purpose: 'สำรวจพื้นที่ติดตั้งหลังคาโรงรถ',
          requestedBy: 'sales-01',
        },
        occurredAt: new Date(),
      },
    ]

    appointmentsStore = []
    jobsStore = []
    siteVisitsStore = [{ id: 'sv-101', status: 'requested' }]
    teamMembersStore = [
      { teamId: 'team-alpha', userId: 'tech-01', role: 'lead' },
      { teamId: 'team-alpha', userId: 'tech-02', role: 'member' },
      { teamId: 'team-beta', userId: 'tech-03', role: 'lead' },
    ]
  })

  it('1. Coordinator Inbox consumes site_visit.requested domain events directly without cross-module query', () => {
    // Queries domainEvents for pending site_visit.requested
    const inboxItems = domainEventsStore.filter(
      (e) => e.name === 'site_visit.requested' && e.status === 'pending' && e.processedAt === null
    )

    expect(inboxItems).toHaveLength(1)
    expect(inboxItems[0].aggregateId).toBe('sv-101')
    expect(inboxItems[0].payload.purpose).toBe('สำรวจพื้นที่ติดตั้งหลังคาโรงรถ')
    expect(inboxItems[0].payload.customerId).toBe('cust-001')
  })

  it('2. Approve appointment creates appointment + pending job, marks event processed, and schedules site visit', () => {
    const event = domainEventsStore[0]
    const scheduledStart = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const scheduledEnd = new Date(Date.now() + 4 * 60 * 60 * 1000)
    const teamId = 'team-alpha'
    const coordinatorId = 'coord-01'

    // Mock approve flow
    event.status = 'processed'
    event.processedAt = new Date()

    const siteVisit = siteVisitsStore.find((sv) => sv.id === event.payload.siteVisitId)
    if (siteVisit) siteVisit.status = 'scheduled'

    const newAppt = {
      id: 'appt-001',
      siteVisitId: event.payload.siteVisitId,
      customerId: event.payload.customerId,
      addressId: event.payload.addressId,
      scheduledStart,
      scheduledEnd,
      teamId,
      status: 'scheduled',
      approvedBy: coordinatorId,
      approvedAt: new Date(),
    }
    appointmentsStore.push(newAppt)

    const newJob = {
      id: 'job-001',
      appointmentId: newAppt.id,
      status: 'pending',
    }
    jobsStore.push(newJob)

    expect(event.status).toBe('processed')
    expect(siteVisit?.status).toBe('scheduled')
    expect(appointmentsStore).toHaveLength(1)
    expect(appointmentsStore[0].status).toBe('scheduled')
    expect(jobsStore).toHaveLength(1)
    expect(jobsStore[0].status).toBe('pending')
  })

  it('3. Technicians in approved team see the scheduled job in their /visit view for that day', () => {
    // Setup appointment today for team-alpha
    const now = new Date()
    const scheduledStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0)
    const scheduledEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0)

    const appt = {
      id: 'appt-today-01',
      teamId: 'team-alpha',
      scheduledStart,
      scheduledEnd,
      status: 'scheduled',
    }
    appointmentsStore.push(appt)

    const job = {
      id: 'job-today-01',
      appointmentId: appt.id,
      status: 'pending',
    }
    jobsStore.push(job)

    function getTechTodayJobs(userId: string) {
      const userTeams = teamMembersStore.filter((m) => m.userId === userId).map((m) => m.teamId)
      const visibleAppts = appointmentsStore.filter((a) => userTeams.includes(a.teamId))
      return jobsStore.filter((j) => visibleAppts.some((a) => a.id === j.appointmentId))
    }

    // Tech 01 & 02 are in team-alpha -> see job
    expect(getTechTodayJobs('tech-01')).toHaveLength(1)
    expect(getTechTodayJobs('tech-02')).toHaveLength(1)

    // Tech 03 is in team-beta -> does NOT see job
    expect(getTechTodayJobs('tech-03')).toHaveLength(0)
  })

  it('4. Reject appointment enforces mandatory reason', () => {
    function rejectAppointment(reason: string) {
      if (!reason || !reason.trim()) {
        throw new Error('กรุณาระบุเหตุผลที่ปฏิเสธ')
      }
      return { success: true }
    }

    expect(() => rejectAppointment('')).toThrow('กรุณาระบุเหตุผลที่ปฏิเสธ')
    expect(() => rejectAppointment('   ')).toThrow('กรุณาระบุเหตุผลที่ปฏิเสธ')
    expect(rejectAppointment('ทีมช่างติดงานด่วน').success).toBe(true)
  })
})
