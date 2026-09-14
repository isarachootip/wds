'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { withTransaction } from '@/modules/shared/with-transaction'
import { emit } from '@/lib/events'
import { calculateQuotation } from '@/lib/qt-calc'
import { checkCredit } from '@/lib/credit-engine'
import {
  quotations, quotationItems, quotationEvents, orders, domainEvents,
  portalOtpCodes, customers, jobItems
} from '@wds/db'

const DEFAULT_VALID_DAYS = 30

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ─────────────────────────────────────────────────────────────────────────────
// Create QT from job_id (event: job.work_recorded)
// ─────────────────────────────────────────────────────────────────────────────
export async function createQuotationFromJobAction(
  jobId: string,
  customerId: string,
  leadId: string | undefined,
  actorId: string
): Promise<{ success: boolean; quotationId?: string; error?: string }> {
  try {
    const db = getDb()

    // Fetch job items
    const srcItems = await db.select().from(jobItems)
      .where(and(eq(jobItems.jobId, jobId), isNull(jobItems.deletedAt)))

    if (srcItems.length === 0) throw new Error('ไม่พบรายการสินค้าในงาน')

    const lineInputs = srcItems.map(i => ({
      qty: i.qty,
      unitPriceSatang: i.unitPriceSatang,
      discountSatang: 0,
    }))

    const calc = calculateQuotation(lineInputs, 0, 7, 'exclusive')

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + DEFAULT_VALID_DAYS)

    const quotationId = await withTransaction(db, async (tx) => {
      // Get next QT number from DB sequence
      const [{ qtNumber }] = await tx.execute(sql`SELECT public.next_quotation_number() AS "qtNumber"`) as any

      const [qt] = await tx.insert(quotations).values({
        number: qtNumber,
        customerId,
        jobId,
        leadId: leadId ?? undefined,
        status: 'draft',
        validUntil,
        subtotalSatang: calc.subtotalSatang,
        billDiscountSatang: 0,
        vatRate: 7,
        vatMode: 'exclusive',
        vatAmountSatang: calc.vatAmountSatang,
        totalSatang: calc.totalSatang,
        createdBy: actorId,
        updatedBy: actorId,
      }).returning({ id: quotations.id })

      // Insert line items
      for (let i = 0; i < srcItems.length; i++) {
        const src = srcItems[i]
        const line = calc.lines[i]
        await tx.insert(quotationItems).values({
          quotationId: qt.id,
          productId: src.productId ?? undefined,
          description: src.description,
          qty: src.qty,
          unit: src.unit ?? 'ชิ้น',
          unitPriceSatang: src.unitPriceSatang,
          discountSatang: 0,
          amountSatang: line.amountSatang,
          sort: i,
        })
      }

      return qt.id
    })

    revalidatePath('/wds/quotations')
    return { success: true, quotationId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export interface CreateQuotationInput {
  customerId: string
  jobId?: string
  leadId?: string
  items: Array<{
    productId?: string
    description: string
    qty: number
    unit?: string
    unitPriceSatang: number
    discountSatang?: number
  }>
  billDiscountSatang?: number
  vatRate?: number
  vatMode?: 'exclusive' | 'inclusive'
  terms?: string
  note?: string
  validDays?: number
  actorId: string
}

export async function createQuotationAction(
  input: CreateQuotationInput
): Promise<{ success: boolean; quotationId?: string; error?: string }> {
  try {
    const db = getDb()
    if (!input.customerId) throw new Error('ต้องระบุลูกค้า')
    if (!input.items || input.items.length === 0) throw new Error('ต้องมีรายการสินค้าอย่างน้อย 1 รายการ')

    const lineInputs = input.items.map(i => ({
      qty: i.qty,
      unitPriceSatang: i.unitPriceSatang,
      discountSatang: i.discountSatang ?? 0,
    }))

    const calc = calculateQuotation(
      lineInputs,
      input.billDiscountSatang ?? 0,
      input.vatRate ?? 7,
      input.vatMode ?? 'exclusive'
    )

    const validDays = input.validDays ?? DEFAULT_VALID_DAYS
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)

    const quotationId = await withTransaction(db, async (tx) => {
      let qtNumber: string
      try {
        const [seqRes] = await tx.execute(sql`SELECT public.next_quotation_number() AS "qtNumber"`) as any
        qtNumber = seqRes.qtNumber
      } catch {
        const now = new Date()
        const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
        qtNumber = `QT-${ym}-${Math.floor(1000 + Math.random() * 9000)}`
      }

      const [qt] = await tx.insert(quotations).values({
        number: qtNumber,
        customerId: input.customerId,
        jobId: input.jobId ?? undefined,
        leadId: input.leadId ?? undefined,
        status: 'draft',
        validUntil,
        subtotalSatang: calc.subtotalSatang,
        billDiscountSatang: calc.billDiscountSatang,
        vatRate: calc.vatRate,
        vatMode: calc.vatMode,
        vatAmountSatang: calc.vatAmountSatang,
        totalSatang: calc.totalSatang,
        terms: input.terms ?? 'ชำระเงินภายใน 30 วัน',
        note: input.note ?? null,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      }).returning({ id: quotations.id })

      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i]
        const line = calc.lines[i]
        await tx.insert(quotationItems).values({
          quotationId: qt.id,
          productId: item.productId ?? undefined,
          description: item.description,
          qty: item.qty,
          unit: item.unit ?? 'ชิ้น',
          unitPriceSatang: item.unitPriceSatang,
          discountSatang: item.discountSatang ?? 0,
          amountSatang: line.amountSatang,
          sort: i,
        })
      }

      return qt.id
    })

    revalidatePath('/wds/quotations')
    return { success: true, quotationId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function reviseQuotationAction(
  quotationId: string,
  actorId: string
): Promise<{ success: boolean; newQuotationId?: string; error?: string }> {
  try {
    const db = getDb()

    const [oldQt] = await db.select().from(quotations)
      .where(and(eq(quotations.id, quotationId), isNull(quotations.deletedAt)))

    if (!oldQt) throw new Error('ไม่พบใบเสนอราคา')
    if (oldQt.status === 'accepted') throw new Error('ใบเสนอราคานี้ได้รับการยอมรับแล้ว ไม่สามารถแก้ไขได้')

    const oldItems = await db.select().from(quotationItems)
      .where(and(eq(quotationItems.quotationId, quotationId), isNull(quotationItems.deletedAt)))

    const newQuotationId = await withTransaction(db, async (tx) => {
      let qtNumber: string
      try {
        const [seqRes] = await tx.execute(sql`SELECT public.next_quotation_number() AS "qtNumber"`) as any
        qtNumber = seqRes.qtNumber
      } catch {
        const now = new Date()
        const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
        qtNumber = `QT-${ym}-${Math.floor(1000 + Math.random() * 9000)}`
      }

      const nextVersion = (oldQt.version || 1) + 1

      const [newQt] = await tx.insert(quotations).values({
        number: qtNumber,
        customerId: oldQt.customerId,
        jobId: oldQt.jobId,
        leadId: oldQt.leadId,
        status: 'draft',
        validUntil: oldQt.validUntil,
        subtotalSatang: oldQt.subtotalSatang,
        billDiscountSatang: oldQt.billDiscountSatang,
        vatRate: oldQt.vatRate,
        vatMode: oldQt.vatMode,
        vatAmountSatang: oldQt.vatAmountSatang,
        totalSatang: oldQt.totalSatang,
        terms: oldQt.terms,
        note: oldQt.note,
        version: nextVersion,
        supersedesId: oldQt.id,
        createdBy: actorId,
        updatedBy: actorId,
      }).returning({ id: quotations.id })

      for (let i = 0; i < oldItems.length; i++) {
        const item = oldItems[i]
        await tx.insert(quotationItems).values({
          quotationId: newQt.id,
          productId: item.productId,
          description: item.description,
          qty: item.qty,
          unit: item.unit,
          unitPriceSatang: item.unitPriceSatang,
          discountSatang: item.discountSatang,
          amountSatang: item.amountSatang,
          sort: item.sort,
        })
      }

      return newQt.id
    })

    revalidatePath('/wds/quotations')
    return { success: true, newQuotationId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Send QT (generate public_token, set status=sent)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendQuotationAction(
  quotationId: string,
  actorId: string
): Promise<{ success: boolean; publicToken?: string; error?: string }> {
  try {
    const db = getDb()

    const [qt] = await db.select({ status: quotations.status, publicToken: quotations.publicToken })
      .from(quotations).where(and(eq(quotations.id, quotationId), isNull(quotations.deletedAt)))
    if (!qt) throw new Error('ไม่พบใบเสนอราคา')
    if (qt.status === 'accepted') throw new Error('ยอมรับแล้ว ต้องออกใบใหม่')

    const [updated] = await db.update(quotations).set({
      status: 'sent',
      sentAt: new Date(),
      updatedBy: actorId,
    }).where(eq(quotations.id, quotationId)).returning({ publicToken: quotations.publicToken })

    await db.insert(quotationEvents).values({
      quotationId,
      kind: 'sent',
    })

    revalidatePath('/wds/quotations')
    return { success: true, publicToken: updated.publicToken! }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Open QT by token (sent → viewed, record ip/ua)
// ─────────────────────────────────────────────────────────────────────────────
export async function openQuotationByTokenAction(
  quotationId: string,
  ip: string,
  userAgent: string
): Promise<void> {
  try {
    const db = getDb()
    const [qt] = await db.select({ status: quotations.status })
      .from(quotations).where(eq(quotations.id, quotationId))
    if (!qt || qt.status !== 'sent') return

    await db.update(quotations).set({
      status: 'viewed',
      viewedAt: new Date(),
    }).where(eq(quotations.id, quotationId))

    await db.insert(quotationEvents).values({ quotationId, kind: 'viewed', ip, userAgent })
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Request OTP
// ─────────────────────────────────────────────────────────────────────────────
export async function requestOtpAction(
  quotationId: string,
  phone: string
): Promise<{ success: boolean; otp?: string; error?: string }> {
  try {
    const db = getDb()
    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await db.insert(portalOtpCodes).values({ quotationId, phone, code, expiresAt })

    // TODO Phase 5: send real SMS via Twilio/LINE
    // For development: return OTP in response
    return { success: true, otp: code }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Accept QT (verify OTP, create Order, emit event)
// ─────────────────────────────────────────────────────────────────────────────
export async function acceptQuotationAction(
  quotationId: string,
  otp: string,
  ip: string,
  userAgent: string
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  try {
    const db = getDb()

    // Verify OTP
    const [otpRow] = await db.select()
      .from(portalOtpCodes)
      .where(and(
        eq(portalOtpCodes.quotationId, quotationId),
        eq(portalOtpCodes.code, otp),
        isNull(portalOtpCodes.usedAt),
      ))
      .orderBy(portalOtpCodes.createdAt)

    if (!otpRow) throw new Error('รหัส OTP ไม่ถูกต้อง')
    if (otpRow.expiresAt < new Date()) throw new Error('รหัส OTP หมดอายุแล้ว')

    // Get QT
    const [qt] = await db.select()
      .from(quotations)
      .where(and(eq(quotations.id, quotationId), isNull(quotations.deletedAt)))
    if (!qt) throw new Error('ไม่พบใบเสนอราคา')
    if (qt.status === 'accepted') throw new Error('ยอมรับแล้ว')
    if (qt.status === 'expired') throw new Error('ใบเสนอราคาหมดอายุแล้ว')
    if (qt.validUntil && qt.validUntil < new Date()) throw new Error('ใบเสนอราคาหมดอายุแล้ว')

    // Get customer credit info
    const [customer] = await db.select({
      creditLimitSatang: customers.creditLimitSatang,
      creditUsedSatang: customers.creditUsedSatang,
      phone: customers.phone,
    }).from(customers).where(eq(customers.id, qt.customerId!))

    const creditResult = checkCredit({
      creditLimitSatang: customer?.creditLimitSatang ?? 0,
      creditUsedSatang: customer?.creditUsedSatang ?? 0,
      newOrderAmountSatang: qt.totalSatang,
    })

    const orderId = await withTransaction(db, async (tx) => {
      // Mark OTP used
      await tx.update(portalOtpCodes).set({ usedAt: new Date() })
        .where(eq(portalOtpCodes.id, otpRow.id))

      // Accept quotation
      await tx.update(quotations).set({
        status: 'accepted',
        decidedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(quotations.id, quotationId))

      // Record event with evidence
      await tx.insert(quotationEvents).values({
        quotationId,
        kind: 'accepted',
        ip,
        userAgent,
        at: new Date(),
      })

      // Get next order number
      const [{ soNumber }] = await tx.execute(sql`SELECT public.next_order_number() AS "soNumber"`) as any

      // Create Order
      const orderStatus = creditResult.tier === 'hard_block' ? 'credit_hold' : 'new'
      const [order] = await tx.insert(orders).values({
        number: soNumber,
        quotationId,
        customerId: qt.customerId ?? undefined,
        status: orderStatus,
        totalSatang: qt.totalSatang,
        creditCheckResult: creditResult.tier,
        creditUsedPct: creditResult.usedPct,
        createdBy: undefined,
        updatedBy: undefined,
      }).returning({ id: orders.id, number: orders.number })

      // Emit order.created
      await emit(tx as any, domainEvents, 'order.created', 'order', order.id, {
        orderId: order.id,
        orderNumber: order.number,
        quotationId,
        customerId: qt.customerId,
        totalSatang: qt.totalSatang,
        creditTier: creditResult.tier,
        acceptedAt: new Date().toISOString(),
        ip,
        userAgent,
      })

      // If soft_warn, also emit credit warning
      if (creditResult.tier === 'soft_warn') {
        await emit(tx as any, domainEvents, 'credit.soft_warn', 'customer', qt.customerId ?? '', {
          customerId: qt.customerId,
          orderId: order.id,
          usedPct: creditResult.usedPct,
        })
      }

      return order.id
    })

    revalidatePath('/wds/quotations')
    return { success: true, orderId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject QT
// ─────────────────────────────────────────────────────────────────────────────
export async function rejectQuotationAction(
  quotationId: string,
  reason: string,
  ip: string,
  userAgent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await db.update(quotations).set({
      status: 'rejected',
      rejectReason: reason,
      decidedAt: new Date(),
    }).where(eq(quotations.id, quotationId))

    await db.insert(quotationEvents).values({ quotationId, kind: 'rejected', ip, userAgent })
    revalidatePath('/wds/quotations')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}
