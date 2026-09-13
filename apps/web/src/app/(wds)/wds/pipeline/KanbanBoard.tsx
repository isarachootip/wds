'use client'

import { useState, useTransition } from 'react'
import { updateLeadStatusAction } from '@/modules/crm/actions'
import type { LeadCard } from './page'

const STATUSES = ['new', 'contacted', 'qualified', 'site_visit_requested', 'quoted', 'won', 'lost'] as const
type Status = typeof STATUSES[number]

const STATUS_LABELS: Record<Status, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  qualified: 'ผ่านคุณสมบัติ',
  site_visit_requested: 'ขอสำรวจ',
  quoted: 'เสนอราคา',
  won: '✅ ปิดการขาย',
  lost: '❌ สูญเสีย',
}

const STATUS_COLORS: Record<Status, string> = {
  new: 'bg-gray-50 border-gray-200',
  contacted: 'bg-blue-50 border-blue-200',
  qualified: 'bg-yellow-50 border-yellow-200',
  site_visit_requested: 'bg-purple-50 border-purple-200',
  quoted: 'bg-orange-50 border-orange-200',
  won: 'bg-green-50 border-green-200',
  lost: 'bg-red-50 border-red-200',
}

function isStale(updatedAt: Date): boolean {
  return Date.now() - new Date(updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000
}

export function KanbanBoard({ initialLeads }: { initialLeads: LeadCard[] }) {
  const [leads, setLeads] = useState<LeadCard[]>(initialLeads)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleDrop(e: React.DragEvent, newStatus: Status) {
    e.preventDefault()
    setDragOver(null)
    const leadId = e.dataTransfer.getData('leadId')
    const fromStatus = e.dataTransfer.getData('fromStatus') as Status
    if (!leadId || fromStatus === newStatus) return

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))

    startTransition(async () => {
      const result = await updateLeadStatusAction(leadId, newStatus, 'current-user-id')
      if (!result.success) {
        // Rollback
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: fromStatus } : l))
        setError(result.error ?? 'เกิดข้อผิดพลาด')
        setTimeout(() => setError(''), 3000)
      }
    })
    setDragging(null)
  }

  const byStatus = STATUSES.reduce<Record<Status, LeadCard[]>>((acc, s) => {
    acc[s] = leads.filter(l => l.status === s)
    return acc
  }, {} as Record<Status, LeadCard[]>)

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => (
          <div
            key={status}
            className={`flex-shrink-0 w-56 rounded-xl border p-3 transition-colors ${
              dragOver === status ? 'ring-2 ring-blue-400' : ''
            } ${STATUS_COLORS[status]}`}
            onDragOver={e => { e.preventDefault(); setDragOver(status) }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-700">{STATUS_LABELS[status]}</h3>
              <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 border">
                {byStatus[status].length}
              </span>
            </div>

            <div className="space-y-2 min-h-16">
              {byStatus[status].map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('leadId', lead.id)
                    e.dataTransfer.setData('fromStatus', lead.status)
                    setDragging(lead.id)
                  }}
                  onDragEnd={() => { setDragging(null); setDragOver(null) }}
                  className={`bg-white rounded-lg p-3 shadow-sm border border-white cursor-grab active:cursor-grabbing transition-opacity ${
                    dragging === lead.id ? 'opacity-40' : ''
                  }`}
                >
                  <a href={`/wds/leads/${lead.id}`} onClick={e => e.stopPropagation()}>
                    <p className="text-sm font-medium text-gray-800 truncate hover:text-blue-600">
                      {lead.customerName ?? '(ไม่ระบุ)'}
                    </p>
                  </a>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">{lead.source}</span>
                    {isStale(lead.updatedAt) && status !== 'won' && status !== 'lost' && (
                      <span className="text-xs text-red-500" title="ค้างนาน >7 วัน">⏰</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(lead.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}