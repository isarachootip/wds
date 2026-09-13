import { unstable_noStore as noStore } from 'next/cache'
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import {
  orders, payments, deliveries, deliveryItems,
  customers, creditChecks, customerCredit, invoices
} from '@wds/db'
import { quotations } from '@wds/db'

export async function getOrders(filters?: { status?: string }) {
  noStore()
  const db = getDb()
  return db
    .select({
      id: orders.id,
      number: orders.number,
      status: orders.status,
      totalSatang: orders.totalSatang,
      creditCheckResult: orders.creditCheckResult,
      creditUsedPct: orders.creditUsedPct,
      createdAt: orders.createdAt,
      customerName: customers.name,
      quotationNumber: quotations.number,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(quotations, eq(orders.quotationId, quotations.id))
    .where(and(
      isNull(orders.deletedAt),
      filters?.status ? eq(orders.status, filters.status) : undefined,
    ))
    .orderBy(desc(orders.createdAt))
}

export async function getOrderById(id: string) {
  noStore()
  const db = getDb()

  const [order] = await db
    .select()
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(quotations, eq(orders.quotationId, quotations.id))
    .where(and(eq(orders.id, id), isNull(orders.deletedAt)))

  if (!order) return null

  const [orderPayments, orderDeliveries, orderCreditChecks] = await Promise.all([
    db.select().from(payments)
      .where(and(eq(payments.orderId, id), isNull(payments.deletedAt)))
      .orderBy(desc(payments.createdAt)),
    db.select().from(deliveries)
      .where(and(eq(deliveries.orderId, id), isNull(deliveries.deletedAt)))
      .orderBy(desc(deliveries.createdAt)),
    db.select().from(creditChecks)
      .where(eq(creditChecks.orderId, id))
      .orderBy(desc(creditChecks.createdAt)),
  ])

  // Sum confirmed payments
  const confirmedSatang = orderPayments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amountSatang, 0)

  return {
    order: order.orders,
    customer: order.customers,
    quotation: order.quotations,
    payments: orderPayments,
    deliveries: orderDeliveries,
    creditChecks: orderCreditChecks,
    confirmedSatang,
  }
}

export async function getPendingPayments() {
  noStore()
  const db = getDb()
  return db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      orderNumber: orders.number,
      method: payments.method,
      amountSatang: payments.amountSatang,
      status: payments.status,
      slipPath: payments.slipPath,
      refNo: payments.refNo,
      customerName: customers.name,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .leftJoin(orders, eq(payments.orderId, orders.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(
      inArray(payments.status, ['pending', 'verifying']),
      isNull(payments.deletedAt)
    ))
    .orderBy(payments.createdAt)
}

export async function getCreditHoldOrders() {
  noStore()
  const db = getDb()

  const holdOrders = await db
    .select({
      id: orders.id,
      number: orders.number,
      status: orders.status,
      totalSatang: orders.totalSatang,
      createdAt: orders.createdAt,
      customerName: customers.name,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(eq(orders.status, 'credit_hold'), isNull(orders.deletedAt)))
    .orderBy(orders.createdAt)

  // For each order, get latest credit check reason
  const enriched = await Promise.all(holdOrders.map(async (o) => {
    const [latestCheck] = await db.select({ reason: creditChecks.reason, decision: creditChecks.decision })
      .from(creditChecks)
      .where(eq(creditChecks.orderId, o.id))
      .orderBy(desc(creditChecks.createdAt))
      .limit(1)
    return { ...o, holdReason: latestCheck?.reason ?? 'ไม่ทราบเหตุผล' }
  }))

  return enriched
}

export async function getDeliveries(driverId?: string) {
  noStore()
  const db = getDb()

  const conditions = [isNull(deliveries.deletedAt)]
  if (driverId) conditions.push(eq(deliveries.driverId, driverId))

  return db
    .select({
      id: deliveries.id,
      orderId: deliveries.orderId,
      orderNumber: orders.number,
      status: deliveries.status,
      scheduledDate: deliveries.scheduledDate,
      deliveredAt: deliveries.deliveredAt,
      attempt: deliveries.attempt,
      driverId: deliveries.driverId,
      vehicle: deliveries.vehicle,
      customerName: customers.name,
    })
    .from(deliveries)
    .leftJoin(orders, eq(deliveries.orderId, orders.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(deliveries.scheduledDate)
}

export async function getDeliveryById(id: string) {
  noStore()
  const db = getDb()
  const [d] = await db
    .select()
    .from(deliveries)
    .leftJoin(orders, eq(deliveries.orderId, orders.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(eq(deliveries.id, id), isNull(deliveries.deletedAt)))
  if (!d) return null

  const items = await db.select().from(deliveryItems)
    .where(eq(deliveryItems.deliveryId, id))

  return { delivery: d.deliveries, order: d.orders, customer: d.customers, items }
}

export async function getOrderByPublicToken(token: string) {
  noStore()
  const db = getDb()

  // Find quotation by token → get order
  const [qt] = await db
    .select({ id: quotations.id, customerId: quotations.customerId })
    .from(quotations)
    .where(eq(quotations.publicToken, token))

  if (!qt) return null

  const [order] = await db
    .select()
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(eq(orders.quotationId, qt.id), isNull(orders.deletedAt)))

  if (!order) return null

  const orderPayments = await db.select().from(payments)
    .where(and(eq(payments.orderId, order.orders.id), isNull(payments.deletedAt)))
    .orderBy(payments.createdAt)

  const orderDeliveries = await db.select({
    id: deliveries.id,
    status: deliveries.status,
    scheduledDate: deliveries.scheduledDate,
    deliveredAt: deliveries.deliveredAt,
    receiverName: deliveries.receiverName,
  })
    .from(deliveries)
    .where(and(eq(deliveries.orderId, order.orders.id), isNull(deliveries.deletedAt)))

  return {
    order: order.orders,
    customer: order.customers,
    payments: orderPayments,
    deliveries: orderDeliveries,
    publicToken: token,
  }
}
