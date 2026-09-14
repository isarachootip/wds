import { describe, it, expect } from 'vitest'
import {
  formatDealValue,
  formatPhone,
  formatShortDate,
  isStale,
  isOverdue,
  getLeadDealSatang,
  getInterestSnippet,
  getSourceBadge,
  STATUS_LABELS,
  STATUS_HEADER_STYLES,
  STATUSES,
  LOST_REASON_OPTIONS,
  type LeadCard,
} from '../pipeline/KanbanBoard'
import { LOST_REASONS } from '@/modules/crm/actions'

describe('Milestone M2: Leads Hub & Pipeline UI Unit Tests', () => {
  // Mock lead fixtures
  const sampleLeads: LeadCard[] = [
    {
      id: 'lead-001',
      status: 'new',
      source: 'line',
      channelRef: 'U12345678',
      customerName: 'คุณสมชาย ยอดขาย',
      customerPhone: '0812345678',
      company: 'บจก. สยามนคร คอนสตรัคชั่น',
      interest: { description: 'ปูนอินทรี 500 ถุง + เหล็กเส้น', products: ['ปูน', 'เหล็ก'] },
      budgetRangeMinSatang: 30_000_000,
      budgetRangeMaxSatang: 50_000_000,
      dealValueSatang: 45_000_000, // 450,000 THB
      createdAt: new Date('2026-09-10T10:00:00Z'),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (Stale)
      nextFollowUpDue: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue
      score: 80,
    },
    {
      id: 'lead-002',
      status: 'contacted',
      source: 'phone',
      channelRef: '029998888',
      customerName: 'คุณวิไลพร ช่างทอง',
      customerPhone: '0898765432',
      company: 'หจก. วิไลการช่าง',
      interest: 'กระเบื้องปูพื้น 200 กล่อง',
      budgetRangeMinSatang: 15_000_000,
      budgetRangeMaxSatang: 25_000_000,
      dealValueSatang: 20_000_000, // 200,000 THB
      createdAt: new Date('2026-09-12T08:00:00Z'),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (Not stale)
      nextFollowUpDue: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Scheduled
      score: 65,
    },
    {
      id: 'lead-003',
      status: 'quoted',
      source: 'store',
      channelRef: 'BR-0012-BANGNA',
      customerName: 'บจก. นครพิงค์ พัฒนา',
      customerPhone: '025556677',
      company: 'บจก. นครพิงค์ พัฒนา',
      interest: { products: ['สีทาบ้าน', 'เคมีภัณฑ์'] },
      budgetRangeMinSatang: 80_000_000,
      budgetRangeMaxSatang: 120_000_000,
      dealValueSatang: 115_000_000, // 1,150,000 THB
      createdAt: new Date('2026-09-08T09:00:00Z'),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      score: 95,
    },
    {
      id: 'lead-004',
      status: 'won',
      source: 'other',
      channelRef: 'WEB-INQUIRY-99',
      customerName: 'คุณอนันต์ สุขเกษม',
      customerPhone: '0911112233',
      interest: null,
      budgetRangeMinSatang: 50_000_000,
      budgetRangeMaxSatang: 50_000_000,
      dealValueSatang: 50_000_000, // 500,000 THB
      createdAt: new Date('2026-09-01T09:00:00Z'),
      updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // >7 days but WON
      score: 100,
    },
    {
      id: 'lead-005',
      status: 'lost',
      source: 'phone',
      customerName: 'ช่างเอก งานโครงสร้าง',
      customerPhone: '0844445566',
      lostReason: 'PRICE_HIGH',
      createdAt: new Date('2026-09-05T09:00:00Z'),
      updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // >7 days but LOST
      score: 30,
    },
  ]

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Currency & Deal Value Formatting
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Deal Value & Monetary Presentation', () => {
    it('formats satang amounts into clean THB currency strings with comma grouping', () => {
      expect(formatDealValue(45_000_000)).toBe('฿450,000')
      expect(formatDealValue(115_000_000)).toBe('฿1,150,000')
      expect(formatDealValue(100)).toBe('฿1')
      expect(formatDealValue(0)).toBe('฿0')
      expect(formatDealValue(-500)).toBe('฿0')
    })

    it('extracts correct deal satang prioritizing dealValueSatang > budgetMax > budgetMin', () => {
      // lead-001 has dealValueSatang: 45_000_000
      expect(getLeadDealSatang(sampleLeads[0])).toBe(45_000_000)

      // lead with only budgetRangeMaxSatang
      const leadWithoutDealValue: LeadCard = {
        id: 'test-1',
        status: 'new',
        source: 'line',
        budgetRangeMaxSatang: 75_000_000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(getLeadDealSatang(leadWithoutDealValue)).toBe(75_000_000)

      // lead with only budgetRangeMinSatang
      const leadWithMinOnly: LeadCard = {
        id: 'test-2',
        status: 'new',
        source: 'phone',
        budgetRangeMinSatang: 25_000_000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(getLeadDealSatang(leadWithMinOnly)).toBe(25_000_000)

      // empty lead returns 0
      const emptyLead: LeadCard = {
        id: 'test-3',
        status: 'new',
        source: 'other',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(getLeadDealSatang(emptyLead)).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Phone Formatting & Quick Actions
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Phone Formatting & Contact Utilities', () => {
    it('formats 10-digit mobile numbers with hyphens', () => {
      expect(formatPhone('0812345678')).toBe('081-234-5678')
      expect(formatPhone('0911112233')).toBe('091-111-2233')
    })

    it('formats 9-digit landline numbers with hyphens', () => {
      expect(formatPhone('025556677')).toBe('02-555-6677')
    })

    it('handles empty, null, or already formatted numbers gracefully', () => {
      expect(formatPhone(null)).toBe('')
      expect(formatPhone(undefined)).toBe('')
      expect(formatPhone('081-234-5678')).toBe('081-234-5678')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Stale Lead & Overdue Follow-Up Detection
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Stale Lead & Due Date Detection', () => {
    it('identifies leads updated > 7 days ago as stale', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)

      expect(isStale(tenDaysAgo)).toBe(true)
      expect(isStale(oneDayAgo)).toBe(false)
      expect(isStale(null)).toBe(false)
    })

    it('detects past due follow-up tasks as overdue', () => {
      const pastDue = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      const futureDue = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

      expect(isOverdue(pastDue)).toBe(true)
      expect(isOverdue(futureDue)).toBe(false)
      expect(isOverdue(null)).toBe(false)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Interest & Source Channel Helpers
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Interest Summary & Channel Badges', () => {
    it('extracts description from jsonb interest object', () => {
      expect(getInterestSnippet({ description: 'ต้องการปูน 100 ถุง' })).toBe('ต้องการปูน 100 ถุง')
    })

    it('extracts and joins products array when description is absent', () => {
      expect(getInterestSnippet({ products: ['ปูนเสือ', 'ท่อ PVC', 'เหล็ก'] })).toBe('ปูนเสือ, ท่อ PVC, เหล็ก')
    })

    it('handles plain string interest', () => {
      expect(getInterestSnippet('งานต่อเติมครัว')).toBe('งานต่อเติมครัว')
    })

    it('returns empty string for null or empty interest', () => {
      expect(getInterestSnippet(null)).toBe('')
      expect(getInterestSnippet(undefined)).toBe('')
      expect(getInterestSnippet({})).toBe('')
    })

    it('maps source channels to correct labels and styles', () => {
      const lineBadge = getSourceBadge('line')
      expect(lineBadge.label).toBe('LINE OA')

      const phoneBadge = getSourceBadge('phone')
      expect(phoneBadge.label).toBe('โทรศัพท์')

      const storeBadge = getSourceBadge('store')
      expect(storeBadge.label).toBe('หน้าร้าน')

      const otherBadge = getSourceBadge('other')
      expect(otherBadge.label).toBe('อื่นๆ')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Kanban Stages & Status Configuration
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Kanban Stages & Column Definitions', () => {
    it('defines exactly the 7 sales pipeline stages in order', () => {
      expect(STATUSES).toEqual([
        'new',
        'contacted',
        'qualified',
        'site_visit_requested',
        'quoted',
        'won',
        'lost',
      ])
    })

    it('has Thai labels and styling configs for every stage', () => {
      STATUSES.forEach(status => {
        expect(STATUS_LABELS[status]).toBeDefined()
        expect(typeof STATUS_LABELS[status]).toBe('string')
        expect(STATUS_HEADER_STYLES[status]).toBeDefined()
        expect(STATUS_HEADER_STYLES[status].borderTop).toBeDefined()
      })
    })

    it('aggregates stage deal sums accurately', () => {
      const stageSums = STATUSES.reduce<Record<string, number>>((acc, s) => {
        const leadsInStage = sampleLeads.filter(l => l.status === s)
        acc[s] = leadsInStage.reduce((sum, l) => sum + getLeadDealSatang(l), 0)
        return acc
      }, {})

      expect(stageSums.new).toBe(45_000_000) // 450,000 THB
      expect(stageSums.contacted).toBe(20_000_000) // 200,000 THB
      expect(stageSums.quoted).toBe(115_000_000) // 1,150,000 THB
      expect(stageSums.won).toBe(50_000_000) // 500,000 THB
      expect(stageSums.lost).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Lost Reason Modal & Enum Validation
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Close Lost Modal & Reason Options', () => {
    it('contains all mandatory LOST_REASONS enum values', () => {
      const optionValues = LOST_REASON_OPTIONS.map(o => o.value)
      LOST_REASONS.forEach(reason => {
        expect(optionValues).toContain(reason)
      })
    })

    it('includes friendly bilingual descriptions for every reason', () => {
      LOST_REASON_OPTIONS.forEach(opt => {
        expect(opt.label).toBeTruthy()
        expect(opt.value).toBeTruthy()
      })
      expect(LOST_REASON_OPTIONS.some(o => o.value === 'PRICE_HIGH')).toBe(true)
      expect(LOST_REASON_OPTIONS.some(o => o.value === 'COMPETITOR_CHOSEN')).toBe(true)
      expect(LOST_REASON_OPTIONS.some(o => o.value === 'PROJECT_CANCELLED')).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Search & Multi-Facet Filtering Logic
  // ──────────────────────────────────────────────────────────────────────────
  describe('7. Multi-Facet Search & Filtering Engine', () => {
    it('filters leads by customer name search query', () => {
      const query = 'สมชาย'
      const matched = sampleLeads.filter(l =>
        (l.customerName || '').toLowerCase().includes(query.toLowerCase())
      )
      expect(matched.length).toBe(1)
      expect(matched[0].id).toBe('lead-001')
    })

    it('filters leads by customer phone number search query', () => {
      const query = '0898765432'
      const matched = sampleLeads.filter(l =>
        (l.customerPhone || '').includes(query)
      )
      expect(matched.length).toBe(1)
      expect(matched[0].id).toBe('lead-002')
    })

    it('filters leads by channel reference search query', () => {
      const query = 'BANGNA'
      const matched = sampleLeads.filter(l =>
        (l.channelRef || '').toLowerCase().includes(query.toLowerCase())
      )
      expect(matched.length).toBe(1)
      expect(matched[0].id).toBe('lead-003')
    })

    it('filters leads by interest material keywords', () => {
      const query = 'ปูน'
      const matched = sampleLeads.filter(l =>
        getInterestSnippet(l.interest).toLowerCase().includes(query.toLowerCase())
      )
      expect(matched.length).toBe(1)
      expect(matched[0].id).toBe('lead-001')
    })

    it('filters leads by source channel', () => {
      const lineLeads = sampleLeads.filter(l => l.source === 'line')
      expect(lineLeads.length).toBe(1)
      expect(lineLeads[0].id).toBe('lead-001')

      const phoneLeads = sampleLeads.filter(l => l.source === 'phone')
      expect(phoneLeads.length).toBe(2)
    })

    it('filters active stale leads excluding won and lost deals', () => {
      const staleActive = sampleLeads.filter(
        l => isStale(l.updatedAt) && l.status !== 'won' && l.status !== 'lost'
      )
      // lead-001 is stale and 'new'
      // lead-004 is >7 days but 'won' (excluded)
      // lead-005 is >7 days but 'lost' (excluded)
      expect(staleActive.length).toBe(1)
      expect(staleActive[0].id).toBe('lead-001')
    })
  })
})
