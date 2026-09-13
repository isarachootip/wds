import { unstable_noStore as noStore } from 'next/cache'
import { KanbanBoard } from './KanbanBoard'

export type LeadCard = {
  id: string
  status: string
  source: string
  customerName: string | null
  createdAt: Date
  updatedAt: Date
  score: number | null
}

export default async function PipelinePage() {
  noStore()

  let leads: LeadCard[] = []
  try {
    const { getPipelineLeads } = await import('@/modules/crm/queries')
    leads = await getPipelineLeads() as LeadCard[]
  } catch {
    // DB not connected during build — show empty state
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">ลาก Lead ข้ามคอลัมน์เพื่อเปลี่ยนสถานะ</p>
      </div>
      <KanbanBoard initialLeads={leads} />
    </div>
  )
}