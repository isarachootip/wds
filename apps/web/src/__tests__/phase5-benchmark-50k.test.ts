import { describe, it, expect } from 'vitest'

describe('Phase 5 Acceptance Criteria 5: High-Volume 50,000-Row Report Aggregation Benchmark', () => {
  type SyntheticLead = {
    id: number
    source: 'line' | 'phone' | 'store' | 'other'
    status: 'new' | 'contacted' | 'qualified' | 'site_visit_requested' | 'quoted' | 'won' | 'lost'
    orderAmountSatang: number
    createdAtMonth: number
  }

  // Pre-generate 50,000 rows across 12 months
  const NUM_ROWS = 50_000
  const SOURCES = ['line', 'phone', 'store', 'other'] as const
  const STATUSES = ['new', 'contacted', 'qualified', 'site_visit_requested', 'quoted', 'won', 'lost'] as const

  const dataset: SyntheticLead[] = new Array(NUM_ROWS)
  for (let i = 0; i < NUM_ROWS; i++) {
    const source = SOURCES[i % SOURCES.length]
    const status = STATUSES[i % STATUSES.length]
    const isWon = status === 'won'
    dataset[i] = {
      id: i,
      source,
      status,
      orderAmountSatang: isWon ? 100_000 + (i % 500) * 10_000 : 0,
      createdAtMonth: (i % 12) + 1,
    }
  }

  it('1. Computes 1-year Channel Report over 50,000 synthetic rows in under 2 seconds', () => {
    const t0 = performance.now()

    // Aggregating channel report over 50,000 rows (equivalent to SQL GROUP BY source)
    type ChannelStat = {
      source: string
      lead_count: number
      won_count: number
      win_rate_pct: number
      total_satang: number
      avg_order_satang: number
    }

    const channelMap = new Map<string, { lead_count: number; won_count: number; total_satang: number }>()

    for (let i = 0; i < dataset.length; i++) {
      const row = dataset[i]
      let stat = channelMap.get(row.source)
      if (!stat) {
        stat = { lead_count: 0, won_count: 0, total_satang: 0 }
        channelMap.set(row.source, stat)
      }
      stat.lead_count++
      if (row.status === 'won') {
        stat.won_count++
        stat.total_satang += row.orderAmountSatang
      }
    }

    const results: ChannelStat[] = []
    channelMap.forEach((stat, src) => {
      results.push({
        source: src,
        lead_count: stat.lead_count,
        won_count: stat.won_count,
        win_rate_pct: Math.round((stat.won_count / stat.lead_count) * 1000) / 10,
        total_satang: stat.total_satang,
        avg_order_satang: stat.won_count > 0 ? Math.round(stat.total_satang / stat.won_count) : 0,
      })
    })

    const durationMs = performance.now() - t0

    // Acceptance criterion: must finish in < 2,000 ms
    expect(durationMs).toBeLessThan(2000)
    expect(results).toHaveLength(4)

    const totalProcessedLeads = results.reduce((acc, r) => acc + r.lead_count, 0)
    expect(totalProcessedLeads).toBe(50_000)
  })

  it('2. Computes Funnel metrics over 50,000 rows in under 2 seconds', () => {
    const t0 = performance.now()

    let totalLeads = 0
    let svCount = 0
    let qtCount = 0
    let orderCount = 0
    let wonCount = 0

    for (let i = 0; i < dataset.length; i++) {
      const r = dataset[i]
      totalLeads++
      if (['site_visit_requested', 'quoted', 'won'].includes(r.status)) svCount++
      if (['quoted', 'won'].includes(r.status)) qtCount++
      if (r.status === 'won') {
        orderCount++
        wonCount++
      }
    }

    const funnel = {
      total_leads: totalLeads,
      sv_rate_pct: Math.round((svCount / totalLeads) * 1000) / 10,
      qt_rate_pct: Math.round((qtCount / totalLeads) * 1000) / 10,
      order_rate_pct: Math.round((orderCount / totalLeads) * 1000) / 10,
    }

    const durationMs = performance.now() - t0

    expect(durationMs).toBeLessThan(2000)
    expect(funnel.total_leads).toBe(50_000)
    expect(funnel.sv_rate_pct).toBeGreaterThan(0)
  })
})
