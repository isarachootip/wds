'use client'

import React from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  PhoneCall,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'
import {
  type LeadCard,
  type Status,
  STATUSES,
  STATUS_LABELS,
  formatPhone,
  formatShortDate,
  isStale,
  isOverdue,
  getLeadDealSatang,
  getInterestSnippet,
  getSourceBadge,
} from '../KanbanBoard'
import { satangToBaht } from '@/lib/qt-calc'
import { cn } from '@/lib/utils'

export interface KanbanCardProps {
  lead: LeadCard
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onMoveStage?: (leadId: string, targetStage: Status) => void
}

export function KanbanCard({
  lead,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onMoveStage,
}: KanbanCardProps) {
  const sourceInfo = getSourceBadge(lead.source)
  const dealSatang = getLeadDealSatang(lead)
  const stale = isStale(lead.updatedAt) && lead.status !== 'won' && lead.status !== 'lost'
  const interestText = getInterestSnippet(lead.interest)

  // Derive AE display name and avatar initials
  const aeName = lead.ownerName || (lead.ownerId ? `AE-${lead.ownerId.slice(0, 4)}` : 'AE ฝ่ายขาย')
  const aeInitials = aeName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AE'

  // Project or company display
  const projectDisplay =
    lead.company ||
    lead.projectName ||
    (lead.channelRef ? `Ref: ${lead.channelRef}` : 'โครงการทั่วไป')

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing group select-none relative',
        isDragging && 'opacity-35 scale-95 border-dashed border-primary'
      )}
    >
      {/* Top Meta Row: Source channel pill & Stale / Lost badges */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border shadow-xs transition-colors',
            sourceInfo.style
          )}
        >
          {sourceInfo.icon}
          <span>{sourceInfo.label}</span>
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {stale && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse"
              title="ไม่มีการอัปเดตเกิน 7 วัน"
            >
              <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>ค้าง &gt;7 วัน</span>
            </span>
          )}

          {lead.status === 'lost' && lead.lostReason && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 truncate max-w-[105px]"
              title={lead.lostReason}
            >
              {lead.lostReason}
            </span>
          )}
        </div>
      </div>

      {/* Customer Name & Link */}
      <Link
        href={`/wds/leads/${lead.id}`}
        onClick={e => e.stopPropagation()}
        className="block group-hover:text-primary transition-colors mt-1"
      >
        <p className="text-base font-bold text-foreground line-clamp-1 tracking-tight">
          {lead.customerName || '(ยังไม่ระบุชื่อลูกค้า)'}
        </p>
      </Link>

      {/* Project / Company Name */}
      <p className="text-xs font-semibold text-muted-foreground line-clamp-1 mt-0.5">
        {projectDisplay}
      </p>

      {/* Material / Interest Snippet */}
      {interestText && (
        <p className="text-xs font-medium text-foreground/90 line-clamp-1 mt-2 bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
          {interestText}
        </p>
      )}

      {/* Deal Value & Contact Row */}
      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2">
        <div className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-base tabular-nums">
          ฿{satangToBaht(dealSatang)}
        </div>

        {lead.customerPhone ? (
          <a
            href={`tel:${lead.customerPhone}`}
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted font-bold text-xs font-mono"
            title="โทรหาลูกค้า"
          >
            <PhoneCall className="size-3.5 text-primary shrink-0" />
            <span>{formatPhone(lead.customerPhone)}</span>
          </a>
        ) : lead.channelRef ? (
          <span className="text-xs font-bold text-muted-foreground truncate max-w-[90px] font-mono">
            {lead.channelRef}
          </span>
        ) : null}
      </div>

      {/* Footer Meta: AE Avatar, Next Date & Stage Selector */}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {/* AE Actor Avatar */}
        <div className="flex items-center gap-1.5 shrink-0" title={`ผู้ดูแล: ${aeName}`}>
          <div className="size-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold flex items-center justify-center shrink-0">
            {aeInitials}
          </div>
          <span className="truncate max-w-[80px] text-xs font-bold text-foreground hidden sm:inline">
            {aeName}
          </span>
        </div>

        {/* Date: Next Follow-up or Last Updated */}
        <div className="shrink-0">
          {lead.nextFollowUpDue ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                isOverdue(lead.nextFollowUpDue)
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-primary'
              )}
              title={new Date(lead.nextFollowUpDue).toLocaleString('th-TH')}
            >
              <Calendar className="size-3 shrink-0" />
              <span>
                {isOverdue(lead.nextFollowUpDue) ? 'เลย: ' : 'นัด: '}
                {formatShortDate(lead.nextFollowUpDue)}
              </span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-muted-foreground"
              title={`อัปเดตเมื่อ: ${new Date(lead.updatedAt).toLocaleString('th-TH')}`}
            >
              <Clock className="size-3" />
              <span>{formatShortDate(lead.updatedAt)}</span>
            </span>
          )}
        </div>

        {/* Move Stage Selector (Accessible Dropdown Affordance) */}
        {onMoveStage && (
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <select
              aria-label={`ย้ายสถานะลีด ${lead.customerName || lead.id}`}
              value={lead.status}
              onChange={e => onMoveStage(lead.id, e.target.value as Status)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  ย้ายไป: {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <div className="inline-flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 font-medium px-1.5 py-0.5 rounded-md hover:bg-muted transition-colors pointer-events-none">
              <span>ย้าย</span>
              <ChevronDown className="size-3" />
            </div>
          </div>
        )}

        {/* Direct Link to Deal Workbench */}
        <Link
          href={`/wds/leads/${lead.id}`}
          onClick={e => e.stopPropagation()}
          className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 hover:underline shrink-0"
          title="ดูรายละเอียดลีด"
        >
          <span>ดูดีล</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  )
}
