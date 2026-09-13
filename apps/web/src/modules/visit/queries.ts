import { unstable_noStore as noStore } from 'next/cache'
import { eq, and, isNull, desc, gte, lt, inArray } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import {
  appointments, jobs, jobItems, jobPhotos, jobChecklists,
  teamMembers, customers, addresses, domainEvents, siteVisits
} from '@wds/db'

export async function getCoordinatorInbox() {
  noStore()
  const db = getDb()
  // Find unprocessed site_visit.requested events
  return db
    .select()
    .from(domainEvents)
    .where(
      and(
        eq(domainEvents.name, 'site_visit.requested'),
        eq(domainEvents.status, 'pending'),
        isNull(domainEvents.processedAt)
      )
    )
    .orderBy(domainEvents.occurredAt)
}


export async function getTeams() {
  noStore()
  const db = getDb()
  const { teams } = await import('@wds/db')
  return db.select().from(teams).where(isNull(teams.deletedAt))
}

export async function getTodayJobs(userId: string) {
  noStore()
  const db = getDb()

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

  // Get team IDs for this user
  const memberTeams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), isNull(teamMembers.deletedAt)))

  if (memberTeams.length === 0) return []

  const teamIds = memberTeams.map(t => t.teamId).filter(Boolean) as string[]

  return db
    .select({
      jobId: jobs.id,
      jobStatus: jobs.status,
      appointmentId: appointments.id,
      scheduledStart: appointments.scheduledStart,
      scheduledEnd: appointments.scheduledEnd,
      appointmentStatus: appointments.status,
      customerName: customers.name,
      customerPhone: customers.phone,
      addressLine1: addresses.addressLine1,
      addressLat: addresses.lat,
      addressLng: addresses.lng,
      flagged: jobs.flagged,
    })
    .from(jobs)
    .innerJoin(appointments, eq(jobs.appointmentId, appointments.id))
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(addresses, eq(appointments.addressId, addresses.id))
    .where(
      and(
        inArray(appointments.teamId, teamIds),
        isNull(jobs.deletedAt),
        isNull(appointments.deletedAt),
        gte(appointments.scheduledStart, startOfDay),
        lt(appointments.scheduledStart, endOfDay)
      )
    )
    .orderBy(appointments.scheduledStart)
}

export async function getJobById(jobId: string) {
  noStore()
  const db = getDb()

  const [job] = await db
    .select({
      id: jobs.id,
      status: jobs.status,
      checkinAt: jobs.checkinAt,
      checkinDistanceM: jobs.checkinDistanceM,
      flagged: jobs.flagged,
      workSummary: jobs.workSummary,
      appointmentId: jobs.appointmentId,
      scheduledStart: appointments.scheduledStart,
      customerName: customers.name,
      customerPhone: customers.phone,
      addressLine1: addresses.addressLine1,
      addressLat: addresses.lat,
      addressLng: addresses.lng,
      purpose: siteVisits.purpose,
      scope: siteVisits.scope,
    })
    .from(jobs)
    .innerJoin(appointments, eq(jobs.appointmentId, appointments.id))
    .leftJoin(siteVisits, eq(appointments.siteVisitId, siteVisits.id))
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(addresses, eq(appointments.addressId, addresses.id))
    .where(and(eq(jobs.id, jobId), isNull(jobs.deletedAt)))

  if (!job) return null

  const [items, photos, checklists] = await Promise.all([
    db.select().from(jobItems).where(and(eq(jobItems.jobId, jobId), isNull(jobItems.deletedAt))),
    db.select().from(jobPhotos).where(and(eq(jobPhotos.jobId, jobId), isNull(jobPhotos.deletedAt))),
    db.select().from(jobChecklists).where(and(eq(jobChecklists.jobId, jobId), isNull(jobChecklists.deletedAt))),
  ])

  return { job, items, photos, checklists }
}

export async function getWeeklyCalendar(weekStart: Date, filterTeamIds?: string[]) {
  noStore()
  const db = getDb()

  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

  const query = db
    .select({
      id: appointments.id,
      scheduledStart: appointments.scheduledStart,
      scheduledEnd: appointments.scheduledEnd,
      status: appointments.status,
      teamId: appointments.teamId,
      customerName: customers.name,
    })
    .from(appointments)
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .where(
      and(
        isNull(appointments.deletedAt),
        gte(appointments.scheduledStart, weekStart),
        lt(appointments.scheduledStart, weekEnd),
      )
    )
    .orderBy(appointments.scheduledStart)

  return query
}
