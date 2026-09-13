import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'

const SOURCE_LABELS: Record<string, string> = {
  line: '💬 LINE OA', phone: '📞 โทรศัพท์', store: '🏪 หน้าร้าน', other: '🌐 อื่นๆ'
}

async function fetchChannels() {
  try {
    const { getChannelReport } = await import('@/modules/reports/queries')
    return await getChannelReport()
  } catch { return [] }
}

export default async function ChannelsReportPage() {
  noStore()
  const rows = await fetchChannels()
  const totalLeads = rows.reduce((s, r) => s + r.lead_count, 0)

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/wds/reports" className="text-sm text-gray-500 hover:text-gray-700">← รายงาน</Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">📡 รายงานช่องทาง</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">ช่องทาง</th>
              <th className="text-right p-4 font-medium text-gray-600">Lead</th>
              <th className="text-right p-4 font-medium text-gray-600">สัดส่วน</th>
              <th className="text-right p-4 font-medium text-gray-600">Win Rate</th>
              <th className="text-right p-4 font-medium text-gray-600">มูลค่าเฉลี่ย</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">ยังไม่มีข้อมูล</td></tr>
            ) : rows.map(r => (
              <tr key={r.source} className="border-b border-gray-100">
                <td className="p-4 font-medium">{SOURCE_LABELS[r.source] ?? r.source}</td>
                <td className="p-4 text-right font-bold">{r.lead_count}</td>
                <td className="p-4 text-right text-gray-500">
                  {totalLeads > 0 ? `${Math.round(r.lead_count / totalLeads * 100)}%` : '—'}
                </td>
                <td className="p-4 text-right text-green-700 font-medium">{r.win_rate_pct ?? 0}%</td>
                <td className="p-4 text-right">
                  {r.avg_order_satang > 0 ? `฿${satangToBaht(r.avg_order_satang)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <a href="/api/reports/channels/export?format=csv"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">📥 Export CSV</a>
        <a href="/api/reports/channels/export?format=xlsx"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">📊 Export Excel</a>
      </div>
    </div>
  )
}
