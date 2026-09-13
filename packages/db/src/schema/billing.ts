import {
  pgTable, uuid, varchar, text, timestamp, boolean,
  integer, bigint, date
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { customers } from './customers'
import { orders } from './ordering'
import { teams } from './visit'
import { products } from './products'

// ─── Customer Credit Terms ────────────────────────────────────────────────────
export const customerCredit = pgTable('customer_credit', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  creditLimitSatang: bigint('credit_limit_satang', { mode: 'number' }).notNull().default(0),
  termsDays: integer('terms_days').notNull().default(0),
  onHold: boolean('on_hold').notNull().default(false),
  onHoldReason: text('on_hold_reason'),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// ─── Credit Check Records ─────────────────────────────────────────────────────
export const creditChecks = pgTable('credit_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  creditLimitSatang: bigint('credit_limit_satang', { mode: 'number' }).notNull().default(0),
  outstandingSatang: bigint('outstanding_satang', { mode: 'number' }).notNull().default(0),
  overdueAmountSatang: bigint('overdue_amount_satang', { mode: 'number' }).notNull().default(0),
  availableSatang: bigint('available_satang', { mode: 'number' }).notNull().default(0),
  orderTotalSatang: bigint('order_total_satang', { mode: 'number' }).notNull().default(0),
  decision: varchar('decision', { length: 10 }).notNull(),
  // 'pass' | 'hold' | 'reject'
  reason: text('reason').notNull(),
  decidedBy: uuid('decided_by').references(() => users.id),
  auto: boolean('auto').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  number: varchar('number', { length: 30 }).unique(),
  issueDate: date('issue_date', { mode: 'date' }).notNull(),
  dueDate: date('due_date', { mode: 'date' }).notNull(),
  amountSatang: bigint('amount_satang', { mode: 'number' }).notNull(),
  paidSatang: bigint('paid_satang', { mode: 'number' }).notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  // 'open' | 'partial' | 'paid' | 'overdue' | 'void'
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  method: varchar('method', { length: 20 }).notNull(),
  // 'cash' | 'transfer' | 'credit' | 'card' | 'cod'
  amountSatang: bigint('amount_satang', { mode: 'number' }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // 'pending' | 'verifying' | 'confirmed' | 'rejected' | 'refunded'
  slipPath: text('slip_path'),
  refNo: varchar('ref_no', { length: 100 }),
  note: text('note'),
  recordedBy: uuid('recorded_by').references(() => users.id),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  rejectReason: text('reject_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  teamId: uuid('team_id').references(() => teams.id),
  driverId: uuid('driver_id').references(() => users.id),
  vehicle: varchar('vehicle', { length: 100 }),
  trackingNo: varchar('tracking_no', { length: 100 }),
  scheduledDate: date('scheduled_date', { mode: 'date' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // 'pending' | 'scheduled' | 'picking' | 'shipped' | 'delivered' | 'failed' | 'returned'
  attempt: integer('attempt').notNull().default(0),
  driverNote: text('driver_note'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  podPath: text('pod_path'),
  receiverName: varchar('receiver_name', { length: 200 }),
  customerSignaturePath: text('customer_signature_path'),
  failReason: text('fail_reason'),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// ─── Delivery Items ───────────────────────────────────────────────────────────
export const deliveryItems = pgTable('delivery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: uuid('delivery_id').notNull().references(() => deliveries.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  description: varchar('description', { length: 500 }).notNull(),
  qtyOrdered: integer('qty_ordered').notNull().default(0),
  qtyDelivered: integer('qty_delivered').notNull().default(0),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
