import {
  pgTable, uuid, varchar, text, timestamp, boolean,
  integer, bigint, jsonb, serial
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { customers } from './customers'
import { jobs } from './visit'
import { leads } from './crm'
import { products } from './products'

// quotations
export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 30 }).unique(),  // QT-YYYYMM-NNNN, set by DB function
  customerId: uuid('customer_id').references(() => customers.id),
  jobId: uuid('job_id').references(() => jobs.id),
  leadId: uuid('lead_id').references(() => leads.id),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  // 'draft'|'sent'|'viewed'|'accepted'|'rejected'|'expired'|'converted'
  validUntil: timestamp('valid_until', { withTimezone: true }),
  // Financial (all in satang, integer)
  subtotalSatang: bigint('subtotal_satang', { mode: 'number' }).notNull().default(0),
  billDiscountSatang: bigint('bill_discount_satang', { mode: 'number' }).notNull().default(0),
  vatRate: integer('vat_rate').notNull().default(7),         // 0 or 7
  vatMode: varchar('vat_mode', { length: 12 }).notNull().default('exclusive'), // 'exclusive'|'inclusive'
  vatAmountSatang: bigint('vat_amount_satang', { mode: 'number' }).notNull().default(0),
  totalSatang: bigint('total_satang', { mode: 'number' }).notNull().default(0),
  // Content
  terms: text('terms'),
  note: text('note'),
  // Versioning
  version: integer('version').notNull().default(1),
  supersedesId: uuid('supersedes_id'),  // self-reference (set manually after insert)
  // Public access
  publicToken: uuid('public_token').defaultRandom(),
  // Timestamps
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  viewedAt: timestamp('viewed_at', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  rejectReason: text('reject_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// quotation_items
export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').notNull().references(() => quotations.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  description: varchar('description', { length: 500 }).notNull(),
  qty: integer('qty').notNull().default(1),
  unit: varchar('unit', { length: 30 }).default('ชิ้น'),
  unitPriceSatang: bigint('unit_price_satang', { mode: 'number' }).notNull().default(0),
  discountSatang: bigint('discount_satang', { mode: 'number' }).notNull().default(0),
  amountSatang: bigint('amount_satang', { mode: 'number' }).notNull().default(0), // qty*price - discount
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// quotation_events
export const quotationEvents = pgTable('quotation_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').notNull().references(() => quotations.id),
  kind: varchar('kind', { length: 20 }).notNull(), // 'sent'|'viewed'|'accepted'|'rejected'
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
})

// orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 30 }).unique(), // SO-YYYYMM-NNNN
  quotationId: uuid('quotation_id').references(() => quotations.id),
  customerId: uuid('customer_id').references(() => customers.id),
  status: varchar('status', { length: 20 }).notNull().default('new'),
  // 'new'|'credit_hold'|'awaiting_payment'|'paid'|'ready'|'delivering'|'delivered'|'closed'|'cancelled'
  totalSatang: bigint('total_satang', { mode: 'number' }).notNull().default(0),
  creditCheckResult: varchar('credit_check_result', { length: 20 }), // 'pass'|'soft_warn'|'hard_block'
  creditUsedPct: integer('credit_used_pct'),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// portal_otp_codes — OTP for customer QT acceptance
export const portalOtpCodes = pgTable('portal_otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').notNull().references(() => quotations.id),
  phone: varchar('phone', { length: 20 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
