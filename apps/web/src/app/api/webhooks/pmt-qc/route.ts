import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { domainEvents } from '@wds/db';

export const runtime = 'nodejs';

// Secret Key สำหรับตรวจสอบความถูกต้อง (ตรงกับค่า STK_OUTBOUND_WEBHOOK_API_KEY ของ PMT Flow)
const PMT_WEBHOOK_SECRET = process.env.PMT_WEBHOOK_SECRET || 'wds_pmt_secure_key_2026';

export async function POST(request: NextRequest) {
  try {
    // 1. ตรวจสอบ Security Header (x-api-key)
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== PMT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    // 2. อ่าน Payload ข้อมูล 8 ฟิลด์หลักจาก PMT Flow
    const body = await request.json();
    const {
      ref_no,          // 1. เลขที่ Ref อ้างอิง
      ticket,          // 2. ticket no
      booking_no,      // 3. booking no
      qc_date,         // 4. วันที่บันทึก QC (DD/MM/YYYY HH:mm:ss น.)
      customer_name,   // 5. ชื่อลูกค้า
      customer_phone,  // 6. เบอร์โทร
      qc_round,        // 7. รอบการตรวจ QC (ตัวเลข เช่น 1, 2)
      qc_score         // 8. คะแนนประเมิน (เช่น 5.0, 1.0)
    } = body;

    console.log(`[PMT-QC Received] Ref: ${ref_no} | Ticket: ${ticket} | Score: ${qc_score}`);

    // 3. บันทึกเข้าตาราง Event / Audit Log ใน WDS Database (Drizzle ORM)
    const db = getDb();
    await db.insert(domainEvents).values({
      name: 'pmt.qc.passed',
      aggregate: 'installation_qc',
      aggregateId: randomUUID(),
      payload: {
        ref_no,
        ticket,
        booking_no,
        qc_date,
        customer_name,
        customer_phone,
        qc_round,
        qc_score,
        full_payload: body,
      },
      status: 'pending',
    });

    // 4. ตอบกลับ 200 OK ให้ PMT Flow รับทราบว่ารับข้อมูลสำเร็จ
    return NextResponse.json({
      success: true,
      message: 'QC data received successfully by WDS Platform',
      ref_no,
      ticket,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[PMT-QC Webhook Error]:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error',
    }, { status: 500 });
  }
}
