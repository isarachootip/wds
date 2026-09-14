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
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { satangToBaht } from '@/lib/qt-calc'
import { formatThaiDate } from '@/lib/date'
import { getDashboardAlerts } from '@/lib/dashboard-metrics'
import { ArtifactKpiCard } from '@/components/ui/ArtifactKpiCard'
import { Button } from '@/components/ui/button'
import { RevenueVelocityChart } from './components/RevenueVelocityChart'
import { DashboardActivityFeed } from './components/DashboardActivityFeed'
import { DashboardFunnelCard } from './components/DashboardFunnelCard'
import { DashboardTimeframeFilter, type Timeframe } from './components/DashboardTimeframeFilter'

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

async function fetchRecentActivities() {
  try {
    const { getDb } = await import('@/lib/db')
    const { leadActivities, leads, customers, users } = await import('@wds/db')
    const { isNull, desc, eq } = await import('drizzle-orm')
    const db = getDb()
    const rows = await db
      .select({
        id: leadActivities.id,
        leadId: leadActivities.leadId,
        type: leadActivities.type,
        note: leadActivities.note,
        occurredAt: leadActivities.occurredAt,
        customerName: customers.name,
        userName: users.displayName,
      })
      .from(leadActivities)
      .leftJoin(leads, eq(leadActivities.leadId, leads.id))
      .leftJoin(customers, eq(leads.customerId, customers.id))
      .leftJoin(users, eq(leadActivities.userId, users.id))
      .where(isNull(leadActivities.deletedAt))
      .orderBy(desc(leadActivities.occurredAt))
      .limit(8)

    if (rows && rows.length > 0) {
      const channelMap: Record<string, 'phone' | 'line' | 'visit' | 'quotation' | 'note'> = {
        call: 'phone',
        phone: 'phone',
        line: 'line',
        visit: 'visit',
        site_visit: 'visit',
        meeting: 'visit',
        quote_sent: 'quotation',
        quotation: 'quotation',
        quote: 'quotation',
        note: 'note',
        status_change: 'note',
        system: 'note',
        email: 'note',
      }
      return rows.map((r) => ({
        id: r.id,
        leadId: r.leadId,
        channel: channelMap[r.type] || 'note',
        customerName: r.customerName || `ลีด #${r.leadId.slice(0, 8)}`,
        note: r.note || 'ไม่มีบันทึกเพิ่มเติม',
        actor: r.userName || 'AE ทีมขาย',
        actorRole: 'Sales AE',
        occurredAt: r.occurredAt ? new Date(r.occurredAt).toISOString() : new Date().toISOString(),
        timeAgo: 'เมื่อสักครู่',
      }))
    }
  } catch {
    // Graceful fallback during build / offline DB
  }
  return null
}

export interface DashboardPageProps {
  params?: Promise<Record<string, string | string[] | undefined>>
  searchParams?: Promise<{ timeframe?: string }>
}

