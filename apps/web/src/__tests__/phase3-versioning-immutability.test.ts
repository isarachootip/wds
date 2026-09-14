import { describe, it, expect } from 'vitest'

describe('Phase 3 Business Rule: Quotation Revision & Immutability', () => {
  type Quotation = {
    id: string
    number: string
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
    version: number
    supersedesId?: string
    totalSatang: number
  }

  const quotationsStore: Quotation[] = [
    {
      id: 'qt-v1',
      number: 'QT-202609-0010',
      status: 'sent',
      version: 1,
      totalSatang: 100000,
    },
    {
      id: 'qt-v2-accepted',
      number: 'QT-202609-0011',
      status: 'accepted',
      version: 2,
      totalSatang: 120000,
    },
  ]

  function reviseQuotation(quotationId: string, newTotalSatang?: number): Quotation {
    const existing = quotationsStore.find((q) => q.id === quotationId)
    if (!existing) throw new Error('ไม่พบใบเสนอราคา')

    // Strict immutability guard
    if (existing.status === 'accepted') {
      throw new Error('ใบเสนอราคานี้ได้รับการยอมรับแล้ว ไม่สามารถแก้ไขได้')
    }

    const nextVersion = existing.version + 1
    const newQt: Quotation = {
      id: `qt-v${nextVersion}`,
      number: `QT-202609-${String(10 + nextVersion).padStart(4, '0')}`,
      status: 'draft',
      version: nextVersion,
      supersedesId: existing.id,
      totalSatang: newTotalSatang ?? existing.totalSatang,
    }
    quotationsStore.push(newQt)
    return newQt
  }

  it('1. Revising a sent quotation produces a new quotation with version = N + 1 and supersedesId', () => {
    const revised = reviseQuotation('qt-v1', 115000)

    expect(revised.version).toBe(2)
    expect(revised.supersedesId).toBe('qt-v1')
    expect(revised.status).toBe('draft')
    expect(revised.totalSatang).toBe(115000)

    // Original quotation remains intact (immutable)
    const original = quotationsStore.find((q) => q.id === 'qt-v1')
    expect(original?.version).toBe(1)
    expect(original?.totalSatang).toBe(100000)
  })

  it('2. Strictly rejects revision of an accepted quotation (immutability)', () => {
    expect(() => {
      reviseQuotation('qt-v2-accepted')
    }).toThrow('ใบเสนอราคานี้ได้รับการยอมรับแล้ว ไม่สามารถแก้ไขได้')
  })
})
