'use client'

import React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { type LeadCard, type Status, STATUS_LABELS, getLeadDealSatang } from '../KanbanBoard'
import { satangToBaht } from '@/lib/qt-calc'
import { Button } from '@/components/ui/button'

export interface CloseWinModalProps {
  pendingLead: { lead: LeadCard; fromStatus: string } | null
  error: string
  submitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function CloseWinModal({
  pendingLead,
  error,
  submitting,
  onCancel,
  onConfirm,
}: CloseWinModalProps) {
  if (!pendingLead) return null

  const dealSatang = getLeadDealSatang(pendingLead.lead)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border">
        {/* Modal Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="flex-1">
            <h3 id="win-modal-title" className="text-lg font-bold text-foreground">
              ยืนยันปิดการขาย (Close Win)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              ลูกค้า:{' '}
              <strong className="text-foreground">
                {pendingLead.lead.customerName || '(ไม่ระบุชื่อ)'}
              </strong>
              {pendingLead.lead.company && ` (${pendingLead.lead.company})`}
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
        <div className="space-y-3 text-sm text-muted-foreground bg-muted/40 rounded-xl p-4 border border-border">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">มูลค่าดีลโดยประมาณ:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono tabular-nums">
              ฿{satangToBaht(dealSatang)}
            </span>
          </div>

          {pendingLead.fromStatus !== 'quoted' && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                ข้อควรทราบ: Lead อยู่ในสถานะ &ldquo;{STATUS_LABELS[pendingLead.fromStatus as Status] || pendingLead.fromStatus}&rdquo; ตามระบบขั้นตอนการขายแนะนำให้ออกใบเสนอราคา (Quoted) ก่อนปิดการขาย
              </span>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1.5 pt-1 border-t border-border">
            <p className="font-semibold text-foreground">การดำเนินการอัตโนมัติเมื่อยืนยัน:</p>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>สร้าง Sales Order (SO) ในระบบ WDS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>ผูกใบเสนอราคา (Quotation) ล่าสุด</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>ตรวจวงเงินและสถานะเครดิตอัตโนมัติ</span>
            </div>
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
            onClick={onConfirm}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึกและสร้าง SO...</span>
              </>
            ) : (
              <span>ยืนยันปิดการขาย (สร้าง SO)</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
