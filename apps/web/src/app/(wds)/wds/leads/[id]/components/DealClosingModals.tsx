'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Trophy,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Truck,
  ExternalLink,
  FileCheck,
  X,
} from 'lucide-react'
import {
  closeWinLeadAction,
  closeLostLeadAction,
  LOST_REASONS,
} from '@/modules/crm/actions'
import { formatTHB, satang } from '@/lib/money'
import { Button } from '@/components/ui/button'

export interface DealClosingModalsProps {
  leadId: string
  currentStatus: string
  quotations: any[]
  lostReason?: string | null
  initialShowWinModal?: boolean
  initialShowLostModal?: boolean
}

export const LOST_REASON_OPTIONS = [
  { value: 'PRICE_HIGH', label: 'ราคาสูงเกินไป (Price too high)' },
  { value: 'COMPETITOR_CHOSEN', label: 'เลือกซื้อจากคู่แข่ง (Chose competitor)' },
  { value: 'PROJECT_CANCELLED', label: 'ลูกค้ายกเลิก/ชะลอโครงการ (Project cancelled)' },
  { value: 'UNREACHABLE', label: 'ติดต่อไม่ได้ / ขาดการติดต่อ (Unreachable)' },
  { value: 'SPEC_MISMATCH', label: 'สเปกสินค้าไม่ตรงความต้องการ (Spec mismatch)' },
  { value: 'BUDGET_INSUFFICIENT', label: 'งบประมาณโครงการไม่เพียงพอ (Budget insufficient)' },
  { value: 'BELOW_WHOLESALE_THRESHOLD', label: 'ยอดสั่งซื้อต่ำกว่าเกณฑ์ขายส่ง (Below wholesale threshold)' },
  { value: 'OTHER', label: 'อื่นๆ (Other reason)' },
]

