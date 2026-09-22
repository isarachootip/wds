import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock getDb before importing POST
const mockInsertValues = vi.fn().mockResolvedValue(undefined)
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues })
const mockDb = { insert: mockInsert }

vi.mock('@/lib/db', () => ({
  getDb: () => mockDb,
}))

import { POST } from '@/app/api/webhooks/pmt-qc/route'

describe('PMT QC Outbound Webhook Receiver (/api/webhooks/pmt-qc)', () => {
  const SECRET = 'wds_pmt_secure_key_2026'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Rejects request without x-api-key with 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/pmt-qc', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ref_no: 'REF-001' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized: Invalid API Key')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('2. Rejects request with invalid x-api-key with 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/pmt-qc', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'wrong_key',
      },
      body: JSON.stringify({ ref_no: 'REF-001' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized: Invalid API Key')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('3. Accepts valid request, saves event with 8 key fields to domainEvents, and returns 200', async () => {
    const payload = {
      ref_no: 'REF-2026-0091',
      ticket: 'TICK-2609090001',
      booking_no: 'BKG-26090901',
      qc_date: '22/09/2026 06:45:00 น.',
      customer_name: 'คุณสมชาย ใจดี',
      customer_phone: '081-234-5678',
      qc_round: 1,
      qc_score: 5.0,
      qc_round_text: 'ตรวจครั้งที่ 1 (ผ่านเกณฑ์รอบแรก)',
      qc_result: 'ผ่านเกณฑ์',
      qc_score_text: '5.0 / 5.0 คะแนน',
      stk_ref: 'STK-QC-2026-849201',
      job_no: 'JOB26090900001',
      service: 'บริการติดตั้งเครื่องปรับอากาศ',
      qc_inspector: 'วิชัย ตรวจดี (ช่าง QC Lead)',
    }

    const req = new NextRequest('http://localhost:3000/api/webhooks/pmt-qc', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': SECRET,
      },
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.ref_no).toBe('REF-2026-0091')
    expect(json.ticket).toBe('TICK-2609090001')

    // Verify DB insertion
    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'pmt.qc.passed',
        aggregate: 'installation_qc',
        status: 'pending',
        payload: expect.objectContaining({
          ref_no: 'REF-2026-0091',
          ticket: 'TICK-2609090001',
          booking_no: 'BKG-26090901',
          qc_date: '22/09/2026 06:45:00 น.',
          customer_name: 'คุณสมชาย ใจดี',
          customer_phone: '081-234-5678',
          qc_round: 1,
          qc_score: 5.0,
          full_payload: payload,
        }),
      })
    )
  })

  it('4. Returns 500 when database insertion fails', async () => {
    mockInsertValues.mockRejectedValueOnce(new Error('DB connection failed'))

    const req = new NextRequest('http://localhost:3000/api/webhooks/pmt-qc', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': SECRET,
      },
      body: JSON.stringify({ ref_no: 'REF-ERR' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe('DB connection failed')
  })
})
