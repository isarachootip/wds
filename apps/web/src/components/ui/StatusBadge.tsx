'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type CrmStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'site_visit_requested'
  | 'quoted'
  | 'won'
  | 'lost'

export type BaseBadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary'

export type StatusVariant = BaseBadgeVariant | CrmStage

// Backwards compatibility alias
export type BadgeVariant = StatusVariant

export interface StatusBadgeProps {
  variant?: StatusVariant
  status?: StatusVariant
  label?: string
  dot?: boolean
  className?: string
}

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  qualified: 'ผ่านเกณฑ์',
  site_visit_requested: 'นัดสำรวจ',
  quoted: 'เสนอราคา',
  won: 'ปิดการขาย (Won)',
  lost: 'ปิดไม่สำเร็จ (Lost)',
}

const variantStyles: Record<StatusVariant, { container: string; dot: string }> = {
  // Standard generic variants
  success: {
    container: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/15',
    dot: 'bg-emerald-500',
  },
  warning: {
    container: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/15',
    dot: 'bg-amber-500',
  },
  danger: {
    container: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400 dark:bg-rose-500/15',
    dot: 'bg-rose-500',
  },
  info: {
    container: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400 dark:bg-sky-500/15',
    dot: 'bg-sky-500',
  },
  neutral: {
    container: 'bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-300 dark:bg-slate-500/15',
    dot: 'bg-slate-400',
  },
  primary: {
    container: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/15',
    dot: 'bg-blue-500',
  },

  // 7 WDS CRM stages
  new: {
    container: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/15',
    dot: 'bg-blue-500',
  },
  contacted: {
    container: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/15',
    dot: 'bg-amber-500',
  },
  qualified: {
    container: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-500/15',
    dot: 'bg-indigo-500',
  },
  site_visit_requested: {
    container: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400 dark:bg-purple-500/15',
    dot: 'bg-purple-500',
  },
  quoted: {
    container: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 dark:text-cyan-400 dark:bg-cyan-500/15',
    dot: 'bg-cyan-500',
  },
  won: {
    container: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/15',
    dot: 'bg-emerald-500',
  },
  lost: {
    container: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400 dark:bg-rose-500/15',
    dot: 'bg-rose-500',
  },
}

export function StatusBadge({
  variant,
  status,
  label,
  dot = true,
  className = '',
}: StatusBadgeProps) {
  const activeKey = (status || variant || 'neutral') as StatusVariant
  const styles = variantStyles[activeKey] || variantStyles.neutral

  const resolvedLabel =
    label ??
    (activeKey in CRM_STAGE_LABELS
      ? CRM_STAGE_LABELS[activeKey as CrmStage]
      : activeKey)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors',
        styles.container,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} />}
      <span className="truncate">{resolvedLabel}</span>
    </span>
  )
}
