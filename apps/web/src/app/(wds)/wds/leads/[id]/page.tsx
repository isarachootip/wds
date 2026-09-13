import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LeadStatusChanger } from './LeadStatusChanger'
import { RequestSiteVisitForm } from './RequestSiteVisitForm'
import { AddFollowUpForm } from './AddFollowUpForm'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-yellow-100 text-yellow-700',
  site_visit_requested: 'bg-purple-100 text-purple-700',
  quoted: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  qualified: 'คุณสมบัติผ่าน',
  site_visit_requested: 'ขอสำรวจหน้างาน',
  quoted: 'เสนอราคาแล้ว',
  won: 'ปิดการขาย ✅',
  lost: 'สูญเสีย ❌',
}

const ACTIVITY_LABELS: Record<string, string> = {
  call: '📞 โทรออก',
  line: '💬 LINE',
  visit: '🏠 เยี่ยมชม',
  note: '📝 บันทึก',
  quote_sent: '📄 ส่ง QT',
  status_change: '🔄 เปลี่ยนสถานะ',
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params

  let data: any = null
  try {
    const { getLeadById } = await import('@/modules/crm/queries')
    data = await getLeadById(id)
  } catch {}

  if (!data) {
    notFound()
  }

  const { lead, activities, followUps, siteVisits } = data
  const leadData = lead.leads
  const customerData = lead.customers

  // Build unified timeline
  type TimelineItem = { id: string; at: Date; kind: 'activity' | 'followup'; data: any }
  const timeline: TimelineItem[] = [
    ...activities.map((a: any) => ({ id: a.id, at: new Date(a.occurredAt), kind: 'activity' as const, data: a })),
    ...followUps.map((f: any) => ({ id: f.id, at: new Date(f.dueAt), kind: 'followup' as const, data: f })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime())

  const canRequestSiteVisit = ['qualified', 'contacted'].includes(leadData.status)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/wds/leads" className="hover:text-blue-600">Lead</Link>
            <span>/</span>
            <span>{customerData?.name ?? 'ไม่ระบุ'}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {customerData?.name ?? 'Lead ไม่ระบุชื่อ'}
          </h1>
          {customerData?.phone && (
            <p className="text-gray-500 text-sm mt-1">{customerData.phone}</p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[leadData.status] ?? 'bg-gray-100 text-gray-700'}`}>
          {STATUS_LABELS[leadData.status] ?? leadData.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Timeline (left 2/3) */}
        <div className="col-span-2 space-y-4">
          {/* Change status */}
          {leadData.status !== 'won' && leadData.status !== 'lost' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">เปลี่ยนสถานะ</h3>
              <LeadStatusChanger
                leadId={leadData.id}
                currentStatus={leadData.status}
              />
            </div>
          )}

          {/* Request Site Visit */}
          {canRequestSiteVisit && leadData.status !== 'site_visit_requested' && (
            <div className="bg-white rounded-xl border border-purple-200 p-4">
              <h3 className="text-sm font-medium text-purple-700 mb-3">🏠 ขอสำรวจหน้างาน</h3>
              <RequestSiteVisitForm leadId={leadData.id} />
            </div>
          )}

          {/* Site visits list */}
          {siteVisits.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">การสำรวจหน้างาน</h3>
              <div className="space-y-2">
                {siteVisits.map((sv: any) => (
                  <div key={sv.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{sv.purpose}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {new Date(sv.requestedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      sv.status === 'done' ? 'bg-green-100 text-green-700' :
                      sv.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {sv.status === 'requested' ? 'รอนัดหมาย' :
                       sv.status === 'scheduled' ? 'นัดแล้ว' :
                       sv.status === 'done' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">ประวัติกิจกรรม</h3>
            {timeline.length === 0 ? (
              <p className="text-gray-400 text-sm">ยังไม่มีกิจกรรม</p>
            ) : (
              <div className="space-y-3">
                {timeline.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      {item.kind === 'activity' ? (
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            {ACTIVITY_LABELS[item.data.type] ?? item.data.type}
                          </span>
                          {item.data.note && (
                            <p className="text-sm text-gray-700 mt-0.5">{item.data.note}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            item.data.status === 'done' ? 'bg-green-100 text-green-700' :
                            item.data.status === 'skipped' ? 'bg-gray-100 text-gray-500' :
                            new Date(item.data.dueAt) < new Date() ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            📅 Follow-up: {item.data.status === 'done' ? 'เสร็จแล้ว' : item.data.status === 'skipped' ? 'ข้ามไป' : 'รอดำเนินการ'}
                          </span>
                          {item.data.note && (
                            <p className="text-sm text-gray-700 mt-0.5">{item.data.note}</p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.at.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (right 1/3) */}
        <div className="space-y-4">
          {/* Lead info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">ข้อมูล Lead</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">ช่องทาง</dt>
                <dd className="text-gray-900">{leadData.source}</dd>
              </div>
              {leadData.channelRef && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Ref</dt>
                  <dd className="text-gray-900 text-xs break-all">{leadData.channelRef}</dd>
                </div>
              )}
              {(leadData.budgetRangeMinSatang || leadData.budgetRangeMaxSatang) && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">งบประมาณ</dt>
                  <dd className="text-gray-900">
                    {leadData.budgetRangeMinSatang ? `฿${(leadData.budgetRangeMinSatang / 100).toLocaleString('th-TH')}` : '-'}
                    {' - '}
                    {leadData.budgetRangeMaxSatang ? `฿${(leadData.budgetRangeMaxSatang / 100).toLocaleString('th-TH')}` : '-'}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">สร้างเมื่อ</dt>
                <dd className="text-gray-900 text-xs">
                  {new Date(leadData.createdAt).toLocaleDateString('th-TH')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Add follow-up */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">สร้าง Follow-up</h3>
            <AddFollowUpForm leadId={leadData.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
