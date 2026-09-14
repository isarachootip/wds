import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { ArtifactKpiCard } from '@/components/ui/ArtifactKpiCard'

describe('Tier 1.4: KPI Cards & Trend Badges', () => {
  it('T1.4.1: renders primary metric value and uppercase label correctly', () => {
    const html = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'New Leads Today',
        value: '18',
      })
    )

    expect(html).toContain('New Leads Today')
    expect(html).toContain('uppercase')
    expect(html).toContain('18')
    expect(html).toContain('text-2xl font-bold')
  })

  it('T1.4.2: renders positive trend badge with emerald styling tokens', () => {
    const html = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'Monthly Revenue',
        value: '฿1,450,000',
        trend: { value: '+14.2%', positive: true },
      })
    )

    expect(html).toContain('+14.2%')
    expect(html).toContain('text-emerald-700')
    expect(html).toContain('bg-emerald-500/10')
  })

  it('T1.4.3: renders negative trend badge with rose styling tokens', () => {
    const html = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'Overdue Follow-ups',
        value: '7',
        trend: { value: '-5.0%', positive: false },
      })
    )

    expect(html).toContain('-5.0%')
    expect(html).toContain('text-rose-700')
    expect(html).toContain('bg-rose-500/10')
  })

  it('T1.4.4: applies semantic variant styles (alert, warning, success, default)', () => {
    const alertHtml = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'Overdue Follow-ups',
        value: 12,
        variant: 'alert',
      })
    )
    expect(alertHtml).toContain('border-rose-500/20')

    const warningHtml = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'Pending Visits',
        value: 5,
        variant: 'warning',
      })
    )
    expect(warningHtml).toContain('border-amber-500/20')

    const successHtml = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'Completed Orders',
        value: 34,
        variant: 'success',
      })
    )
    expect(successHtml).toContain('border-emerald-500/20')
  })

  it('T1.4.5: renders Next.js Link when href prop is provided', () => {
    const htmlWithLink = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'Leads',
        value: 40,
        href: '/wds/leads',
      })
    )
    expect(htmlWithLink).toContain('href="/wds/leads"')

    const htmlWithoutLink = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'Leads',
        value: 40,
      })
    )
    expect(htmlWithoutLink).not.toContain('href=')
  })

  it('T1.4.6: renders subtitle and icon container when props are supplied', () => {
    const TestIcon = () => React.createElement('svg', { 'data-testid': 'custom-kpi-icon' })
    const html = renderToString(
      React.createElement(ArtifactKpiCard, {
        label: 'Active Deals',
        value: 29,
        sub: 'มูลค่ารวม ฿4.8M',
        icon: React.createElement(TestIcon),
      })
    )

    expect(html).toContain('มูลค่ารวม ฿4.8M')
    expect(html).toContain('data-testid="custom-kpi-icon"')
    expect(html).toContain('rounded-lg bg-muted/60')
  })
})
