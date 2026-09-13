import { createDb } from '../index'
import {
  customers,
  addresses,
  products,
  leads,
  followUps,
  siteVisits,
  quotations,
  quotationItems,
  orders,
  deliveries,
} from '../schema'
import { seedCustomers, seedAddresses } from './customers'
import { seedProducts } from './products'
import { seedLeads } from './crm'
import { seedQuotations, seedOrders } from './ordering'
import { seedSiteVisits, seedFollowUps, seedDeliveries } from './operations'

export async function runSeed(dbUrl: string) {
  const db = createDb(dbUrl)

  console.log('Seeding customers...')
  const insertedCustomers = await db
    .insert(customers)
    .values(seedCustomers)
    .onConflictDoNothing()
    .returning()

  const allCustomers = insertedCustomers.length > 0 ? insertedCustomers : await db.select().from(customers)

  console.log('Seeding addresses...')
  const addressRecords = seedAddresses.map((addr) => {
    const customer = allCustomers.find((c) => c.code === addr.customerCode)
    if (!customer) return null
    const { customerCode, ...addressData } = addr
    return {
      ...addressData,
      customerId: customer.id,
    }
  }).filter(Boolean) as any[]

  if (addressRecords.length > 0) {
    await db.insert(addresses).values(addressRecords).onConflictDoNothing()
  }

  console.log('Seeding products...')
  const insertedProducts = await db
    .insert(products)
    .values(seedProducts)
    .onConflictDoNothing()
    .returning()
  const allProducts = insertedProducts.length > 0 ? insertedProducts : await db.select().from(products)

  console.log('Seeding leads...')
  const leadsToInsert = seedLeads.map((l, idx) => ({
    ...l,
    customerId: allCustomers[idx % allCustomers.length]?.id,
  }))
  const insertedLeads = await db.insert(leads).values(leadsToInsert).returning()
  const allLeads = insertedLeads.length > 0 ? insertedLeads : await db.select().from(leads)

  console.log('Seeding follow-ups...')
  if (allLeads.length > 0) {
    const followUpsToInsert = seedFollowUps.map((f, idx) => ({
      ...f,
      leadId: allLeads[idx % allLeads.length].id,
    }))
    await db.insert(followUps).values(followUpsToInsert).onConflictDoNothing()
  }

  console.log('Seeding site visits...')
  if (allLeads.length > 0 && allCustomers.length > 0) {
    const siteVisitsToInsert = seedSiteVisits.map((sv, idx) => ({
      ...sv,
      leadId: allLeads[idx % allLeads.length].id,
      customerId: allCustomers[idx % allCustomers.length].id,
    }))
    await db.insert(siteVisits).values(siteVisitsToInsert).onConflictDoNothing()
  }

  console.log('Seeding quotations & items...')
  for (let i = 0; i < seedQuotations.length; i++) {
    const { items, ...qData } = seedQuotations[i]
    const [insertedQ] = await db
      .insert(quotations)
      .values({
        ...qData,
        customerId: allCustomers[i % allCustomers.length]?.id,
        leadId: allLeads[i % allLeads.length]?.id,
      })
      .onConflictDoNothing()
      .returning()

    if (insertedQ && items && items.length > 0) {
      const qItems = items.map((item, itemIdx) => ({
        ...item,
        quotationId: insertedQ.id,
        productId: allProducts[itemIdx % allProducts.length]?.id,
      }))
      await db.insert(quotationItems).values(qItems).onConflictDoNothing()
    }
  }

  console.log('Seeding orders & deliveries...')
  const allQuotations = await db.select().from(quotations)
  for (let i = 0; i < seedOrders.length; i++) {
    const ordData = seedOrders[i]
    const [insertedOrder] = await db
      .insert(orders)
      .values({
        ...ordData,
        customerId: allCustomers[i % allCustomers.length]?.id,
        quotationId: allQuotations[i % allQuotations.length]?.id,
      })
      .onConflictDoNothing()
      .returning()

    if (insertedOrder && seedDeliveries[i]) {
      await db
        .insert(deliveries)
        .values({
          ...seedDeliveries[i],
          orderId: insertedOrder.id,
        })
        .onConflictDoNothing()
    }
  }

  console.log('WDS Comprehensive Seed complete!')
}
