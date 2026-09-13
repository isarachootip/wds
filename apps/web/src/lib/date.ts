export const TIMEZONE = 'Asia/Bangkok'

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

export function nowBangkok(): Date {
  const now = new Date()
  const tzStr = now.toLocaleString('en-US', { timeZone: TIMEZONE })
  return new Date(tzStr)
}

export function formatThaiDate(date: Date): string {
  const d = date.getDate()
  const m = THAI_MONTHS[date.getMonth()]
  const y = date.getFullYear() + 543
  return `${d} ${m} ${y}`
}

export function formatThaiDateTime(date: Date): string {
  const time = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  return `${formatThaiDate(date)} ${time} น.`
}

export function formatThaiShortDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = String((date.getFullYear() + 543) % 100).padStart(2, '0')
  return `${d}/${m}/${y}`
}

export function toDBDate(date: Date): string {
  return date.toISOString()
}
