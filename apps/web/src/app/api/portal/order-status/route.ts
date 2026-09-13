import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { quotations, orders, customers } from '@wds/db'
import { eq, isNull, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json(null, { status: 400 })

  try {
    const db = getDb()
    const [qt] = await db.select({ id: quotations.id })
      .from(quotations)
      .where(eq(quotations.publicToken, token as any))
      .limit(1)
    if (!qt) return NextResponse.json(null, { status: 404 })

    const [order] = await db
      .select({
        number: orders.number,
        status: orders.status,
        totalSatang: orders.totalSatang,
        customerName: customers.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(orders.quotationId, qt.id), isNull(orders.deletedAt)))
      .limit(1)

    if (!order) return NextResponse.json(null, { status: 404 })

    return NextResponse.json({
      orderNumber: order.number,
      orderStatus: order.status,
      totalSatang: order.totalSatang,
      customerName: order.customerName,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(null, { status: 500 })
  }
}
