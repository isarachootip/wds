import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'

async function fetchFunnel() {
  try {
    const { getFunnelReport } = await import('@/modules/reports/queries')
    return await getFunnelReport()
  } catch { return null }
}

export default async function FunnelReportPage() {
  noStore()
  const funnel = await fetchFunnel()

  const steps = funnel ? [
    { label: 'Lead ทั้งหมด', count: funnel.total_leads, rate: null, avgDays: null },
    { label: 'สำรวจหน้างาน (Site Visit)', count: funnel.sv_count, rate: funnel.sv_rate_pct, avgDays: funnel.sv_avg_days },
    { label: 'ใบเสนอราคา (QT)', count: funnel.qt_count, rate: funnel.qt_rate_pct, avgDays: funnel.qt_avg_days },
    { label: 'คำสั่งซื้อ (Order)', count: funnel.order_count, rate: funnel.order_rate_pct, avgDays: null },
    { label: 'ชำระเงิน (Paid)', count: funnel.paid_count, rate: funnel.paid_rate_pct, avgDays: null },
  ] : []

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/wds/reports" className="text-sm text-gray-500 hover:text-gray-700">← รายงาน</Link>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">📊 Conversion Funnel</h1>

      {!funnel ? (
        <p className="text-gray-400">ไม่สามารถโหลดข้อมูลได้</p>
      ) : (
        <div className="space-y-6">
          {/* Funnel visual */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {steps.map((step, i) => {
              const widthPct = funnel.total_leads > 0
                ? Math.max(5, Math.round((step.count / funnel.total_leads) * 100))
                : 0
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-900">{step.label}</span>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {step.avgDays !== null && step.avgDays > 0 && (
                        <span>⏱ เฉลี่ย {step.avgDays} วัน</span>
                      )}
                      {step.rate !== null && (
                        <span className="font-bold text-blue-600">{step.rate}% แปลง</span>
                      )}
                      <span className="font-bold text-gray-900 text-base">{step.count}</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: `hsl(${210 + i * 15}, 80%, ${55 - i * 5}%)`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">ขั้นตอน</th>
                  <th className="text-right p-4 font-medium text-gray-600">จำนวน</th>
                  <th className="text-right p-4 font-medium text-gray-600">อัตราแปลง</th>
                  <th className="text-right p-4 font-medium text-gray-600">เวลาเฉลี่ย</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-4 font-medium">{step.label}</td>
                    <td className="p-4 text-right font-bold">{step.count}</td>
                    <td className="p-4 text-right text-blue-600">{step.rate !== null ? `${step.rate}%` : '—'}</td>
                    <td className="p-4 text-right text-gray-500">{step.avgDays ? `${step.avgDays} วัน` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <a href="/api/reports/funnel/export?format=csv"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              📥 Export CSV
            </a>
            <a href="/api/reports/funnel/export?format=xlsx"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              📊 Export Excel
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
