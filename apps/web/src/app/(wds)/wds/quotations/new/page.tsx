import { unstable_noStore as noStore } from 'next/cache'
import { QuotationEditor } from './QuotationEditor'

async function fetchJobItems(jobId: string) {
  try {
    const { getDb } = await import('@/lib/db')
    const { jobItems } = await import('@wds/db')
    const { eq, and, isNull } = await import('drizzle-orm')
    const db = getDb()
    return await db.select().from(jobItems)
      .where(and(eq(jobItems.jobId, jobId), isNull(jobItems.deletedAt)))
  } catch {
    return []
  }
}

async function fetchCustomers() {
  try {
    const { getDb } = await import('@/lib/db')
    const { customers } = await import('@wds/db')
    const { isNull } = await import('drizzle-orm')
    const db = getDb()
    return await db.select({ id: customers.id, name: customers.name, phone: customers.phone })
      .from(customers).where(isNull(customers.deletedAt))
  } catch {
    return []
  }
}

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  noStore()
  const params = await searchParams
  const jobId = params.jobId

  const [jobItems, customerList] = await Promise.all([
    jobId ? fetchJobItems(jobId) : Promise.resolve([]),
    fetchCustomers(),
  ])

  const initialItems = jobItems.map((item, i) => ({
    id: item.id,
    description: item.description,
    qty: item.qty,
    unit: item.unit ?? 'ชิ้น',
    unitPriceSatang: item.unitPriceSatang,
    discountSatang: 0,
    amountSatang: item.qty * item.unitPriceSatang,
    sort: i,
  }))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        {jobId ? 'สร้างใบเสนอราคาจากงาน' : 'สร้างใบเสนอราคา'}
      </h1>
      <QuotationEditor
        initialItems={initialItems}
        customers={customerList}
        jobId={jobId}
      />
    </div>
  )
}
