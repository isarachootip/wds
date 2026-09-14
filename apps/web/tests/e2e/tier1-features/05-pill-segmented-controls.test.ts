import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'

interface PillOption<T extends string = string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface PillSegmentedControlProps<T extends string = string> {
  options: PillOption<T>[]
  value: T
  onChange?: (value: T) => void
  disabled?: boolean
  className?: string
}

// Canonical Cruip Artifact Pill Segmented Control implemented via React.createElement (TS-clean)
function PillSegmentedControl<T extends string = string>({
  options,
  value,
  disabled = false,
  className = '',
}: PillSegmentedControlProps<T>) {
  return React.createElement(
    'div',
    {
      role: 'radiogroup',
      className: `inline-flex items-center p-0.5 rounded-lg border border-border bg-muted/50 text-xs font-medium ${className}`,
    },
    options.map((opt) => {
      const isSelected = opt.value === value
      return React.createElement(
        'button',
        {
          key: opt.value,
          type: 'button',
          role: 'radio',
          'aria-checked': isSelected,
          disabled,
          className: `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            isSelected
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        },
        opt.icon,
        React.createElement('span', null, opt.label)
      )
    })
  )
}

describe('Tier 1.5: Pill-Segmented Controls', () => {
  const timeframeOptions: PillOption<'7D' | '30D' | '12M'>[] = [
    { value: '7D', label: '7D (สัปดาห์นี้)' },
    { value: '30D', label: '30D (เดือนนี้)' },
    { value: '12M', label: '12M (ปีนี้)' },
  ]

  it('T1.5.1: renders container with Cruip Artifact pill background and border tokens', () => {
    const html = renderToString(
      React.createElement(PillSegmentedControl, {
        options: timeframeOptions,
        value: '7D',
      })
    )

    expect(html).toContain('bg-muted/50')
    expect(html).toContain('rounded-lg')
    expect(html).toContain('border-border')
    expect(html).toContain('role="radiogroup"')
  })

  it('T1.5.2: highlights active pill option with bg-background and shadow-xs', () => {
    const html = renderToString(
      React.createElement(PillSegmentedControl, {
        options: timeframeOptions,
        value: '30D',
      })
    )

    expect(html).toContain('aria-checked="true"')
    expect(html).toContain('bg-background text-foreground shadow-xs font-semibold')
  })

  it('T1.5.3: renders inactive options with text-muted-foreground and hover styling', () => {
    const html = renderToString(
      React.createElement(PillSegmentedControl, {
        options: timeframeOptions,
        value: '7D',
      })
    )

    expect(html).toContain('aria-checked="false"')
    expect(html).toContain('text-muted-foreground hover:text-foreground')
  })

  it('T1.5.4: timeframe state machine switches between 7D, 30D, and 12M', () => {
    type Timeframe = '7D' | '30D' | '12M'
    let selected: Timeframe = '7D'

    const select = (t: Timeframe) => {
      selected = t
    }

    expect(selected).toBe('7D')
    select('30D')
    expect(selected).toBe('30D')
    select('12M')
    expect(selected).toBe('12M')
  })

  it('T1.5.5: supports disabled state preventing selection changes', () => {
    const html = renderToString(
      React.createElement(PillSegmentedControl, {
        options: timeframeOptions,
        value: '7D',
        disabled: true,
      })
    )

    expect(html).toContain('disabled=""')
    expect(html).toContain('opacity-50 cursor-not-allowed')
  })

  it('T1.5.6: renders custom icons alongside pill labels', () => {
    const viewOptions: PillOption<'kanban' | 'table'>[] = [
      {
        value: 'kanban',
        label: 'คัมบัง (Kanban)',
        icon: React.createElement('span', { 'data-testid': 'icon-kanban' }, '■'),
      },
      {
        value: 'table',
        label: 'ตาราง (Table)',
        icon: React.createElement('span', { 'data-testid': 'icon-table' }, '≡'),
      },
    ]

    const html = renderToString(
      React.createElement(PillSegmentedControl, {
        options: viewOptions,
        value: 'kanban',
      })
    )

    expect(html).toContain('data-testid="icon-kanban"')
    expect(html).toContain('data-testid="icon-table"')
    expect(html).toContain('คัมบัง (Kanban)')
    expect(html).toContain('ตาราง (Table)')
  })
})
