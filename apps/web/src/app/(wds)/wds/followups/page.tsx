import { unstable_noStore as noStore } from 'next/cache'
import { DoneFollowUpButton } from './DoneFollowUpButton'

type FollowUp = {
  id: string
  leadId: string
  dueAt: Date
  channel: string | null
  status: string
  note: string | null
  customerName: string | null
}

async function fetchFollowUps() {
  try {
    const { getFollowUps } = await import('@/modules/crm/queries')
    return await getFollowUps('current-user-id') as { overdue: FollowUp[], today: FollowUp[], week: FollowUp[] }
  } catch {
    return { overdue: [], today: [], week: [] }
  }
}

function FollowUpCard({ fu, compact }: { fu: FollowUp, compact?: boolean }) {
  const CHANNEL_ICONS: Record<string, string> = { phone: '📞', line: '💬', email: '📧', visit: '🏠' }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">{CHANNEL_ICONS[fu.channel ?? ''] ?? '📋'}</span>
        <div>
          <p className="text-sm font-medium text-gray-800">{fu.customerName ?? 'ไม่ระบุลูกค้า'}</p>
          {fu.note && <p className="text-xs text-gray-500 mt-0.5">{fu.note}</p>}
          <p className="text-xs text-gray-400 mt-1">
            กำหนด: {new Date(fu.dueAt).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={`/wds/leads/${fu.leadId}`}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          ดู Lead
        </a>
        <DoneFollowUpButton followUpId={fu.id} />
      </div>
    </div>
  )
}

function Section({
  title, items, badge, color
}: {
  title: string, items: FollowUp[], badge: string, color: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">ไม่มีรายการ</p>
      ) : (
        <div className="space-y-2">
          {items.map(fu => <FollowUpCard key={fu.id} fu={fu} />)}
        </div>
      )}
    </div>
  )
}

export default async function FollowUpsPage() {
  noStore()
  const { overdue, today, week } = await fetchFollowUps()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">งานติดตาม</h1>
        <p className="text-sm text-gray-500 mt-1">
          {overdue.length > 0 && <span className="text-red-600 font-medium">{overdue.length} รายการเลยกำหนด · </span>}
          {today.length} รายการวันนี้
        </p>
      </div>

      <div className="space-y-8">
        <Section
          title="🔴 เลยกำหนด"
          items={overdue}
          badge={`${overdue.length}`}
          color="bg-red-100 text-red-700"
        />
        <Section
          title="🟡 วันนี้"
          items={today}
          badge={`${today.length}`}
          color="bg-yellow-100 text-yellow-700"
        />
        <Section
          title="🟢 7 วันข้างหน้า"
          items={week}
          badge={`${week.length}`}
          color="bg-green-100 text-green-700"
        />
      </div>
    </div>
  )
}
