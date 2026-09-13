import { unstable_noStore as noStore } from 'next/cache'
import { ApproveForm } from './ApproveForm'

type InboxItem = {
  id: string
  eventType: string
  aggregateId: string  // site_visit_id
  payload: Record<string, unknown>
  createdAt: Date
}

async function fetchInbox(): Promise<InboxItem[]> {
  try {
    const { getCoordinatorInbox } = await import('@/modules/visit/queries')
    const events = await getCoordinatorInbox()
    return events.map((e: any) => ({
      id: e.id,
      eventType: e.eventType,
      aggregateId: e.aggregateId,
      payload: (e.payload ?? {}) as Record<string, unknown>,
      createdAt: e.createdAt,
    }))
  } catch {
    return []
  }
}

async function fetchTeams() {
  try {
    const { getTeams } = await import('@/modules/visit/queries')
    return await getTeams()
  } catch {
    return []
  }
}

export default async function AppointmentsPage() {
  noStore()
  const [inbox, teams] = await Promise.all([fetchInbox(), fetchTeams()])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inbox คำขอสำรวจ</h1>
        <p className="text-sm text-gray-500 mt-1">
          คำขอที่รอการนัดหมาย{' '}
          {inbox.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {inbox.length} รายการ
            </span>
          )}
        </p>
      </div>

      {inbox.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">✅ ไม่มีคำขอที่รอดำเนินการ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inbox.map(item => {
            const payload = item.payload
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        🏠 ขอสำรวจหน้างาน
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString('th-TH', {
                          weekday: 'short', day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <h3 className="font-medium text-gray-900 mb-1">
                      {String(payload.purpose ?? 'ไม่ระบุวัตถุประสงค์')}
                    </h3>

                    {Boolean(payload.customerId) && (
                      <p className="text-sm text-gray-500">
                        ลูกค้า ID: {String(payload.customerId)}
                      </p>
                    )}

                    {Boolean(payload.addressId) && (
                      <p className="text-sm text-gray-500">
                        ที่อยู่ ID: {String(payload.addressId)}
                      </p>
                    )}

                    {Boolean(payload.scope) && typeof payload.scope === 'object' && (
                      <p className="text-sm text-gray-500 mt-1">
                        ขอบเขต: {JSON.stringify(payload.scope)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Approve / Reject Form */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <ApproveForm
                    domainEventId={item.id}
                    siteVisitId={item.aggregateId}
                    customerId={payload.customerId as string | undefined}
                    addressId={payload.addressId as string | undefined}
                    teams={teams as Array<{ id: string; name: string }>}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
