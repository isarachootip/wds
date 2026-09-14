'use client'

import React, { useState } from 'react'
import { PillTabs, type PillTabOption } from '@/components/ui/PillTabs'

export type Timeframe = '7D' | '30D' | '12M'

export interface DashboardTimeframeFilterProps {
  value?: Timeframe
  onChange?: (val: Timeframe) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function DashboardTimeframeFilter({
  value,
  onChange,
  className,
  size = 'sm',
}: DashboardTimeframeFilterProps) {
  const [internalTimeframe, setInternalTimeframe] = useState<Timeframe>(value ?? '30D')
  const activeTimeframe = value ?? internalTimeframe

  const options: PillTabOption<Timeframe>[] = [
    { value: '7D', label: '7D' },
    { value: '30D', label: '30D' },
    { value: '12M', label: '12M' },
  ]

  const handleChange = (val: Timeframe) => {
    setInternalTimeframe(val)
    onChange?.(val)
    if (typeof window !== 'undefined' && !onChange) {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('timeframe', val)
        window.history.pushState(null, '', url.toString())
      } catch {
        // Safe no-op in non-browser or restricted environments
      }
    }
  }

  return (
    <div className={className}>
      <PillTabs<Timeframe>
        options={options}
        value={activeTimeframe}
        onChange={handleChange}
        size={size}
      />
    </div>
  )
}
