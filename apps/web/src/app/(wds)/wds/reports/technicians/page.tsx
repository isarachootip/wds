import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'

async function fetchTechnicians() {
  try {
    const { getTechnicianReport } = await import('@/modules/reports/queries')
    return await getTechnicianReport()
  } catch { return [] }
}

export default async function TechniciansReportPage() {
  noStore()
  const rows = await fetchTechnicians()

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/wds/reports" className="text-sm text-gray-500 hover:text-gray-700">← รายงาน</Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">🔧 ผลงานทีมช่าง</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">ช่าง</th>
              <th className="text-right p-4 font-medium text-gray-600">งานทั้งหมด</th>
              <th className="text-right p-4 font-medium text-gray-600">เสร็จ</th>
              <th className="text-right p-4 font-medium text-gray-600">ตรงเวลา %</th>
              <th className="text-right p-4 font-medium text-gray-600">นอกพื้นที่</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">ยังไม่มีข้อมูล</td></tr>
            ) : rows.map(r => (
              <tr key={r.user_id} className="border-b border-gray-100">
                <td className="p-4 font-medium">{r.full_name ?? '-'}</td>
                <td className="p-4 text-right">{r.total_jobs}</td>
                <td className="p-4 text-right text-green-700">{r.completed_jobs}</td>
                <td className="p-4 text-right">
                  <span className={r.on_time_pct >= 80 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                    {r.on_time_pct ?? 0}%
                  </span>
                </td>
                <td className="p-4 text-right">
                  <span className={r.flagged_jobs > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                    {r.flagged_jobs}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <a href="/api/reports/technicians/export?format=csv"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">📥 Export CSV</a>
        <a href="/api/reports/technicians/export?format=xlsx"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">📊 Export Excel</a>
      </div>
    </div>
  )
}
