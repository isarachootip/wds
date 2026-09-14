import { describe, it, expect } from 'vitest'

describe('Phase 4 Acceptance Criteria 5: AR Aging Bucketing (0-30, 31-60, 61-90, 90+ days)', () => {
  type Invoice = {
    id: string
    customerId: string
    dueDate: Date
    amountSatang: number
    paidSatang: number
    status: string
  }

  type ArAgingBucket = {
    bucket_0_30: number
    bucket_31_60: number
    bucket_61_90: number
    bucket_90plus: number
    total_outstanding: number
  }

  function calculateArAging(invoices: Invoice[], asOfDate: Date): ArAgingBucket {
    const bucket: ArAgingBucket = {
      bucket_0_30: 0,
      bucket_31_60: 0,
      bucket_61_90: 0,
      bucket_90plus: 0,
      total_outstanding: 0,
    }

    for (const inv of invoices) {
      if (inv.status === 'paid' || inv.status === 'void') continue
      const outstanding = inv.amountSatang - inv.paidSatang
      if (outstanding <= 0) continue

      const diffTime = asOfDate.getTime() - inv.dueDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      bucket.total_outstanding += outstanding

      if (diffDays <= 30) {
        bucket.bucket_0_30 += outstanding
      } else if (diffDays <= 60) {
        bucket.bucket_31_60 += outstanding
      } else if (diffDays <= 90) {
        bucket.bucket_61_90 += outstanding
      } else {
        bucket.bucket_90plus += outstanding
      }
    }

    return bucket
  }

  it('1. Correctly places invoices into 0-30, 31-60, 61-90, and 90+ buckets according to days past due', () => {
    const asOf = new Date('2026-09-15T00:00:00Z')

    const invoices: Invoice[] = [
      // 10 days overdue -> 0-30
      {
        id: 'inv-1',
        customerId: 'c1',
        dueDate: new Date('2026-09-05T00:00:00Z'),
        amountSatang: 100_000,
        paidSatang: 0,
        status: 'overdue',
      },
      // 45 days overdue -> 31-60
      {
        id: 'inv-2',
        customerId: 'c1',
        dueDate: new Date('2026-08-01T00:00:00Z'),
        amountSatang: 200_000,
        paidSatang: 50_000, // outstanding 150,000
        status: 'partial',
      },
      // 75 days overdue -> 61-90
      {
        id: 'inv-3',
        customerId: 'c1',
        dueDate: new Date('2026-07-02T00:00:00Z'),
        amountSatang: 300_000,
        paidSatang: 0,
        status: 'overdue',
      },
      // 120 days overdue -> 90+
      {
        id: 'inv-4',
        customerId: 'c1',
        dueDate: new Date('2026-05-18T00:00:00Z'),
        amountSatang: 400_000,
        paidSatang: 0,
        status: 'overdue',
      },
      // Fully paid invoice -> excluded
      {
        id: 'inv-5',
        customerId: 'c1',
        dueDate: new Date('2026-05-18T00:00:00Z'),
        amountSatang: 500_000,
        paidSatang: 500_000,
        status: 'paid',
      },
    ]

    const result = calculateArAging(invoices, asOf)

    expect(result.bucket_0_30).toBe(100_000)
    expect(result.bucket_31_60).toBe(150_000)
    expect(result.bucket_61_90).toBe(300_000)
    expect(result.bucket_90plus).toBe(400_000)
    expect(result.total_outstanding).toBe(950_000)
  })
})
