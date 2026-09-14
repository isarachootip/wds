'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface PillTabOption<T extends string = string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  count?: number | string
  badge?: React.ReactNode
  disabled?: boolean
}

export interface PillTabsProps<T extends string = string> {
  options: PillTabOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

export function PillTabs<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  fullWidth = false,
}: PillTabsProps<T>) {
  const sizeStyles = {
    sm: 'p-0.5 text-xs',
    md: 'p-0.5 text-xs sm:text-sm',
    lg: 'p-1 text-sm',
  }

  const itemSizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs sm:text-sm',
    lg: 'px-4 py-2 text-sm',
  }

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center rounded-lg bg-muted border border-border/50 text-muted-foreground',
        fullWidth && 'w-full flex',
        sizeStyles[size],
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap',
              itemSizeStyles[size],
              fullWidth && 'flex-1',
              isActive
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            )}
          >
            {option.icon && <span className="size-3.5 shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'bg-background/60 text-muted-foreground'
                )}
              >
                {option.count}
              </span>
            )}
            {option.badge}
          </button>
        )
      })}
    </div>
  )
}

// Alias interface & component for Radiogroup / Segmented Control compatibility
export type PillOption<T extends string = string> = PillTabOption<T>

export interface PillSegmentedControlProps<T extends string = string> {
  options: PillOption<T>[]
  value: T
  onChange?: (value: T) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function PillSegmentedControl<T extends string = string>({
  options,
  value,
  onChange = () => {},
  disabled = false,
  className = '',
  fullWidth = false,
}: PillSegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-center p-0.5 rounded-lg border border-border bg-muted/50 text-xs font-medium text-muted-foreground',
        fullWidth && 'w-full flex',
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap',
              fullWidth && 'flex-1',
              isSelected
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
              (disabled || opt.disabled) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {opt.icon && <span className="size-3.5 shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums',
                  isSelected
                    ? 'bg-muted text-foreground'
                    : 'bg-background/60 text-muted-foreground'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
