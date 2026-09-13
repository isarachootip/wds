import {
  pgTable, uuid, varchar, text, timestamp, jsonb, integer, bigint
} from 'drizzle-orm/pg-core'
import { customers } from './customers'
import { users } from './auth'
import { addresses } from './customers'

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id),
  source: varchar('source', { length: 20 }).notNull(), // 'line'|'phone'|'store'|'other'
  channelRef: varchar('channel_ref', { length: 255 }), // line_user_id / phone / branch_code
  status: varchar('status', { length: 30 }).notNull().default('new'),
  // 'new'|'contacted'|'qualified'|'site_visit_requested'|'quoted'|'won'|'lost'
  ownerId: uuid('owner_id').references(() => users.id),
  interest: jsonb('interest'), // {products: [], description: string}
  budgetRangeMinSatang: bigint('budget_range_min_satang', { mode: 'number' }),
  budgetRangeMaxSatang: bigint('budget_range_max_satang', { mode: 'number' }),
  lostReason: varchar('lost_reason', { length: 100 }),
  score: integer('score').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  type: varchar('type', { length: 20 }).notNull(), // 'call'|'line'|'visit'|'note'|'quote_sent'
  note: text('note'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  userId: uuid('user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const followUps = pgTable('follow_ups', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  channel: varchar('channel', { length: 20 }), // 'phone'|'line'|'email'|'visit'
  status: varchar('status', { length: 20 }).notNull().default('open'), // 'open'|'done'|'skipped'
  note: text('note'),
  doneAt: timestamp('done_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const siteVisits = pgTable('site_visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').references(() => leads.id),
  customerId: uuid('customer_id').references(() => customers.id),
  addressId: uuid('address_id').references(() => addresses.id),
  requestedBy: uuid('requested_by').references(() => users.id),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  purpose: text('purpose'),
  status: varchar('status', { length: 20 }).notNull().default('requested'),
  // 'requested'|'scheduled'|'done'|'cancelled'
  scope: jsonb('scope'), // {areas: [], measurements: [], notes: string}
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
