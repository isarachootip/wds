'use server';

import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { domainEvents } from '@wds/db';
import type { QcEventRecord, QcPayload } from './types';

export async function fetchQcEventsAction(limit = 100): Promise<QcEventRecord[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(domainEvents)
      .where(eq(domainEvents.name, 'pmt.qc.passed'))
      .orderBy(desc(domainEvents.occurredAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      aggregate: row.aggregate,
      aggregateId: row.aggregateId,
      payload: (row.payload || {}) as QcPayload,
      occurredAt: row.occurredAt.toISOString(),
      processedAt: row.processedAt ? row.processedAt.toISOString() : null,
      attempts: row.attempts,
      status: row.status,
      lastError: row.lastError,
    }));
  } catch (error) {
    console.error('Error fetching QC events:', error);
    return [];
  }
}

export async function createSampleQcRecordAction() {
  try {
    const db = getDb();
    const timestamp = new Date();
    const dateFormatted = timestamp.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const sampleNo = Math.floor(1000 + Math.random() * 9000);
    const isPassing = Math.random() > 0.15;
    const score = isPassing ? (4.5 + Math.random() * 0.5).toFixed(1) : '3.0';
    const round = Math.random() > 0.7 ? 2 : 1;

    const samplePayload = {
      ref_no: `REF-2026-${sampleNo}`,
      ticket: `TICK-260909${sampleNo}`,
      booking_no: `BKG-260909${sampleNo.toString().slice(0, 2)}`,
      qc_date: `${dateFormatted} น.`,
      customer_name: ['คุณสมชาย ใจดี', 'คุณกนกวรรณ เจริญสุข', 'คุณวีระชัย วงศ์สวัสดิ์', 'คุณรัตนา เลิศพงศ์'][Math.floor(Math.random() * 4)],
      customer_phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
      qc_round: round,
      qc_score: parseFloat(score),
      qc_round_text: round === 1 ? 'ตรวจครั้งที่ 1 (ผ่านเกณฑ์รอบแรก)' : `ตรวจครั้งที่ ${round} (แก้ไขเรียบร้อย)`,
      qc_result: isPassing ? 'ผ่านเกณฑ์' : 'ต้องแก้ไขปรับปรุง',
      qc_score_text: `${score} / 5.0 คะแนน`,
      stk_ref: `STK-QC-2026-${sampleNo}`,
      job_no: `JOB260909${sampleNo}`,
      service: 'บริการติดตั้งเครื่องปรับอากาศและตรวจระบบไฟ',
      qc_inspector: 'วิชัย ตรวจดี (ช่าง QC Lead)',
    };

    await db.insert(domainEvents).values({
      name: 'pmt.qc.passed',
      aggregate: 'installation_qc',
      aggregateId: randomUUID(),
      payload: {
        ref_no: samplePayload.ref_no,
        ticket: samplePayload.ticket,
        booking_no: samplePayload.booking_no,
        qc_date: samplePayload.qc_date,
        customer_name: samplePayload.customer_name,
        customer_phone: samplePayload.customer_phone,
        qc_round: samplePayload.qc_round,
        qc_score: samplePayload.qc_score,
        full_payload: samplePayload,
      },
      status: 'pending',
    });

    revalidatePath('/wds/pmt-qc');
    return { success: true, message: `สร้างข้อมูลจำลอง ${samplePayload.ref_no} สำเร็จ` };
  } catch (error: any) {
    console.error('Error creating sample QC record:', error);
    return { success: false, error: error.message || 'ไม่สามารถสร้างข้อมูลจำลองได้' };
  }
}
