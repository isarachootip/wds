'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { withTransaction } from '@/modules/shared/with-transaction'
import { transition } from '@/lib/statemachine'
import { emit } from '@/lib/events'
import { LEAD_MACHINE, FOLLOW_UP_MACHINE } from './lead-machine'
import { leads, leadActivities, followUps, siteVisits, customers, auditLog, domainEvents } from '@wds/db'
import type { CreateLeadInput, RequestSiteVisitInput, CreateFollowUpInput } from './types'

// Auto follow-up: 24 hours from now
function getAutoFollowUpDue(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
}

export async function createLeadAction(input: CreateLeadInput): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const db = getDb()

    let customerId = input.customerId

    const leadId = await withTransaction(db, async (tx) => {
      // If no customerId, create customer inline
      if (!customerId) {
        if (!input.customerName) throw new Error('ต้องระบุชื่อลูกค้า')
        const [newCustomer] = await tx.insert(customers).values({
          code: `C${Date.now()}`,
          name: input.customerName,
          phone: input.customerPhone,
          status: 'active',
        }).returning({ id: customers.id })
        customerId = newCustomer.id
      }

      // Insert lead
      const [lead] = await tx.insert(leads).values({
        customerId,
        source: input.source,
        channelRef: input.channelRef,
        status: 'new',
        ownerId: input.ownerId,
        interest: input.interest ?? null,
        budgetRangeMinSatang: input.budgetRangeMinSatang ?? null,
        budgetRangeMaxSatang: input.budgetRangeMaxSatang ?? null,
        createdBy: input.ownerId,
        updatedBy: input.ownerId,
      }).returning({ id: leads.id })

      // Auto-create first follow-up within 24h
      await tx.insert(followUps).values({
        leadId: lead.id,
        dueAt: getAutoFollowUpDue(),
        assigneeId: input.ownerId,
        channel: input.source === 'line' ? 'line' : 'phone',
        status: 'open',
        note: 'ติดตาม Lead ใหม่ภายใน 24 ชั่วโมง (สร้างอัตโนมัติ)',
        createdBy: input.ownerId,
        updatedBy: input.ownerId,
      })

      // Log initial activity
      await tx.insert(leadActivities).values({
        leadId: lead.id,
        type: 'note',
        note: `สร้าง Lead จากช่องทาง: ${input.source}`,
        userId: input.ownerId,
      })

      return lead.id
    })

    revalidatePath('/wds/leads')
    return { success: true, leadId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function updateLeadStatusAction(
  leadId: string,
  newStatus: string,
  actorId: string,
  lostReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()

    // Fetch current status
    const [lead] = await db.select({ status: leads.status }).from(leads)
      .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))

    if (!lead) throw new Error('ไม่พบ Lead')
    if (newStatus === 'lost' && !lostReason) throw new Error('กรุณาระบุเหตุผลที่ปิด Lead')

    await withTransaction(db, async (tx) => {
      // transition() validates + writes audit_log in same tx
      await transition(tx as any, auditLog, LEAD_MACHINE, leadId, lead.status, newStatus, actorId)

      // Update lead status
      await tx.update(leads).set({
        status: newStatus,
        lostReason: lostReason ?? null,
        updatedBy: actorId,
        updatedAt: new Date(),
      }).where(eq(leads.id, leadId))

      // Log activity
      await tx.insert(leadActivities).values({
        leadId,
        type: 'status_change',
        note: `เปลี่ยนสถานะ: ${lead.status} → ${newStatus}${lostReason ? ` (${lostReason})` : ''}`,
        userId: actorId,
      })
    })

    revalidatePath(`/wds/leads/${leadId}`)
    revalidatePath('/wds/leads')
    revalidatePath('/wds/pipeline')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function requestSiteVisitAction(
  input: RequestSiteVisitInput,
  actorId: string
): Promise<{ success: boolean; siteVisitId?: string; error?: string }> {
  try {
    const db = getDb()

    const [lead] = await db.select({ status: leads.status, customerId: leads.customerId })
      .from(leads)
      .where(and(eq(leads.id, input.leadId), isNull(leads.deletedAt)))

    if (!lead) throw new Error('ไม่พบ Lead')

    const siteVisitId = await withTransaction(db, async (tx) => {
      // 1. Transition lead status → site_visit_requested (validates via state machine)
      await transition(tx as any, auditLog, LEAD_MACHINE, input.leadId, lead.status, 'site_visit_requested', actorId)

      // 2. Update lead status
      await tx.update(leads).set({
        status: 'site_visit_requested',
        updatedBy: actorId,
        updatedAt: new Date(),
      }).where(eq(leads.id, input.leadId))

      // 3. Create site_visit record
      const [sv] = await tx.insert(siteVisits).values({
        leadId: input.leadId,
        customerId: lead.customerId ?? undefined,
        addressId: input.addressId ?? undefined,
        requestedBy: actorId,
        requestedAt: new Date(),
        purpose: input.purpose,
        status: 'requested',
        scope: input.scope ?? null,
        createdBy: actorId,
        updatedBy: actorId,
      }).returning({ id: siteVisits.id })

      // 4. Emit domain event (cross-module: Visit App will pick this up in Phase 2)
      await emit(tx as any, domainEvents, 'site_visit.requested', 'site_visit', sv.id, {
        siteVisitId: sv.id,
        leadId: input.leadId,
        customerId: lead.customerId,
        addressId: input.addressId,
        purpose: input.purpose,
        scope: input.scope,
        requestedBy: actorId,
        requestedAt: new Date().toISOString(),
      })

      // 5. Log activity on lead
      await tx.insert(leadActivities).values({
        leadId: input.leadId,
        type: 'visit',
        note: `ขอสำรวจหน้างาน: ${input.purpose}`,
        userId: actorId,
      })

      return sv.id
    })

    revalidatePath(`/wds/leads/${input.leadId}`)
    revalidatePath('/wds/leads')
    return { success: true, siteVisitId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function createFollowUpAction(
  input: CreateFollowUpInput,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await db.insert(followUps).values({
      leadId: input.leadId,
      dueAt: new Date(input.dueAt),
      assigneeId: input.assigneeId,
      channel: input.channel,
      note: input.note,
      status: 'open',
      createdBy: actorId,
      updatedBy: actorId,
    })
    revalidatePath(`/wds/leads/${input.leadId}`)
    revalidatePath('/wds/followups')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function doneFollowUpAction(
  followUpId: string,
  actorId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    const [fu] = await db.select({ status: followUps.status, leadId: followUps.leadId })
      .from(followUps).where(eq(followUps.id, followUpId))

    if (!fu) throw new Error('ไม่พบ Follow-up')

    await withTransaction(db, async (tx) => {
      await transition(tx as any, auditLog, FOLLOW_UP_MACHINE, followUpId, fu.status, 'done', actorId)
      await tx.update(followUps).set({
        status: 'done',
        doneAt: new Date(),
        note: note ?? undefined,
        updatedBy: actorId,
      }).where(eq(followUps.id, followUpId))
    })

    revalidatePath('/wds/followups')
    revalidatePath(`/wds/leads/${fu.leadId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}
