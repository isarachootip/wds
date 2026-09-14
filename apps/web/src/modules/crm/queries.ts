import { unstable_noStore as noStore } from 'next/cache'
import { eq, and, isNull, desc, gte, lt, lte, or, ilike, inArray, notInArray } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import {
  leads, followUps, siteVisits, leadActivities, customers, addresses,
  quotations, orders, appointments, jobs
} from '@wds/db'

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

export type LeadQuotationSummary = {
  id: string
  number: string | null
  status: string
  subtotalSatang: number
  vatAmountSatang: number
  totalSatang: number
  validUntil: Date | null
  createdAt: Date
}

export type LeadSiteVisitDetail = typeof siteVisits.$inferSelect & {
  appointment?: typeof appointments.$inferSelect | null
  job?: {
    id: string
    appointmentId: string
    status: string
    checkinAt: Date | null
    checkinLat: number | null
    checkinLng: number | null
    checkinDistanceM: number | null
    checkinReason: string | null
    flagged: boolean | null
    checkoutAt: Date | null
    checkoutLat: number | null
    checkoutLng: number | null
    workSummary: string | null
    customerSignaturePath: string | null
    nextAction: string | null
  } | null
  appointments?: Array<typeof appointments.$inferSelect & { job?: any }>
  checkinAt?: Date | null
  checkinLat?: number | null
  checkinLng?: number | null
  checkinDistanceM?: number | null
  checkoutAt?: Date | null
  checkoutLat?: number | null
  checkoutLng?: number | null
  workSummary?: string | null
  customerSignaturePath?: string | null
}

export type LeadDetailWithRelations = {
  lead: {
    leads: typeof leads.$inferSelect
    customers: typeof customers.$inferSelect | null
  }
  activities: (typeof leadActivities.$inferSelect)[]
  followUps: (typeof followUps.$inferSelect)[]
  siteVisits: LeadSiteVisitDetail[]
  quotations: LeadQuotationSummary[]
}

