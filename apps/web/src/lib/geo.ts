/**
 * Haversine formula — distance between two GPS coordinates in meters
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const CHECKIN_RADIUS_M = 300
export const FLAGGED_RADIUS_M = 300

export function isWithinRadius(
  userLat: number, userLng: number,
  siteLat: number, siteLng: number,
  radiusM = CHECKIN_RADIUS_M
): boolean {
  return haversineDistance(userLat, userLng, siteLat, siteLng) <= radiusM
}

/** Format distance for display */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} ม.`
  return `${(meters / 1000).toFixed(1)} กม.`
}

/** Build Google Maps directions URL */
export function googleMapsUrl(lat: number, lng: number, label?: string): string {
  const dest = `${lat},${lng}`
  if (label) return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=${encodeURIComponent(label)}`
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`
}
