import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  User,
  Phone,
  MessageCircle,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  ArrowLeft,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Trophy,
  XCircle,
  ExternalLink,
} from 'lucide-react'

import { StageProgressStepper } from './components/StageProgressStepper'
import { QuickActivityLogger } from './components/QuickActivityLogger'
import { UnifiedTimeline } from './components/UnifiedTimeline'
import { SiteVisitCard } from './components/SiteVisitCard'
import { QuotationCard } from './components/QuotationCard'
import { DealClosingModals } from './components/DealClosingModals'
import { AddFollowUpForm } from './AddFollowUpForm'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatTHB, satang } from '@/lib/money'

import { getLeadById } from '@/modules/crm/queries'

const SOURCE_LABELS: Record<string, string> = {
  line: '💬 LINE OA',
  phone: '📞 โทรศัพท์ (Call Center)',
  store: '🏪 หน้าร้าน (Walk-in)',
  other: '📋 ช่องทางอื่นๆ',
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  noStore()
  const { id } = await params

  let data: any = null
  try {
    data = await getLeadById(id)
  } catch {
    data = null
  }

  if (!data || !data.lead) {
    notFound()
  }

  const { lead, activities = [], followUps = [], siteVisits = [], quotations = [] } = data
  const leadData = lead.leads
  const customerData = lead.customers

  const createdDate = new Date(leadData.createdAt)
  const thaiBuddhistFormatted = createdDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6">
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* Top Header Card with Breadcrumb, Customer Title, Company Badge, Buddhist Era */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs text-card-foreground">
        {/* Breadcrumbs & Status Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/wds/leads"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>/wds/leads</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-mono font-semibold">
              {`Lead #${leadData.id.slice(0, 8)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge variant={leadData.status as any} dot />
          </div>
        </div>

        {/* Customer Title, Company Badge, Contacts & Budget Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {customerData?.name ?? 'Lead ลูกค้าทั่วไป'}
              </h1>

              {customerData?.taxId ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
                  <Building2 className="w-3 h-3 text-primary" />
                  <span>{`Tax ID: ${customerData.taxId}`}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span>ลูกค้านิติบุคคล / ทั่วไป</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {customerData?.phone && (
                <a
                  href={`tel:${customerData.phone}`}
                  className="inline-flex items-center gap-1.5 text-primary hover:underline bg-primary/10 px-2.5 py-0.5 rounded-md font-mono font-medium border border-primary/20"
                >
                  <Phone className="w-3 h-3" />
                  <span>{customerData.phone}</span>
                </a>
              )}

              <div className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-0.5 rounded-md text-foreground border border-border">
                <span>{SOURCE_LABELS[leadData.source] ?? leadData.source}</span>
                {leadData.channelRef && (
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {`(${leadData.channelRef})`}
                  </span>
                )}
              </div>

              {leadData.projectLocation && (
                <div className="inline-flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>{leadData.projectLocation}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                <Clock className="w-3 h-3" />
                <span>
                  {`สร้างเมื่อ: ${thaiBuddhistFormatted} (พ.ศ. 2569)`}
                </span>
              </div>
            </div>
          </div>

          {/* Budget Display Strip */}
          <div className="flex items-center gap-2">
            {leadData.budgetRangeMinSatang || leadData.budgetRangeMaxSatang ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-right">
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold block">
                  งบประมาณโครงการ (Budget)
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {leadData.budgetRangeMinSatang
                    ? formatTHB(satang(leadData.budgetRangeMinSatang))
                    : '฿0'}
                  {' - '}
                  {leadData.budgetRangeMaxSatang
                    ? formatTHB(satang(leadData.budgetRangeMaxSatang))
                    : 'ไม่ระบุ'}
                </span>
              </div>
            ) : (
              <div className="bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-right">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                  งบประมาณโครงการ
                </span>
                <span className="text-xs text-muted-foreground">ยังไม่ได้ระบุงบประมาณ</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. Visual Stage Progress Stepper */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <StageProgressStepper
        leadId={leadData.id}
        currentStatus={leadData.status}
        lostReason={leadData.lostReason}
      />

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2-Column Responsive Execution Grid (Left 7, Right 5) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer & Project Parameters Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-card-foreground">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>ข้อมูลลูกค้า & โครงการ (Customer & Project Parameters)</span>
            </h3>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <dt className="text-muted-foreground">ชื่อลูกค้า / นิติบุคคล</dt>
                <dd className="font-semibold text-foreground text-right">
                  {customerData?.name ?? 'ไม่ระบุ'}
                </dd>
              </div>

              {customerData?.phone && (
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <dt className="text-muted-foreground">เบอร์โทรศัพท์ติดต่อ</dt>
                  <dd className="font-mono font-medium text-foreground text-right">
                    {customerData.phone}
                  </dd>
                </div>
              )}

              {customerData?.email && (
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <dt className="text-muted-foreground">อีเมล</dt>
                  <dd className="text-foreground text-right">{customerData.email}</dd>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-border/60">
                <dt className="text-muted-foreground">ช่องทางที่เข้ามา</dt>
                <dd className="text-foreground text-right">
                  {SOURCE_LABELS[leadData.source] ?? leadData.source}
                </dd>
              </div>

              {leadData.channelRef && (
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <dt className="text-muted-foreground">Ref ช่องทาง</dt>
                  <dd className="font-mono text-muted-foreground text-[11px] text-right break-all">
                    {leadData.channelRef}
                  </dd>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-border/60">
                <dt className="text-muted-foreground">AE ผู้รับผิดชอบ</dt>
                <dd className="text-foreground text-right font-medium">
                  {leadData.assignedTo || 'สมเกียรติ ยอดขาย (ทีม AE B2B บางนา)'}
                </dd>
              </div>

              {leadData.interestSummary && (
                <div className="pt-2">
                  <dt className="text-muted-foreground mb-1 font-medium">ความต้องการ / สินค้าที่สนใจ</dt>
                  <dd className="bg-muted/50 border border-border/60 p-3 rounded-xl text-foreground leading-relaxed">
                    {leadData.interestSummary}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quick Activity Logger Bar */}
          <QuickActivityLogger leadId={leadData.id} />

          {/* Site Visit Management Card */}
          <SiteVisitCard leadId={leadData.id} siteVisits={siteVisits} />

          {/* Quotation Card */}
          <QuotationCard leadId={leadData.id} quotations={quotations} />
        </div>

        {/* Right Column (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Deal Closing Actions Card */}
          <DealClosingModals
            leadId={leadData.id}
            currentStatus={leadData.status}
            quotations={quotations}
            lostReason={leadData.lostReason}
          />

          {/* Chronological Unified Timeline Stream */}
          <UnifiedTimeline
            activities={activities}
            followUps={followUps}
            siteVisits={siteVisits}
            quotations={quotations}
          />

          {/* Follow-up Scheduler Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-card-foreground">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-500" />
              <span>สร้างงานติดตาม (Follow-up)</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              กำหนดเวลาโทรกลับ หรือนัดหมายพูดคุยลูกค้าครั้งถัดไป
            </p>
            <AddFollowUpForm leadId={leadData.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
