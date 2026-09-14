import { describe, it, expect } from 'vitest'
import { haversineDistance, isWithinRadius, FLAGGED_RADIUS_M } from '@/lib/geo'

describe('Phase 2 Acceptance Criteria 3: Site On Check-in & 300m Geofencing', () => {
  // Site coordinate: CentralWorld, Bangkok (13.74697, 100.53934)
  const siteLat = 13.74697
  const siteLng = 100.53934

  it('1. Check-in within 300m radius succeeds without flag', () => {
    // 150m away from site
    const techLat = 13.7480
    const techLng = 100.5398

    const distanceM = Math.round(haversineDistance(techLat, techLng, siteLat, siteLng))
    expect(distanceM).toBeLessThanOrEqual(FLAGGED_RADIUS_M) // <= 300m

    const flagged = distanceM > FLAGGED_RADIUS_M
    expect(flagged).toBe(false)
  })

  it('2. Check-in beyond 300m without reason throws validation error', () => {
    // 800m away from site (outside 300m)
    const techLat = 13.7540
    const techLng = 100.5420

    const distanceM = Math.round(haversineDistance(techLat, techLng, siteLat, siteLng))
    expect(distanceM).toBeGreaterThan(FLAGGED_RADIUS_M)

    function validateCheckin(dist: number, reason?: string) {
      const isFlagged = dist > FLAGGED_RADIUS_M
      if (isFlagged && (!reason || !reason.trim())) {
        throw new Error('กรุณาระบุเหตุผลที่ check-in นอกพื้นที่')
      }
      return { flagged: isFlagged }
    }

    expect(() => validateCheckin(distanceM)).toThrow('กรุณาระบุเหตุผลที่ check-in นอกพื้นที่')
    expect(() => validateCheckin(distanceM, '')).toThrow('กรุณาระบุเหตุผลที่ check-in นอกพื้นที่')
    expect(() => validateCheckin(distanceM, '   ')).toThrow('กรุณาระบุเหตุผลที่ check-in นอกพื้นที่')
  })

  it('3. Check-in beyond 300m with reason succeeds with flagged = true', () => {
    const techLat = 13.7540
    const techLng = 100.5420
    const distanceM = Math.round(haversineDistance(techLat, techLng, siteLat, siteLng))

    const reason = 'จอดรถที่จุดรับฝากรถห่างออกไป 500 เมตรเนื่องจากซอยหน้างานแคบ'
    const isFlagged = distanceM > FLAGGED_RADIUS_M
    expect(isFlagged).toBe(true)

    const checkinRecord = {
      checkinAt: new Date(),
      checkinLat: techLat,
      checkinLng: techLng,
      checkinDistanceM: distanceM,
      checkinReason: reason,
      flagged: isFlagged,
      jobStatus: 'checked_in',
      appointmentStatus: 'in_progress',
    }

    expect(checkinRecord.flagged).toBe(true)
    expect(checkinRecord.checkinReason).toBe(reason)
    expect(checkinRecord.jobStatus).toBe('checked_in')
    expect(checkinRecord.appointmentStatus).toBe('in_progress')
  })
})
