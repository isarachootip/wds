'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
  MessageSquare,
  Phone,
  Store,
  HelpCircle,
  Globe,
  Compass,
  HardHat,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  List,
} from 'lucide-react'
import {
  updateLeadStatusAction,
  closeLostLeadAction,
  closeWinLeadAction,
  LOST_REASONS,
} from '@/modules/crm/actions'
import { KanbanColumn } from './components/KanbanColumn'
import { KanbanCard } from './components/KanbanCard'
import { PipelineListView } from './components/PipelineListView'
import { CloseLostModal } from './components/CloseLostModal'
import { CloseWinModal } from './components/CloseWinModal'
import { cn } from '@/lib/utils'

export const STATUSES = [
  'new',
  'contacted',
  'qualified',
  'site_visit_requested',
  'quoted',
  'won',
  'lost',
] as const

export type Status = (typeof STATUSES)[number]

export const STATUS_LABELS: Record<Status, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  qualified: 'ผ่านเกณฑ์',
  site_visit_requested: 'นัดสำรวจ',
  quoted: 'เสนอราคา',
  won: 'ปิดการขาย',
  lost: 'ไม่สำเร็จ',
}

export const STATUS_HEADER_STYLES: Record<
  Status,
  { bg: string; borderTop: string; badge: string; pill: string }
> = {
  new: {
    bg: 'bg-card border-border',
    borderTop: 'border-t-blue-600',
    badge: 'bg-blue-100 text-blue-950 font-bold dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    pill: 'bg-blue-100 text-blue-950 font-bold dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  },
  contacted: {
    bg: 'bg-card border-border',
    borderTop: 'border-t-amber-600',
    badge: 'bg-amber-100 text-amber-950 font-bold dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    pill: 'bg-amber-100 text-amber-950 font-bold dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
  },
  qualified: {
    bg: 'bg-card border-border',
    borderTop: 'border-t-indigo-600',
    badge: 'bg-indigo-100 text-indigo-950 font-bold dark:bg-indigo-950/80 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    pill: 'bg-indigo-100 text-indigo-950 font-bold dark:bg-indigo-950/80 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
  },
  site_visit_requested: {
    bg: 'bg-card border-border',
    borderTop: 'border-t-purple-600',
    badge: 'bg-purple-100 text-purple-950 font-bold dark:bg-purple-950/80 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    pill: 'bg-purple-100 text-purple-950 font-bold dark:bg-purple-950/80 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  },
  quoted: {
    bg: 'bg-card border-border',
    borderTop: 'border-t-cyan-600',
    badge: 'bg-cyan-100 text-cyan-950 font-bold dark:bg-cyan-950/80 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
    pill: 'bg-cyan-100 text-cyan-950 font-bold dark:bg-cyan-950/80 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
  },
  won: {
    bg: 'bg-card border-border',
    borderTop: 'border-t-emerald-600',
    badge: 'bg-emerald-100 text-emerald-950 font-bold dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    pill: 'bg-emerald-100 text-emerald-950 font-bold dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
  },
  lost: {
    bg: 'bg-card border-border',
    borderTop: 'border-t-rose-600',
    badge: 'bg-rose-100 text-rose-950 font-bold dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-700',
    pill: 'bg-rose-100 text-rose-950 font-bold dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-700',
  },
}

export const LOST_REASON_OPTIONS = [
  { value: 'PRICE_HIGH', label: 'ราคาสูงเกินไป / สู้ราคาไม่ไหว (Price too high)' },
  { value: 'COMPETITOR_CHOSEN', label: 'เลือกคู่แข่ง / ซื้อเจ้าอื่น (Chose competitor)' },
  { value: 'PROJECT_CANCELLED', label: 'ลูกค้ายกเลิก/ชะลอโครงการ (Project cancelled)' },
  { value: 'UNREACHABLE', label: 'ติดต่อลูกค้าไม่ได้ / ขาดการติดต่อ (Unreachable)' },
  { value: 'SPEC_MISMATCH', label: 'สเปกสินค้าไม่ตรงความต้องการ (Spec mismatch)' },
  { value: 'BUDGET_INSUFFICIENT', label: 'งบประมาณไม่เพียงพอ (Budget insufficient)' },
  { value: 'BELOW_WHOLESALE_THRESHOLD', label: 'ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง (Below wholesale threshold)' },
  { value: 'OTHER', label: 'อื่นๆ (Other reason)' },
]

export interface LeadCard {
  id: string
  status: string
  source: string
  channelRef?: string | null
  customerName?: string | null
  customerPhone?: string | null
  company?: string | null
  interest?: any
  budgetRangeMinSatang?: number | null
  budgetRangeMaxSatang?: number | null
  dealValueSatang?: number | null
  nextFollowUpDue?: string | Date | null
  lostReason?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  score?: number | null
  branch?: string | null
  ownerId?: string | null
  ownerName?: string | null
  projectName?: string | null
}

