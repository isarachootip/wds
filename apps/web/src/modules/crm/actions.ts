'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { withTransaction } from '@/modules/shared/with-transaction'
import { transition, isValidTransition } from '@/lib/statemachine'
import { emit } from '@/lib/events'
import { LEAD_MACHINE, FOLLOW_UP_MACHINE } from './lead-machine'
import {
  leads, leadActivities, followUps, siteVisits, customers,
  quotations, orders, auditLog, domainEvents
} from '@wds/db'
import { runAutoCreditCheckAction } from '@/modules/billing/actions'
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
      // Deduplication: if no customerId provided, check if customer already exists with this phone or channelRef
      if (!customerId && (input.customerPhone || input.channelRef)) {
        const phoneToMatch = input.customerPhone || (input.channelRef?.match(/^[0-9+]/) ? input.channelRef : undefined)
        if (phoneToMatch) {
          const [existingCustomer] = await tx
            .select({ id: customers.id })
            .from(customers)
            .where(and(eq(customers.phone, phoneToMatch), isNull(customers.deletedAt)))
            .limit(1)
          if (existingCustomer) {
            customerId = existingCustomer.id
          }
        }
      }

      // If still no customerId, create customer inline
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

// ─────────────────────────────────────────────────────────────────────────────
// Attach Quotation to Lead Action
// ─────────────────────────────────────────────────────────────────────────────
export interface AttachQuotationData {
  quotationNumber: string
  totalSatang: number
  quotationDate?: string
  validUntil?: string
  note?: string
}

export interface AttachQuotationInput extends AttachQuotationData {
  leadId: string
  actorId?: string
}

