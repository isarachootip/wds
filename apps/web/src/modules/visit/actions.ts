'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { withTransaction } from '@/modules/shared/with-transaction'
import { transition } from '@/lib/statemachine'
import { emit } from '@/lib/events'
import { APPOINTMENT_MACHINE, JOB_MACHINE } from './appointment-machine'
import {
  appointments, jobs, jobItems, jobPhotos, jobChecklists,
  domainEvents, auditLog, siteVisits, teams
} from '@wds/db'
import { haversineDistance, FLAGGED_RADIUS_M } from '@/lib/geo'

const DEFAULT_CHECKLIST = [
  'ตรวจสอบพื้นที่ก่อนเริ่มงาน',
  'แจ้งลูกค้าก่อนเริ่มงาน',
  'ใส่อุปกรณ์ป้องกันส่วนบุคคล',
  'ดำเนินงานตามขอบเขตที่ตกลง',
  'ทำความสะอาดพื้นที่หลังงาน',
  'ตรวจสอบคุณภาพงานก่อน check out',
]

export async function approveAppointmentAction(
  domainEventId: string,
  siteVisitId: string,
  data: {
    customerId?: string
    addressId?: string
    scheduledStart: string
    scheduledEnd: string
    teamId: string
  },
  actorId: string
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    const db = getDb()

    const appointmentId = await withTransaction(db, async (tx) => {
      // 1. Mark domain event as processed
      await tx.update(domainEvents).set({
        status: 'processed',
        processedAt: new Date(),
      }).where(eq(domainEvents.id, domainEventId))

      // 2. Update site_visit status
      await tx.update(siteVisits).set({
        status: 'scheduled',
        updatedBy: actorId,
      }).where(eq(siteVisits.id, siteVisitId))

      // 3. Create appointment
      const [appt] = await tx.insert(appointments).values({
        siteVisitId,
        customerId: data.customerId ?? undefined,
        addressId: data.addressId ?? undefined,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        teamId: data.teamId,
        status: 'scheduled',
        approvedBy: actorId,
        approvedAt: new Date(),
        createdBy: actorId,
        updatedBy: actorId,
      }).returning({ id: appointments.id })

      // 4. Create pending job
      const [job] = await tx.insert(jobs).values({
        appointmentId: appt.id,
        status: 'pending',
        createdBy: actorId,
        updatedBy: actorId,
      }).returning({ id: jobs.id })

      // 5. Create default checklist
      for (const item of DEFAULT_CHECKLIST) {
        await tx.insert(jobChecklists).values({
          jobId: job.id,
          templateKey: 'standard',
          item,
          checked: false,
        })
      }

      // 6. Emit appointment.approved event
      await emit(tx as any, domainEvents, 'appointment.approved', 'appointment', appt.id, {
        appointmentId: appt.id,
        jobId: job.id,
        siteVisitId,
        teamId: data.teamId,
        scheduledStart: data.scheduledStart,
      })

      return appt.id
    })

    revalidatePath('/wds/appointments')
    revalidatePath('/wds/appointments/calendar')
    return { success: true, appointmentId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function rejectAppointmentAction(
  domainEventId: string,
  siteVisitId: string,
  reason: string,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!reason.trim()) throw new Error('กรุณาระบุเหตุผลที่ปฏิเสธ')
    const db = getDb()

    await withTransaction(db, async (tx) => {
      await tx.update(domainEvents).set({
        status: 'failed',
        processedAt: new Date(),
      }).where(eq(domainEvents.id, domainEventId))

      await tx.update(siteVisits).set({
        status: 'cancelled',
        updatedBy: actorId,
      }).where(eq(siteVisits.id, siteVisitId))

      await emit(tx as any, domainEvents, 'appointment.rejected', 'site_visit', siteVisitId, {
        siteVisitId,
        reason,
        rejectedBy: actorId,
      })
    })

    revalidatePath('/wds/appointments')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function checkInJobAction(
  jobId: string,
  lat: number,
  lng: number,
  actorId: string,
  reason?: string,
  siteLat?: number,
  siteLng?: number
): Promise<{ success: boolean; flagged?: boolean; distanceM?: number; error?: string }> {
  try {
    const db = getDb()
    const [job] = await db.select({ status: jobs.status, appointmentId: jobs.appointmentId })
      .from(jobs).where(and(eq(jobs.id, jobId), isNull(jobs.deletedAt)))
    if (!job) throw new Error('ไม่พบงาน')

    const distanceM = (siteLat != null && siteLng != null)
      ? Math.round(haversineDistance(lat, lng, siteLat, siteLng))
      : 0

    const flagged = distanceM > FLAGGED_RADIUS_M
    if (flagged && !reason) throw new Error('กรุณาระบุเหตุผลที่ check-in นอกพื้นที่')

    await withTransaction(db, async (tx) => {
      // Transition job: pending → checked_in
      await transition(tx as any, auditLog, JOB_MACHINE, jobId, job.status, 'checked_in', actorId)

      await tx.update(jobs).set({
        status: 'checked_in',
        checkinAt: new Date(),
        checkinLat: lat,
        checkinLng: lng,
        checkinDistanceM: distanceM,
        checkinReason: reason ?? null,
        flagged,
        updatedBy: actorId,
      }).where(eq(jobs.id, jobId))

      // Update appointment → in_progress
      await tx.update(appointments).set({
        status: 'in_progress',
        updatedBy: actorId,
      }).where(eq(appointments.id, job.appointmentId))
    })

    revalidatePath(`/visit/jobs/${jobId}`)
    revalidatePath('/visit')
    return { success: true, flagged, distanceM }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function addJobItemAction(
  jobId: string,
  item: { productId?: string; description: string; qty: number; unit: string; unitPriceSatang: number },
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await db.insert(jobItems).values({
      jobId,
      productId: item.productId ?? undefined,
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      unitPriceSatang: item.unitPriceSatang,
      source: 'added_onsite',
    })
    revalidatePath(`/visit/jobs/${jobId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function updateChecklistItemAction(
  checklistId: string,
  checked: boolean,
  note: string | undefined,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await db.update(jobChecklists).set({ checked, note: note ?? null, updatedAt: new Date() })
      .where(eq(jobChecklists.id, checklistId))
    revalidatePath(`/visit/jobs/${jobId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function saveWorkSummaryAction(
  jobId: string,
  summary: string,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await db.update(jobs).set({ workSummary: summary, updatedBy: actorId })
      .where(eq(jobs.id, jobId))
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

export async function recordPhotoAction(
  jobId: string,
  storagePath: string,
  kind: 'before' | 'during' | 'after' | 'issue',
  caption: string | undefined
): Promise<{ success: boolean; photoId?: string; error?: string }> {
  try {
    const db = getDb()
    const [photo] = await db.insert(jobPhotos).values({
      jobId,
      storagePath,
      kind,
      caption: caption ?? null,
    }).returning({ id: jobPhotos.id })
    revalidatePath(`/visit/jobs/${jobId}`)
    return { success: true, photoId: photo.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}

type CheckoutData = {
  lat: number
  lng: number
  signaturePath: string
  nextAction?: string
}

export async function checkoutJobAction(
  jobId: string,
  data: CheckoutData,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()

    const [job] = await db.select({ status: jobs.status, appointmentId: jobs.appointmentId })
      .from(jobs).where(and(eq(jobs.id, jobId), isNull(jobs.deletedAt)))
    if (!job) throw new Error('ไม่พบงาน')

    // Validate requirements
    const [photos, checklists] = await Promise.all([
      db.select().from(jobPhotos)
        .where(and(eq(jobPhotos.jobId, jobId), isNull(jobPhotos.deletedAt))),
      db.select().from(jobChecklists)
        .where(and(eq(jobChecklists.jobId, jobId), isNull(jobChecklists.deletedAt))),
    ])

    const afterPhotos = photos.filter(p => p.kind === 'after')
    if (afterPhotos.length === 0) throw new Error('ต้องมีรูปถ่าย "หลังงาน" อย่างน้อย 1 รูป')

    const unchecked = checklists.filter(c => !c.checked)
    if (unchecked.length > 0) throw new Error(`ต้องติ๊ก checklist ให้ครบ (เหลือ ${unchecked.length} รายการ)`)

    if (!data.signaturePath) throw new Error('ต้องมีลายเซ็นลูกค้า')

    // Get all job items for event payload
    const items = await db.select().from(jobItems)
      .where(and(eq(jobItems.jobId, jobId), isNull(jobItems.deletedAt)))

    await withTransaction(db, async (tx) => {
      await transition(tx as any, auditLog, JOB_MACHINE, jobId, job.status, 'checked_out', actorId)

      await tx.update(jobs).set({
        status: 'checked_out',
        checkoutAt: new Date(),
        checkoutLat: data.lat,
        checkoutLng: data.lng,
        customerSignaturePath: data.signaturePath,
        nextAction: data.nextAction ?? null,
        updatedBy: actorId,
      }).where(eq(jobs.id, jobId))

      // Update appointment → completed
      await tx.update(appointments).set({
        status: 'completed',
        updatedBy: actorId,
      }).where(eq(appointments.id, job.appointmentId))

      // Emit job.checked_out — สำหรับ WDS เพื่อตั้งรายการรอเก็บเงิน
      await emit(tx as any, domainEvents, 'job.checked_out', 'job', jobId, {
        jobId,
        appointmentId: job.appointmentId,
        checkedOutBy: actorId,
        checkedOutAt: new Date().toISOString(),
      })

      // Emit job.work_recorded — สำหรับ E-ordering เพื่อสร้าง QT ตั้งต้น
      await emit(tx as any, domainEvents, 'job.work_recorded', 'job', jobId, {
        jobId,
        appointmentId: job.appointmentId,
        items: items.map(i => ({
          id: i.id,
          productId: i.productId,
          description: i.description,
          qty: i.qty,
          unit: i.unit,
          unitPriceSatang: i.unitPriceSatang,
          source: i.source,
        })),
        workSummary: job.status,
        signaturePath: data.signaturePath,
      })
    })

    revalidatePath(`/visit/jobs/${jobId}`)
    revalidatePath('/visit')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}
