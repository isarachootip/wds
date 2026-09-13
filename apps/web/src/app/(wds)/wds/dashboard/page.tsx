import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'
import { getDashboardAlerts } from '@/lib/dashboard-metrics'

async function fetchMetrics() {
  try {
    const { getDashboardToday } = await import('@/modules/reports/queries')
    return await getDashboardToday()
  } catch { return null }
}

async function fetchFunnel() {
  try {
    const { getFunnelReport } = await import('@/modules/reports/queries')
    return await getFunnelReport()
  } catch { return null }
}

type KpiCardProps = {
  label: string; value: string | number; sub?: string
  href?: string; alert?: boolean; warning?: boolean
}

function KpiCard({ label, value, sub, href, alert, warning }: KpiCardProps) {
  const bg = alert ? 'bg-red-50 border-red-200' : warning ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
  const valueColor = alert ? 'text-red-600' : warning ? 'text-yellow-700' : 'text-gray-900'
  const content = (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

export default async function DashboardPage() {
  noStore()
  const [metrics, funnel] = await Promise.all([fetchMetrics(), fetchFunnel()])
  const alerts = metrics ? getDashboardAlerts(metrics) : []

  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <Link href="/wds/reports" className="text-sm text-blue-600 hover:underline">รายงานทั้งหมด →</Link>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((a, i) => (
            <div key={i} className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2
              ${a.kind === 'danger' ? 'bg-red-50 text-red-700 border border-red-200'
                : a.kind === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <span>{a.kind === 'danger' ? '🔴' : a.kind === 'warning' ? '⚠️' : 'ℹ️'}</span>
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      {metrics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Lead ใหม่วันนี้" value={metrics.new_leads_today}
            href="/wds/leads" />
          <KpiCard
            label="Follow-up ค้าง" value={metrics.overdue_followups}
            href="/wds/followups" alert={metrics.overdue_followups > 0} />
          <KpiCard
            label="Site Visit รอ" value={metrics.pending_site_visits}
            href="/wds/appointments" warning={metrics.pending_site_visits > 0} />
          <KpiCard
            label="นัดรออนุมัติ" value={metrics.pending_appointments}
            href="/wds/appointments" warning={metrics.pending_appointments > 0} />
          <KpiCard
            label="QT รอตอบ" value={metrics.pending_quotations}
            href="/wds/quotations" />
          <KpiCard
            label="สลิปรอตรวจ" value={metrics.pending_payments_count}
            sub={metrics.pending_payments_count > 0 ? `฿${satangToBaht(metrics.pending_payments_satang)}` : undefined}
            href="/wds/payments" warning={metrics.pending_payments_count > 0} />
          <KpiCard
            label="ของรอส่ง" value={metrics.pending_deliveries}
            href="/wds/deliveries" />
          <KpiCard
            label="รายงาน" value="→"
            href="/wds/reports" />
        </div>
      ) : (
        <p className="text-gray-400 text-sm mb-8">ไม่สามารถโหลด KPI ได้</p>
      )}

      {/* Funnel */}
      {funnel && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          <div className="space-y-3">
            {[
              { label: 'Leads', count: funnel.total_leads, rate: null, avgDays: null, href: '/wds/leads' },
              { label: 'Site Visit', count: funnel.sv_count, rate: funnel.sv_rate_pct, avgDays: funnel.sv_avg_days, href: '/wds/appointments' },
              { label: 'Quotation', count: funnel.qt_count, rate: funnel.qt_rate_pct, avgDays: funnel.qt_avg_days, href: '/wds/quotations' },
              { label: 'Order', count: funnel.order_count, rate: funnel.order_rate_pct, avgDays: null, href: '/wds/orders' },
              { label: 'ชำระแล้ว', count: funnel.paid_count, rate: funnel.paid_rate_pct, avgDays: null, href: '/wds/orders?status=paid' },
            ].map((step, i) => {
              const widthPct = funnel.total_leads > 0
                ? Math.round((step.count / funnel.total_leads) * 100)
                : 0
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                      <Link href={step.href} className="font-medium text-gray-900 hover:text-blue-600">{step.label}</Link>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {step.avgDays !== null && step.avgDays > 0 && (
                        <span>⏱ {step.avgDays} วัน</span>
                      )}
                      {step.rate !== null && (
                        <span className="text-blue-600 font-medium">{step.rate}%</span>
                      )}
                      <span className="font-bold text-gray-900 text-sm">{step.count}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
