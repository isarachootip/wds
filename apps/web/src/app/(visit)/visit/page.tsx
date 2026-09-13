import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { OfflineStatus } from '@/components/OfflineStatus'

type TodayJob = {
  jobId: string
  jobStatus: string
  appointmentId: string
  scheduledStart: Date | null
  scheduledEnd: Date | null
  customerName: string | null
  customerPhone: string | null
  addressLine1: string | null
  addressLat: number | null
  addressLng: number | null
  flagged: boolean | null
}

async function fetchTodayJobs(): Promise<TodayJob[]> {
  try {
    const { getTodayJobs } = await import('@/modules/visit/queries')
    const data = await getTodayJobs('current-user-id')  // TODO: get real userId from session
    return data as TodayJob[]
  } catch {
    return []
  }
}

const JOB_STATUS_LABELS: Record<string, string> = {
  pending: 'รอเริ่มงาน',
  checked_in: 'Check-in แล้ว',
  in_progress: 'กำลังทำงาน',
  checked_out: 'Check-out แล้ว',
  closed: 'ปิดแล้ว',
}

const JOB_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  checked_in: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  checked_out: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-400',
}

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export default async function VisitTodayPage() {
  noStore()
  const jobs = await fetchTodayJobs()

  const now = new Date()
  const dateStr = now.toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineStatus />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-gray-900">งานวันนี้</h1>
        <p className="text-sm text-gray-500 mt-0.5">{dateStr}</p>
        {jobs.length > 0 && (
          <p className="text-sm text-blue-600 mt-1 font-medium">{jobs.length} งานรออยู่</p>
        )}
      </div>

      {/* Jobs list */}
      <div className="px-4 py-4 space-y-3">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-600 font-medium">ไม่มีงานวันนี้</p>
            <p className="text-gray-400 text-sm mt-1">พักผ่อนได้เลย!</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.jobId} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4">
                {/* Time badge */}
                {job.scheduledStart && (
                  <div className="text-xs font-medium text-blue-600 mb-2">
                    🕐 {new Date(job.scheduledStart).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    {job.scheduledEnd && (
                      <span className="text-gray-400">
                        {' – '}
                        {new Date(job.scheduledEnd).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                )}

                {/* Customer */}
                <h3 className="text-base font-semibold text-gray-900">
                  {job.customerName ?? 'ไม่ระบุลูกค้า'}
                </h3>
                {job.customerPhone && (
                  <a href={`tel:${job.customerPhone}`} className="text-sm text-blue-600 mt-0.5 block">
                    📞 {job.customerPhone}
                  </a>
                )}
                {job.addressLine1 && (
                  <p className="text-sm text-gray-500 mt-1">📍 {job.addressLine1}</p>
                )}

                {/* Status + flagged */}
                <div className="flex items-center gap-2 mt-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[job.jobStatus] ?? 'bg-gray-100'}`}>
                    {JOB_STATUS_LABELS[job.jobStatus] ?? job.jobStatus}
                  </span>
                  {job.flagged && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">⚠️ Flagged</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <Link
                  href={`/visit/jobs/${job.jobId}`}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl text-center hover:bg-blue-700 transition-colors"
                >
                  ดูรายละเอียด →
                </Link>
                {job.addressLat && job.addressLng && (
                  <a
                    href={googleMapsUrl(job.addressLat, job.addressLng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 text-sm rounded-xl hover:bg-green-100"
                  >
                    🗺️ นำทาง
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
