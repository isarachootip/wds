'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  Layers,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import type { QcEventRecord } from './types';
import { QcDetailModal } from './QcDetailModal';
import { createSampleQcRecordAction } from './actions';

interface Props {
  initialEvents: QcEventRecord[];
}

export function QcDataTable({ initialEvents }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [roundFilter, setRoundFilter] = useState<'all' | '1' | '2+'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'passed' | 'review'>('all');
  const [selectedEvent, setSelectedEvent] = useState<QcEventRecord | null>(null);

  const [simulating, setSimulating] = useState(false);
  const [simulateMsg, setSimulateMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);
  const [showCurlBox, setShowCurlBox] = useState(false);

  // Filtered & Sorted events (default sorted DESC by occurredAt)
  const filteredEvents = useMemo(() => {
    return initialEvents.filter((item) => {
      const p = item.payload || {};
      const full = p.full_payload || {};

      const refNo = (p.ref_no || full.ref_no || '').toLowerCase();
      const ticket = (p.ticket || full.ticket || '').toLowerCase();
      const booking = (p.booking_no || full.booking_no || '').toLowerCase();
      const customer = (p.customer_name || full.customer_name || '').toLowerCase();
      const phone = (p.customer_phone || full.customer_phone || '').toLowerCase();
      const inspector = (full.qc_inspector || '').toLowerCase();

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        refNo.includes(q) ||
        ticket.includes(q) ||
        booking.includes(q) ||
        customer.includes(q) ||
        phone.includes(q) ||
        inspector.includes(q);

      if (!matchSearch) return false;

      // Round filter
      const round = p.qc_round ?? full.qc_round ?? 1;
      if (roundFilter === '1' && round !== 1) return false;
      if (roundFilter === '2+' && round < 2) return false;

      // Score filter
      const score = p.qc_score ?? full.qc_score ?? 0;
      if (scoreFilter === 'passed' && score < 4.0) return false;
      if (scoreFilter === 'review' && score >= 4.0) return false;

      return true;
    });
  }, [initialEvents, search, roundFilter, scoreFilter]);

  async function handleSimulate() {
    setSimulating(true);
    setSimulateMsg(null);
    try {
      const res = await createSampleQcRecordAction();
      if (res.success) {
        setSimulateMsg({ success: true, text: res.message || 'สร้างข้อมูลจำลองสำเร็จ' });
        startTransition(() => {
          router.refresh();
        });
      } else {
        setSimulateMsg({ success: false, text: res.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (e: any) {
      setSimulateMsg({ success: false, text: e.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setSimulating(false);
    }
  }

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  const curlCommand = `curl.exe -X POST https://vwds.online/api/webhooks/pmt-qc \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: wds_pmt_secure_key_2026" \\
  -d '{
    "ref_no": "REF-2026-0091",
    "ticket": "TICK-2609090001",
    "booking_no": "BKG-26090901",
    "qc_date": "22/09/2026 06:45:00 น.",
    "customer_name": "คุณสมชาย ใจดี",
    "customer_phone": "081-234-5678",
    "qc_round": 1,
    "qc_score": 5.0
  }'`;

  function copyCurl() {
    navigator.clipboard.writeText(curlCommand);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Top action toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="ค้นหา Ref No, Ticket, Booking, ชื่อลูกค้า, เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filter Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Round Filter */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <button
              onClick={() => setRoundFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                roundFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              ทุกรอบ
            </button>
            <button
              onClick={() => setRoundFilter('1')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                roundFilter === '1'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              รอบที่ 1
            </button>
            <button
              onClick={() => setRoundFilter('2+')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                roundFilter === '2+'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              รอบ 2 ขึ้นไป
            </button>
          </div>

          {/* Score Filter */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <button
              onClick={() => setScoreFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                scoreFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              ทุกเกณฑ์
            </button>
            <button
              onClick={() => setScoreFilter('passed')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                scoreFilter === 'passed'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              ผ่าน (≥ 4.0)
            </button>
            <button
              onClick={() => setScoreFilter('review')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                scoreFilter === 'review'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              แก้ไข (&lt; 4.0)
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            title="รีเฟรชข้อมูล"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          </button>

          {/* Test Simulator Button */}
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{simulating ? 'กำลังจำลอง...' : 'จำลองรับ Webhook'}</span>
          </button>

          {/* Toggle cURL Helper */}
          <button
            onClick={() => setShowCurlBox(!showCurlBox)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>คำสั่ง cURL</span>
          </button>
        </div>
      </div>

      {/* Simulator Message Toast */}
      {simulateMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            simulateMsg.success
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {simulateMsg.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
            <span>{simulateMsg.text}</span>
          </div>
          <button
            onClick={() => setSimulateMsg(null)}
            className="text-zinc-400 hover:text-zinc-600 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* cURL Quick Helper Drawer */}
      {showCurlBox && (
        <div className="p-4 rounded-2xl bg-zinc-950 text-zinc-200 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Terminal className="w-4 h-4 text-blue-400" />
              คำสั่งยิงทดสอบจริงเข้า Production / Localhost
            </span>
            <button
              onClick={copyCurl}
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline cursor-pointer"
            >
              {curlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{curlCopied ? 'คัดลอกแล้ว' : 'คัดลอกคำสั่ง'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-zinc-900/80 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800/80">
            {curlCommand}
          </pre>
        </div>
      )}

      {/* QC Events Data Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4">เวลาที่รับ (ล่าสุด)</th>
                <th className="p-4">เลขอ้างอิง (Ref / Ticket)</th>
                <th className="p-4">ลูกค้า & เบอร์โทร</th>
                <th className="p-4">วันที่บันทึก QC</th>
                <th className="p-4 text-center">รอบที่</th>
                <th className="p-4 text-center">คะแนนประเมิน</th>
                <th className="p-4">ผู้ตรวจ / บริการ</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Clock className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                      <p className="text-sm font-medium text-zinc-500">
                        {search || roundFilter !== 'all' || scoreFilter !== 'all'
                          ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'
                          : 'ยังไม่มีข้อมูลผลตรวจ QC ที่ส่งเข้ามา'}
                      </p>
                      <button
                        onClick={handleSimulate}
                        disabled={simulating}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>สร้างข้อมูลจำลองเพื่อตรวจสอบ (Simulate)</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item) => {
                  const p = item.payload || {};
                  const full = p.full_payload || {};
                  const score = p.qc_score ?? full.qc_score;
                  const isPassing = typeof score === 'number' ? score >= 4.0 : true;
                  const round = p.qc_round ?? full.qc_round ?? 1;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      {/* Received Time */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {new Date(item.occurredAt).toLocaleDateString('th-TH', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {new Date(item.occurredAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })} น.
                        </div>
                      </td>

                      {/* Ref No & Ticket */}
                      <td className="p-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                          {p.ref_no || full.ref_no || '—'}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Ticket: {p.ticket || full.ticket || '—'}
                        </div>
                        {(p.booking_no || full.booking_no) && (
                          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">
                            BKG: {p.booking_no || full.booking_no}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                          {p.customer_name || full.customer_name || '—'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {p.customer_phone || full.customer_phone || '—'}
                        </div>
                      </td>

                      {/* QC Date */}
                      <td className="p-4 text-xs text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {p.qc_date || full.qc_date || '—'}
                      </td>

                      {/* Round */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            round === 1
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                          }`}
                        >
                          รอบ {round}
                        </span>
                      </td>

                      {/* Score & Result */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {score != null ? `${Number(score).toFixed(1)} / 5.0` : '—'}
                          </span>
                          <span
                            className={`mt-1 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isPassing
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {isPassing ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : (
                              <ShieldAlert className="w-3 h-3" />
                            )}
                            {full.qc_result || (isPassing ? 'ผ่านเกณฑ์' : 'แก้ไข')}
                          </span>
                        </div>
                      </td>

                      {/* Inspector / Service */}
                      <td className="p-4 text-xs">
                        <div className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-[140px]">
                          {full.qc_inspector || '—'}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                          {full.service || '—'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {item.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedEvent(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูข้อมูล</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div>
            แสดง {filteredEvents.length} จากทั้งหมด {initialEvents.length} รายการ (เรียงตามวันที่เวลาเข้าล่าสุด)
          </div>
          <div>Endpoint: <span className="font-mono text-[11px]">/api/webhooks/pmt-qc</span></div>
        </div>
      </div>

      {/* Modal View Details */}
      <QcDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