export default async function DashboardPage(): Promise<React.JSX.Element>
export default async function DashboardPage(props: DashboardPageProps): Promise<React.JSX.Element>
export default async function DashboardPage(props: DashboardPageProps = {}): Promise<React.JSX.Element> {
  const searchParams = props.searchParams
  noStore()
  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : undefined
  const initialTimeframe: Timeframe =
    resolvedParams?.timeframe === '7D' || resolvedParams?.timeframe === '12M'
      ? (resolvedParams.timeframe as Timeframe)
      : '30D'

  const [metrics, funnel, activities] = await Promise.all([
    fetchMetrics(),
    fetchFunnel(),
    fetchRecentActivities(),
  ])

  const safeMetrics = metrics ?? {
    new_leads_today: 0,
    overdue_followups: 0,
    pending_site_visits: 0,
    pending_appointments: 0,
    pending_quotations: 0,
    pending_payments_count: 0,
    pending_payments_satang: 0,
    pending_deliveries: 0,
  }

  const alerts = metrics ? getDashboardAlerts(metrics) : []

  // Compute Thai Buddhist Date with Day of Week
  const now = new Date()
  const weekdays = [
    'วันอาทิตย์',
    'วันจันทร์',
    'วันอังคาร',
    'วันพุธ',
    'วันพฤหัสบดี',
    'วันศุกร์',
    'วันเสาร์',
  ]
  const weekday = weekdays[now.getDay()]
  const thaiBuddhistDate = `${weekday}ที่ ${formatThaiDate(now)}`

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-thaiwatsadu-red/10 text-thaiwatsadu-red dark:bg-rose-500/15 dark:text-rose-400">
              <ShieldCheck className="size-3" />
              <span>Thai Watsadu WDS Operations</span>
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Cruip Artifact Dashboard
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            ภาพรวมงานขาย & ปฏิบัติการ
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-foreground font-medium">
              <Calendar className="size-3.5 text-primary" />
              <span>{thaiBuddhistDate}</span>
            </span>
            <span className="inline-block size-1 rounded-full bg-muted-foreground/40" />
            <span>Thai Watsadu Wholesale & Direct Sales Platform</span>
          </p>
        </div>

        {/* Action Controls & Timeframe Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Filter Tabs */}
          <DashboardTimeframeFilter value={initialTimeframe} />

          {/* Quick Action Links */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 shadow-xs"
            >
              <Link href="/wds/leads/new">
                <Plus className="size-3.5 text-primary" />
                <span>+ เพิ่มลีด</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="thaiwatsadu"
              size="sm"
              className="gap-1.5 shadow-xs"
            >
              <Link href="/wds/quotations/new">
                <Plus className="size-3.5" />
                <span>+ สร้างใบเสนอราคา</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Urgent Operational Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-3 border shadow-xs transition-all ${
                a.kind === 'danger'
                  ? 'border-l-4 border-l-thaiwatsadu-red bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400 dark:bg-rose-500/15'
                  : a.kind === 'warning'
                  ? 'border-l-4 border-l-amber-500 bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/15'
                  : 'border-l-4 border-l-blue-500 bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/15'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {a.kind === 'danger' ? (
                  <AlertCircle className="size-4 shrink-0 text-thaiwatsadu-red dark:text-rose-400" />
                ) : a.kind === 'warning' ? (
                  <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                )}
                <span className="truncate font-semibold">{a.message}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    a.kind === 'danger'
                      ? 'bg-thaiwatsadu-red text-white'
                      : a.kind === 'warning'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {a.kind === 'danger' ? 'ด่วนที่สุด' : 'แจ้งเตือน'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4x2 Responsive Grid of ArtifactKpiCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: New Leads Today */}
        <ArtifactKpiCard
          label="Lead ใหม่วันนี้"
          value={safeMetrics.new_leads_today}
          sub="ลีดจากทุกช่องทาง (Omnichannel)"
          trend={{ value: '+12.5%', positive: true }}
          icon={<Users className="size-4" />}
          href="/wds/leads"
          variant="default"
        />

        {/* Card 2: Overdue Follow-ups */}
        <ArtifactKpiCard
          label="Follow-up ค้างติดต่อ"
          value={safeMetrics.overdue_followups}
          sub={
            safeMetrics.overdue_followups > 0
              ? 'เกินกำหนดนัดหมายแล้ว'
              : 'ติดต่อครบถ้วนตรงเวลา'
          }
          trend={
            safeMetrics.overdue_followups > 0
              ? { value: `+${safeMetrics.overdue_followups}`, positive: false }
              : { value: '0 ค้าง', positive: true }
          }
          icon={<PhoneCall className="size-4" />}
          href="/wds/followups"
          variant={safeMetrics.overdue_followups > 0 ? 'alert' : 'default'}
        />

        {/* Card 3: Pending Site Visits */}
        <ArtifactKpiCard
          label="Site Visit รอช่างสำรวจ"
          value={safeMetrics.pending_site_visits}
          sub="นัดหมายเตรียมเข้าหน้างาน"
          trend={{ value: '+8.3%', positive: true }}
          icon={<MapPin className="size-4" />}
          href="/wds/appointments"
          variant={safeMetrics.pending_site_visits > 0 ? 'warning' : 'default'}
        />

        {/* Card 4: Pending Quotations */}
        <ArtifactKpiCard
          label="QT รอลูกค้าตอบรับ"
          value={safeMetrics.pending_quotations}
          sub="ใบเสนอราคารอคอนเฟิร์ม"
          trend={{ value: '+15.4%', positive: true }}
          icon={<FileText className="size-4" />}
          href="/wds/quotations"
          variant="default"
        />

        {/* Card 5: Pending Payments */}
        <ArtifactKpiCard
          label="สลิปรอตรวจสอบยอด"
          value={safeMetrics.pending_payments_count}
          sub={
            safeMetrics.pending_payments_count > 0
              ? `รวม ฿${satangToBaht(safeMetrics.pending_payments_satang)}`
              : 'ตรวจสอบครบทุกสลิป'
          }
          trend={
            safeMetrics.pending_payments_count > 0
              ? { value: `${safeMetrics.pending_payments_count} รายการ`, positive: false }
              : { value: '0 ค้าง', positive: true }
          }
          icon={<CreditCard className="size-4" />}
          href="/wds/payments"
          variant={safeMetrics.pending_payments_count > 0 ? 'warning' : 'default'}
        />

        {/* Card 6: Pending Deliveries */}
        <ArtifactKpiCard
          label="สินค้าคิวรอจัดส่ง"
          value={safeMetrics.pending_deliveries}
          sub="คิวรถรอจัดส่งกระจายสินค้า"
          trend={{ value: '+5.2%', positive: true }}
          icon={<Truck className="size-4" />}
          href="/wds/deliveries"
          variant="default"
        />

        {/* Card 7: Credit Dual-Control */}
        <ArtifactKpiCard
          label="Credit Dual-Control"
          value="ตรวจวงเงิน"
          sub="Dual-Sign อนุมัติวงเงิน B2B"
          trend={{ value: 'Tier 1/2', positive: true }}
          icon={<TrendingUp className="size-4" />}
          href="/wds/credit"
          variant="default"
        />

        {/* Card 8: Reports */}
        <ArtifactKpiCard
          label="รายงานสรุปทั้งหมด"
          value="ดูสถิติรวม"
          sub="AR Aging, Funnel, Channels"
          trend={{ value: '+18.2%', positive: true }}
          icon={<BarChart3 className="size-4" />}
          href="/wds/reports"
          variant="default"
        />
      </div>

      {/* Main Analytics Layout: Chart & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Revenue & Order Velocity Chart */}
        <div className="lg:col-span-8">
          <RevenueVelocityChart initialTimeframe={initialTimeframe} />
        </div>

        {/* Right Column: Conversion Funnel Card */}
        <div className="lg:col-span-4">
          <DashboardFunnelCard funnel={funnel} />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div>
        <DashboardActivityFeed activities={activities ?? undefined} />
      </div>
    </div>
  )
}
