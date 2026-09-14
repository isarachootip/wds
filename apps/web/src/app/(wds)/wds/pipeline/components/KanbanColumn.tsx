'use client'

import React from 'react'
import {
  type LeadCard,
  type Status,
  STATUS_LABELS,
  STATUS_HEADER_STYLES,
} from '../KanbanBoard'
import { KanbanCard } from './KanbanCard'
import { satangToBaht } from '@/lib/qt-calc'
import { cn } from '@/lib/utils'

export interface KanbanColumnProps {
  status: Status
  leads: LeadCard[]
  stageTotal: number
  isTargetOver?: boolean
  draggingLeadId?: string | null
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragStartCard: (e: React.DragEvent, lead: LeadCard) => void
  onDragEndCard: () => void
  onMoveStage: (leadId: string, targetStage: Status) => void
}

export function KanbanColumn({
  status,
  leads,
  stageTotal,
  isTargetOver = false,
  draggingLeadId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStartCard,
  onDragEndCard,
  onMoveStage,
}: KanbanColumnProps) {
  const styles = STATUS_HEADER_STYLES[status]
  const statusLabel = STATUS_LABELS[status]

  return (
    <div
      className={cn(
        'flex-shrink-0 w-80 rounded-2xl border border-border bg-muted/20 p-3.5 transition-all duration-200 flex flex-col',
        styles.borderTop,
        'border-t-4 shadow-xs',
        isTargetOver && 'ring-2 ring-primary bg-primary/5 border-primary/40 shadow-md'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Modern Column Header */}
      <div className="mb-3.5 bg-card rounded-xl p-3 border border-border shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs',
                styles.pill
              )}
            >
              {statusLabel}
            </span>
          </div>

          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-semibold border tabular-nums',
              styles.badge
            )}
          >
            {leads.length} ดีล
          </span>
        </div>

        {/* Total Sum Aggregation via satangToBaht */}
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>มูลค่ารวม:</span>
          <span className="font-bold text-foreground font-mono tabular-nums">
            ฿{satangToBaht(stageTotal)}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="space-y-3 min-h-[140px] flex-1">
        {leads.length === 0 ? (
          <div className="h-28 rounded-xl border border-dashed border-border/80 flex flex-col items-center justify-center text-center p-3 text-xs text-muted-foreground bg-card/40">
            <span>ไม่มีรายการในสถานะนี้</span>
            <span className="text-[11px] text-muted-foreground/70 mt-0.5">
              ลาก Lead มาวางที่นี่
            </span>
          </div>
        ) : (
          leads.map(lead => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              isDragging={draggingLeadId === lead.id}
              onDragStart={e => onDragStartCard(e, lead)}
              onDragEnd={onDragEndCard}
              onMoveStage={onMoveStage}
            />
          ))
        )}
      </div>
    </div>
  )
}
