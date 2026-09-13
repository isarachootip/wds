import { createDb } from '../index'
import { customers, addresses, products } from '../schema'
import { seedCustomers, seedAddresses } from './customers'
import { seedProducts } from './products'

export async function runSeed(dbUrl: string) {
  const db = createDb(dbUrl)
  
  console.log('Seeding customers...')
  const insertedCustomers = await db.insert(customers).values(seedCustomers).returning()
  
  console.log('Seeding addresses...')
  const addressRecords = seedAddresses.map(addr => {
    const customer = insertedCustomers.find(c => c.code === addr.customerCode)
    if (!customer) throw new Error(`Customer not found for code ${addr.customerCode}`)
    const { customerCode, ...addressData } = addr
    return {
      ...addressData,
      customerId: customer.id
    }
  })
  if (addressRecords.length > 0) {
    await db.insert(addresses).values(addressRecords)
  }

  console.log('Seeding products...')
  await db.insert(products).values(seedProducts)
  
  console.log('Seed complete!')
}
