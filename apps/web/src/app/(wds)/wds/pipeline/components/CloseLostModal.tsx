'use client'

import React from 'react'
import { XCircle, AlertCircle } from 'lucide-react'
import { type LeadCard, LOST_REASON_OPTIONS } from '../KanbanBoard'
import { Button } from '@/components/ui/button'

export interface CloseLostModalProps {
  pendingLead: { lead: LeadCard; fromStatus: string } | null
  selectedReason: string
  onSelectReason: (val: string) => void
  note: string
  onChangeNote: (val: string) => void
  error: string
  submitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function CloseLostModal({
  pendingLead,
  selectedReason,
  onSelectReason,
  note,
  onChangeNote,
  error,
  submitting,
  onCancel,
  onConfirm,
}: CloseLostModalProps) {
  if (!pendingLead) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lost-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border">
        {/* Modal Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
            <XCircle className="size-6" />
          </div>
          <div className="flex-1">
            <h3 id="lost-modal-title" className="text-lg font-bold text-foreground">
              ระบุเหตุผลการปิด Lead (Close Lost)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              ลูกค้า:{' '}
              <strong className="text-foreground">
                {pendingLead.lead.customerName || '(ไม่ระบุชื่อ)'}
              </strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              สาเหตุที่ปิดการขายไม่สำเร็จ{' '}
              <span className="text-rose-500">* (บังคับเลือก)</span>
            </label>
            <select
              aria-label="สาเหตุที่ปิดการขายไม่สำเร็จ"
              value={selectedReason}
              onChange={e => onSelectReason(e.target.value)}
              className="w-full text-sm rounded-xl border border-input p-2.5 bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              {LOST_REASON_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-card text-card-foreground">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              หมายเหตุเพิ่มเติม / ข้อเสนอแนะ
            </label>
            <textarea
              aria-label="หมายเหตุเพิ่มเติม"
              value={note}
              onChange={e => onChangeNote(e.target.value)}
              placeholder="ระบุข้อคิดเห็นหรือข้อมูลการตัดสินใจของลูกค้า..."
              rows={3}
              className="w-full text-sm rounded-xl border border-input p-2.5 bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={submitting || !selectedReason}
            className="shadow-xs inline-flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <span>ยืนยันปิด Lead (Close Lost)</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
