'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  FileSpreadsheet,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
  DollarSign,
  X,
} from 'lucide-react'
import { attachQuotationToLeadAction } from '@/modules/crm/actions'
import { formatTHB, satang } from '@/lib/money'
import { satangToBaht } from '@/lib/qt-calc'
import { Button } from '@/components/ui/button'

export interface QuotationCardProps {
  leadId: string
  quotations: any[]
  initialShowAttachModal?: boolean
}

export function QuotationCard({
  leadId,
  quotations = [],
  initialShowAttachModal = false,
}: QuotationCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showAttachModal, setShowAttachModal] = useState(initialShowAttachModal)
  const [quotationNumber, setQuotationNumber] = useState('')
  const [totalBahtStr, setTotalBahtStr] = useState('')
  const [quotationDate, setQuotationDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Live VAT calculation preview
  const numBaht = parseFloat(totalBahtStr) || 0
  const subtotalBaht = Math.round((numBaht / 1.07) * 100) / 100
  const vatAmountBaht = Math.round((numBaht - subtotalBaht) * 100) / 100

  function handleAttachSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!quotationNumber.trim()) {
      setError('กรุณาระบุเลขที่ใบเสนอราคา เช่น QT-202609-0012')
      return
    }

    if (isNaN(numBaht) || numBaht <= 0) {
      setError('กรุณาระบุยอดเงินรวมเป็นจำนวนเงินที่ถูกต้อง (มากกว่า 0)')
      return
    }

    setError(null)
    startTransition(async () => {
      const totalSatang = Math.round(numBaht * 100)
      const result = await attachQuotationToLeadAction({
        leadId,
        quotationNumber: quotationNumber.trim(),
        totalSatang,
        quotationDate,
        validUntil,
        actorId: 'sales-ae',
      })

      if (result.success) {
        setSuccess(`แนบใบเสนอราคา ${quotationNumber.trim()} เรียบร้อยแล้ว (ปรับสถานะเป็นเสนอราคาแล้ว)`)
        setShowAttachModal(false)
        setQuotationNumber('')
        setTotalBahtStr('')
        setTimeout(() => setSuccess(null), 3500)
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาดในการแนบใบเสนอราคา')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>ใบเสนอราคา E-ordering (Quotations)</span>
            </h3>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
              {quotations.length} ฉบับ
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            เชื่อมต่อกับ E-ordering Engine คำนวณส่วนลดตาม Tier, Volume Break และภาษีมูลค่าเพิ่ม 7%
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            setShowAttachModal(true)
            setError(null)
          }}
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>แนบใบเสนอราคา (Attach QT)</span>
        </Button>
      </div>

      {success && (
        <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Attach Quotation Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="attach-quotation-modal-title"
            className="bg-card rounded-2xl shadow-xl border border-border max-w-md w-full p-5 space-y-4 text-card-foreground"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4
                id="attach-quotation-modal-title"
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                <span>แนบใบเสนอราคาจากระบบ E-ordering</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                aria-label="ปิดหน้าต่าง"
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  เลขที่ใบเสนอราคา (Quotation Number) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  placeholder="เช่น QT-202609-0042"
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 text-xs font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  รูปแบบมาตรฐาน: QT-YYYYMM-NNNN (ดึงจากระบบ E-ordering)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  ยอดเงินรวมสุทธิ (Total Amount THB รวม VAT) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-muted-foreground">฿</span>
                  <input
                    type="number"
                    step="0.01"
                    value={totalBahtStr}
                    onChange={(e) => setTotalBahtStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-input bg-background rounded-lg pl-7 pr-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Live VAT Calculation Preview */}
              {numBaht > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] space-y-1.5 text-foreground">
                  <div className="flex justify-between text-muted-foreground">
                    <span>ยอดก่อนภาษี (Subtotal 100/107):</span>
                    <span className="font-mono text-foreground">
                      ฿{subtotalBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                    <span className="font-mono text-foreground">
                      ฿{vatAmountBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground border-t border-amber-500/20 pt-1.5">
                    <span>ยอดรวมสุทธิ (Total):</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      ฿{numBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">
                    วันที่ออกเอกสาร (QT Date)
                  </label>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full border border-input bg-background rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">
                    ใช้ได้ถึงวันที่ (Valid Until)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full border border-input bg-background rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAttachModal(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !quotationNumber.trim() || numBaht <= 0}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  {isPending ? 'กำลังแนบ...' : 'ยืนยันแนบใบเสนอราคา'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotations List */}
      {quotations.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-2xl bg-muted/20">
          <FileSpreadsheet className="w-7 h-7 text-muted-foreground/50 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground font-medium">ยังไม่มีใบเสนอราคาแนบกับ Lead นี้</p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            คลิกปุ่ม &quot;แนบใบเสนอราคา (Attach QT)&quot; เพื่อผูกเลขที่เอกสาร
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {quotations.map((q) => {
            const formattedTotal = formatTHB(satang(q.totalSatang))
            const formattedSubtotal = formatTHB(satang(q.subtotalSatang))
            const formattedVat = formatTHB(satang(q.vatAmountSatang))
            const bahtTotalDisplay = satangToBaht(q.totalSatang)

            return (
              <div key={q.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {q.number}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        q.status === 'accepted'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : q.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : q.status === 'expired'
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {q.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    ออกเมื่อ: {new Date(q.createdAt).toLocaleDateString('th-TH')} • ใช้ได้ถึง:{' '}
                    {q.validUntil ? new Date(q.validUntil).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                  </div>

                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    ยอดก่อน VAT {formattedSubtotal} + VAT 7% {formattedVat} (฿{bahtTotalDisplay})
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-foreground font-mono">
                    {formattedTotal}
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <Link
                      href={`/api/quotations/${q.id}/pdf`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
                    >
                      <FileText className="w-3 h-3" />
                      <span>พิมพ์ PDF</span>
                    </Link>
                    <span className="text-border">|</span>
                    <Link
                      href="/wds/quotations"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                    >
                      <span>E-ordering</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