export async function attachQuotationToLeadAction(
  param1: string | AttachQuotationInput,
  param2?: AttachQuotationData | string,
  param3?: string
): Promise<{ success: boolean; quotationId?: string; error?: string }> {
  try {
    let leadId: string
    let quotationNumber: string
    let totalSatang: number
    let quotationDate: string | undefined
    let validUntil: string | undefined
    let actorId: string

    if (typeof param1 === 'object') {
      leadId = param1.leadId
      quotationNumber = param1.quotationNumber
      totalSatang = param1.totalSatang
      quotationDate = param1.quotationDate
      validUntil = param1.validUntil
      actorId = (typeof param2 === 'string' ? param2 : param1.actorId) || 'system'
    } else {
      leadId = param1
      const data = (typeof param2 === 'object' ? param2 : {}) as AttachQuotationData
      quotationNumber = data.quotationNumber
      totalSatang = data.totalSatang
      quotationDate = data.quotationDate
      validUntil = data.validUntil
      actorId = param3 || 'system'
    }

    if (!leadId) {
      return { success: false, error: 'ต้องระบุ leadId' }
    }
    if (!quotationNumber || typeof quotationNumber !== 'string' || quotationNumber.trim() === '') {
      return { success: false, error: 'ต้องระบุเลขที่ใบเสนอราคา' }
    }
    if (typeof totalSatang !== 'number' || isNaN(totalSatang) || totalSatang < 0) {
      return { success: false, error: 'ยอดรวมต้องเป็นตัวเลขที่ถูกต้อง' }
    }

    const db = getDb()

    // 1. Fetch lead
    const [lead] = await db
      .select({ id: leads.id, status: leads.status, customerId: leads.customerId })
      .from(leads)
      .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))

    if (!lead) {
      return { success: false, error: 'ไม่พบ Lead' }
    }

    const quotationId = await withTransaction(db, async (tx) => {
      // 2. Check if quotation already exists with this number
      const [existingQuote] = await tx
        .select({ id: quotations.id, status: quotations.status })
        .from(quotations)
        .where(and(eq(quotations.number, quotationNumber.trim()), isNull(quotations.deletedAt)))

      let qId: string
      const subtotalSatang = Math.round(totalSatang / 1.07)
      const vatAmountSatang = totalSatang - subtotalSatang
      const parsedValidUntil = validUntil ? new Date(validUntil) : null
      const parsedCreatedAt = quotationDate ? new Date(quotationDate) : new Date()

      if (existingQuote) {
        qId = existingQuote.id
        await tx.update(quotations).set({
          leadId,
          customerId: lead.customerId ?? undefined,
          totalSatang,
          subtotalSatang,
          vatAmountSatang,
          status: 'sent',
          validUntil: parsedValidUntil ?? undefined,
          sentAt: new Date(),
          updatedBy: actorId,
          updatedAt: new Date(),
        }).where(eq(quotations.id, qId))
      } else {
        const [newQuote] = await tx.insert(quotations).values({
          number: quotationNumber.trim(),
          leadId,
          customerId: lead.customerId ?? undefined,
          totalSatang,
          subtotalSatang,
          vatAmountSatang,
          status: 'sent',
          validUntil: parsedValidUntil,
          sentAt: new Date(),
          createdBy: actorId,
          updatedBy: actorId,
          createdAt: parsedCreatedAt,
        }).returning({ id: quotations.id })
        qId = newQuote.id
      }

      // 3. Transition lead status to 'quoted'
      if (lead.status !== 'quoted') {
        if (isValidTransition(LEAD_MACHINE, lead.status, 'quoted')) {
          await transition(tx as any, auditLog, LEAD_MACHINE, leadId, lead.status, 'quoted', actorId)
        }
        await tx.update(leads).set({
          status: 'quoted',
          updatedBy: actorId,
          updatedAt: new Date(),
        }).where(eq(leads.id, leadId))
      }

      // 4. Log activity: type: 'quote_sent'
      const thbFormatted = (totalSatang / 100).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      await tx.insert(leadActivities).values({
        leadId,
        type: 'quote_sent',
        note: `แนบใบเสนอราคา ${quotationNumber.trim()} ยอดรวม ${thbFormatted} บาท`,
        userId: actorId,
      })

      // 5. Emit events
      await emit(tx as any, domainEvents, 'quotation.attached', 'quotation', qId, {
        quotationId: qId,
        quotationNumber: quotationNumber.trim(),
        leadId,
        totalSatang,
        actorId,
      })
      await emit(tx as any, domainEvents, 'lead.updated', 'lead', leadId, {
        leadId,
        status: 'quoted',
        quotationId: qId,
        actorId,
      })

      return qId
    })

    revalidatePath(`/wds/leads/${leadId}`)
    revalidatePath('/wds/leads')
    revalidatePath('/wds/pipeline')

    return { success: true, quotationId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแนบใบเสนอราคา' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Close Win Lead Action
// ─────────────────────────────────────────────────────────────────────────────
export interface CloseWinInput {
  leadId: string
  quotationId?: string
  customerId?: string
  totalSatang?: number
  actorId?: string
}

export async function closeWinLeadAction(
  param1: string | CloseWinInput,
  param2?: string | { quotationId?: string; customerId?: string; totalSatang?: number; actorId?: string },
  param3?: string
): Promise<{
  success: boolean
  orderId?: string
  orderNumber?: string
  creditStatus?: string
  error?: string
}> {
  try {
    let leadId: string
    let quotationId: string | undefined
    let customerId: string | undefined
    let totalSatang: number | undefined
    let actorId: string

    if (typeof param1 === 'object') {
      leadId = param1.leadId
      quotationId = param1.quotationId
      customerId = param1.customerId
      totalSatang = param1.totalSatang
      actorId = (typeof param2 === 'string' ? param2 : param1.actorId) || 'system'
    } else {
      leadId = param1
      if (typeof param2 === 'string') {
        quotationId = param2
        actorId = param3 || 'system'
      } else if (typeof param2 === 'object') {
        quotationId = param2.quotationId
        customerId = param2.customerId
        totalSatang = param2.totalSatang
        actorId = param2.actorId || param3 || 'system'
      } else {
        actorId = param3 || 'system'
      }
    }

    if (!leadId) {
      return { success: false, error: 'ต้องระบุ leadId' }
    }

    const db = getDb()

    // 1. Fetch lead
    const [lead] = await db
      .select({
        id: leads.id,
        status: leads.status,
        customerId: leads.customerId,
        budgetRangeMaxSatang: leads.budgetRangeMaxSatang,
      })
      .from(leads)
      .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))

    if (!lead) {
      return { success: false, error: 'ไม่พบ Lead' }
    }

    // Validate state transition to 'won'
    if (!isValidTransition(LEAD_MACHINE, lead.status, 'won')) {
      return {
        success: false,
        error: `ไม่สามารถปิดการขายได้จากสถานะ ${lead.status} (ต้องอยู่ในสถานะ เสนอราคาแล้ว / quoted)`,
      }
    }

    // 2. Resolve quotation, customerId, totalSatang
    let resolvedQuotationId = quotationId
    let resolvedTotalSatang = totalSatang
    let resolvedCustomerId = customerId ?? lead.customerId ?? undefined

    if (!resolvedQuotationId) {
      const [latestQuote] = await db
        .select()
        .from(quotations)
        .where(and(eq(quotations.leadId, leadId), isNull(quotations.deletedAt)))
        .orderBy(desc(quotations.createdAt))
        .limit(1)

      if (latestQuote) {
        resolvedQuotationId = latestQuote.id
        if (resolvedTotalSatang === undefined) resolvedTotalSatang = latestQuote.totalSatang
        if (!resolvedCustomerId) resolvedCustomerId = latestQuote.customerId ?? undefined
      }
    } else if (resolvedTotalSatang === undefined) {
      const [specifiedQuote] = await db
        .select()
        .from(quotations)
        .where(and(eq(quotations.id, resolvedQuotationId), isNull(quotations.deletedAt)))
      if (specifiedQuote) {
        resolvedTotalSatang = specifiedQuote.totalSatang
        if (!resolvedCustomerId) resolvedCustomerId = specifiedQuote.customerId ?? undefined
      }
    }

    if (resolvedTotalSatang === undefined) {
      resolvedTotalSatang = lead.budgetRangeMaxSatang ?? 0
    }

    // 3. Perform atomic transaction: transition lead, create SO, log activity, emit events
    const orderNumber = `SO-${Date.now()}`
    const createdOrder = await withTransaction(db, async (tx) => {
      // Transition state machine and write audit log
      await transition(tx as any, auditLog, LEAD_MACHINE, leadId, lead.status, 'won', actorId)

      // Update lead
      await tx.update(leads).set({
        status: 'won',
        updatedBy: actorId,
        updatedAt: new Date(),
      }).where(eq(leads.id, leadId))

      // If quotation linked, mark accepted
      if (resolvedQuotationId) {
        await tx.update(quotations).set({
          status: 'accepted',
          decidedAt: new Date(),
          updatedBy: actorId,
          updatedAt: new Date(),
        }).where(eq(quotations.id, resolvedQuotationId))
      }

      // Create Sales Order in orders table (status: 'draft')
      const [newOrder] = await tx.insert(orders).values({
        number: orderNumber,
        quotationId: resolvedQuotationId ?? null,
        customerId: resolvedCustomerId ?? null,
        totalSatang: resolvedTotalSatang,
        status: 'draft',
        createdBy: actorId,
        updatedBy: actorId,
      }).returning({ id: orders.id, number: orders.number })

      // Append activity log
      await tx.insert(leadActivities).values({
        leadId,
        type: 'status_change',
        note: 'ปิดการขายสำเร็จ (Close Win) - สร้างคำสั่งซื้อและส่งต่อตรวจสอบเครดิต',
        userId: actorId,
      })

      // Emit domain events
      await emit(tx as any, domainEvents, 'lead.won', 'lead', leadId, {
        leadId,
        orderId: newOrder.id,
        orderNumber: newOrder.number,
        quotationId: resolvedQuotationId,
        customerId: resolvedCustomerId,
        totalSatang: resolvedTotalSatang,
        actorId,
      })

      await emit(tx as any, domainEvents, 'order.created', 'order', newOrder.id, {
        orderId: newOrder.id,
        number: newOrder.number,
        customerId: resolvedCustomerId,
        totalSatang: resolvedTotalSatang,
        actorId,
      })

      return newOrder
    })

    // 4. Run auto credit check outside the creation transaction to evaluate exposure
    let creditStatus: string = 'awaiting_payment'
    try {
      if (resolvedCustomerId) {
        const creditResult = await runAutoCreditCheckAction(
          createdOrder.id,
          resolvedCustomerId,
          resolvedTotalSatang
        )
        creditStatus = creditResult.decision === 'pass' ? 'awaiting_payment' : 'credit_hold'
      } else {
        // If no customer credit record, default to awaiting_payment
        await db.update(orders).set({
          status: 'awaiting_payment',
          updatedAt: new Date(),
        }).where(eq(orders.id, createdOrder.id))
      }
    } catch (err) {
      console.error('runAutoCreditCheckAction fallback error:', err)
      // Ensure order status moves from draft to awaiting_payment
      await db.update(orders).set({
        status: 'awaiting_payment',
        updatedAt: new Date(),
      }).where(eq(orders.id, createdOrder.id))
    }

    revalidatePath(`/wds/leads/${leadId}`)
    revalidatePath('/wds/leads')
    revalidatePath('/wds/pipeline')
    revalidatePath('/wds/orders')

    return {
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.number ?? orderNumber,
      creditStatus,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการปิดการขาย (Close Win)',
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Close Lost Lead Action
// ─────────────────────────────────────────────────────────────────────────────
export const LOST_REASONS = [
  'PRICE_HIGH',
  'COMPETITOR_CHOSEN',
  'PROJECT_CANCELLED',
  'UNREACHABLE',
  'SPEC_MISMATCH',
  'BUDGET_INSUFFICIENT',
  'BELOW_WHOLESALE_THRESHOLD',
  'OTHER',
] as const

export const THAI_LOST_REASONS = [
  'ราคาสูงเกินไป',
  'เลือกคู่แข่ง',
  'ยกเลิกโครงการ',
  'ติดต่อไม่ได้',
  'ไม่ตรงความต้องการ',
  'งบประมาณไม่เพียงพอ',
  'ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง',
  'อื่นๆ',
] as const

const ALL_VALID_LOST_REASONS = new Set<string>([
  ...LOST_REASONS,
  ...THAI_LOST_REASONS,
])

export interface CloseLostInput {
  leadId: string
  lostReason: string
  note?: string
  actorId?: string
}

export async function closeLostLeadAction(
  param1: string | CloseLostInput,
  param2?: string,
  param3?: string,
  param4?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let leadId: string
    let lostReason: string
    let note: string | undefined
    let actorId: string

    if (typeof param1 === 'object') {
      leadId = param1.leadId
      lostReason = param1.lostReason
      note = param1.note
      actorId = param1.actorId || (typeof param2 === 'string' ? param2 : 'system')
    } else {
      leadId = param1
      lostReason = param2 as string
      note = param3
      actorId = param4 || 'system'
    }

    if (!leadId) {
      return { success: false, error: 'ต้องระบุ leadId' }
    }

    // Validate that lostReason is provided and is a valid value from LOST_REASONS
    if (!lostReason || typeof lostReason !== 'string' || !ALL_VALID_LOST_REASONS.has(lostReason.trim())) {
      return { success: false, error: 'กรุณาระบุเหตุผลการปิดการขายไม่สำเร็จ' }
    }

    const trimmedReason = lostReason.trim()
    const db = getDb()

    const [lead] = await db
      .select({ id: leads.id, status: leads.status })
      .from(leads)
      .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))

    if (!lead) {
      return { success: false, error: 'ไม่พบ Lead' }
    }

    if (!isValidTransition(LEAD_MACHINE, lead.status, 'lost')) {
      return { success: false, error: `ไม่สามารถปิดสถานะ lost จากสถานะ ${lead.status}` }
    }

    await withTransaction(db, async (tx) => {
      // 1. Transition state machine
      await transition(tx as any, auditLog, LEAD_MACHINE, leadId, lead.status, 'lost', actorId)

      // 2. Update lead status and lostReason
      await tx.update(leads).set({
        status: 'lost',
        lostReason: trimmedReason,
        updatedBy: actorId,
        updatedAt: new Date(),
      }).where(eq(leads.id, leadId))

      // 3. Log activity: ปิดการขายไม่สำเร็จ (Close Lost): ${lostReason} - ${note || ''}
      const activityNote = `ปิดการขายไม่สำเร็จ (Close Lost): ${trimmedReason} - ${note || ''}`
      await tx.insert(leadActivities).values({
        leadId,
        type: 'status_change',
        note: activityNote,
        userId: actorId,
      })

      // 4. Emit domain event
      await emit(tx as any, domainEvents, 'lead.lost', 'lead', leadId, {
        leadId,
        lostReason: trimmedReason,
        note: note || '',
        actorId,
      })
    })

    revalidatePath(`/wds/leads/${leadId}`)
    revalidatePath('/wds/leads')
    revalidatePath('/wds/pipeline')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการปิด Lead (Close Lost)',
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Log Lead Activity Action
// ─────────────────────────────────────────────────────────────────────────────
export interface LogLeadActivityInput {
  leadId: string
  type: 'call' | 'line' | 'visit' | 'note'
  note: string
  actorId?: string
}

const VALID_ACTIVITY_TYPES = new Set(['call', 'line', 'visit', 'note'])

export async function logLeadActivityAction(
  param1: string | LogLeadActivityInput,
  param2?: 'call' | 'line' | 'visit' | 'note' | string,
  param3?: string,
  param4?: string
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    let leadId: string
    let type: string
    let note: string
    let actorId: string

    if (typeof param1 === 'object') {
      leadId = param1.leadId
      type = param1.type
      note = param1.note
      actorId = (typeof param2 === 'string' ? param2 : param1.actorId) || 'system'
    } else {
      leadId = param1
      type = param2 as string
      note = param3 as string
      actorId = param4 || 'system'
    }

    if (!leadId) {
      return { success: false, error: 'ต้องระบุ leadId' }
    }
    if (!type || !VALID_ACTIVITY_TYPES.has(type)) {
      return { success: false, error: 'ประเภทกิจกรรมไม่ถูกต้อง (ต้องเป็น call, line, visit หรือ note)' }
    }
    if (!note || typeof note !== 'string' || note.trim() === '') {
      return { success: false, error: 'กรุณาระบุรายละเอียดกิจกรรม' }
    }

    const db = getDb()

    const [lead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))

    if (!lead) {
      return { success: false, error: 'ไม่พบ Lead' }
    }

    const activityId = await withTransaction(db, async (tx) => {
      // 1. Insert leadActivities
      const [newActivity] = await tx.insert(leadActivities).values({
        leadId,
        type,
        note: note.trim(),
        userId: actorId,
        occurredAt: new Date(),
      }).returning({ id: leadActivities.id })

      // 2. Touch leads.updatedAt
      await tx.update(leads).set({
        updatedAt: new Date(),
        updatedBy: actorId,
      }).where(eq(leads.id, leadId))

      return newActivity.id
    })

    revalidatePath(`/wds/leads/${leadId}`)
    revalidatePath('/wds/leads')

    return { success: true, activityId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม',
    }
  }
}

