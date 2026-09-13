'use client'

import { useState } from 'react'
import { CheckInButton } from './CheckInButton'
import { WorkMode } from './WorkMode'
import { CheckOutSection } from './CheckOutSection'
import { OfflineStatus } from '@/components/OfflineStatus'

type Job = {
  id: string
  status: string
  checkinAt: Date | null
  checkinDistanceM: number | null
  flagged: boolean | null
  workSummary: string | null
  customerName: string | null
  customerPhone: string | null
  addressLine1: string | null
  addressLat: number | null
  addressLng: number | null
  purpose: string | null
  scope: unknown
}

type Props = {
  initialData: {
    job: Job
    items: any[]
    photos: any[]
    checklists: any[]
  }
  jobId: string
}

export function JobDetail({ initialData, jobId }: Props) {
  const [jobStatus, setJobStatus] = useState(initialData.job.status)
  const [items, setItems] = useState(initialData.items)
  const [photos, setPhotos] = useState(initialData.photos)
  const [checklists, setChecklists] = useState(initialData.checklists)

  const job = initialData.job

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineStatus />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{job.customerName ?? 'ไม่ระบุ'}</h1>
            {job.customerPhone && (
              <a href={`tel:${job.customerPhone}`} className="text-sm text-blue-600">📞 {job.customerPhone}</a>
            )}
            {job.addressLine1 && (
              <p className="text-sm text-gray-500 mt-1">📍 {job.addressLine1}</p>
            )}
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              jobStatus === 'pending' ? 'bg-gray-100 text-gray-600' :
              jobStatus === 'checked_in' ? 'bg-blue-100 text-blue-700' :
              jobStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-700'
            }`}>
              {jobStatus === 'pending' ? 'รอเริ่ม' :
               jobStatus === 'checked_in' ? 'Check-in แล้ว' :
               jobStatus === 'in_progress' ? 'กำลังทำงาน' :
               jobStatus === 'checked_out' ? 'เสร็จสิ้น' : jobStatus}
            </span>
            {job.flagged && (
              <div className="mt-1 text-xs text-red-600">⚠️ Flagged: นอกพื้นที่</div>
            )}
          </div>
        </div>

        {job.purpose && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">วัตถุประสงค์</p>
            <p className="text-sm text-gray-700">{job.purpose}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Check-in button — shown when pending */}
        {jobStatus === 'pending' && (
          <CheckInButton
            jobId={jobId}
            siteLat={job.addressLat ?? undefined}
            siteLng={job.addressLng ?? undefined}
            onSuccess={() => setJobStatus('checked_in')}
          />
        )}

        {/* Work mode — shown when checked_in or in_progress */}
        {(jobStatus === 'checked_in' || jobStatus === 'in_progress') && (
          <WorkMode
            jobId={jobId}
            initialItems={items}
            initialPhotos={photos}
            initialChecklists={checklists}
            onItemsChange={setItems}
            onPhotosChange={setPhotos}
            onChecklistsChange={setChecklists}
          />
        )}

        {/* Check-out section */}
        {(jobStatus === 'checked_in' || jobStatus === 'in_progress') && (
          <CheckOutSection
            jobId={jobId}
            photos={photos}
            checklists={checklists}
            onSuccess={() => setJobStatus('checked_out')}
          />
        )}

        {/* Completed state */}
        {jobStatus === 'checked_out' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-green-700 font-semibold">Check-out สำเร็จ</p>
            <p className="text-green-600 text-sm mt-1">รายงานถูกส่งแล้ว</p>
          </div>
        )}
      </div>
    </div>
  )
}
