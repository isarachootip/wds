import { unstable_noStore as noStore } from 'next/cache'
import { getDb } from '@/lib/db'
import { customers as customersTable } from '@wds/db'
import { isNull, desc } from 'drizzle-orm'
import { CustomersHub } from './CustomersHub'

async function fetchCustomers() {
  try {
    const db = getDb()
    const allCustomers = await db
      .select({
        id: customersTable.id,
        code: customersTable.code,
        name: customersTable.name,
        taxId: customersTable.taxId,
        phone: customersTable.phone,
        email: customersTable.email,
        contactPerson: customersTable.contactPerson,
        lineId: customersTable.lineId,
        creditLimitSatang: customersTable.creditLimitSatang,
        creditUsedSatang: customersTable.creditUsedSatang,
        customerGroup: customersTable.customerGroup,
        status: customersTable.status,
        createdAt: customersTable.createdAt,
      })
      .from(customersTable)
      .where(isNull(customersTable.deletedAt))
      .orderBy(desc(customersTable.createdAt))
      .limit(100)

    return allCustomers
  } catch {
    return []
  }
}

export default async function CustomersPage() {
  noStore()

  const customers = await fetchCustomers()

  return (
    <div className="p-6 max-w-[1700px] mx-auto space-y-6">
      <CustomersHub initialCustomers={customers} />
    </div>
  )
}
