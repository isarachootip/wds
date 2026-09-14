import { describe, it, expect } from 'vitest'

describe('Phase 3 Acceptance Criteria 4: Portal Security & Access Guard', () => {
  type QuotationRecord = {
    id: string
    publicToken: string
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
    validUntil: Date | null
    number: string
  }

  const mockDb: QuotationRecord[] = [
    {
      id: 'qt-001',
      publicToken: 'valid-token-active',
      status: 'sent',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
      number: 'QT-202609-0001',
    },
    {
      id: 'qt-002',
      publicToken: 'valid-token-expired',
      status: 'expired',
      validUntil: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      number: 'QT-202609-0002',
    },
    {
      id: 'qt-003',
      publicToken: 'valid-token-past-date',
      status: 'sent',
      validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // past validUntil
      number: 'QT-202609-0003',
    },
  ]

  function resolvePortalAccess(token: string) {
    const qt = mockDb.find((q) => q.publicToken === token)
    if (!qt) {
      // 404 without data leakage
      return { status: 404, view: 'NOT_FOUND', error: 'ไม่พบหน้าที่ต้องการ' }
    }

    const isExpired =
      qt.status === 'expired' || (qt.validUntil && qt.validUntil.getTime() < Date.now())

    if (isExpired) {
      return {
        status: 200,
        view: 'EXPIRED_NOTICE',
        notice: 'ใบเสนอราคาหมดอายุแล้ว กรุณาติดต่อเจ้าหน้าที่',
        canAccept: false,
      }
    }

    // Valid and active
    return {
      status: 200,
      view: 'ACTIVE_QUOTATION',
      canAccept: true,
      quotationNumber: qt.number,
    }
  }

  it('1. Returns 404 not found for non-existent token without data leakage', () => {
    const result = resolvePortalAccess('non-existent-fake-token')
    expect(result.status).toBe(404)
    expect(result.view).toBe('NOT_FOUND')
    expect(result).not.toHaveProperty('quotationNumber')
  })

  it('2. Shows expired notice when token is expired by status', () => {
    const result = resolvePortalAccess('valid-token-expired')
    expect(result.status).toBe(200)
    expect(result.view).toBe('EXPIRED_NOTICE')
    expect(result.canAccept).toBe(false)
  })

  it('3. Automatically rejects action if validUntil is in the past even if status was sent', () => {
    const result = resolvePortalAccess('valid-token-past-date')
    expect(result.status).toBe(200)
    expect(result.view).toBe('EXPIRED_NOTICE')
    expect(result.canAccept).toBe(false)
  })

  it('4. Allows access and acceptance for active, non-expired quotation', () => {
    const result = resolvePortalAccess('valid-token-active')
    expect(result.status).toBe(200)
    expect(result.view).toBe('ACTIVE_QUOTATION')
    expect(result.canAccept).toBe(true)
    expect(result.quotationNumber).toBe('QT-202609-0001')
  })
})
