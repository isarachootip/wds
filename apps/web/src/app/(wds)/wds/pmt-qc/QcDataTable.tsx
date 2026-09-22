'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
  Terminal,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck,
  Hash,
  Tag,
  FileText,
  Calendar,
  User,
  Phone,
  Code2,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import type { QcEventRecord } from './types';
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [simulating, setSimulating] = useState(false);
  const [simulateMsg, setSimulateMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);
  const [showCurlBox, setShowCurlBox] = useState(false);

  // Filtered & Sorted events (default sorted DESC by occurredAt)
  const filteredEvents = useMemo(() => {
    return initialEvents.filter((item) => {
      const p = item.payload || {};
      const full = p.full_payload || p || {};

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

  function copyItemJson(id: string, payload: any) {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                roundFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              ทุกรอบ
            </button>
            <button
              onClick={() => setRoundFilter('1')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                roundFilter === '1'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              รอบที่ 1
            </button>
            <button
              onClick={() => setRoundFilter('2+')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                scoreFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              ทุกเกณฑ์
            </button>
            <button
              onClick={() => setScoreFilter('passed')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                scoreFilter === 'passed'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              ผ่าน (≥ 4.0)
            </button>
            <button
              onClick={() => setScoreFilter('review')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                scoreFilter === 'review'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              แก้ไข (&lt; 4.0)
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <button
              onClick={() => setViewMode('cards')}
              title="แสดงรายละเอียดเต็ม (Detail Cards)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ดละเอียด</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="แสดงตารางสรุป (Compact Table)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>ตารางย่อ</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            title="รีเฟรชข้อมูล"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          </button>

          {/* Test Simulator Button */}
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{simulating ? 'กำลังจำลอง...' : 'จำลองรับ Webhook'}</span>
          </button>

          {/* Toggle cURL Helper */}
          <button
            onClick={() => setShowCurlBox(!showCurlBox)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
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
            className="text-zinc-400 hover:text-zinc-600 ml-4 font-bold cursor-pointer"
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

      {/* Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-16 text-center shadow-xs">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>สร้างข้อมูลจำลองเพื่อตรวจสอบ (Simulate)</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* DETAIL CARDS VIEW (DEFAULT: เอาข้อมูล Detail ในรูปที่ 2 มาแสดงรวมในรูปที่ 1 เลย ไม่ต้องกดดู) */
        <div className="space-y-4">
          {filteredEvents.map((item) => {
            const p = item.payload || {};
            const full = p.full_payload || p || {};
            const score = p.qc_score ?? full.qc_score;
            const isPassing = typeof score === 'number' ? score >= 4.0 : true;
            const round = p.qc_round ?? full.qc_round ?? 1;
            const fullPayload = p.full_payload || p;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs p-5 sm:p-6 space-y-5 transition-shadow hover:shadow-md"
              >
                {/* 1. Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0">
                      <ClipboardCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                          {p.ref_no || full.ref_no || 'ไม่ระบุ Ref No'}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isPassing
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isPassing ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          )}
                          {full.qc_result || (isPassing ? 'ผ่านเกณฑ์' : 'ต้องแก้ไข')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            round === 1
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                          }`}
                        >
                          รอบที่ {round}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">
                        Ticket: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{p.ticket || full.ticket || '—'}</span>
                        {' | '}Booking: <span className="text-cyan-600 dark:text-cyan-400 font-medium">{p.booking_no || full.booking_no || '—'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-zinc-500">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      รับเมื่อ: {new Date(item.occurredAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' })}
                    </span>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium text-[11px]">
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* 2. ข้อมูลสำคัญ 8 ฟิลด์หลัก (PMT FLOW PAYLOAD) */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    ข้อมูลสำคัญ 8 ฟิลด์หลัก (PMT Flow Payload)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Ref No */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
                      <Hash className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">1. เลขที่ Ref อ้างอิง (ref_no)</p>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono truncate">
                          {p.ref_no || full.ref_no || '—'}
                        </p>
                      </div>
                    </div>

                    {/* 2. Ticket No */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
                      <Tag className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">2. Ticket No (ticket)</p>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono truncate">
                          {p.ticket || full.ticket || '—'}
                        </p>
                      </div>
                    </div>

                    {/* 3. Booking No */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">3. Booking No (booking_no)</p>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono truncate">
                          {p.booking_no || full.booking_no || '—'}
                        </p>
                      </div>
                    </div>

                    {/* 4. QC Date */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">4. วันที่บันทึก QC (qc_date)</p>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {p.qc_date || full.qc_date || '—'}
                        </p>
                      </div>
                    </div>

                    {/* 5. Customer Name */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
                      <User className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">5. ชื่อลูกค้า (customer_name)</p>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {p.customer_name || full.customer_name || '—'}
                        </p>
                      </div>
                    </div>

                    {/* 6. Customer Phone */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">6. เบอร์โทร (customer_phone)</p>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono truncate">
                          {p.customer_phone || full.customer_phone || '—'}
                        </p>
                      </div>
                    </div>

                    {/* 7. QC Round */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">7. รอบการตรวจ QC (qc_round)</p>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          รอบที่ {p.qc_round ?? full.qc_round ?? 1}
                          {full.qc_round_text && (
                            <span className="text-[11px] text-zinc-500 font-normal ml-1">
                              ({full.qc_round_text})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 8. QC Score */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">8. คะแนนประเมิน (qc_score)</p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          {full.qc_score_text || `${score != null ? Number(score).toFixed(1) : '—'} / 5.0 คะแนน`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ข้อมูลบริบทงานเพิ่มเติม (ถ้ามี) */}
                {(full.qc_inspector || full.service || full.job_no || full.stk_ref) && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      ข้อมูลบริบทงานเพิ่มเติม
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs bg-zinc-50/70 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      {full.qc_inspector && (
                        <div>
                          <span className="text-zinc-500">ผู้ตรวจ QC:</span>{' '}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {full.qc_inspector}
                          </span>
                        </div>
                      )}
                      {full.service && (
                        <div>
                          <span className="text-zinc-500">บริการ:</span>{' '}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {full.service}
                          </span>
                        </div>
                      )}
                      {full.job_no && (
                        <div>
                          <span className="text-zinc-500">Job No:</span>{' '}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                            {full.job_no}
                          </span>
                        </div>
                      )}
                      {full.stk_ref && (
                        <div>
                          <span className="text-zinc-500">STK Ref:</span>{' '}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                            {full.stk_ref}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. RAW WEBHOOK JSON PAYLOAD */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Raw Webhook JSON Payload</span>
                    </h3>
                    <button
                      onClick={() => copyItemJson(item.id, fullPayload)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-medium">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอก JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800 max-h-52">
                    {JSON.stringify(fullPayload, null, 2)}
                  </pre>
                </div>

                {/* 5. Event System Meta Footer */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
                  <div>Event ID: <span className="font-mono text-zinc-500 dark:text-zinc-400">{item.id}</span></div>
                  <div>
                    บันทึกรับเมื่อ:{' '}
                    {new Date(item.occurredAt).toLocaleString('th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </div>
                  <div>
                    Status:{' '}
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW (ทางเลือกสำหรับการกวาดสายตาเร็ว) */
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
                  <th className="p-4 text-right">JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredEvents.map((item) => {
                  const p = item.payload || {};
                  const full = p.full_payload || p || {};
                  const score = p.qc_score ?? full.qc_score;
                  const isPassing = typeof score === 'number' ? score >= 4.0 : true;
                  const round = p.qc_round ?? full.qc_round ?? 1;
                  const fullPayload = p.full_payload || p;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors"
                    >
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

                      <td className="p-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                          {p.customer_name || full.customer_name || '—'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {p.customer_phone || full.customer_phone || '—'}
                        </div>
                      </td>

                      <td className="p-4 text-xs text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {p.qc_date || full.qc_date || '—'}
                      </td>

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
                              <ShieldCheck className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            )}
                            {full.qc_result || (isPassing ? 'ผ่านเกณฑ์' : 'แก้ไข')}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-xs">
                        <div className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-[140px]">
                          {full.qc_inspector || '—'}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                          {full.service || '—'}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {item.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => copyItemJson(item.id, fullPayload)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>คัดลอก</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer info bar */}
      <div className="px-4 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2 shadow-xs">
        <div>
          แสดง {filteredEvents.length} จากทั้งหมด {initialEvents.length} รายการ (เรียงตามวันที่เวลาเข้าล่าสุด)
        </div>
        <div>
          Endpoint:{' '}
          <code className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-zinc-800 dark:text-zinc-200">
            /api/webhooks/pmt-qc
          </code>
        </div>
      </div>
    </div>
  );
}
