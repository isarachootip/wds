import { unstable_noStore as noStore } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { domainEvents } from '@wds/db';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Activity,
  Webhook,
} from 'lucide-react';
import type { QcEventRecord, QcPayload, QcStats } from './types';
import { QcDataTable } from './QcDataTable';

export const metadata = {
  title: 'ผลตรวจ QC (PMT Flow) | WDS Platform',
  description: 'รายการข้อมูลผลการตรวจรับรองคุณภาพงาน QC จาก PMT Flow Outbound Webhook',
};

async function getQcEvents(): Promise<{ events: QcEventRecord[]; stats: QcStats }> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(domainEvents)
      .where(eq(domainEvents.name, 'pmt.qc.passed'))
      .orderBy(desc(domainEvents.occurredAt))
      .limit(200);

    let totalPassed = 0;
    let totalScoreSum = 0;
    let scoreCount = 0;

    const events: QcEventRecord[] = rows.map((row) => {
      const payload = (row.payload || {}) as QcPayload;
      const full = payload.full_payload || {};
      const score = payload.qc_score ?? full.qc_score;

      if (typeof score === 'number' && !isNaN(score)) {
        totalScoreSum += score;
        scoreCount++;
        if (score >= 4.0) totalPassed++;
      } else {
        totalPassed++;
      }

      return {
        id: row.id,
        name: row.name,
        aggregate: row.aggregate,
        aggregateId: row.aggregateId,
        payload,
        occurredAt: row.occurredAt.toISOString(),
        processedAt: row.processedAt ? row.processedAt.toISOString() : null,
        attempts: row.attempts,
        status: row.status,
        lastError: row.lastError,
      };
    });

    const stats: QcStats = {
      total: events.length,
      passed: totalPassed,
      failedOrWarning: events.length - totalPassed,
      averageScore: scoreCount > 0 ? parseFloat((totalScoreSum / scoreCount).toFixed(2)) : 5.0,
      latestReceivedAt: events.length > 0 ? events[0].occurredAt : null,
    };

    return { events, stats };
  } catch (error) {
    console.error('[PMT-QC Page] Error fetching events:', error);
    return {
      events: [],
      stats: {
        total: 0,
        passed: 0,
        failedOrWarning: 0,
        averageScore: 0,
        latestReceivedAt: null,
      },
    };
  }
}

export default async function PmtQcPage() {
  noStore();
  const { events, stats } = await getQcEvents();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              บันทึกผลตรวจ QC (PMT Flow Webhook)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            ตรวจสอบข้อมูลและสถานะการตรวจรับรองคุณภาพงานติดตั้งที่ส่งตรงจากระบบ PMT Flow (Step 6)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
          <Webhook className="w-4 h-4 text-emerald-500" />
          <span>Endpoint:</span>
          <code className="font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-200/60 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded-sm">
            /api/webhooks/pmt-qc
          </code>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total records */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>รายการที่รับทั้งหมด</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats.total.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-400">เรียงตามวันที่เวลาเข้าล่าสุด</p>
        </div>

        {/* Passed criteria */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>ผ่านเกณฑ์ (Passed)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.passed.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600/80">
            {stats.total > 0 ? `${Math.round((stats.passed / stats.total) * 100)}% ของทั้งหมด` : '—'}
          </p>
        </div>

        {/* Average score */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>คะแนนเฉลี่ย</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats.averageScore.toFixed(2)} <span className="text-xs font-normal text-zinc-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-zinc-400">เกณฑ์มาตรฐาน 4.0 ขึ้นไป</p>
        </div>

        {/* Latest received */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>รับล่าสุดเมื่อ</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {stats.latestReceivedAt
              ? new Date(stats.latestReceivedAt).toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }) + ' น.'
              : '—'}
          </div>
          <p className="text-[11px] text-zinc-400 truncate">
            {stats.latestReceivedAt
              ? new Date(stats.latestReceivedAt).toLocaleDateString('th-TH', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'ยังไม่มีข้อมูล'}
          </p>
        </div>
      </div>

      {/* Main Table Component */}
      <QcDataTable initialEvents={events} />
    </div>
  );
}
