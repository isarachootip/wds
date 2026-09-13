import {
  pgTable, uuid, varchar, text, timestamp, bigint, doublePrecision, boolean
} from 'drizzle-orm/pg-core'

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  taxId: varchar('tax_id', { length: 13 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  creditLimitSatang: bigint('credit_limit_satang', { mode: 'number' }).default(0),
  creditUsedSatang: bigint('credit_used_satang', { mode: 'number' }).default(0),
  customerGroup: varchar('customer_group', { length: 50 }).default('standard'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  label: varchar('label', { length: 100 }),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  subDistrict: varchar('sub_district', { length: 100 }),
  district: varchar('district', { length: 100 }),
  province: varchar('province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  isSite: boolean('is_site').default(false),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
