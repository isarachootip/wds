'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ClipboardCheck,
  User,
  Phone,
  Calendar,
  FileText,
  Tag,
  Hash,
  ShieldAlert,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import type { QcEventRecord } from './types';

interface Props {
  event: QcEventRecord | null;
  onClose: () => void;
}

export function QcDetailModal({ event, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const payload = event.payload || {};
  const fullPayload = payload.full_payload || payload;

  const score = payload.qc_score ?? fullPayload.qc_score;
  const isPassing = typeof score === 'number' ? score >= 4.0 : true;

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(fullPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <ClipboardCheck className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {payload.ref_no || fullPayload.ref_no || 'ไม่ระบุ Ref No'}
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
                    {fullPayload.qc_result || (isPassing ? 'ผ่านเกณฑ์' : 'ต้องแก้ไข')}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Ticket: {payload.ticket || fullPayload.ticket || '—'} | Booking: {payload.booking_no || fullPayload.booking_no || '—'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8 Core Fields Grid */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            ข้อมูลสำคัญ 8 ฟิลด์หลัก (PMT Flow Payload)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Ref No */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
              <Hash className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">1. เลขที่ Ref อ้างอิง (ref_no)</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  {payload.ref_no || fullPayload.ref_no || '—'}
                </p>
              </div>
            </div>

            {/* 2. Ticket No */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
              <Tag className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">2. Ticket No (ticket)</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  {payload.ticket || fullPayload.ticket || '—'}
                </p>
              </div>
            </div>

            {/* 3. Booking No */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
              <FileText className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">3. Booking No (booking_no)</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  {payload.booking_no || fullPayload.booking_no || '—'}
                </p>
              </div>
            </div>

            {/* 4. QC Date */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
              <Calendar className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">4. วันที่บันทึก QC (qc_date)</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {payload.qc_date || fullPayload.qc_date || '—'}
                </p>
              </div>
            </div>

            {/* 5. Customer Name */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
              <User className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">5. ชื่อลูกค้า (customer_name)</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {payload.customer_name || fullPayload.customer_name || '—'}
                </p>
              </div>
            </div>

            {/* 6. Customer Phone */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
              <Phone className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">6. เบอร์โทร (customer_phone)</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {payload.customer_phone || fullPayload.customer_phone || '—'}
                </p>
              </div>
            </div>

            {/* 7. QC Round */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
              <Layers className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">7. รอบการตรวจ QC (qc_round)</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  รอบที่ {payload.qc_round ?? fullPayload.qc_round ?? 1}
                  {fullPayload.qc_round_text && (
                    <span className="text-xs text-zinc-500 font-normal ml-1.5">
                      ({fullPayload.qc_round_text})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 8. QC Score */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">8. คะแนนประเมิน (qc_score)</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {fullPayload.qc_score_text || `${score ?? '—'} / 5.0 คะแนน`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Fields if available */}
        {(fullPayload.qc_inspector || fullPayload.service || fullPayload.job_no || fullPayload.stk_ref) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              ข้อมูลบริบทงานเพิ่มเติม
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-50/50 dark:bg-zinc-800/30 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
              {fullPayload.qc_inspector && (
                <div>
                  <span className="text-zinc-500">ผู้ตรวจ QC:</span>{' '}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {fullPayload.qc_inspector}
                  </span>
                </div>
              )}
              {fullPayload.service && (
                <div>
                  <span className="text-zinc-500">บริการ:</span>{' '}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {fullPayload.service}
                  </span>
                </div>
              )}
              {fullPayload.job_no && (
                <div>
                  <span className="text-zinc-500">Job No:</span>{' '}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                    {fullPayload.job_no}
                  </span>
                </div>
              )}
              {fullPayload.stk_ref && (
                <div>
                  <span className="text-zinc-500">STK Ref:</span>{' '}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                    {fullPayload.stk_ref}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw JSON Payload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Raw Webhook JSON Payload
            </h3>
            <button
              onClick={copyJson}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800 max-h-60">
            {JSON.stringify(fullPayload, null, 2)}
          </pre>
        </div>

        {/* Event System Meta */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
          <div>Event ID: <span className="font-mono">{event.id}</span></div>
          <div>
            บันทึกรับเมื่อ:{' '}
            {new Date(event.occurredAt).toLocaleString('th-TH', {
              dateStyle: 'medium',
              timeStyle: 'medium',
            })}
          </div>
          <div>
            Status:{' '}
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
              {event.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
