import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 08:00-18:00

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-200 text-blue-800',
  in_progress: 'bg-yellow-200 text-yellow-800',
  completed: 'bg-green-200 text-green-800',
  cancelled: 'bg-gray-200 text-gray-500',
  no_show: 'bg-red-200 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'นัดแล้ว',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
  no_show: 'ไม่มา',
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  noStore()
  const params = await searchParams

  const weekStart = params.week ? startOfWeek(new Date(params.week)) : startOfWeek(new Date())
  const prevWeek = new Date(weekStart)
  prevWeek.setDate(prevWeek.getDate() - 7)
  const nextWeek = new Date(weekStart)
  nextWeek.setDate(nextWeek.getDate() + 7)

  let appointments: any[] = []
  try {
    const { getWeeklyCalendar } = await import('@/modules/visit/queries')
    appointments = (await getWeeklyCalendar(weekStart)).map((a: any) => ({
      ...a,
      scheduledStart: new Date(a.scheduledStart),
      scheduledEnd: a.scheduledEnd ? new Date(a.scheduledEnd) : null,
    }))
  } catch {}

  const weekDates = getWeekDates(weekStart)

  function appointmentsForDay(date: Date, hour: number) {
    return appointments.filter((a: any) => {
      if (!a.scheduledStart) return false
      const d = new Date(a.scheduledStart)
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate() &&
        d.getHours() === hour
      )
    })
  }

  const todayStr = new Date().toDateString()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ปฏิทินงาน</h1>
          <p className="text-sm text-gray-500 mt-1">
            {weekDates[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            {' – '}
            {weekDates[6].toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/wds/appointments/calendar?week=${prevWeek.toISOString().split('T')[0]}`}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            ← สัปดาห์ก่อน
          </Link>
          <Link
            href="/wds/appointments/calendar"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            สัปดาห์นี้
          </Link>
          <Link
            href={`/wds/appointments/calendar?week=${nextWeek.toISOString().split('T')[0]}`}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            สัปดาห์ถัดไป →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-3 text-xs text-gray-400" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === todayStr
            return (
              <div key={i} className={`p-3 text-center border-l border-gray-100 ${isToday ? 'bg-blue-50' : ''}`}>
                <div className="text-xs text-gray-500">{DAYS_TH[date.getDay()]}</div>
                <div className={`text-lg font-semibold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time rows */}
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-16">
            <div className="p-2 text-xs text-gray-400 text-right pr-3 pt-2">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDates.map((date, di) => {
              const isToday = date.toDateString() === todayStr
              const dayAppts = appointmentsForDay(date, hour)
              return (
                <div key={di} className={`border-l border-gray-100 p-1 ${isToday ? 'bg-blue-50/40' : ''}`}>
                  {dayAppts.map((a: any) => (
                    <div
                      key={a.id}
                      className={`rounded p-1.5 text-xs mb-1 ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      <div className="font-medium truncate">{a.customerName ?? 'ไม่ระบุ'}</div>
                      <div className="opacity-70">
                        {new Date(a.scheduledStart).toLocaleTimeString('th-TH', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color.split(' ')[0]}`} />
            <span>{STATUS_LABELS[status] ?? status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}