export interface KanbanBoardProps {
  initialLeads?: LeadCard[]
  leads?: LeadCard[]
  initialView?: 'kanban' | 'list'
  view?: 'kanban' | 'list'
  onViewChange?: (view: 'kanban' | 'list') => void
  showViewToggle?: boolean
  onStatusChange?: (leadId: string, newStatus: string, lostReason?: string) => void
}

export function isStale(updatedAt: Date | string | null | undefined): boolean {
  if (!updatedAt) return false
  const time = new Date(updatedAt).getTime()
  if (isNaN(time)) return false
  return Date.now() - time > 7 * 24 * 60 * 60 * 1000
}

export function getLeadDealSatang(lead: LeadCard): number {
  if (lead.dealValueSatang && lead.dealValueSatang > 0) return lead.dealValueSatang
  if (lead.budgetRangeMaxSatang && lead.budgetRangeMaxSatang > 0) return lead.budgetRangeMaxSatang
  if (lead.budgetRangeMinSatang && lead.budgetRangeMinSatang > 0) return lead.budgetRangeMinSatang
  return 0
}

export function formatDealValue(satangAmount: number): string {
  if (!satangAmount || satangAmount <= 0) return '฿0'
  const baht = Math.round(satangAmount / 100)
  return `฿${baht.toLocaleString('th-TH')}`
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  }
  return phone
}

export function formatShortDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  })
}

export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false
  const time = new Date(dueDate).getTime()
  if (isNaN(time)) return false
  return time < Date.now()
}

export function getInterestSnippet(interest: any): string {
  if (!interest) return ''
  if (typeof interest === 'string') return interest
  if (typeof interest === 'object') {
    if (interest.description && typeof interest.description === 'string') {
      return interest.description
    }
    if (Array.isArray(interest.products) && interest.products.length > 0) {
      return interest.products.join(', ')
    }
    if (interest.title && typeof interest.title === 'string') {
      return interest.title
    }
  }
  return ''
}

export function getSourceBadge(source: string) {
  const normalized = (source || '').toLowerCase()
  switch (normalized) {
    case 'line':
      return {
        label: 'LINE OA',
        icon: <MessageSquare className="size-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />,
        style: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold',
      }
    case 'phone':
      return {
        label: 'โทรศัพท์',
        icon: <Phone className="size-3.5 text-blue-700 dark:text-blue-400 shrink-0" />,
        style: 'bg-blue-100 text-blue-950 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-700 font-bold',
      }
    case 'store':
    case 'walk_in':
      return {
        label: 'หน้าร้าน',
        icon: <Store className="size-3.5 text-purple-700 dark:text-purple-400 shrink-0" />,
        style: 'bg-purple-100 text-purple-950 dark:bg-purple-950/80 dark:text-purple-200 border-purple-300 dark:border-purple-700 font-bold',
      }
    case 'web':
      return {
        label: 'เว็บไซต์ (Web)',
        icon: <Globe className="size-3.5 text-indigo-700 dark:text-indigo-400 shrink-0" />,
        style: 'bg-indigo-100 text-indigo-950 dark:bg-indigo-950/80 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 font-bold',
      }
    case 'architect':
      return {
        label: 'สถาปนิก (Architect)',
        icon: <Compass className="size-3.5 text-cyan-700 dark:text-cyan-400 shrink-0" />,
        style: 'bg-cyan-100 text-cyan-950 dark:bg-cyan-950/80 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700 font-bold',
      }
    case 'subcontractor':
      return {
        label: 'ผู้รับเหมาช่วง (Subcontractor)',
        icon: <HardHat className="size-3.5 text-amber-700 dark:text-amber-400 shrink-0" />,
        style: 'bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-bold',
      }
    default:
      return {
        label: 'อื่นๆ',
        icon: <HelpCircle className="size-3.5 text-muted-foreground shrink-0" />,
        style: 'bg-muted text-foreground border-border font-bold',
      }
  }
}

