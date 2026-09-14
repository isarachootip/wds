'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  Plus,
  ShieldCheck,
  UserCheck,
  Navigation,
} from 'lucide-react'
import { requestSiteVisitAction } from '@/modules/crm/actions'
import { Button } from '@/components/ui/button'

export interface SiteVisitCardProps {
  leadId: string
  siteVisits: any[]
}

const TRUCK_TYPES = [
  { key: '4W', label: '4W (กระบะ 4 ล้อ)', desc: 'เข้าได้สะดวก ทุกซอย' },
  { key: '6W', label: '6W (บรรทุก 6 ล้อ)', desc: 'ถนนกว้าง > 4 ม. ไม่มีสิ่งกีดขวาง' },
  { key: '10W', label: '10W (สิบล้อ)', desc: 'ถนนกว้าง > 6 ม. รัศมีเลี้ยวพอเหมาะ' },
  { key: '22W', label: '22W (เทรลเลอร์)', desc: 'ทางหลัก ไม่มีสายไฟต่ำและสะพานจำกัดน้ำหนัก' },
]

export function SiteVisitCard({ leadId, siteVisits = [] }: SiteVisitCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [purpose, setPurpose] = useState('')
  const [selectedRoadClearance, setSelectedRoadClearance] = useState('10W')
  const [scopeNotes, setScopeNotes] = useState('')
  const [address, setAddress] = useState('')
  const [surveyorName, setSurveyorName] = useState('ช่างสำรวจพื้นที่ (ทีม Field Survey WDS)')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const latestVisit = siteVisits[0] ?? null

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!purpose.trim()) {
      setError('กรุณาระบุวัตถุประสงค์ในการเข้าสำรวจหน้างาน')
      return
    }

    setError(null)
    startTransition(async () => {
      const fullPurpose = `${purpose.trim()} (ระยะผ่านทางรถ: ${selectedRoadClearance}${
        address ? `, สถานที่: ${address.trim()}` : ''
      }${scopeNotes ? `, ขอบเขต: ${scopeNotes.trim()}` : ''})`

      const result = await requestSiteVisitAction(
        { leadId, purpose: fullPurpose },
        'sales-ae'
      )

      if (result.success) {
        setSuccess('ส่งคำขอนัดหมายสำรวจหน้างานเรียบร้อยแล้ว')
        setShowRequestForm(false)
        setPurpose('')
        setScopeNotes('')
        setAddress('')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาดในการขอสำรวจหน้างาน')
      }
    })
  }

  // Determine truck clearance display from visit workSummary / purpose / scope
  const detectedClearance =
    latestVisit?.scope?.roadClearance ||
    (latestVisit?.purpose?.includes('22W')
      ? '22W'
      : latestVisit?.purpose?.includes('10W')
      ? '10W'
      : latestVisit?.purpose?.includes('6W')
      ? '6W'
      : latestVisit?.purpose?.includes('4W')
      ? '4W'
      : '10W')

  const isApproved =
    latestVisit?.appointment?.approvedAt ||
    latestVisit?.status === 'scheduled' ||
    latestVisit?.status === 'done'
  const isRejected = latestVisit?.appointment?.status === 'rejected'

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>การสำรวจหน้างาน (Site Visit Management)</span>
            </h3>
            {latestVisit && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  latestVisit.status === 'done'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : latestVisit.status === 'scheduled'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    : latestVisit.status === 'cancelled'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                }`}
              >
                {latestVisit.status === 'done'
                  ? '✅ สำรวจเสร็จสิ้น'
                  : latestVisit.status === 'scheduled'
                  ? '📅 นัดหมายแล้ว'
                  : latestVisit.status === 'cancelled'
                  ? '❌ ยกเลิก'
                  : '⏳ รอจัดคิวนัดหมาย'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            จัดการทีมสำรวจ พิกัดทางเข้า รถบรรทุกเข้าถึง GPS Check-in และลายเซ็นส่งมอบ
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="inline-flex items-center gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showRequestForm ? 'ปิดแบบฟอร์ม' : 'ขอนัดสำรวจหน้างานใหม่'}</span>
        </Button>
      </div>

      {success && (
        <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Request Site Visit Modal / Form */}
      {showRequestForm && (
        <form
          onSubmit={handleRequestSubmit}
          className="mb-5 p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-3"
        >
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-500" />
            <span>กรอกข้อมูลขอนัดหมายสำรวจหน้างาน (Site Visit Appointment Request)</span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-foreground mb-1">
              วัตถุประสงค์ในการเข้าสำรวจ <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="เช่น ตรวจสอบความพร้อมทางเข้าไซต์งาน และวัดพื้นที่เทคอนกรีตฐานราก"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">
                การประเมินรถส่งสินค้าเข้าถึง (Road Clearance)
              </label>
              <select
                value={selectedRoadClearance}
                onChange={(e) => setSelectedRoadClearance(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TRUCK_TYPES.map((t) => (
                  <option key={t.key} value={t.key} className="bg-popover text-popover-foreground">
                    {t.label} - {t.desc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">
                ช่างผู้รับผิดชอบสำรวจ (Surveyor Assignment)
              </label>
              <input
                type="text"
                value={surveyorName}
                onChange={(e) => setSurveyorName(e.target.value)}
                placeholder="ระบุชื่อช่างสำรวจ"
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">
                ที่อยู่ / สถานที่ไซต์งาน (Site Address / Location)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น โครงการหมู่บ้านพฤกษาวิลล์ บางนา-ตราด กม. 12"
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">
                ขอบเขตการสำรวจ / รายการประเมิน (Scope & BoQ)
              </label>
              <input
                type="text"
                value={scopeNotes}
                onChange={(e) => setScopeNotes(e.target.value)}
                placeholder="เช่น วัดระยะถนน เสาไฟ ท่อระบายน้ำ ขนาดหลุมเท"
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRequestForm(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isPending || !purpose.trim()}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
            >
              {isPending ? 'กำลังส่งคำขอ...' : 'ยืนยันขอสำรวจหน้างาน'}
            </Button>
          </div>
        </form>
      )}

      {/* Existing Site Visit Information */}
      {!latestVisit ? (
        <div className="text-center py-6 border border-dashed border-border rounded-2xl bg-muted/20">
          <MapPin className="w-7 h-7 text-muted-foreground/50 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground font-medium">ยังไม่มีข้อมูลการนัดหมายสำรวจหน้างาน</p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            คลิกปุ่ม &quot;ขอนัดสำรวจหน้างานใหม่&quot; ด้านบนเพื่อเริ่มจัดคิวลงพื้นที่
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Status Strip: Schedule & Approval */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/40 rounded-xl p-3.5 border border-border">
            <div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                วัตถุประสงค์ & กำหนดการ
              </span>
              <div className="text-xs font-semibold text-foreground mt-1 flex items-start gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>{latestVisit.purpose || 'สำรวจไซต์งาน'}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 ml-5">
                ร้องขอเมื่อ:{' '}
                {new Date(latestVisit.requestedAt).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {latestVisit.surveyorName && (
                <div className="text-[11px] text-foreground/80 mt-1 ml-5 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-purple-500" />
                  <span>ช่างผู้รับผิดชอบ: {latestVisit.surveyorName}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center sm:items-end">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">
                การอนุมัติเดินทาง (Travel Approval)
              </span>
              <div>
                {isApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> อนุมัติการเดินทางแล้ว (Approved)
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" /> ไม่อนุมัติ (Rejected)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" /> รออนุมัติการเดินทาง (Pending)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3 Detail Blocks: Check-in, Work Summary & Road Clearance, Check-out */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* 1. Field Check-in (Site On) */}
            <div className="border border-border rounded-xl p-3.5 bg-card/60">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  1. Check-in (Site On)
                </span>
                {latestVisit.checkinAt ? (
                  <span className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold px-2 py-0.5 rounded-full border border-teal-500/20">
                    ถึงไซต์แล้ว
                  </span>
                ) : (
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                    รอลงพื้นที่
                  </span>
                )}
              </div>

              {latestVisit.checkinAt ? (
                <div className="space-y-1.5 text-muted-foreground">
                  <div className="text-[11px]">
                    <span className="font-medium text-foreground">เวลา: </span>
                    {new Date(latestVisit.checkinAt).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    น.
                  </div>
                  <div className="text-[11px] font-mono bg-muted/60 p-1.5 rounded-md border border-border text-foreground">
                    GPS: {latestVisit.checkinLat?.toFixed(5)}, {latestVisit.checkinLng?.toFixed(5)}
                  </div>
                  <div className="text-[10px] flex items-center gap-1">
                    {latestVisit.checkinDistanceM !== null && latestVisit.checkinDistanceM <= 100 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> ในรัศมี ({latestVisit.checkinDistanceM} ม.)
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" />{' '}
                        {latestVisit.checkinDistanceM !== null
                          ? `ห่าง ${latestVisit.checkinDistanceM} ม.`
                          : 'พิกัดได้รับการยืนยัน'}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-2">
                  ยังไม่มีการเช็คอินด้วยพิกัด GPS จากแอปหน้างาน
                </p>
              )}
            </div>

            {/* 2. Work Summary & Truck Road Clearance */}
            <div className="border border-border rounded-xl p-3.5 bg-card/60">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                  2. สรุปหน้างาน & ทางรถ
                </span>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
                  {detectedClearance}
                </span>
              </div>

              <div className="space-y-2">
                {/* Truck clearance badges */}
                <div className="flex flex-wrap gap-1">
                  {['4W', '6W', '10W', '22W'].map((t) => {
                    const isSupported =
                      detectedClearance === '22W' ||
                      (detectedClearance === '10W' && t !== '22W') ||
                      (detectedClearance === '6W' && (t === '4W' || t === '6W')) ||
                      (detectedClearance === '4W' && t === '4W')

                    return (
                      <span
                        key={t}
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                          isSupported
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground/60 line-through border border-border/50'
                        }`}
                      >
                        {t}
                      </span>
                    )
                  })}
                </div>

                <div className="text-[11px] text-foreground/80 line-clamp-3">
                  {latestVisit.workSummary ||
                    latestVisit.scope?.notes ||
                    'ต้องการเทคอนกรีตฐานราก และตรวจสอบสภาพถนนทางเข้าสำหรับรถสิบล้อ'}
                </div>
              </div>
            </div>

            {/* 3. Field Check-out & Signature */}
            <div className="border border-border rounded-xl p-3.5 bg-card/60">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                  3. Check-out & ลายเซ็น
                </span>
                {latestVisit.checkoutAt ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    เสร็จสิ้น
                  </span>
                ) : (
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                    รอปิดงาน
                  </span>
                )}
              </div>

              {latestVisit.checkoutAt ? (
                <div className="space-y-1.5 text-muted-foreground">
                  <div className="text-[11px]">
                    <span className="font-medium text-foreground">เวลา: </span>
                    {new Date(latestVisit.checkoutAt).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    น.
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>ลูกค้าลงลายเซ็นตรวจรับหน้างานแล้ว (Sign-on-Glass)</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-2">
                  รอช่างหรือ AE สรุปข้อมูลและให้ลูกค้าลงลายเซ็นก่อนเช็คเอาท์
                </p>
              )}
            </div>
          </div>

          {/* Field App Link & External Maps link */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {latestVisit.checkinLat && latestVisit.checkinLng ? (
              <a
                href={`https://www.google.com/maps?q=${latestVisit.checkinLat},${latestVisit.checkinLng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                <Navigation className="w-3 h-3" />
                <span>เปิดพิกัดแผนที่ (Google Maps)</span>
              </a>
            ) : <span />}

            {latestVisit?.job?.id && (
              <Link
                href={`/visit/jobs/${latestVisit.job.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
              >
                <span>เปิดดูรายละเอียดเต็มใน Field App</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
