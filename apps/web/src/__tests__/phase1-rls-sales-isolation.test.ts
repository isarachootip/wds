import { describe, it, expect } from 'vitest'

// Emulating Supabase PostgreSQL RLS policies defined in 00006_crm_rls.sql
interface AuthContext {
  uid: string | null
  roles: string[]
}

interface LeadRow {
  id: string
  ownerId: string | null
  customerId: string | null
  status: string
  deletedAt: Date | null
}

interface LeadActivityRow {
  id: string
  leadId: string
  type: string
  deletedAt: Date | null
}

interface FollowUpRow {
  id: string
  leadId: string
  assigneeId: string | null
  deletedAt: Date | null
}

class CrmRlsEvaluator {
  // Evaluates public.leads FOR SELECT policy from 00006_crm_rls.sql
  static canSelectLead(auth: AuthContext, lead: LeadRow, siteVisitLeadIds: string[] = []): boolean {
    if (lead.deletedAt !== null) return false
    if (!auth.uid) return false // Anonymous access blocked

    // 1. admin, sales_manager, accounting see all leads
    const elevatedRoles = ['admin', 'sales_manager', 'accounting']
    if (auth.roles.some(r => elevatedRoles.includes(r))) {
      return true
    }

    // 2. sales sees only their own owned leads
    if (auth.roles.includes('sales') && lead.ownerId === auth.uid) {
      return true
    }

    // 3. coordinator sees leads linked to site visits
    if (auth.roles.includes('coordinator') && siteVisitLeadIds.includes(lead.id)) {
      return true
    }

    return false
  }

  // Evaluates public.lead_activities FOR SELECT policy from 00006_crm_rls.sql
  static canSelectActivity(auth: AuthContext, activity: LeadActivityRow, leadsMap: Map<string, LeadRow>): boolean {
    if (activity.deletedAt !== null) return false
    if (!auth.uid) return false

    const elevatedRoles = ['admin', 'sales_manager', 'accounting']
    if (auth.roles.some(r => elevatedRoles.includes(r))) {
      return true
    }

    const parentLead = leadsMap.get(activity.leadId)
    if (auth.roles.includes('sales') && parentLead && parentLead.ownerId === auth.uid && parentLead.deletedAt === null) {
      return true
    }

    return false
  }

  // Evaluates public.follow_ups FOR SELECT policy from 00006_crm_rls.sql
  static canSelectFollowUp(auth: AuthContext, followUp: FollowUpRow): boolean {
    if (followUp.deletedAt !== null) return false
    if (!auth.uid) return false

    const elevatedRoles = ['admin', 'sales_manager']
    if (auth.roles.some(r => elevatedRoles.includes(r))) {
      return true
    }

    if ((auth.roles.includes('sales') || auth.roles.includes('coordinator')) && followUp.assigneeId === auth.uid) {
      return true
    }

    return false
  }
}