export function KanbanBoard({
  initialLeads = [],
  leads: controlledLeads,
  initialView = 'kanban',
  view: controlledView,
  onViewChange,
  showViewToggle = true,
  onStatusChange,
}: KanbanBoardProps) {
  const [internalLeads, setInternalLeads] = useState<LeadCard[]>(initialLeads)
  const [internalView, setInternalView] = useState<'kanban' | 'list'>(initialView)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const currentView = controlledView ?? internalView

  function handleViewChange(v: 'kanban' | 'list') {
    setInternalView(v)
    onViewChange?.(v)
  }

  // Lost Reason Modal State
  const [pendingLostLead, setPendingLostLead] = useState<{
    lead: LeadCard
    fromStatus: string
  } | null>(null)
  const [selectedLostReason, setSelectedLostReason] = useState<string>('PRICE_HIGH')
  const [lostNote, setLostNote] = useState('')
  const [lostSubmitting, setLostSubmitting] = useState(false)
  const [lostError, setLostError] = useState('')

  // Close Win Modal State
  const [pendingWinLead, setPendingWinLead] = useState<{
    lead: LeadCard
    fromStatus: string
  } | null>(null)
  const [winSubmitting, setWinSubmitting] = useState(false)
  const [winError, setWinError] = useState('')

  const [winSuccessToast, setWinSuccessToast] = useState<{
    orderNumber?: string
    creditStatus?: string
  } | null>(null)

  // Sync internal leads when controlledLeads or initialLeads changes
  useEffect(() => {
    if (controlledLeads) {
      setInternalLeads(controlledLeads)
    } else if (initialLeads) {
      setInternalLeads(initialLeads)
    }
  }, [controlledLeads, initialLeads])

  const activeLeads = controlledLeads ?? internalLeads

  // Group leads by status (handling 'site_visit' synonym for 'site_visit_requested')
  const byStatus = STATUSES.reduce<Record<Status, LeadCard[]>>(
    (acc, s) => {
      acc[s] = activeLeads.filter(l => {
        if (s === 'site_visit_requested') {
          return l.status === 'site_visit_requested' || l.status === 'site_visit'
        }
        return l.status === s
      })
      return acc
    },
    {} as Record<Status, LeadCard[]>
  )

  // Calculate stage deal sums
  const stageSums = STATUSES.reduce<Record<Status, number>>(
    (acc, s) => {
      acc[s] = byStatus[s].reduce((sum, lead) => sum + getLeadDealSatang(lead), 0)
      return acc
    },
    {} as Record<Status, number>
  )

  function initiateStageTransition(lead: LeadCard, fromStatus: string, newStatus: Status) {
    if (fromStatus === newStatus) return

    // Intercept drop to Lost: require mandatory reason modal
    if (newStatus === 'lost') {
      setPendingLostLead({ lead, fromStatus })
      setSelectedLostReason('PRICE_HIGH')
      setLostNote('')
      setLostError('')
      setDragging(null)
      return
    }

    // Intercept drop to Won: require Close Win confirmation to trigger Sales Order creation & credit check
    if (newStatus === 'won') {
      setPendingWinLead({ lead, fromStatus })
      setWinError('')
      setDragging(null)
      return
    }

    // Optimistic update
    setInternalLeads(prev =>
      prev.map(l => (l.id === lead.id ? { ...l, status: newStatus } : l))
    )

    startTransition(async () => {
      const result = await updateLeadStatusAction(lead.id, newStatus, 'current-user-id')
      if (!result.success) {
        // Rollback
        setInternalLeads(prev =>
          prev.map(l => (l.id === lead.id ? { ...l, status: fromStatus } : l))
        )
        setError(result.error ?? 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
        setTimeout(() => setError(''), 4000)
      } else {
        onStatusChange?.(lead.id, newStatus)
      }
    })
    setDragging(null)
  }

  async function handleDrop(e: React.DragEvent, newStatus: Status) {
    e.preventDefault()
    setDragOver(null)
    const leadId = e.dataTransfer.getData('leadId')
    const fromStatus = e.dataTransfer.getData('fromStatus') as Status
    if (!leadId) {
      setDragging(null)
      return
    }

    const lead = activeLeads.find(l => l.id === leadId)
    if (!lead) {
      setDragging(null)
      return
    }

    initiateStageTransition(lead, fromStatus, newStatus)
  }

  async function handleConfirmCloseWin() {
    if (!pendingWinLead) return

    setWinSubmitting(true)
    setWinError('')

    try {
      const result = await closeWinLeadAction({
        leadId: pendingWinLead.lead.id,
        actorId: 'current-user-id',
      })

      if (!result.success) {
        setWinError(result.error ?? 'เกิดข้อผิดพลาดในการปิดการขาย')
        setWinSubmitting(false)
        return
      }

      // Optimistic update
      setInternalLeads(prev =>
        prev.map(l =>
          l.id === pendingWinLead.lead.id
            ? { ...l, status: 'won' }
            : l
        )
      )

      onStatusChange?.(pendingWinLead.lead.id, 'won')

      const orderNumber = result.orderNumber
      const creditStatus = result.creditStatus
      setPendingWinLead(null)

      setWinSuccessToast({
        orderNumber,
        creditStatus,
      })
      setTimeout(() => setWinSuccessToast(null), 6000)
    } catch (err: any) {
      setWinError(err.message ?? 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setWinSubmitting(false)
    }
  }

  function handleCancelCloseWin() {
    setPendingWinLead(null)
    setWinError('')
  }

  async function handleConfirmCloseLost() {
    if (!pendingLostLead) return
    if (!selectedLostReason) {
      setLostError('กรุณาเลือกเหตุผลการปิดการขายไม่สำเร็จ')
      return
    }

    setLostSubmitting(true)
    setLostError('')

    try {
      const result = await closeLostLeadAction({
        leadId: pendingLostLead.lead.id,
        lostReason: selectedLostReason,
        note: lostNote.trim() || undefined,
        actorId: 'current-user-id',
      })

      if (!result.success) {
        setLostError(result.error ?? 'เกิดข้อผิดพลาดในการปิด Lead')
        setLostSubmitting(false)
        return
      }

      // Optimistic update
      setInternalLeads(prev =>
        prev.map(l =>
          l.id === pendingLostLead.lead.id
            ? { ...l, status: 'lost', lostReason: selectedLostReason }
            : l
        )
      )

      onStatusChange?.(pendingLostLead.lead.id, 'lost', selectedLostReason)
      setPendingLostLead(null)
      setLostNote('')
      setSelectedLostReason('PRICE_HIGH')
    } catch (err: any) {
      setLostError(err.message ?? 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLostSubmitting(false)
    }
  }

  function handleCancelCloseLost() {
    setPendingLostLead(null)
    setLostNote('')
    setLostError('')
    setSelectedLostReason('PRICE_HIGH')
  }

  function handleMoveStageAccessible(leadId: string, newStage: Status) {
    const lead = activeLeads.find(l => l.id === leadId)
    if (!lead) return
    initiateStageTransition(lead, lead.status, newStage)
  }

  return (
    <>
      {/* View Switcher Toolbar */}
      {showViewToggle && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-2xs">
          <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border">
            <button
              type="button"
              onClick={() => handleViewChange('kanban')}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all select-none',
                currentView === 'kanban'
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="size-3.5" />
              <span>การ์ด (Card / Kanban)</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('list')}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all select-none',
                currentView === 'list'
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="size-3.5" />
              <span>รายการ (List / Table)</span>
            </button>
          </div>

          <div className="text-xs font-bold text-muted-foreground">
            โหมดการแสดงผล: {currentView === 'kanban' ? 'กระดานการ์ด (Kanban)' : 'ตารางรายการ (List)'}
          </div>
        </div>
      )}

      {winSuccessToast && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              ปิดการขายสำเร็จ! สร้าง Sales Order{' '}
              <strong className="font-semibold text-foreground">
                {winSuccessToast.orderNumber || 'เรียบร้อยแล้ว'}
              </strong>
              {winSuccessToast.creditStatus && ` (สถานะเครดิต: ${winSuccessToast.creditStatus})`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setWinSuccessToast(null)}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-semibold px-2.5 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors ml-4"
          >
            ปิด
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {currentView === 'kanban' ? (
        /* Kanban Board Container with 7 Stage Columns */
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[580px]">
          {STATUSES.map(status => {
            const leadsInStage = byStatus[status]
            const stageTotal = stageSums[status]
            const isTargetOver = dragOver === status

            return (
              <KanbanColumn
                key={status}
                status={status}
                leads={leadsInStage}
                stageTotal={stageTotal}
                isTargetOver={isTargetOver}
                draggingLeadId={dragging}
                onDragOver={e => {
                  e.preventDefault()
                  if (dragOver !== status) setDragOver(status)
                }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOver(null)
                  }
                }}
                onDrop={e => handleDrop(e, status)}
                onDragStartCard={(e, lead) => {
                  e.dataTransfer.setData('leadId', lead.id)
                  e.dataTransfer.setData('fromStatus', lead.status)
                  setDragging(lead.id)
                }}
                onDragEndCard={() => {
                  setDragging(null)
                  setDragOver(null)
                }}
                onMoveStage={handleMoveStageAccessible}
              />
            )
          })}
        </div>
      ) : (
        /* List / Table View with Stage Metrics */
        <PipelineListView
          leads={activeLeads}
          stageSums={stageSums}
          byStatus={byStatus}
          onMoveStage={handleMoveStageAccessible}
        />
      )}

      {/* Close Lost Reason Modal */}
      <CloseLostModal
        pendingLead={pendingLostLead}
        selectedReason={selectedLostReason}
        onSelectReason={setSelectedLostReason}
        note={lostNote}
        onChangeNote={setLostNote}
        error={lostError}
        submitting={lostSubmitting}
        onCancel={handleCancelCloseLost}
        onConfirm={handleConfirmCloseLost}
      />

      {/* Close Win Confirmation Modal */}
      <CloseWinModal
        pendingLead={pendingWinLead}
        error={winError}
        submitting={winSubmitting}
        onCancel={handleCancelCloseWin}
        onConfirm={handleConfirmCloseWin}
      />
    </>
  )
}

export { KanbanCard }