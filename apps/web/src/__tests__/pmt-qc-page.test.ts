import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
const mockOrderBy = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
};

vi.mock('@/lib/db', () => ({
  getDb: () => mockDb,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  unstable_noStore: vi.fn(),
}));

import { fetchQcEventsAction, createSampleQcRecordAction } from '@/app/(wds)/wds/pmt-qc/actions';

describe('PMT QC Page Actions & Verification Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. fetchQcEventsAction queries domainEvents where name="pmt.qc.passed" ordered by occurredAt DESC', async () => {
    const mockEvents = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'pmt.qc.passed',
        aggregate: 'installation_qc',
        aggregateId: '22222222-2222-2222-2222-222222222222',
        payload: {
          ref_no: 'REF-2026-0001',
          ticket: 'TICK-001',
          booking_no: 'BKG-001',
          qc_date: '22/09/2026 06:45:00 น.',
          customer_name: 'สมชาย',
          customer_phone: '0812345678',
          qc_round: 1,
          qc_score: 5.0,
        },
        occurredAt: new Date('2026-09-22T06:45:00Z'),
        processedAt: null,
        attempts: 0,
        status: 'pending',
        lastError: null,
      },
    ];

    mockOrderBy.mockReturnValueOnce({
      limit: vi.fn().mockResolvedValueOnce(mockEvents),
    });

    const results = await fetchQcEventsAction(50);
    expect(results).toHaveLength(1);
    expect(results[0].payload.ref_no).toBe('REF-2026-0001');
    expect(results[0].payload.qc_score).toBe(5.0);
    expect(mockSelect).toHaveBeenCalled();
  });

  it('2. createSampleQcRecordAction generates complete 8-field QC record and inserts to DB', async () => {
    const res = await createSampleQcRecordAction();
    expect(res.success).toBe(true);
    expect(res.message).toContain('สร้างข้อมูลจำลอง');

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'pmt.qc.passed',
        aggregate: 'installation_qc',
        status: 'pending',
        payload: expect.objectContaining({
          ref_no: expect.stringMatching(/^REF-2026-\d{4}$/),
          ticket: expect.stringMatching(/^TICK-260909\d{4}$/),
          booking_no: expect.any(String),
          qc_date: expect.any(String),
          customer_name: expect.any(String),
          customer_phone: expect.any(String),
          qc_round: expect.any(Number),
          qc_score: expect.any(Number),
        }),
      })
    );
  });
});
