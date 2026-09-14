'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ArtifactKpiCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: {
    value: string
    positive?: boolean
  }
  icon?: React.ReactNode
  href?: string
  variant?: 'default' | 'alert' | 'warning' | 'success'
  className?: string
}

export function ArtifactKpiCard({
  label,
  value,
  sub,
  trend,
  icon,
  href,
  variant = 'default',
  className,
}: ArtifactKpiCardProps) {
  const variantStyles = {
    default: 'bg-card text-card-foreground border-border hover:border-border/80',
    alert: 'bg-rose-500/5 border-rose-500/20 text-card-foreground hover:border-rose-500/40',
    warning: 'bg-amber-500/5 border-amber-500/20 text-card-foreground hover:border-amber-500/40',
    success: 'bg-emerald-500/5 border-emerald-500/20 text-card-foreground hover:border-emerald-500/40',
  }

  const valueStyles = {
    default: 'text-foreground',
    alert: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-emerald-600 dark:text-emerald-400',
  }

  const cardContent = (
    <div
      className={cn(
        'group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-subtle',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className={cn('text-2xl font-bold tracking-tight', valueStyles[variant])}>
          {value}
        </div>

        {(sub || trend) && (
          <div className="flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium rounded-full px-2 py-0.5',
                  trend.positive
                    ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15'
                    : 'text-rose-700 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15'
                )}
              >
                {trend.positive ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {trend.value}
              </span>
            )}
            {sub && <span className="text-muted-foreground truncate">{sub}</span>}
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block group">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
