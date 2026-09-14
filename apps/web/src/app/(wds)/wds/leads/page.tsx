import { unstable_noStore as noStore } from 'next/cache'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { leads, customers, followUps, quotations } from '@wds/db'
import { LeadsHub } from './LeadsHub'
import type { LeadCard } from '../pipeline/KanbanBoard'

async function fetchLeadsHubData(): Promise<LeadCard[]> {
  try {
    const db = getDb()

    // 1. Query all non-deleted leads joined with customer master
    const allLeads = await db
      .select({
        id: leads.id,
        status: leads.status,
        source: leads.source,
        channelRef: leads.channelRef,
        score: leads.score,
        interest: leads.interest,
        budgetRangeMinSatang: leads.budgetRangeMinSatang,
        budgetRangeMaxSatang: leads.budgetRangeMaxSatang,
        lostReason: leads.lostReason,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        ownerId: leads.ownerId,
        customerId: leads.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(leads)
      .leftJoin(customers, eq(leads.customerId, customers.id))
      .where(isNull(leads.deletedAt))
      .orderBy(desc(leads.createdAt))

    // 2. Query open follow-up tasks to determine next action due dates
    const followUpsMap = new Map<string, Date>()
    try {
      const openFollowUps = await db
        .select({
          leadId: followUps.leadId,
          dueAt: followUps.dueAt,
        })
        .from(followUps)
        .where(and(eq(followUps.status, 'open'), isNull(followUps.deletedAt)))
        .orderBy(followUps.dueAt)

      for (const fu of openFollowUps) {
        if (fu.leadId && !followUpsMap.has(fu.leadId)) {
          followUpsMap.set(fu.leadId, new Date(fu.dueAt))
        }
      }
    } catch {
      // Graceful fallback if followUps table is unpopulated or offline
    }

    // 3. Query quotations to determine actual deal values for quoted/won leads
    const quotationsMap = new Map<string, number>()
    try {
      const quotes = await db
        .select({
          leadId: quotations.leadId,
          totalSatang: quotations.totalSatang,
        })
        .from(quotations)
        .where(isNull(quotations.deletedAt))
        .orderBy(desc(quotations.createdAt))

      for (const q of quotes) {
        if (q.leadId && !quotationsMap.has(q.leadId)) {
          quotationsMap.set(q.leadId, q.totalSatang)
        }
      }
    } catch {
      // Graceful fallback if quotations table is unpopulated or offline
    }

    // 4. Map records to LeadCard interface
    return allLeads.map(l => {
      const quoteSatang = quotationsMap.get(l.id)
      const dealValueSatang =
        quoteSatang ?? l.budgetRangeMaxSatang ?? l.budgetRangeMinSatang ?? 0

      return {
        id: l.id,
        status: l.status,
        source: l.source,
        channelRef: l.channelRef,
        customerName: l.customerName,
        customerPhone: l.customerPhone,
        company: l.customerName,
        interest: l.interest,
        budgetRangeMinSatang: l.budgetRangeMinSatang,
        budgetRangeMaxSatang: l.budgetRangeMaxSatang,
        dealValueSatang,
        lostReason: l.lostReason,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        score: l.score,
        ownerId: l.ownerId,
        nextFollowUpDue: followUpsMap.get(l.id) ?? null,
      }
    })
  } catch {
    // Return empty list during build when database is not connected
    return []
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  noStore()
  const params = await searchParams
  const initialView = params.view === 'table' ? 'table' : 'kanban'
  const initialStatus = params.status || 'all'
  const initialSource = params.source || 'all'
  const initialSearch = params.search || ''

  const leadsData = await fetchLeadsHubData()

  return (
    <div className="p-6 max-w-[1700px] mx-auto space-y-6">
      <LeadsHub
        initialLeads={leadsData}
        initialView={initialView}
        initialStatus={initialStatus}
        initialSource={initialSource}
        initialSearch={initialSearch}
      />
    </div>
  )
}
