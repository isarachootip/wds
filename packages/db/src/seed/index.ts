import postgres from 'postgres'
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

const DDL_STATEMENTS = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name varchar(255),
  avatar_url text,
  org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(50) NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(20) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  tax_id varchar(13),
  phone varchar(20),
  email varchar(255),
  credit_limit_satang bigint DEFAULT 0,
  credit_used_satang bigint DEFAULT 0,
  customer_group varchar(50) DEFAULT 'standard',
  status varchar(50) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label varchar(100),
  address_line1 text NOT NULL,
  address_line2 text,
  sub_district varchar(100),
  district varchar(100),
  province varchar(100),
  postal_code varchar(10),
  lat double precision,
  lng double precision,
  is_site boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku varchar(50) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  name_en varchar(255),
  description text,
  unit varchar(50) NOT NULL,
  base_price_satang bigint NOT NULL,
  category varchar(100),
  brand varchar(100),
  status varchar(50) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_group varchar(50) NOT NULL,
  price_satang bigint NOT NULL,
  min_qty integer DEFAULT 1,
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  source varchar(20) NOT NULL,
  channel_ref varchar(255),
  status varchar(30) NOT NULL DEFAULT 'new',
  owner_id uuid REFERENCES users(id),
  interest jsonb,
  budget_range_min_satang bigint,
  budget_range_max_satang bigint,
  lost_reason varchar(100),
  score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type varchar(20) NOT NULL,
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  assignee_id uuid REFERENCES users(id),
  channel varchar(20),
  status varchar(20) NOT NULL DEFAULT 'open',
  note text,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  customer_id uuid REFERENCES customers(id),
  address_id uuid REFERENCES addresses(id),
  requested_by uuid REFERENCES users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  purpose text,
  status varchar(20) NOT NULL DEFAULT 'requested',
  scope jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number varchar(50) NOT NULL UNIQUE,
  lead_id uuid REFERENCES leads(id),
  customer_id uuid REFERENCES customers(id),
  status varchar(30) NOT NULL DEFAULT 'draft',
  subtotal_satang bigint NOT NULL DEFAULT 0,
  discount_satang bigint NOT NULL DEFAULT 0,
  vat_satang bigint NOT NULL DEFAULT 0,
  total_satang bigint NOT NULL DEFAULT 0,
  valid_until date,
  payment_term_days integer DEFAULT 30,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description varchar(255) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_satang bigint NOT NULL,
  discount_satang bigint DEFAULT 0,
  total_satang bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number varchar(50) NOT NULL UNIQUE,
  quotation_id uuid REFERENCES quotations(id),
  customer_id uuid REFERENCES customers(id),
  status varchar(30) NOT NULL DEFAULT 'pending',
  subtotal_satang bigint NOT NULL DEFAULT 0,
  vat_satang bigint NOT NULL DEFAULT 0,
  total_satang bigint NOT NULL DEFAULT 0,
  payment_status varchar(30) DEFAULT 'unpaid',
  delivery_status varchar(30) DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number varchar(50) NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES orders(id),
  status varchar(30) NOT NULL DEFAULT 'scheduled',
  scheduled_date date,
  delivered_at timestamptz,
  recipient_name varchar(255),
  recipient_phone varchar(20),
  tracking_number varchar(100),
  carrier varchar(100),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity varchar(100) NOT NULL,
  entity_id uuid NOT NULL,
  action varchar(50) NOT NULL,
  from_status varchar(50),
  to_status varchar(50),
  payload jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  aggregate varchar(100) NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  status varchar(20) NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  kind varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  deleted_at timestamptz
);
`

export async function runSeed(dbUrl: string) {
  console.log('Ensuring tables exist...')
  const rawClient = postgres(dbUrl)
  try {
    await rawClient.unsafe(DDL_STATEMENTS)
  } finally {
    await rawClient.end()
  }

  const db = createDb(dbUrl)

  console.log('Seeding 20 customers...')
  const insertedCustomers = await db
    .insert(customers)
    .values(seedCustomers)
    .onConflictDoNothing()
    .returning()

  const allCustomers = await db.select().from(customers)
  const customerMap = new Map<string, typeof allCustomers[0]>()
  for (const c of allCustomers) {
    if (c.code) customerMap.set(c.code, c)
  }

  console.log('Seeding addresses...')
  const addressRecords = seedAddresses
    .map((addr) => {
      const customer = customerMap.get(addr.customerCode)
      if (!customer) return null
      const { customerCode, ...addressData } = addr
      return {
        ...addressData,
        customerId: customer.id,
      }
    })
    .filter(Boolean) as any[]

  if (addressRecords.length > 0) {
    await db.insert(addresses).values(addressRecords).onConflictDoNothing()
  }

  console.log('Seeding products...')
  await db
    .insert(products)
    .values(seedProducts)
    .onConflictDoNothing()
  const allProducts = await db.select().from(products)

  console.log('Seeding 20 CRM leads across process stages...')
  const leadsToInsert = seedLeads.map((l) => {
    const customer = customerMap.get(l.customerCode)
    const { customerCode, ...leadData } = l
    return {
      ...leadData,
      customerId: customer?.id,
    }
  })
  await db.insert(leads).values(leadsToInsert).onConflictDoNothing()
  const allLeads = await db.select().from(leads)
  const leadByCustomerId = new Map<string, typeof allLeads[0]>()
  for (const l of allLeads) {
    if (l.customerId) leadByCustomerId.set(l.customerId, l)
  }

  console.log('Seeding follow-ups...')
  const followUpsToInsert = seedFollowUps
    .map((f) => {
      const customer = customerMap.get(f.customerCode)
      if (!customer) return null
      const lead = leadByCustomerId.get(customer.id)
      if (!lead) return null
      const { customerCode, ...fData } = f
      return {
        ...fData,
        leadId: lead.id,
      }
    })
    .filter(Boolean) as any[]

  if (followUpsToInsert.length > 0) {
    await db.insert(followUps).values(followUpsToInsert).onConflictDoNothing()
  }

  console.log('Seeding site visits...')
  const siteVisitsToInsert = seedSiteVisits
    .map((sv) => {
      const customer = customerMap.get(sv.customerCode)
      if (!customer) return null
      const lead = leadByCustomerId.get(customer.id)
      const { customerCode, ...svData } = sv
      return {
        ...svData,
        customerId: customer.id,
        leadId: lead?.id,
      }
    })
    .filter(Boolean) as any[]

  if (siteVisitsToInsert.length > 0) {
    await db.insert(siteVisits).values(siteVisitsToInsert).onConflictDoNothing()
  }

  console.log('Seeding quotations & line items...')
  for (const q of seedQuotations) {
    const customer = customerMap.get(q.customerCode)
    const lead = customer ? leadByCustomerId.get(customer.id) : undefined
    const { customerCode, items, ...qData } = q

    const [insertedQ] = await db
      .insert(quotations)
      .values({
        ...qData,
        customerId: customer?.id,
        leadId: lead?.id,
      })
      .onConflictDoNothing()
      .returning()

    const qRecord = insertedQ || (await db.query?.quotations?.findFirst?.({ where: (qTable, { eq }) => eq(qTable.number, qData.number) }))

    if (qRecord && items && items.length > 0 && allProducts.length > 0) {
      const qItems = items.map((item, itemIdx) => ({
        ...item,
        quotationId: qRecord.id,
        productId: allProducts[itemIdx % allProducts.length]?.id,
      }))
      await db.insert(quotationItems).values(qItems).onConflictDoNothing()
    }
  }

  console.log('Seeding orders & deliveries...')
  const allQuotations = await db.select().from(quotations)
  const quotationByNumber = new Map<string, typeof allQuotations[0]>()
  for (const q of allQuotations) {
    if (q.number) quotationByNumber.set(q.number, q)
  }

  const orderMap = new Map<string, any>()
  for (const ord of seedOrders) {
    const customer = customerMap.get(ord.customerCode)
    const quote = quotationByNumber.get(ord.quotationNumber)
    const { customerCode, quotationNumber, ...ordData } = ord

    const [insertedOrder] = await db
      .insert(orders)
      .values({
        ...ordData,
        customerId: customer?.id,
        quotationId: quote?.id,
      })
      .onConflictDoNothing()
      .returning()

    if (insertedOrder) {
      orderMap.set(ordData.number, insertedOrder)
    }
  }

  const allOrders = await db.select().from(orders)
  for (const o of allOrders) {
    if (o.number) orderMap.set(o.number, o)
  }

  console.log('Seeding delivery records...')
  for (const del of seedDeliveries) {
    const order = orderMap.get(del.orderNumber)
    if (!order) continue
    const { customerCode, orderNumber, ...delData } = del

    await db
      .insert(deliveries)
      .values({
        ...delData,
        orderId: order.id,
      })
      .onConflictDoNothing()
  }

  console.log('✅ WDS Comprehensive 20-Customer Sampling Seed completed successfully!')
}
