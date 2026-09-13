'use client'

import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'

interface StatusBadgeProps {
  variant?: BadgeVariant
  label: string
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
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
}

export function StatusBadge({ variant = 'neutral', label, dot = true, className = '' }: StatusBadgeProps) {
  const styles = variantStyles[variant]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors ${styles.container} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      <span className="truncate">{label}</span>
    </span>
  )
}