export async function getLeadById(id: string): Promise<LeadDetailWithRelations | null> {
  noStore()
  const db = getDb()

  const [lead] = await db
    .select()
    .from(leads)
    .leftJoin(customers, eq(leads.customerId, customers.id))
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))

  if (!lead) return null

  let activities: (typeof leadActivities.$inferSelect)[] = []
  try {
    activities = await db
      .select()
      .from(leadActivities)
      .where(and(eq(leadActivities.leadId, id), isNull(leadActivities.deletedAt)))
      .orderBy(desc(leadActivities.occurredAt))
  } catch {
    activities = []
  }

  let followUpsData: (typeof followUps.$inferSelect)[] = []
  try {
    followUpsData = await db
      .select()
      .from(followUps)
      .where(and(eq(followUps.leadId, id), isNull(followUps.deletedAt)))
      .orderBy(desc(followUps.dueAt))
  } catch {
    followUpsData = []
  }

  let rawVisits: (typeof siteVisits.$inferSelect)[] = []
  try {
    rawVisits = await db
      .select()
      .from(siteVisits)
      .where(and(eq(siteVisits.leadId, id), isNull(siteVisits.deletedAt)))
      .orderBy(desc(siteVisits.requestedAt))
  } catch {
    rawVisits = []
  }

  let siteVisitsWithRelations: LeadSiteVisitDetail[] = (rawVisits ?? []).map(v => ({
    ...v,
    appointment: null,
    job: null,
    appointments: [],
    checkinAt: null,
    checkinLat: null,
    checkinLng: null,
    checkinDistanceM: null,
    checkoutAt: null,
    checkoutLat: null,
    checkoutLng: null,
    workSummary: null,
    customerSignaturePath: null,
  }))

  const visitIds = (rawVisits ?? []).map(v => v.id).filter(Boolean)
  if (visitIds.length > 0) {
    try {
      const apptsAndJobs = await db
        .select({
          appointment: appointments,
          job: {
            id: jobs.id,
            appointmentId: jobs.appointmentId,
            status: jobs.status,
            checkinAt: jobs.checkinAt,
            checkinLat: jobs.checkinLat,
            checkinLng: jobs.checkinLng,
            checkinDistanceM: jobs.checkinDistanceM,
            checkinReason: jobs.checkinReason,
            flagged: jobs.flagged,
            checkoutAt: jobs.checkoutAt,
            checkoutLat: jobs.checkoutLat,
            checkoutLng: jobs.checkoutLng,
            workSummary: jobs.workSummary,
            customerSignaturePath: jobs.customerSignaturePath,
            nextAction: jobs.nextAction,
          },
        })
        .from(appointments)
        .leftJoin(jobs, and(eq(jobs.appointmentId, appointments.id), isNull(jobs.deletedAt)))
        .where(and(inArray(appointments.siteVisitId, visitIds), isNull(appointments.deletedAt)))

      siteVisitsWithRelations = (rawVisits ?? []).map(v => {
        const vAppts = (apptsAndJobs ?? []).filter(a => a.appointment?.siteVisitId === v.id)
        const primaryAppt = vAppts[0]?.appointment ?? null
        const primaryJob = vAppts[0]?.job?.id ? vAppts[0].job : null

        return {
          ...v,
          appointment: primaryAppt,
          job: primaryJob,
          appointments: vAppts.map(a => ({
            ...a.appointment,
            job: a.job?.id ? a.job : null,
          })),
          checkinAt: primaryJob?.checkinAt ?? null,
          checkinLat: primaryJob?.checkinLat ?? null,
          checkinLng: primaryJob?.checkinLng ?? null,
          checkinDistanceM: primaryJob?.checkinDistanceM ?? null,
          checkoutAt: primaryJob?.checkoutAt ?? null,
          checkoutLat: primaryJob?.checkoutLat ?? null,
          checkoutLng: primaryJob?.checkoutLng ?? null,
          workSummary: primaryJob?.workSummary ?? null,
          customerSignaturePath: primaryJob?.customerSignaturePath ?? null,
        }
      })
    } catch {
      // Graceful fallback preserves raw visits with null check-in metrics
    }
  }

  let quotes: LeadQuotationSummary[] = []
  try {
    quotes = await db
      .select({
        id: quotations.id,
        number: quotations.number,
        status: quotations.status,
        subtotalSatang: quotations.subtotalSatang,
        vatAmountSatang: quotations.vatAmountSatang,
        totalSatang: quotations.totalSatang,
        validUntil: quotations.validUntil,
        createdAt: quotations.createdAt,
      })
      .from(quotations)
      .where(and(eq(quotations.leadId, id), isNull(quotations.deletedAt)))
      .orderBy(desc(quotations.createdAt))
  } catch {
    quotes = []
  }

  return {
    lead,
    activities: activities ?? [],
    followUps: followUpsData ?? [],
    siteVisits: siteVisitsWithRelations ?? [],
    quotations: quotes ?? [],
  }
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

  // 1. Lead history
  const customerLeads = await db
    .select({ id: leads.id, status: leads.status, source: leads.source, createdAt: leads.createdAt })
    .from(leads)
    .where(and(eq(leads.customerId, customerId), isNull(leads.deletedAt)))
    .orderBy(desc(leads.createdAt))

  // 2. Site visits with address & technician jobs
  const visits = await db
    .select()
    .from(siteVisits)
    .where(and(eq(siteVisits.customerId, customerId), isNull(siteVisits.deletedAt)))
    .orderBy(desc(siteVisits.requestedAt))

  // 3. Site addresses (lat/lng for site work)
  let customerAddresses: (typeof addresses.$inferSelect)[] = []
  try {
    customerAddresses = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.customerId, customerId), isNull(addresses.deletedAt)))
  } catch {
    customerAddresses = []
  }

  // 4. Completed/Existing Orders and accumulated purchase volume
  let customerOrders: (typeof orders.$inferSelect)[] = []
  let totalPurchasedSatang = 0
  try {
    customerOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.customerId, customerId), isNull(orders.deletedAt)))
      .orderBy(desc(orders.createdAt))

    totalPurchasedSatang = customerOrders.reduce((sum, o) => sum + (Number(o.totalSatang) || 0), 0)
  } catch {
    customerOrders = []
  }

  return {
    customer,
    leads: customerLeads,
    siteVisits: visits,
    addresses: customerAddresses,
    orders: customerOrders,
    totalPurchasedSatang,
  }
}

export async function getStaleLeads(days = 7) {
  noStore()
  const db = getDb()
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return db
    .select({
      id: leads.id,
      status: leads.status,
      source: leads.source,
      ownerId: leads.ownerId,
      customerId: leads.customerId,
      customerName: customers.name,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
    })
    .from(leads)
    .leftJoin(customers, eq(leads.customerId, customers.id))
    .where(
      and(
        isNull(leads.deletedAt),
        lte(leads.updatedAt, cutoff),
        notInArray(leads.status, ['won', 'lost'])
      )
    )
    .orderBy(desc(leads.updatedAt))
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
