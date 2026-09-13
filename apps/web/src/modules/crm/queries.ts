import { unstable_noStore as noStore } from 'next/cache'
import { eq, and, isNull, desc, gte, lt, lte, or, ilike } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { leads, followUps, siteVisits, leadActivities, customers } from '@wds/db'

export type LeadFilter = {
  source?: string
  status?: string
  ownerId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function getLeads(filter: LeadFilter = {}) {
  noStore()
  const db = getDb()
  const { page = 1, pageSize = 20, search, source, status, ownerId } = filter

  const conditions = [isNull(leads.deletedAt)]
  if (source) conditions.push(eq(leads.source, source))
  if (status) conditions.push(eq(leads.status, status))
  if (ownerId) conditions.push(eq(leads.ownerId, ownerId))

  const query = db
    .select({
      id: leads.id,
      status: leads.status,
      source: leads.source,
      channelRef: leads.channelRef,
      score: leads.score,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      ownerId: leads.ownerId,
      customerId: leads.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(leads)
    .leftJoin(customers, eq(leads.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return query
}

export async function getLeadById(id: string) {
  noStore()
  const db = getDb()

  const [lead] = await db
    .select()
    .from(leads)
    .leftJoin(customers, eq(leads.customerId, customers.id))
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))

  if (!lead) return null

  const activities = await db
    .select()
    .from(leadActivities)
    .where(and(eq(leadActivities.leadId, id), isNull(leadActivities.deletedAt)))
    .orderBy(desc(leadActivities.occurredAt))

  const followUpsData = await db
    .select()
    .from(followUps)
    .where(and(eq(followUps.leadId, id), isNull(followUps.deletedAt)))
    .orderBy(desc(followUps.dueAt))

  const visits = await db
    .select()
    .from(siteVisits)
    .where(and(eq(siteVisits.leadId, id), isNull(siteVisits.deletedAt)))
    .orderBy(desc(siteVisits.requestedAt))

  return { lead, activities, followUps: followUpsData, siteVisits: visits }
}

export type FollowUpPeriod = 'overdue' | 'today' | 'week'

export async function getFollowUps(assigneeId: string) {
  noStore()
  const db = getDb()
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

  const all = await db
    .select({
      id: followUps.id,
      leadId: followUps.leadId,
      dueAt: followUps.dueAt,
      channel: followUps.channel,
      status: followUps.status,
      note: followUps.note,
      customerName: customers.name,
    })
    .from(followUps)
    .leftJoin(leads, eq(followUps.leadId, leads.id))
    .leftJoin(customers, eq(leads.customerId, customers.id))
    .where(
      and(
        eq(followUps.assigneeId, assigneeId),
        eq(followUps.status, 'open'),
        isNull(followUps.deletedAt),
        lte(followUps.dueAt, endOfWeek)
      )
    )
    .orderBy(followUps.dueAt)

  return {
    overdue: all.filter(f => new Date(f.dueAt) < startOfToday),
    today: all.filter(f => {
      const d = new Date(f.dueAt)
      return d >= startOfToday && d < endOfToday
    }),
    week: all.filter(f => {
      const d = new Date(f.dueAt)
      return d >= endOfToday && d < endOfWeek
    }),
  }
}

export async function getCustomer360(customerId: string) {
  noStore()
  const db = getDb()

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), isNull(customers.deletedAt)))

  if (!customer) return null

  const customerLeads = await db
    .select({ id: leads.id, status: leads.status, source: leads.source, createdAt: leads.createdAt })
    .from(leads)
    .where(and(eq(leads.customerId, customerId), isNull(leads.deletedAt)))
    .orderBy(desc(leads.createdAt))

  const visits = await db
    .select()
    .from(siteVisits)
    .where(and(eq(siteVisits.customerId, customerId), isNull(siteVisits.deletedAt)))
    .orderBy(desc(siteVisits.requestedAt))

  return { customer, leads: customerLeads, siteVisits: visits }
}

export async function checkLeadDedupe(channelRef: string) {
  noStore()
  const db = getDb()

  return db
    .select({ id: leads.id, status: leads.status, customerId: leads.customerId })
    .from(leads)
    .where(
      and(
        eq(leads.channelRef, channelRef),
        isNull(leads.deletedAt)
      )
    )
    .limit(5)
}

export async function getPipelineLeads() {
  noStore()
  const db = getDb()

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  return db
    .select({
      id: leads.id,
      status: leads.status,
      source: leads.source,
      score: leads.score,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      customerId: leads.customerId,
      customerName: customers.name,
    })
    .from(leads)
    .leftJoin(customers, eq(leads.customerId, customers.id))
    .where(and(isNull(leads.deletedAt)))
    .orderBy(desc(leads.createdAt))
}