// Alias for backwards compatibility
export const addLeadActivityAction = logLeadActivityAction

export interface CreateCustomerInput {
  name: string
  code?: string
  taxId?: string
  phone?: string
  email?: string
  contactPerson?: string
  lineId?: string
  customerGroup?: string
  creditLimitSatang?: number
  addressLine1?: string
  province?: string
  district?: string
  subDistrict?: string
  postalCode?: string
  actorId?: string
}

export async function createCustomerAction(input: CreateCustomerInput): Promise<{
  success: boolean
  customer?: any
  error?: string
}> {
  try {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: 'กรุณาระบุชื่อลูกค้าหรือชื่อบริษัท' }
    }

    const db = getDb()
    const customerCode = input.code?.trim() || `CUS-${Date.now().toString().slice(-6)}`

    const { addresses } = await import('@wds/db')

    const newCustomer = await withTransaction(db, async (tx) => {
      const [c] = await tx.insert(customers).values({
        code: customerCode,
        name: input.name.trim(),
        taxId: input.taxId?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        contactPerson: input.contactPerson?.trim() || null,
        lineId: input.lineId?.trim() || null,
        customerGroup: input.customerGroup || 'contractor',
        creditLimitSatang: input.creditLimitSatang ?? 0,
        creditUsedSatang: 0,
        status: 'active',
      }).returning()

      if (input.addressLine1?.trim()) {
        await tx.insert(addresses).values({
          customerId: c.id,
          label: 'สำนักงานใหญ่ / สถานที่หลัก',
          addressLine1: input.addressLine1.trim(),
          province: input.province?.trim() || null,
          district: input.district?.trim() || null,
          subDistrict: input.subDistrict?.trim() || null,
          postalCode: input.postalCode?.trim() || null,
          isDefault: true,
        })
      }

      return c
    })

    revalidatePath('/wds/customers')
    return { success: true, customer: newCustomer }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในการสร้างลูกค้า',
    }
  }
}

