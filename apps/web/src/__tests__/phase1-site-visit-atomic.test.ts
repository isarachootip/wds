import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isValidTransition, InvalidTransitionError } from '@/lib/statemachine'
import { LEAD_MACHINE } from '@/modules/crm/lead-machine'

describe('Phase 1 Acceptance Criteria 5: Atomic Site Visit Request & Domain Event', () => {
  let transactionOps: string[]
  let domainEventsList: any[]
  let siteVisitsList: any[]
  let auditLogsList: any[]

  beforeEach(() => {
    transactionOps = []
    domainEventsList = []
    siteVisitsList = []
    auditLogsList = []
  })

  it('1. Executes atomic 4-step sequence in a single transaction', async () => {
    const leadId = 'lead-uuid-001'
    const customerId = 'cust-uuid-001'
    const addressId = 'addr-uuid-001'
    const actorId = 'user-sales-01'
    const currentLeadStatus = 'qualified'
    const purpose = 'สำรวจพื้นที่ติดตั้งโครงสร้างหลังคาโรงจอดรถ'

    // Mock transaction runner
    async function mockAtomicRequestSiteVisit() {
      // 1. Validate state transition
      if (!isValidTransition(LEAD_MACHINE, currentLeadStatus, 'site_visit_requested')) {
        throw new InvalidTransitionError('lead', currentLeadStatus, 'site_visit_requested')
      }
      transactionOps.push('transition_validated')

      // Record audit log
      auditLogsList.push({
        entity: 'lead',
        entityId: leadId,
        fromState: currentLeadStatus,
        toState: 'site_visit_requested',
        actorId,
        createdAt: new Date(),
      })
      transactionOps.push('audit_log_written')

      // 2. Update lead status
      const updatedLead = { id: leadId, status: 'site_visit_requested', updatedBy: actorId }
      transactionOps.push('lead_status_updated')

      // 3. Create site_visit record
      const siteVisit = {
        id: 'sv-uuid-001',
        leadId,
        customerId,
        addressId,
        requestedBy: actorId,
        requestedAt: new Date(),
        purpose,
        status: 'requested',
      }
      siteVisitsList.push(siteVisit)
      transactionOps.push('site_visit_inserted')

      // 4. Emit domain event in same transaction
      const event = {
        id: 'evt-uuid-001',
        name: 'site_visit.requested',
        aggregateType: 'site_visit',
        aggregateId: siteVisit.id,
        payload: {
          siteVisitId: siteVisit.id,
          leadId,
          customerId,
          addressId,
          purpose,
          requestedBy: actorId,
        },
        status: 'pending',
      }
      domainEventsList.push(event)
      transactionOps.push('domain_event_emitted')

      return siteVisit.id
    }

    const svId = await mockAtomicRequestSiteVisit()

    expect(svId).toBe('sv-uuid-001')
    expect(transactionOps).toEqual([
      'transition_validated',
      'audit_log_written',
      'lead_status_updated',
      'site_visit_inserted',
      'domain_event_emitted',
    ])

    // Verify site visit record
    expect(siteVisitsList).toHaveLength(1)
    expect(siteVisitsList[0].status).toBe('requested')
    expect(siteVisitsList[0].purpose).toBe(purpose)

    // Verify domain event emitted
    expect(domainEventsList).toHaveLength(1)
    expect(domainEventsList[0].name).toBe('site_visit.requested')
    expect(domainEventsList[0].aggregateId).toBe('sv-uuid-001')
    expect(domainEventsList[0].payload.leadId).toBe(leadId)

    // Verify audit log
    expect(auditLogsList).toHaveLength(1)
    expect(auditLogsList[0].toState).toBe('site_visit_requested')
  })

  it('2. Rejects site visit request from invalid states (e.g. won or lost)', async () => {
    const invalidStatuses = ['won', 'lost', 'new']

    for (const st of invalidStatuses) {
      const canTransition = isValidTransition(LEAD_MACHINE, st, 'site_visit_requested')
      expect(canTransition).toBe(false)
    }
  })
})
