'use client'

import React, { useState, useTransition } from 'react'
import { Check, ArrowRight, AlertCircle, Sparkles, XCircle } from 'lucide-react'
import { updateLeadStatusAction } from '@/modules/crm/actions'
import { Button } from '@/components/ui/button'

export interface StageProgressStepperProps {
  leadId: string
  currentStatus: string
  lostReason?: string | null
}

interface StepItem {
  id: string
  label: string
  labelEn: string
  stepNumber: number
}

const STAGES: StepItem[] = [
  { id: 'new', label: 'ใหม่', labelEn: 'New', stepNumber: 1 },
  { id: 'contacted', label: 'ติดต่อแล้ว', labelEn: 'Contacted', stepNumber: 2 },
  { id: 'qualified', label: 'ผ่านเกณฑ์', labelEn: 'Qualified', stepNumber: 3 },
  { id: 'site_visit_requested', label: 'นัดสำรวจ', labelEn: 'Site Visit', stepNumber: 4 },
  { id: 'quoted', label: 'เสนอราคา', labelEn: 'Quotation', stepNumber: 5 },
  { id: 'won', label: 'ปิดการขาย', labelEn: 'Closing', stepNumber: 6 },
]

const STAGE_ORDER = ['new', 'contacted', 'qualified', 'site_visit_requested', 'quoted', 'won']

const ELIGIBLE_NEXT_STEPS: Record<string, { to: string; label: string }[]> = {
  new: [{ to: 'contacted', label: 'ติดต่อแล้ว (Contacted)' }],
  contacted: [{ to: 'qualified', label: 'ผ่านเกณฑ์ (Qualified)' }],
  qualified: [
    { to: 'site_visit_requested', label: 'นัดสำรวจหน้างาน (Site Visit)' },
    { to: 'quoted', label: 'ข้ามไปเสนอราคา (Fast-track Quote)' },
  ],
  site_visit_requested: [{ to: 'quoted', label: 'ออกใบเสนอราคา (Quotation)' }],
}

export function StageProgressStepper({
  leadId,
  currentStatus,
  lostReason,
}: StageProgressStepperProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isWon = currentStatus === 'won'
  const isLost = currentStatus === 'lost'
  const currentIndex = STAGE_ORDER.indexOf(currentStatus)
  const nextOptions = ELIGIBLE_NEXT_STEPS[currentStatus] ?? []

  function handleAdvance(targetStatus: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateLeadStatusAction(leadId, targetStatus, 'sales-ae')
      if (!result.success) {
        setError(result.error ?? 'ไม่สามารถอัปเดตสถานะได้')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              วงจรการขาย (Sales Pipeline Cycle)
            </h2>
            {isWon && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" /> ชนะการขายสำเร็จ (Won)
              </span>
            )}
            {isLost && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <XCircle className="w-3.5 h-3.5" /> ปิดไม่สำเร็จ (Lost)
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ขั้นตอนการขายแบบ End-to-End: นำเข้า Lead → ติดตาม → สำรวจหน้างาน → เสนอราคา E-ordering → ปิดดีล
          </p>
        </div>

        {/* Quick next transition action if available */}
        {nextOptions.length > 0 && !isWon && !isLost && (
          <div className="flex items-center gap-2">
            {nextOptions.map((opt) => (
              <Button
                key={opt.to}
                type="button"
                size="sm"
                onClick={() => handleAdvance(opt.to)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>{isPending ? 'กำลังเปลี่ยน...' : `เลื่อนเป็น: ${opt.label}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Stepper */}
      <div className="relative py-2">
        {/* Connecting bar background */}
        <div
          className="absolute top-6 left-8 right-8 h-0.5 bg-border -z-0"
          aria-hidden="true"
        />

        <div className="grid grid-cols-6 gap-2 relative z-10">
          {STAGES.map((stage, idx) => {
            let isCompleted = false
            let isActive = false
            let isCurrentLost = false

            if (isWon) {
              isCompleted = true
            } else if (isLost) {
              if (idx === 5) {
                isCurrentLost = true
                isActive = true
              } else if (idx < currentIndex || (currentIndex === -1 && idx === 0)) {
                isCompleted = true
              }
            } else {
              if (stage.id === currentStatus) {
                isActive = true
              } else if (currentIndex > idx) {
                isCompleted = true
              }
            }

            return (
              <div key={stage.id} className="flex flex-col items-center text-center group">
                {/* Step Circle Marker */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-200 ${
                    isCurrentLost
                      ? 'bg-rose-600 text-white ring-4 ring-rose-500/20 shadow-xs'
                      : isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md shadow-primary/25'
                      : isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-card border-2 border-border text-muted-foreground'
                  }`}
                >
                  {isCurrentLost ? (
                    <XCircle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    stage.stepNumber
                  )}
                </div>

                {/* Stage Labels */}
                <div className="mt-2.5">
                  <div
                    className={`text-xs font-semibold ${
                      isCurrentLost
                        ? 'text-rose-600 dark:text-rose-400'
                        : isActive
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {isCurrentLost && idx === 5 ? 'ปิดไม่สำเร็จ' : stage.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {isCurrentLost && idx === 5 ? 'Lost' : stage.labelEn}
                  </div>
                </div>

                {/* Status indicator tag */}
                {isActive && !isLost && (
                  <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                    ขั้นตอนปัจจุบัน
                  </span>
                )}
                {isCurrentLost && (
                  <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {lostReason ? `เหตุผล: ${lostReason}` : 'ปิดการขายไม่ได้'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