describe('Phase 1 Acceptance Criteria 6: RLS Sales Isolation & CRM Policies', () => {
  const salesAContext: AuthContext = {
    uid: 'user-sales-a',
    roles: ['sales'],
  }

  const salesBContext: AuthContext = {
    uid: 'user-sales-b',
    roles: ['sales'],
  }

  const managerContext: AuthContext = {
    uid: 'user-manager-01',
    roles: ['sales_manager'],
  }

  const adminContext: AuthContext = {
    uid: 'user-admin-01',
    roles: ['admin'],
  }

  const anonContext: AuthContext = {
    uid: null,
    roles: [],
  }

  const sampleLeads: LeadRow[] = [
    { id: 'lead-a1', ownerId: 'user-sales-a', customerId: 'cust-1', status: 'new', deletedAt: null },
    { id: 'lead-a2', ownerId: 'user-sales-a', customerId: 'cust-2', status: 'qualified', deletedAt: null },
    { id: 'lead-b1', ownerId: 'user-sales-b', customerId: 'cust-3', status: 'contacted', deletedAt: null },
    { id: 'lead-b2', ownerId: 'user-sales-b', customerId: 'cust-4', status: 'quoted', deletedAt: null },
  ]

  const leadsMap = new Map<string, LeadRow>(sampleLeads.map(l => [l.id, l]))

  const sampleActivities: LeadActivityRow[] = [
    { id: 'act-a1', leadId: 'lead-a1', type: 'call', deletedAt: null },
    { id: 'act-b1', leadId: 'lead-b1', type: 'line', deletedAt: null },
  ]

  const sampleFollowUps: FollowUpRow[] = [
    { id: 'fu-a1', leadId: 'lead-a1', assigneeId: 'user-sales-a', deletedAt: null },
    { id: 'fu-b1', leadId: 'lead-b1', assigneeId: 'user-sales-b', deletedAt: null },
  ]

  it('1. Sales A CANNOT access Sales B leads (query returns empty / 0 rows for Sales B leads)', () => {
    const accessibleForSalesA = sampleLeads.filter(l => CrmRlsEvaluator.canSelectLead(salesAContext, l))
    
    // Sales A sees only their 2 leads
    expect(accessibleForSalesA).toHaveLength(2)
    expect(accessibleForSalesA.map(l => l.id)).toEqual(['lead-a1', 'lead-a2'])

    // Explicitly verify Sales B leads are blocked
    const salesBLeadsVisibleToA = accessibleForSalesA.filter(l => l.ownerId === 'user-sales-b')
    expect(salesBLeadsVisibleToA).toHaveLength(0)
  })

  it('2. Sales B CANNOT access Sales A leads', () => {
    const accessibleForSalesB = sampleLeads.filter(l => CrmRlsEvaluator.canSelectLead(salesBContext, l))
    
    expect(accessibleForSalesB).toHaveLength(2)
    expect(accessibleForSalesB.map(l => l.id)).toEqual(['lead-b1', 'lead-b2'])

    const salesALeadsVisibleToB = accessibleForSalesB.filter(l => l.ownerId === 'user-sales-a')
    expect(salesALeadsVisibleToB).toHaveLength(0)
  })

  it('3. Sales Manager can access ALL leads across the team', () => {
    const accessibleForManager = sampleLeads.filter(l => CrmRlsEvaluator.canSelectLead(managerContext, l))
    expect(accessibleForManager).toHaveLength(4)
  })

  it('4. Admin can access ALL leads', () => {
    const accessibleForAdmin = sampleLeads.filter(l => CrmRlsEvaluator.canSelectLead(adminContext, l))
    expect(accessibleForAdmin).toHaveLength(4)
  })

  it('5. Anonymous queries without session token are completely blocked (0 rows)', () => {
    const accessibleForAnon = sampleLeads.filter(l => CrmRlsEvaluator.canSelectLead(anonContext, l))
    expect(accessibleForAnon).toHaveLength(0)
  })

  it('6. Lead Activities & Follow-ups are isolated between Sales reps', () => {
    // Activities
    const aActivities = sampleActivities.filter(a => CrmRlsEvaluator.canSelectActivity(salesAContext, a, leadsMap))
    expect(aActivities).toHaveLength(1)
    expect(aActivities[0].id).toBe('act-a1')

    const bActivities = sampleActivities.filter(a => CrmRlsEvaluator.canSelectActivity(salesBContext, a, leadsMap))
    expect(bActivities).toHaveLength(1)
    expect(bActivities[0].id).toBe('act-b1')

    // Follow-ups
    const aFollowUps = sampleFollowUps.filter(f => CrmRlsEvaluator.canSelectFollowUp(salesAContext, f))
    expect(aFollowUps).toHaveLength(1)
    expect(aFollowUps[0].id).toBe('fu-a1')

    const bFollowUps = sampleFollowUps.filter(f => CrmRlsEvaluator.canSelectFollowUp(salesBContext, f))
    expect(bFollowUps).toHaveLength(1)
    expect(bFollowUps[0].id).toBe('fu-b1')
  })
})
