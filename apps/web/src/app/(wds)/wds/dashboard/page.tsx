import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import {
  Users,
  PhoneCall,
  MapPin,
  FileText,
  CreditCard,
  Truck,
  BarChart3,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { satangToBaht } from '@/lib/qt-calc'
import { getDashboardAlerts } from '@/lib/dashboard-metrics'
import { ArtifactKpiCard } from '@/components/ui/ArtifactKpiCard'

async function fetchMetrics() {
  try {
    const { getDashboardToday } = await import('@/modules/reports/queries')
    return await getDashboardToday()
  } catch {
    return null
  }
}

async function fetchFunnel() {
  try {
    const { getFunnelReport } = await import('@/modules/reports/queries')
    return await getFunnelReport()
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  noStore()
  const [metrics, funnel] = await Promise.all([fetchMetrics(), fetchFunnel()])
  const alerts = metrics ? getDashboardAlerts(metrics) : []

  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            ภาพรวมงานขาย & ปฏิบัติการ
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{today}</span>
            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>Thai Watsadu Wholesale & Direct Sales</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/wds/leads/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>เพิ่มลีด</span>
          </Link>
          <Link
            href="/wds/quotations/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-xs font-medium text-primary-foreground transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างใบเสนอราคา</span>
          </Link>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-3 border shadow-xs transition-all ${
                a.kind === 'danger'
                  ? 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400'
                  : a.kind === 'warning'
                  ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400'
                  : 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {a.kind === 'danger' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                ) : a.kind === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                )}
                <span className="truncate">{a.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern KPI Cards Grid */}
      {metrics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <ArtifactKpiCard
            label="Lead ใหม่วันนี้"
            value={metrics.new_leads_today}
            sub="ลีดจากทุกช่องทาง"
            icon={<Users className="w-4 h-4" />}
            href="/wds/leads"
            variant="default"
          />
          <ArtifactKpiCard
            label="Follow-up ค้างติดต่อ"
            value={metrics.overdue_followups}
            sub={metrics.overdue_followups > 0 ? 'เกินกำหนดแล้ว' : 'ติดต่อครบถ้วน'}
            icon={<PhoneCall className="w-4 h-4" />}
            href="/wds/followups"
            variant={metrics.overdue_followups > 0 ? 'alert' : 'default'}
          />
          <ArtifactKpiCard
            label="Site Visit รอช่างสำรวจ"
            value={metrics.pending_site_visits}
            sub="นัดหมายเตรียมเข้างาน"
            icon={<MapPin className="w-4 h-4" />}
            href="/wds/appointments"
            variant={metrics.pending_site_visits > 0 ? 'warning' : 'default'}
          />
          <ArtifactKpiCard
            label="QT รอลูกค้าตอบรับ"
            value={metrics.pending_quotations}
            sub="รอตรวจทานและยืนยัน"
            icon={<FileText className="w-4 h-4" />}
            href="/wds/quotations"
            variant="default"
          />
          <ArtifactKpiCard
            label="สลิปรอตรวจสอบยอด"
            value={metrics.pending_payments_count}
            sub={
              metrics.pending_payments_count > 0
                ? `รวม ฿${satangToBaht(metrics.pending_payments_satang)}`
                : 'ตรวจสอบครบทุกสลิป'
            }
            icon={<CreditCard className="w-4 h-4" />}
            href="/wds/payments"
            variant={metrics.pending_payments_count > 0 ? 'warning' : 'default'}
          />
          <ArtifactKpiCard
            label="สินค้าคิวรอจัดส่ง"
            value={metrics.pending_deliveries}
            sub="รอขนส่งกระจายสินค้า"
            icon={<Truck className="w-4 h-4" />}
            href="/wds/deliveries"
            variant="default"
          />
          <ArtifactKpiCard
            label="Credit Dual-Control"
            value="ตรวจวงเงิน"
            sub="Dual-sign สำหรับวงเงิน B2B"
            icon={<TrendingUp className="w-4 h-4" />}
            href="/wds/credit"
            variant="default"
          />
          <ArtifactKpiCard
            label="รายงานสรุปทั้งหมด"
            value="ดูสถิติ"
            sub="AR Aging, Funnel, Channels"
            icon={<BarChart3 className="w-4 h-4" />}
            href="/wds/reports"
            variant="default"
          />
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-border bg-card text-center text-sm text-muted-foreground">
          ไม่สามารถโหลดข้อมูลสถิติ KPI ประจำวันได้
        </div>
      )}

      {/* Cruip Artifact Style Conversion Funnel */}
      {funnel && (
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Conversion Funnel & Sales Velocity
              </h2>
              <p className="text-xs text-muted-foreground">
                สถิติการแปลงสภาพจาก Lead จนถึงการชำระเงินสำเร็จ
              </p>
            </div>
            <Link
              href="/wds/reports/funnel"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>รายงานฉบับเต็ม</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { label: 'Leads ทั้งหมด', count: funnel.total_leads, rate: null, avgDays: null, href: '/wds/leads' },
              { label: 'สำรวจหน้างาน (Site Visit)', count: funnel.sv_count, rate: funnel.sv_rate_pct, avgDays: funnel.sv_avg_days, href: '/wds/appointments' },
              { label: 'ออกใบเสนอราคา (Quotation)', count: funnel.qt_count, rate: funnel.qt_rate_pct, avgDays: funnel.qt_avg_days, href: '/wds/quotations' },
              { label: 'แปลงเป็นคำสั่งซื้อ (Order)', count: funnel.order_count, rate: funnel.order_rate_pct, avgDays: null, href: '/wds/orders' },
              { label: 'ชำระเงินเรียบร้อย (Paid)', count: funnel.paid_count, rate: funnel.paid_rate_pct, avgDays: null, href: '/wds/orders?status=paid' },
            ].map((step, i) => {
              const widthPct =
                funnel.total_leads > 0
                  ? Math.max(4, Math.round((step.count / funnel.total_leads) * 100))
                  : 0
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <Link
                        href={step.href}
                        className="font-medium text-foreground group-hover:text-primary transition-colors truncate"
                      >
                        {step.label}
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {step.avgDays !== null && step.avgDays > 0 && (
                        <span className="hidden sm:inline">⏱ เฉลี่ย {step.avgDays} วัน</span>
                      )}
                      {step.rate !== null && (
                        <span className="font-semibold text-primary">{step.rate}%</span>
                      )}
                      <span className="font-bold text-foreground sm:text-sm">{step.count} รายการ</span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out group-hover:bg-primary/80"
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
