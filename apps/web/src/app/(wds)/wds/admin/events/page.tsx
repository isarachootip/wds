import { unstable_noStore as noStore } from 'next/cache'
import { desc, inArray, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { domainEvents } from '@wds/db'
import { EventsTable } from './EventsTable'

async function fetchFailedEvents() {
  try {
    const db = getDb()
    return await db.select()
      .from(domainEvents)
      .where(inArray(domainEvents.status, ['failed', 'dead']))
      .orderBy(desc(domainEvents.occurredAt))
      .limit(100)
  } catch { return [] }
}

async function fetchStats() {
  try {
    const db = getDb()
    const all = await db.select({ status: domainEvents.status })
      .from(domainEvents)
      .where(isNull(domainEvents.processedAt))
    const counts: Record<string, number> = {}
    for (const row of all) {
      counts[row.status] = (counts[row.status] ?? 0) + 1
    }
    return counts
  } catch { return {} }
}

export default async function AdminEventsPage() {
  noStore()
  const [events, stats] = await Promise.all([fetchFailedEvents(), fetchStats()])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Domain Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการ event ที่ค้าง/พัง</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', key: 'pending', color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Failed', key: 'failed', color: 'bg-orange-50 text-orange-700' },
          { label: 'Dead Letter', key: 'dead', color: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.key} className={`${s.color} rounded-xl p-4`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-2xl font-bold">{stats[s.key] ?? 0}</p>
          </div>
        ))}
      </div>

      <EventsTable events={events} />
    </div>
  )
}
