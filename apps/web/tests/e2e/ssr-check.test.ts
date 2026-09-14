import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ArtifactKpiCard } from '@/components/ui/ArtifactKpiCard'

describe('SSR Layout & Component Markup Integrity', () => {
  it('renders StatusBadge markup with semantic tokens and Thai text on server', () => {
    const html = renderToString(React.createElement(StatusBadge, { label: 'ใหม่', variant: 'info' }))
    expect(html).toContain('ใหม่')
    expect(html).toContain('bg-sky-500')
    expect(html).toContain('rounded-full')
  })

  it('renders ArtifactKpiCard with typography and border-border token on server', () => {
    const html = renderToString(React.createElement(ArtifactKpiCard, { label: 'New Leads', value: 42 }))
    expect(html).toContain('New Leads')
    expect(html).toContain('uppercase')
    expect(html).toContain('42')
    expect(html).toContain('rounded-2xl')
    expect(html).toContain('border-border')
  })
})
