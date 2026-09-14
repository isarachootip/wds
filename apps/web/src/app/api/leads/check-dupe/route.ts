import { NextRequest, NextResponse } from 'next/server'
import { eq, and, isNull, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { leads, customers } from '@wds/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelRef = searchParams.get('channelRef')?.trim() || ''
    const phone = searchParams.get('phone')?.trim() || ''

    if (!channelRef && !phone) {
      return NextResponse.json({ dupes: [], customers: [] })
    }

    const db = getDb()

    // 1. Search existing customers by phone or channelRef
    const matchedCustomers: Array<{ id: string; name: string; phone: string | null; code: string | null }> = []
    if (phone || channelRef) {
      const customerConditions = [isNull(customers.deletedAt)]
      const filterOrs = []
      if (phone) filterOrs.push(eq(customers.phone, phone))
      if (channelRef && (channelRef.startsWith('0') || channelRef.startsWith('+66'))) {
        filterOrs.push(eq(customers.phone, channelRef))
      }
      if (filterOrs.length > 0) {
        customerConditions.push(or(...filterOrs)!)
        const found = await db
          .select({
            id: customers.id,
            name: customers.name,
            phone: customers.phone,
            code: customers.code,
          })
          .from(customers)
          .where(and(...customerConditions))
          .limit(5)
        matchedCustomers.push(...found)
      }
    }

    // 2. Search existing leads by channelRef or matched customer IDs
    const matchedLeads: Array<{
      leadId: string
      status: string
      source: string
      customerId: string | null
      customerName: string | null
    }> = []

    const leadConditions = [isNull(leads.deletedAt)]
    const leadOrs = []
    if (channelRef) {
      leadOrs.push(eq(leads.channelRef, channelRef))
    }
    if (matchedCustomers.length > 0) {
      for (const mc of matchedCustomers) {
        leadOrs.push(eq(leads.customerId, mc.id))
      }
    }

    if (leadOrs.length > 0) {
      leadConditions.push(or(...leadOrs)!)
      const foundLeads = await db
        .select({
          leadId: leads.id,
          status: leads.status,
          source: leads.source,
          customerId: leads.customerId,
          customerName: customers.name,
        })
        .from(leads)
        .leftJoin(customers, eq(leads.customerId, customers.id))
        .where(and(...leadConditions))
        .limit(10)
      matchedLeads.push(...foundLeads)
    }

    return NextResponse.json({
      dupes: matchedLeads,
      customers: matchedCustomers,
    })
  } catch (error) {
    console.error('Error in check-dupe route:', error)
    return NextResponse.json({ dupes: [], customers: [], error: 'Failed to check deduplication' }, { status: 500 })
  }
}
