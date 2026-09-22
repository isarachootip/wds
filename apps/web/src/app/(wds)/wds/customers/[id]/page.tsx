import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  Briefcase,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react'
import { satangToBaht } from '@/lib/qt-calc'

const STATUS_LABELS: Record<string, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  qualified: 'ผ่านเกณฑ์',
  site_visit_requested: 'นัดสำรวจ',
  quoted: 'เสนอราคา',
  won: 'ปิดการขาย',
  lost: 'ไม่สำเร็จ',
}

export default async function Customer360Page({ params }: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params

  let data: any = null
  try {
    const { getCustomer360 } = await import('@/modules/crm/queries')
    data = await getCustomer360(id)
  } catch {}

  if (!data) notFound()

  const {
    customer,
    leads = [],
    siteVisits = [],
    addresses = [],
    orders = [],
    totalPurchasedSatang = 0,
  } = data

  const creditLimit = customer.creditLimitSatang || 0
  const creditUsed = customer.creditUsedSatang || 0
  const creditUsedPct = creditLimit ? Math.round((creditUsed / creditLimit) * 100) : 0

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Link href="/wds/customers" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          <span>กลับไปรายชื่อลูกค้า</span>
        </Link>
        <span>/</span>
        <span className="text-foreground">{customer.name}</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Building2 className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{customer.name}</h1>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-muted text-foreground border border-border">
                {customer.code}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {customer.status === 'active' ? '● ใช้งานปกติ' : '● ปิดการใช้งาน'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-1.5 flex-wrap">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="size-3.5 text-primary" />
                  <span>{customer.phone}</span>
                </a>
              )}
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  <span>{customer.email}</span>
                </span>
              )}
              {customer.taxId && (
                <span className="font-mono">Tax ID: {customer.taxId}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Site Addresses (หน้างาน) */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>ที่อยู่หน้างานและสำนักงาน ({addresses.length})</span>
              </h3>
            </div>
            {addresses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">ยังไม่มีข้อมูลที่อยู่หน้างานที่บันทึกไว้</p>
            ) : (
              <div className="space-y-2.5">
                {addresses.map((addr: any) => (
                  <div key={addr.id} className="p-3.5 bg-muted/30 rounded-xl border border-border text-sm flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{addr.label ?? 'หน้างานติดตั้ง'}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                            หลัก
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {addr.addressLine1} {addr.subDistrict} {addr.district} {addr.province} {addr.postalCode}
                      </p>
                    </div>
                    {addr.lat && addr.lng ? (
                      <a
                        href={`https://www.google.com/maps?q=${addr.lat},${addr.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline shrink-0 ml-4 font-bold"
                      >
                        พิกัดแผนที่ ↗
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leads */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Briefcase className="size-4 text-primary" />
                <span>ประวัติ Lead ทั้งหมด ({leads.length})</span>
              </h3>
              <Link href={`/wds/leads?customerId=${customer.id}`} className="text-xs text-primary font-bold hover:underline">
                ดูทั้งหมด →
              </Link>
            </div>
            {leads.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">ยังไม่มีประวัติ Lead</p>
            ) : (
              <div className="space-y-2">
                {leads.slice(0, 5).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                        {STATUS_LABELS[l.status] ?? l.status}
                      </span>
                      <span className="text-xs font-medium text-foreground">{l.interest?.title || l.interest?.description || 'ดีลโครงการ'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground">
                        {new Date(l.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <Link href={`/wds/leads/${l.id}`} className="text-xs text-primary font-bold hover:underline">
                        ดูดีล →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Site Visits */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span>ประวัติการสำรวจหน้างาน ({siteVisits.length})</span>
            </h3>
            {siteVisits.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">ยังไม่มีประวัติการสำรวจหน้างาน</p>
            ) : (
              <div className="space-y-2">
                {siteVisits.slice(0, 5).map((sv: any) => (
                  <div key={sv.id} className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-xl border border-border">
                    <div>
                      <span className="font-bold text-foreground">{sv.purpose ?? 'สำรวจหน้างานก่อสร้าง'}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {new Date(sv.requestedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                      {sv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders / Purchase History */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span>ประวัติคำสั่งซื้อและติดตั้ง ({orders.length})</span>
            </h3>
            {orders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">ยังไม่มีประวัติคำสั่งซื้อ</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((ord: any) => (
                  <div key={ord.id} className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-xl border border-border">
                    <div>
                      <span className="font-bold text-foreground">{ord.number ?? ord.id.slice(0, 8)}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {new Date(ord.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ฿{satangToBaht(ord.totalSatang || 0)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-muted text-foreground border border-border">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Right 1 Column */}
        <div className="space-y-6">
          {/* Accumulated Purchase Volume */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs border-t-4 border-t-primary">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              ยอดซื้อสะสม (Customer LTV)
            </h3>
            <p className="text-2xl font-black text-foreground font-mono tabular-nums">
              ฿{satangToBaht(totalPurchasedSatang)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">คำนวณจากยอดคำสั่งซื้อทั้งหมด</p>
          </div>

          {/* Credit */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs border-t-4 border-t-emerald-500">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <CreditCard className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>การบริหารวงเงินเครดิต</span>
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">วงเงินอนุมัติ</span>
                <span className="font-bold text-foreground font-mono">฿{satangToBaht(creditLimit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">ใช้ไปแล้ว</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">฿{satangToBaht(creditUsed)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(creditUsedPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right font-medium">ใช้ไปแล้ว {creditUsedPct}%</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span>สรุปภาพรวมบัญชี</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground font-medium">จำนวน Lead ทั้งหมด</span>
                <span className="font-bold text-foreground">{leads.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground font-medium">ปิดการขายสำเร็จ</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {leads.filter((l: any) => l.status === 'won').length}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground font-medium">การสำรวจหน้างาน</span>
                <span className="font-bold text-foreground">{siteVisits.length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground font-medium">ที่อยู่หน้างาน</span>
                <span className="font-bold text-foreground">{addresses.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
