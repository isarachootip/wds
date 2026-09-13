'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, isNull, sql, desc, sum } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { withTransaction } from '@/modules/shared/with-transaction'
import { emit } from '@/lib/events'
import { runCreditCheck, isFullyPaid, remainingBalanceSatang } from './credit'
import {
  orders, payments, deliveries, deliveryItems, domainEvents,
  customers, customerCredit, creditChecks, invoices
} from '@wds/db'

// ─── Helper: get actor role (stub — replace with real session in Phase 5) ────
function assertRole(actorRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(actorRole)) {
    throw new Error(`บทบาท ${actorRole} ไม่มีสิทธิ์ดำเนินการนี้`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO Credit Check — called immediately after order.created
// ─────────────────────────────────────────────────────────────────────────────
export async function runAutoCreditCheckAction(
  orderId: string,
  customerId: string,
  orderTotalSatang: number
): Promise<{ decision: 'pass' | 'hold' | 'reject'; reason: string }> {
  const db = getDb()

  // Get customer credit terms
  const [cc] = await db.select().from(customerCredit)
    .where(and(eq(customerCredit.customerId, customerId), isNull(customerCredit.deletedAt)))

  // Get outstanding: open/partial/overdue invoices + active orders (excl this one)
  const [invSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount_satang - paid_satang), 0)` })
    .from(invoices)
    .where(and(
      eq(invoices.orderId, orderId),   // TODO: per customer outstanding across all orders
      isNull(invoices.deletedAt),
    ))

  // Simpler: sum unpaid invoices for this customer
  const [overdueSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount_satang - paid_satang), 0)` })
    .from(invoices)
    .where(and(
      eq(invoices.orderId, orderId),
      isNull(invoices.deletedAt),
    ))

  // Check prior history
  const [priorOrder] = await db.select({ id: orders.id }).from(orders)
    .where(and(
      eq(orders.customerId, customerId),
      isNull(orders.deletedAt),
    ))

  const creditResult = runCreditCheck({
    onHold: cc?.onHold ?? false,
    creditLimitSatang: cc?.creditLimitSatang ?? 0,
    outstandingSatang: 0, // Phase 5: compute real outstanding
    overdueAmountSatang: 0, // Phase 5: compute real overdue
    orderTotalSatang,
    hasPriorHistory: Boolean(priorOrder),
  })

  // Record credit check
  await db.insert(creditChecks).values({
    orderId,
    customerId,
    creditLimitSatang: cc?.creditLimitSatang ?? 0,
    outstandingSatang: 0,
    overdueAmountSatang: 0,
    availableSatang: creditResult.availableSatang,
    orderTotalSatang,
    decision: creditResult.decision,
    reason: creditResult.reason,
    auto: true,
  })

  // Update order status based on decision
  const newStatus = creditResult.decision === 'pass' ? 'awaiting_payment' : 'credit_hold'
  await db.update(orders).set({ status: newStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  revalidatePath('/wds/orders')
  return { decision: creditResult.decision, reason: creditResult.reason }
}

// ─────────────────────────────────────────────────────────────────────────────
// Approve credit_hold → awaiting_payment (manager/admin only)
// ─────────────────────────────────────────────────────────────────────────────
export async function approveOrderAction(
  orderId: string,
  actorId: string,
  actorRole: string = 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    assertRole(actorRole, ['admin', 'accounting', 'sales_manager'])
    const db = getDb()

    const [order] = await db.select({ status: orders.status, customerId: orders.customerId, totalSatang: orders.totalSatang })
      .from(orders).where(eq(orders.id, orderId))
    if (!order) throw new Error('ไม่พบ Order')
    if (order.status !== 'credit_hold') throw new Error(`ไม่สามารถอนุมัติจากสถานะ ${order.status}`)

    await withTransaction(db, async (tx) => {
      await tx.update(orders).set({
        status: 'awaiting_payment',
        updatedBy: actorId,
        updatedAt: new Date(),
      }).where(eq(orders.id, orderId))

      // Record manual approval in credit_checks
      await tx.insert(creditChecks).values({
        orderId,
        customerId: order.customerId ?? '',
        creditLimitSatang: 0,
        outstandingSatang: 0,
        overdueAmountSatang: 0,
        availableSatang: 0,
        orderTotalSatang: order.totalSatang,
        decision: 'pass',
        reason: 'อนุมัติโดยผู้จัดการ',
        decidedBy: actorId,
        auto: false,
      })
    })

    revalidatePath('/wds/orders')
    revalidatePath('/wds/credit')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Record payment (sales/coordinator records slip)
// ─────────────────────────────────────────────────────────────────────────────
export async function recordPaymentAction(input: {
  orderId: string
  method: 'cash' | 'transfer' | 'credit' | 'card' | 'cod'
  amountSatang: number
  refNo?: string
  slipPath?: string
  note?: string
  actorId: string
  actorRole?: string
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    const db = getDb()

    // Cash: auto-confirm by recorder
    const isCash = input.method === 'cash'
    const initialStatus = isCash ? 'confirmed' : 'verifying'

    const paymentId = await withTransaction(db, async (tx) => {
      const [payment] = await tx.insert(payments).values({
        orderId: input.orderId,
        method: input.method,
        amountSatang: input.amountSatang,
        refNo: input.refNo,
        slipPath: input.slipPath,
        note: input.note,
        status: initialStatus,
        recordedBy: input.actorId,
        paidAt: new Date(),
        ...(isCash ? { verifiedBy: input.actorId, verifiedAt: new Date() } : {}),
      }).returning({ id: payments.id })

      // If cash: check if fully paid and update order
      if (isCash) {
        await checkAndUpdateOrderPaidStatus(tx, input.orderId, input.actorId)
      }

      return payment.id
    })

    revalidatePath('/wds/orders')
    revalidatePath(`/wds/orders/${input.orderId}`)
    revalidatePath('/wds/payments')
    return { success: true, paymentId }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// Internal helper: sum confirmed payments and update order if fully paid
async function checkAndUpdateOrderPaidStatus(tx: any, orderId: string, actorId: string) {
  const [order] = await tx.select({ totalSatang: orders.totalSatang, status: orders.status })
    .from(orders).where(eq(orders.id, orderId))
  if (!order) return

  const [result] = await tx
    .select({ total: sql<number>`COALESCE(SUM(amount_satang), 0)` })
    .from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.status, 'confirmed'), isNull(payments.deletedAt)))

  const confirmedSatang = Number(result?.total ?? 0)

  if (isFullyPaid(order.totalSatang, confirmedSatang) && order.status === 'awaiting_payment') {
    await tx.update(orders).set({
      status: 'ready',
      updatedBy: actorId,
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId))

    await emit(tx, domainEvents, 'order.ready_to_deliver', 'order', orderId, {
      orderId,
      confirmedSatang,
      orderTotalSatang: order.totalSatang,
      readyAt: new Date().toISOString(),
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify payment — ACCOUNTING ONLY
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyPaymentAction(input: {
  paymentId: string
  decision: 'confirmed' | 'rejected'
  rejectReason?: string
  actorId: string
  actorRole: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // RBAC: only accounting can verify
    assertRole(input.actorRole, ['admin', 'accounting'])
    const db = getDb()

    const [payment] = await db.select()
      .from(payments).where(and(eq(payments.id, input.paymentId), isNull(payments.deletedAt)))
    if (!payment) throw new Error('ไม่พบรายการชำระเงิน')
    if (payment.status !== 'verifying' && payment.status !== 'pending')
      throw new Error('รายการนี้ดำเนินการแล้ว')

    await withTransaction(db, async (tx) => {
      await tx.update(payments).set({
        status: input.decision,
        verifiedBy: input.actorId,
        verifiedAt: new Date(),
        ...(input.decision === 'rejected' ? { rejectReason: input.rejectReason } : {}),
      }).where(eq(payments.id, input.paymentId))

      if (input.decision === 'confirmed') {
        await checkAndUpdateOrderPaidStatus(tx, payment.orderId, input.actorId)
      }
    })

    revalidatePath('/wds/payments')
    revalidatePath(`/wds/orders/${payment.orderId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Warehouse: mark order ready
// ─────────────────────────────────────────────────────────────────────────────
export async function markReadyAction(
  orderId: string,
  actorId: string,
  actorRole: string = 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    assertRole(actorRole, ['admin', 'warehouse', 'coordinator'])
    const db = getDb()
    await db.update(orders).set({ status: 'ready', updatedBy: actorId, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
    revalidatePath('/wds/orders')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Create delivery
// ─────────────────────────────────────────────────────────────────────────────
export async function createDeliveryAction(input: {
  orderId: string
  teamId?: string
  driverId?: string
  vehicle?: string
  scheduledDate: Date
  items: Array<{ productId?: string; description: string; qtyOrdered: number }>
  actorId: string
}): Promise<{ success: boolean; deliveryId?: string; error?: string }> {
  try {
    const db = getDb()

    const deliveryId = await withTransaction(db, async (tx) => {
      const [delivery] = await tx.insert(deliveries).values({
        orderId: input.orderId,
        teamId: input.teamId,
        driverId: input.driverId,
        vehicle: input.vehicle,
        scheduledDate: input.scheduledDate,
        status: 'scheduled',
        attempt: 0,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      }).returning({ id: deliveries.id })

      for (const item of input.items) {
        await tx.insert(deliveryItems).values({
          deliveryId: delivery.id,
          productId: item.productId,
          description: item.description,
          qtyOrdered: item.qtyOrdered,
          qtyDelivered: 0,
        })
      }

      // Update order status
      await tx.update(orders).set({ status: 'delivering', updatedBy: input.actorId, updatedAt: new Date() })
        .where(eq(orders.id, input.orderId))

      return delivery.id
    })

    revalidatePath(`/wds/orders/${input.orderId}`)
    revalidatePath('/wds/deliveries')
    return { success: true, deliveryId }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver: update delivery status (picking → shipped)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateDeliveryStatusAction(
  deliveryId: string,
  newStatus: 'picking' | 'shipped',
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await db.update(deliveries).set({ status: newStatus, updatedBy: actorId, updatedAt: new Date() })
      .where(eq(deliveries.id, deliveryId))
    revalidatePath('/visit/deliveries')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver: Mark delivered (POD required) — warehouse/technician only
// ─────────────────────────────────────────────────────────────────────────────
export async function markDeliveredAction(input: {
  deliveryId: string
  orderId: string
  podPath: string             // REQUIRED — blocked if empty
  receiverName: string        // REQUIRED
  customerSignaturePath?: string
  driverNote?: string
  actorId: string
  actorRole: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    assertRole(input.actorRole, ['admin', 'warehouse', 'technician'])

    // POD is mandatory
    if (!input.podPath || !input.podPath.trim()) {
      throw new Error('กรุณาถ่ายรูป POD ก่อนปิดงานส่ง')
    }
    if (!input.receiverName || !input.receiverName.trim()) {
      throw new Error('กรุณาระบุชื่อผู้รับ')
    }

    const db = getDb()

    await withTransaction(db, async (tx) => {
      await tx.update(deliveries).set({
        status: 'delivered',
        deliveredAt: new Date(),
        podPath: input.podPath,
        receiverName: input.receiverName,
        customerSignaturePath: input.customerSignaturePath,
        driverNote: input.driverNote,
        updatedBy: input.actorId,
        updatedAt: new Date(),
      }).where(eq(deliveries.id, input.deliveryId))

      await tx.update(orders).set({ status: 'delivered', updatedBy: input.actorId, updatedAt: new Date() })
        .where(eq(orders.id, input.orderId))

      await emit(tx, domainEvents, 'delivery.completed', 'delivery', input.deliveryId, {
        deliveryId: input.deliveryId,
        orderId: input.orderId,
        deliveredAt: new Date().toISOString(),
        podPath: input.podPath,
        receiverName: input.receiverName,
      })
    })

    revalidatePath(`/wds/orders/${input.orderId}`)
    revalidatePath('/visit/deliveries')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver: Mark delivery failed → attempt++, if ≥3 emit alert
// ─────────────────────────────────────────────────────────────────────────────
export async function failDeliveryAction(input: {
  deliveryId: string
  orderId: string
  failReason: string
  actorId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!input.failReason.trim()) throw new Error('กรุณาระบุเหตุผลที่ส่งไม่สำเร็จ')
    const db = getDb()

    const [delivery] = await db.select({ attempt: deliveries.attempt })
      .from(deliveries).where(eq(deliveries.id, input.deliveryId))
    if (!delivery) throw new Error('ไม่พบรายการจัดส่ง')

    const newAttempt = (delivery.attempt ?? 0) + 1

    await withTransaction(db, async (tx) => {
      await tx.update(deliveries).set({
        status: 'failed',
        attempt: newAttempt,
        failReason: input.failReason,
        updatedBy: input.actorId,
        updatedAt: new Date(),
      }).where(eq(deliveries.id, input.deliveryId))

      if (newAttempt >= 3) {
        await emit(tx, domainEvents, 'delivery.failed_3_times', 'delivery', input.deliveryId, {
          deliveryId: input.deliveryId,
          orderId: input.orderId,
          attempt: newAttempt,
          failReason: input.failReason,
        })
      }
    })

    revalidatePath('/visit/deliveries')
    revalidatePath(`/wds/orders/${input.orderId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Close order
// ─────────────────────────────────────────────────────────────────────────────
export async function closeOrderAction(
  orderId: string,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await withTransaction(db, async (tx) => {
      await tx.update(orders).set({ status: 'closed', updatedBy: actorId, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
      await emit(tx, domainEvents, 'order.closed', 'order', orderId, {
        orderId,
        closedAt: new Date().toISOString(),
        closedBy: actorId,
      })
    })
    revalidatePath('/wds/orders')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal: customer uploads payment slip
// ─────────────────────────────────────────────────────────────────────────────
export async function customerUploadSlipAction(input: {
  orderId: string
  token: string
  slipPath: string
  amountSatang: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()

    // Verify order belongs to this token (via quotation)
    // Token checked by portal page — just insert the payment here
    await db.insert(payments).values({
      orderId: input.orderId,
      method: 'transfer',
      amountSatang: input.amountSatang,
      slipPath: input.slipPath,
      status: 'verifying',
      paidAt: new Date(),
    })

    revalidatePath(`/portal/orders/${input.token}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' }
  }
}
