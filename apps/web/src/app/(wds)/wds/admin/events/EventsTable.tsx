'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'

type Event = {
  id: string
  name: string
  aggregate: string | null
  aggregateId: string | null
  status: string
  attempts: number | null
  lastError: string | null
  occurredAt: Date
}

type Props = { events: Event[] }

const STATUS_COLORS: Record<string, string> = {
  failed: 'bg-orange-100 text-orange-700',
  dead: 'bg-red-100 text-red-700',
}

export function EventsTable({ events }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function handleRetry(id: string) {
    setProcessingId(id)
    startTransition(async () => {
      const { retryEventAction } = await import('@/modules/events/actions')
      await retryEventAction(id)
      router.refresh()
      setProcessingId(null)
    })
  }

  async function handleMarkDead(id: string) {
    if (!confirm('ย้ายไป Dead Letter?')) return
    setProcessingId(id)
    startTransition(async () => {
      const { markDeadAction } = await import('@/modules/events/actions')
      await markDeadAction(id)
      router.refresh()
      setProcessingId(null)
    })
  }

  async function handleProcessAll() {
    startTransition(async () => {
      const { processEventsNowAction } = await import('@/modules/events/actions')
      const r = await processEventsNowAction()
      console.log('Process result:', r.result)
      router.refresh()
    })
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <p className="text-green-600 font-medium">✅ ไม่มี Event ที่ค้าง</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={handleProcessAll} disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '⏳ กำลังประมวลผล...' : '▶ Process All Pending'}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Event</th>
              <th className="text-left p-4 font-medium text-gray-600">Aggregate</th>
              <th className="text-center p-4 font-medium text-gray-600">Attempts</th>
              <th className="text-left p-4 font-medium text-gray-600">Status</th>
              <th className="text-left p-4 font-medium text-gray-600">Error</th>
              <th className="text-left p-4 font-medium text-gray-600">เวลา</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id} className="border-b border-gray-100">
                <td className="p-4 font-mono text-xs text-blue-700">{ev.name}</td>
                <td className="p-4 text-xs text-gray-500">{ev.aggregate}/{ev.aggregateId?.slice(0, 8)}…</td>
                <td className="p-4 text-center font-bold">{ev.attempts ?? 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ev.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ev.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-red-600 max-w-xs truncate">{ev.lastError ?? '—'}</td>
                <td className="p-4 text-xs text-gray-400">
                  {new Date(ev.occurredAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRetry(ev.id)}
                      disabled={isPending && processingId === ev.id}
                      className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                      Retry
                    </button>
                    {ev.status !== 'dead' && (
                      <button
                        onClick={() => handleMarkDead(ev.id)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50">
                        Dead
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
