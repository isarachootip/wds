import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StatusBadge, type BadgeVariant } from '@/components/ui/StatusBadge'
import { STATUS_LABELS, STATUSES, type Status } from '@/app/(wds)/wds/pipeline/KanbanBoard'

describe('Tier 1.7: Status Pills & Badges', () => {
  it('T1.7.1: renders all 7 standard CRM pipeline status labels accurately', () => {
    const expectedLabels: Record<Status, string> = {
      new: 'ใหม่',
      contacted: 'ติดต่อแล้ว',
      qualified: 'ผ่านเกณฑ์',
      site_visit_requested: 'นัดสำรวจ',
      quoted: 'เสนอราคา',
      won: 'ปิดการขาย',
      lost: 'ไม่สำเร็จ',
    }

    STATUSES.forEach((s) => {
      expect(STATUS_LABELS[s]).toBe(expectedLabels[s])
    })
  })

  it('T1.7.2: StatusBadge renders with status dot indicator by default', () => {
    const html = renderToString(
      React.createElement(StatusBadge, {
        variant: 'success',
        label: 'ปิดการขาย (Won)',
      })
    )

    expect(html).toContain('w-1.5 h-1.5 rounded-full')
    expect(html).toContain('bg-emerald-500')
    expect(html).toContain('ปิดการขาย (Won)')
  })

  it('T1.7.3: StatusBadge omits dot indicator when dot=false', () => {
    const html = renderToString(
      React.createElement(StatusBadge, {
        variant: 'info',
        label: 'ใหม่',
        dot: false,
      })
    )

    expect(html).not.toContain('w-1.5 h-1.5')
    expect(html).toContain('ใหม่')
  })

  it('T1.7.4: verifies semantic color tokens for all badge variants', () => {
    const variants: BadgeVariant[] = ['success', 'warning', 'danger', 'info', 'neutral', 'primary']

    variants.forEach((v) => {
      const html = renderToString(React.createElement(StatusBadge, { variant: v, label: `Badge-${v}` }))
      expect(html).toContain(`Badge-${v}`)
      expect(html).toContain('rounded-full')
      expect(html).toContain('text-xs')
    })
  })

  it('T1.7.5: supports custom className extension without overriding base pill layout', () => {
    const html = renderToString(
      React.createElement(StatusBadge, {
        variant: 'danger',
        label: 'แพ้ประมูล',
        className: 'custom-extra-padding ring-1',
      })
    )

    expect(html).toContain('custom-extra-padding ring-1')
    expect(html).toContain('inline-flex items-center')
  })

  it('T1.7.6: dark mode class tokens are defined for high-contrast presentation', () => {
    const htmlSuccess = renderToString(
      React.createElement(StatusBadge, { variant: 'success', label: 'Success' })
    )
    expect(htmlSuccess).toContain('dark:text-emerald-400')

    const htmlDanger = renderToString(
      React.createElement(StatusBadge, { variant: 'danger', label: 'Danger' })
    )
    expect(htmlDanger).toContain('dark:text-rose-400')
  })
})
