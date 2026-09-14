import { describe, it, expect } from 'vitest'

describe('Phase 2 Acceptance Criteria 4: Strict Checkout Guards', () => {
  interface Photo {
    id: string
    kind: 'before' | 'during' | 'after' | 'issue'
  }

  interface ChecklistItem {
    id: string
    item: string
    checked: boolean
  }

  function validateCheckout(photos: Photo[], checklists: ChecklistItem[], signaturePath?: string) {
    const afterPhotos = photos.filter((p) => p.kind === 'after')
    if (afterPhotos.length === 0) {
      throw new Error('ต้องมีรูปถ่าย "หลังงาน" อย่างน้อย 1 รูป')
    }

    const unchecked = checklists.filter((c) => !c.checked)
    if (unchecked.length > 0) {
      throw new Error(`ต้องติ๊ก checklist ให้ครบ (เหลือ ${unchecked.length} รายการ)`)
    }

    if (!signaturePath || !signaturePath.trim()) {
      throw new Error('ต้องมีลายเซ็นลูกค้า')
    }

    return { valid: true }
  }

  it('1. Blocks checkout when missing "after" photos', () => {
    const photos: Photo[] = [
      { id: 'p1', kind: 'before' },
      { id: 'p2', kind: 'during' },
    ]
    const checklists: ChecklistItem[] = [{ id: 'c1', item: 'เก็บงาน', checked: true }]
    const sig = 'signatures/job-1/sig.png'

    expect(() => validateCheckout(photos, checklists, sig)).toThrow(
      'ต้องมีรูปถ่าย "หลังงาน" อย่างน้อย 1 รูป'
    )
  })

  it('2. Blocks checkout when checklist items remain unchecked', () => {
    const photos: Photo[] = [{ id: 'p1', kind: 'after' }]
    const checklists: ChecklistItem[] = [
      { id: 'c1', item: 'ทำความสะอาด', checked: true },
      { id: 'c2', item: 'ตรวจคุณภาพรอบสุดท้าย', checked: false },
    ]
    const sig = 'signatures/job-1/sig.png'

    expect(() => validateCheckout(photos, checklists, sig)).toThrow(
      'ต้องติ๊ก checklist ให้ครบ (เหลือ 1 รายการ)'
    )
  })

  it('3. Blocks checkout when customer signature is missing', () => {
    const photos: Photo[] = [{ id: 'p1', kind: 'after' }]
    const checklists: ChecklistItem[] = [{ id: 'c1', item: 'เสร็จสมบูรณ์', checked: true }]

    expect(() => validateCheckout(photos, checklists, '')).toThrow('ต้องมีลายเซ็นลูกค้า')
    expect(() => validateCheckout(photos, checklists, undefined)).toThrow('ต้องมีลายเซ็นลูกค้า')
  })

  it('4. Allows checkout only when all 3 gates are satisfied', () => {
    const photos: Photo[] = [
      { id: 'p1', kind: 'before' },
      { id: 'p2', kind: 'after' },
    ]
    const checklists: ChecklistItem[] = [
      { id: 'c1', item: 'ตรวจสอบพื้นที่', checked: true },
      { id: 'c2', item: 'เก็บงาน', checked: true },
    ]
    const sig = 'signatures/job-1/sig.png'

    const result = validateCheckout(photos, checklists, sig)
    expect(result.valid).toBe(true)
  })
})