export function DealClosingModals({
  leadId,
  currentStatus,
  quotations = [],
  lostReason,
  initialShowWinModal = false,
  initialShowLostModal = false,
}: DealClosingModalsProps) {
  const [isPending, startTransition] = useTransition()

  // Modal states
  const [showWinModal, setShowWinModal] = useState(initialShowWinModal)
  const [showLostModal, setShowLostModal] = useState(initialShowLostModal)
  const [winSuccessData, setWinSuccessData] = useState<{
    orderId?: string
    orderNumber?: string
    creditStatus?: string
  } | null>(null)

  // Close Win form state
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>(() => {
    return quotations[0]?.id || ''
  })
  const [winError, setWinError] = useState<string | null>(null)

  // Close Lost form state
  const [selectedLostReason, setSelectedLostReason] = useState<string>('')
  const [lostNote, setLostNote] = useState<string>('')
  const [lostError, setLostError] = useState<string | null>(null)

  const isWon = currentStatus === 'won'
  const isLost = currentStatus === 'lost'
  const canCloseWin = currentStatus === 'quoted'

  function handleCloseWinSubmit() {
    setWinError(null)
    startTransition(async () => {
      const result = await closeWinLeadAction({
        leadId,
        quotationId: selectedQuotationId || undefined,
        actorId: 'sales-ae',
      })

      if (result.success) {
        setWinSuccessData({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          creditStatus: result.creditStatus,
        })
      } else {
        setWinError(result.error ?? 'เกิดข้อผิดพลาดในการปิดการขาย')
      }
    })
  }

  function handleCloseLostSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Strictly enforce mandatory lost reason selection
    if (!selectedLostReason || !selectedLostReason.trim()) {
      setLostError('กรุณาเลือกเหตุผลการปิดการขายไม่สำเร็จ (Mandatory Lost Reason)')
      return
    }

    setLostError(null)
    startTransition(async () => {
      const result = await closeLostLeadAction({
        leadId,
        lostReason: selectedLostReason,
        note: lostNote.trim() || undefined,
        actorId: 'sales-ae',
      })

      if (result.success) {
        setShowLostModal(false)
      } else {
        setLostError(result.error ?? 'เกิดข้อผิดพลาดในการปิดการขาย')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-card-foreground">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>การปิดดีล (Deal Closing Actions)</span>
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        ตัดสินผลการขายเพื่อส่งต่องานเข้าสู่กระบวนการสั่งซื้อ เครดิต และการจัดส่งสินค้า WDS
      </p>

      {/* When lead is already closed */}
      {isWon && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-foreground">ดีลนี้ปิดการขายสำเร็จแล้ว (Deal Won)</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              สร้างคำสั่งซื้อ (Sales Order) และส่งต่องานเข้าสู่ระบบตรวจสอบวงเงินและการจัดส่งสินค้าแล้ว
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <Link
                href="/wds/orders"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <span>ดูคำสั่งซื้อ (SO)</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-border">•</span>
              <Link
                href="/wds/deliveries"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <span>แผนจัดส่ง</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {isLost && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-foreground">ดีลนี้ปิดไม่สำเร็จ (Deal Lost)</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              เหตุผล: <span className="font-semibold text-rose-600 dark:text-rose-400">{lostReason || 'ไม่ระบุ'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Trigger Buttons */}
      {!isWon && !isLost && (
        <div className="space-y-2.5">
          <Button
            type="button"
            onClick={() => {
              setWinError(null)
              setWinSuccessData(null)
              setShowWinModal(true)
            }}
            disabled={!canCloseWin}
            className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold text-xs py-2.5 disabled:opacity-50"
          >
            <Trophy className="w-4 h-4" />
            <span>+ ปิดการขาย (Win)</span>
          </Button>

          {!canCloseWin && (
            <p className="text-[10px] text-muted-foreground text-center">
              * ต้องอยู่ในสถานะ &quot;เสนอราคาแล้ว (Quoted)&quot; จึงจะสามารถปิดการขาย (Win) ได้
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLostError(null)
              setShowLostModal(true)
            }}
            className="w-full justify-center border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold text-xs py-2.5"
          >
            <XCircle className="w-4 h-4" />
            <span>ปิดไม่สำเร็จ (Lost)</span>
          </Button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. Close Win Modal Dialog */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-win-modal-title"
            className="bg-card rounded-2xl shadow-xl border border-border max-w-lg w-full p-6 space-y-4 text-card-foreground"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4
                id="close-win-modal-title"
                className="text-base font-bold text-foreground flex items-center gap-2"
              >
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>ยืนยันปิดการขายสำเร็จ (Close Win Deal)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowWinModal(false)}
                aria-label="ปิดหน้าต่าง"
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If won successfully, show summary */}
            {winSuccessData ? (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h5 className="text-sm font-bold text-foreground">
                    สร้าง Sales Order สำเร็จเรียบร้อย! 🎉
                  </h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    เลขที่คำสั่งซื้อ:{' '}
                    <span className="font-mono font-bold text-primary">
                      {winSuccessData.orderNumber || 'SO-2026-XXXX'}
                    </span>
                  </p>
                </div>

                <div className="bg-muted/40 rounded-xl p-3 border border-border text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ผลประเมินวงเงินเครดิตอัตโนมัติ:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        winSuccessData.creditStatus === 'credit_hold'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {winSuccessData.creditStatus === 'credit_hold'
                        ? 'ติดเงื่อนไขเครดิต (Hold)'
                        : 'ผ่านเกณฑ์ (Awaiting Payment)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    ระบบได้แปลงใบเสนอราคาเป็นคำสั่งซื้อ และส่งต่องานเข้าสู่แผนกการเงินและคลังสินค้า
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWinModal(false)}
                  >
                    ปิดหน้าต่าง
                  </Button>
                  <Link href="/wds/orders">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <span>ไปยังหน้ารายการ Orders</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  เมื่อยืนยันชนะการขาย ระบบจะดำเนินการดังต่อไปนี้อัตโนมัติ:
                </p>

                <ul className="text-xs text-foreground space-y-2 bg-muted/40 p-3.5 rounded-xl border border-border">
                  <li className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>สร้างใบสั่งขาย (Sales Order) จากใบเสนอราคาที่เลือก</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>ประเมินวงเงินเครดิตลูกค้าอัตโนมัติ (Credit Limit Check)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>เปิดสิทธิ์จัดคิวรถขนส่ง WDS พร้อมกระจายสินค้า</span>
                  </li>
                </ul>

                {/* Quotation Selector if available */}
                {quotations.length > 0 ? (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      เลือกใบเสนอราคาที่ลูกค้ายืนยันสั่งซื้อ
                    </label>
                    <select
                      value={selectedQuotationId}
                      onChange={(e) => setSelectedQuotationId(e.target.value)}
                      className="w-full border border-input bg-background rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {quotations.map((q) => (
                        <option key={q.id} value={q.id} className="bg-popover text-popover-foreground">
                          {q.number} — {formatTHB(satang(q.totalSatang))} ({q.status})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ ยังไม่มีใบเสนอราคาแนบกับ Lead นี้ (ระบบจะสร้าง Order ว่างและต้องระบุรายการภายหลัง)
                  </div>
                )}

                {winError && (
                  <div className="p-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{winError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWinModal(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="button"
                    disabled={isPending}
                    size="sm"
                    onClick={handleCloseWinSubmit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
                  >
                    {isPending ? 'กำลังบันทึกและสร้าง SO...' : '🏆 ยืนยันปิดการขาย (Won)'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. Close Lost Modal Dialog */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-lost-modal-title"
            className="bg-card rounded-2xl shadow-xl border border-border max-w-md w-full p-6 space-y-4 text-card-foreground"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4
                id="close-lost-modal-title"
                className="text-base font-bold text-foreground flex items-center gap-2"
              >
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>ปิดดีลไม่สำเร็จ (Close Lost Deal)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLostModal(false)}
                aria-label="ปิดหน้าต่าง"
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseLostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  ระบุเหตุผลที่ไม่ปิดการขาย <span className="text-destructive">* (จำเป็นต้องเลือก)</span>
                </label>
                <select
                  value={selectedLostReason}
                  onChange={(e) => setSelectedLostReason(e.target.value)}
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" className="bg-popover text-popover-foreground">
                    -- กรุณาเลือกเหตุผล --
                  </option>
                  {LOST_REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  ข้อมูลเหตุผลจะถูกนำไปวิเคราะห์ใน Sales Lost Analysis เพื่อปรับปรุงกลยุทธ์ราคาและสินค้า
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  หมายเหตุเพิ่มเติม / ข้อเสนอแนะจากลูกค้า
                </label>
                <textarea
                  value={lostNote}
                  onChange={(e) => setLostNote(e.target.value)}
                  rows={3}
                  placeholder="เช่น คู่แข่งให้เครดิต 60 วัน หรือลูกค้าแจ้งว่าโครงการชะลอไปปีหน้า..."
                  className="w-full border border-input bg-background rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              {lostError && (
                <div className="p-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{lostError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLostModal(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !selectedLostReason}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white shadow-xs font-semibold"
                >
                  {isPending ? 'กำลังบันทึก...' : 'ยืนยันปิดดีลไม่สำเร็จ (Lost)'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
