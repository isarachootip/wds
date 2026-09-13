import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'

async function fetchArAging() {
  try {
    const { getArAgingReport } = await import('@/modules/reports/queries')
    return await getArAgingReport()
  } catch { return [] }
}

function sumBucket(rows: Awaited<ReturnType<typeof fetchArAging>>, key: keyof (typeof rows)[0]) {
  return rows.reduce((s, r) => s + (Number(r[key]) || 0), 0)
}

export default async function ArAgingPage() {
  noStore()
  const rows = await fetchArAging()

  const totals = {
    bucket_0_30: sumBucket(rows, 'bucket_0_30'),
    bucket_31_60: sumBucket(rows, 'bucket_31_60'),
    bucket_61_90: sumBucket(rows, 'bucket_61_90'),
    bucket_90plus: sumBucket(rows, 'bucket_90plus'),
    total_outstanding: sumBucket(rows, 'total_outstanding'),
  }

  return (
    <div className="p-6">
      <Link href="/wds/reports" className="text-sm text-gray-500 hover:text-gray-700">← รายงาน</Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">💳 ลูกหนี้คงค้าง</h1>

      {/* Summary boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '0–30 วัน', value: totals.bucket_0_30, color: 'text-yellow-700' },
          { label: '31–60 วัน', value: totals.bucket_31_60, color: 'text-orange-600' },
          { label: '61–90 วัน', value: totals.bucket_61_90, color: 'text-red-600' },
          { label: '90+ วัน', value: totals.bucket_90plus, color: 'text-red-800' },
        ].map(b => (
          <div key={b.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{b.label}</p>
            <p className={`text-lg font-bold ${b.color}`}>฿{satangToBaht(b.value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">ลูกค้า</th>
              <th className="text-right p-4 font-medium text-gray-600">0–30 วัน</th>
              <th className="text-right p-4 font-medium text-gray-600">31–60 วัน</th>
              <th className="text-right p-4 font-medium text-gray-600">61–90 วัน</th>
              <th className="text-right p-4 font-medium text-gray-600 text-red-600">90+ วัน</th>
              <th className="text-right p-4 font-medium text-gray-600">รวม</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">ไม่มีลูกหนี้คงค้าง</td></tr>
            ) : rows.map(r => (
              <tr key={r.customer_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium">{r.customer_name}</td>
                <td className="p-4 text-right">{r.bucket_0_30 > 0 ? `฿${satangToBaht(r.bucket_0_30)}` : '—'}</td>
                <td className="p-4 text-right text-orange-600">{r.bucket_31_60 > 0 ? `฿${satangToBaht(r.bucket_31_60)}` : '—'}</td>
                <td className="p-4 text-right text-red-600">{r.bucket_61_90 > 0 ? `฿${satangToBaht(r.bucket_61_90)}` : '—'}</td>
                <td className="p-4 text-right font-bold text-red-700">{r.bucket_90plus > 0 ? `฿${satangToBaht(r.bucket_90plus)}` : '—'}</td>
                <td className="p-4 text-right font-bold">฿{satangToBaht(r.total_outstanding)}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="bg-gray-50 font-bold border-t border-gray-200">
                <td className="p-4">รวม</td>
                <td className="p-4 text-right">฿{satangToBaht(totals.bucket_0_30)}</td>
                <td className="p-4 text-right text-orange-600">฿{satangToBaht(totals.bucket_31_60)}</td>
                <td className="p-4 text-right text-red-600">฿{satangToBaht(totals.bucket_61_90)}</td>
                <td className="p-4 text-right text-red-700">฿{satangToBaht(totals.bucket_90plus)}</td>
                <td className="p-4 text-right">฿{satangToBaht(totals.total_outstanding)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <a href="/api/reports/ar-aging/export?format=csv"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">📥 Export CSV</a>
        <a href="/api/reports/ar-aging/export?format=xlsx"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">📊 Export Excel</a>
      </div>
    </div>
  )
}
