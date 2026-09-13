import { unstable_noStore as noStore } from 'next/cache'
import { eq, and, isNull, lte, gte, desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import {
  quotations, quotationItems, quotationEvents, orders, customers, jobs
} from '@wds/db'

const EXPIRY_WARN_DAYS = 3

export async function getQuotations(filters?: { status?: string }) {
  noStore()
  const db = getDb()

  const warnDate = new Date()
  warnDate.setDate(warnDate.getDate() + EXPIRY_WARN_DAYS)

  const rows = await db
    .select({
      id: quotations.id,
      number: quotations.number,
      status: quotations.status,
      totalSatang: quotations.totalSatang,
      validUntil: quotations.validUntil,
      version: quotations.version,
      customerName: customers.name,
      createdAt: quotations.createdAt,
    })
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .where(and(
      isNull(quotations.deletedAt),
      filters?.status ? eq(quotations.status, filters.status) : undefined,
    ))
    .orderBy(desc(quotations.createdAt))

  return rows.map(r => ({
    ...r,
    expiringWarn: r.validUntil != null && r.validUntil <= warnDate &&
      r.status !== 'accepted' && r.status !== 'rejected' && r.status !== 'expired',
  }))
}

export async function getQuotationById(id: string) {
  noStore()
  const db = getDb()

  const [qt] = await db
    .select()
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .where(and(eq(quotations.id, id), isNull(quotations.deletedAt)))

  if (!qt) return null

  const [items, events] = await Promise.all([
    db.select().from(quotationItems)
      .where(and(eq(quotationItems.quotationId, id), isNull(quotationItems.deletedAt)))
      .orderBy(quotationItems.sort),
    db.select().from(quotationEvents)
      .where(eq(quotationEvents.quotationId, id))
      .orderBy(quotationEvents.at),
  ])

  return { quotation: qt.quotations, customer: qt.customers, items, events }
}

export async function getQuotationByToken(token: string) {
  noStore()
  const db = getDb()

  const [qt] = await db
    .select({
      id: quotations.id,
      number: quotations.number,
      status: quotations.status,
      validUntil: quotations.validUntil,
      totalSatang: quotations.totalSatang,
      vatRate: quotations.vatRate,
      vatMode: quotations.vatMode,
      vatAmountSatang: quotations.vatAmountSatang,
      subtotalSatang: quotations.subtotalSatang,
      billDiscountSatang: quotations.billDiscountSatang,
      terms: quotations.terms,
      note: quotations.note,
      customerId: quotations.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .where(and(eq(quotations.publicToken, token), isNull(quotations.deletedAt)))

  if (!qt) return null

  const items = await db.select().from(quotationItems)
    .where(and(eq(quotationItems.quotationId, qt.id), isNull(quotationItems.deletedAt)))
    .orderBy(quotationItems.sort)

  return { quotation: qt, items }
}
