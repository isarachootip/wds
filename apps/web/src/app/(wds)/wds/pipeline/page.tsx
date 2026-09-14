import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { eq, isNull, desc } from 'drizzle-orm'
import { Plus } from 'lucide-react'
import { getDb } from '@/lib/db'
import { leads, customers, quotations, followUps } from '@wds/db'
import { KanbanBoard, type LeadCard } from './KanbanBoard'
import { Button } from '@/components/ui/button'

export type { LeadCard }

async function fetchPipelineLeads(): Promise<LeadCard[]> {
  try {
    const db = getDb()

    // 1. Query leads joined with customer master
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

    // 2. Query quotations map for deal totals
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
      // Graceful fallback during offline / unmigrated states
    }

    // 3. Query followUps map for next scheduled action
    const followUpsMap = new Map<string, Date>()
    try {
      const openFollowUps = await db
        .select({
          leadId: followUps.leadId,
          dueAt: followUps.dueAt,
        })
        .from(followUps)
        .where(isNull(followUps.deletedAt))
        .orderBy(followUps.dueAt)

      for (const fu of openFollowUps) {
        if (fu.leadId && !followUpsMap.has(fu.leadId)) {
          followUpsMap.set(fu.leadId, new Date(fu.dueAt))
        }
      }
    } catch {
      // Graceful fallback
    }

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
    // Return empty list during build when database is not reachable
    return []
  }
}

export default async function PipelinePage() {
  noStore()

  const leadsData = await fetchPipelineLeads()
  const buddhistYear = new Date().getFullYear() + 543

  return (
    <div className="p-6 max-w-[1700px] mx-auto space-y-6">
      {/* Modern Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              กระดานการขาย (Sales Pipeline Kanban)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
              พ.ศ. {buddhistYear}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">
              {leadsData.length} ลีดทั้งหมด
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ลาก Lead ข้ามคอลัมน์เพื่อเปลี่ยนสถานะ หรือเลือกย้ายสถานะตามขั้นตอนการขาย
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="thaiwatsadu" size="sm" className="shadow-xs">
            <Link href="/wds/leads/new">
              <Plus className="size-4 mr-1" />
              <span>+ เพิ่มลีด</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard initialLeads={leadsData} />
    </div>
  )
}