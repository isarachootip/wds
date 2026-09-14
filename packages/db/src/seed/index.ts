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

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role varchar(30) DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
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

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_visit_id uuid REFERENCES site_visits(id),
  customer_id uuid REFERENCES customers(id),
  address_id uuid REFERENCES addresses(id),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  team_id uuid REFERENCES teams(id),
  status varchar(20) NOT NULL DEFAULT 'requested',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id),
  status varchar(20) NOT NULL DEFAULT 'pending',
  checkin_at timestamptz,
  checkin_lat double precision,
  checkin_lng double precision,
  checkin_distance_m integer,
  checkin_reason text,
  flagged boolean DEFAULT false,
  checkout_at timestamptz,
  checkout_lat double precision,
  checkout_lng double precision,
  work_summary text,
  customer_signature_path text,
  next_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number varchar(30) UNIQUE,
  customer_id uuid REFERENCES customers(id),
  job_id uuid REFERENCES jobs(id),
  lead_id uuid REFERENCES leads(id),
  status varchar(20) NOT NULL DEFAULT 'draft',
  valid_until timestamptz,
  subtotal_satang bigint NOT NULL DEFAULT 0,
  bill_discount_satang bigint NOT NULL DEFAULT 0,
  vat_rate integer NOT NULL DEFAULT 7,
  vat_mode varchar(12) NOT NULL DEFAULT 'exclusive',
  vat_amount_satang bigint NOT NULL DEFAULT 0,
  total_satang bigint NOT NULL DEFAULT 0,
  terms text,
  note text,
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid,
  public_token uuid DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  sent_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description varchar(500) NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  unit varchar(30) DEFAULT 'ชิ้น',
  unit_price_satang bigint NOT NULL DEFAULT 0,
  discount_satang bigint DEFAULT 0,
  amount_satang bigint NOT NULL DEFAULT 0,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number varchar(30) UNIQUE,
  quotation_id uuid REFERENCES quotations(id),
  customer_id uuid REFERENCES customers(id),
  status varchar(20) NOT NULL DEFAULT 'new',
  total_satang bigint NOT NULL DEFAULT 0,
  credit_check_result varchar(20),
  credit_used_pct integer,
  note text,
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS customer_credit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  credit_limit_satang bigint NOT NULL DEFAULT 0,
  terms_days integer NOT NULL DEFAULT 0,
  on_hold boolean NOT NULL DEFAULT false,
  on_hold_reason text,
  note text,
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS credit_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  credit_limit_satang bigint NOT NULL DEFAULT 0,
  outstanding_satang bigint NOT NULL DEFAULT 0,
  overdue_amount_satang bigint NOT NULL DEFAULT 0,
  available_satang bigint NOT NULL DEFAULT 0,
  order_total_satang bigint NOT NULL DEFAULT 0,
  decision varchar(10) NOT NULL,
  reason text NOT NULL,
  decided_by uuid REFERENCES users(id),
  auto boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  number varchar(30) UNIQUE,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  amount_satang bigint NOT NULL,
  paid_satang bigint NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  invoice_id uuid REFERENCES invoices(id),
  method varchar(20) NOT NULL,
  amount_satang bigint NOT NULL,
  paid_at timestamptz,
  status varchar(20) NOT NULL DEFAULT 'pending',
  slip_path text,
  ref_no varchar(100),
  note text,
  recorded_by uuid REFERENCES users(id),
  verified_by uuid REFERENCES users(id),
  verified_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  team_id uuid REFERENCES teams(id),
  driver_id uuid REFERENCES users(id),
  vehicle varchar(100),
  tracking_no varchar(100),
  scheduled_date date,
  status varchar(20) NOT NULL DEFAULT 'pending',
  attempt integer NOT NULL DEFAULT 0,
  driver_note text,
  delivered_at timestamptz,
  pod_path text,
  receiver_name varchar(200),
  customer_signature_path text,
  fail_reason text,
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS delivery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description varchar(500) NOT NULL,
  qty_ordered integer NOT NULL DEFAULT 0,
  qty_delivered integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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

-- Schema Migrations / Column Alignments
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS job_id uuid;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS subtotal_satang bigint DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS bill_discount_satang bigint DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vat_rate integer DEFAULT 7;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vat_mode varchar(12) DEFAULT 'exclusive';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vat_amount_satang bigint DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS total_satang bigint DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS supersedes_id uuid;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS public_token uuid DEFAULT gen_random_uuid();
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS reject_reason text;

ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS qty integer DEFAULT 1;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS unit varchar(30) DEFAULT 'ชิ้น';
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS unit_price_satang bigint DEFAULT 0;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS discount_satang bigint DEFAULT 0;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS amount_satang bigint DEFAULT 0;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS sort integer DEFAULT 0;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_check_result varchar(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_used_pct integer;

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS driver_id uuid;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS vehicle varchar(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS tracking_no varchar(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS attempt integer DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS driver_note text;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS pod_path text;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS receiver_name varchar(200);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS customer_signature_path text;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS fail_reason text;
`

export async function runSeed(dbUrl: string) {
  console.log('Ensuring tables exist...')
  const needsSsl =
    dbUrl.includes('sslmode=require') ||
    dbUrl.includes('neon.tech') ||
    dbUrl.includes('supabase.co')
  const rawClient = postgres(dbUrl, {
    ssl: needsSsl ? 'require' : false,
    max: 1,
    connect_timeout: 30,
  })
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
