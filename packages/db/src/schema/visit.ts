import {
  pgTable, uuid, varchar, text, timestamp, boolean, integer, bigint,
  real, jsonb, doublePrecision
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { customers, addresses } from './customers'
import { products } from './products'
import { siteVisits } from './crm'

// teams
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// team_members
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: varchar('role', { length: 30 }).default('member'), // 'lead' | 'member'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// appointments
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteVisitId: uuid('site_visit_id').references(() => siteVisits.id),
  customerId: uuid('customer_id').references(() => customers.id),
  addressId: uuid('address_id').references(() => addresses.id),
  scheduledStart: timestamp('scheduled_start', { withTimezone: true }),
  scheduledEnd: timestamp('scheduled_end', { withTimezone: true }),
  teamId: uuid('team_id').references(() => teams.id),
  status: varchar('status', { length: 20 }).notNull().default('requested'),
  // 'requested'|'scheduled'|'in_progress'|'completed'|'rejected'|'cancelled'|'no_show'
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectReason: text('reject_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// jobs — one job per appointment
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointments.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // 'pending'|'checked_in'|'in_progress'|'checked_out'|'closed'
  // check-in
  checkinAt: timestamp('checkin_at', { withTimezone: true }),
  checkinLat: doublePrecision('checkin_lat'),
  checkinLng: doublePrecision('checkin_lng'),
  checkinDistanceM: integer('checkin_distance_m'),
  checkinReason: text('checkin_reason'), // required if flagged
  flagged: boolean('flagged').default(false),
  // check-out
  checkoutAt: timestamp('checkout_at', { withTimezone: true }),
  checkoutLat: doublePrecision('checkout_lat'),
  checkoutLng: doublePrecision('checkout_lng'),
  // results
  workSummary: text('work_summary'),
  customerSignaturePath: text('customer_signature_path'), // Supabase Storage path
  nextAction: text('next_action'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// job_items — products used / planned / added on-site
export const jobItems = pgTable('job_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  productId: uuid('product_id').references(() => products.id),
  description: varchar('description', { length: 500 }).notNull(),
  qty: integer('qty').notNull().default(1),
  unit: varchar('unit', { length: 30 }).default('ชิ้น'),
  unitPriceSatang: bigint('unit_price_satang', { mode: 'number' }).notNull().default(0),
  source: varchar('source', { length: 20 }).notNull().default('planned'),
  // 'planned'|'added_onsite'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// job_photos
export const jobPhotos = pgTable('job_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  storagePath: text('storage_path').notNull(), // Supabase Storage path
  kind: varchar('kind', { length: 20 }).notNull(), // 'before'|'during'|'after'|'issue'
  caption: varchar('caption', { length: 255 }),
  takenAt: timestamp('taken_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// job_checklists
export const jobChecklists = pgTable('job_checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  templateKey: varchar('template_key', { length: 100 }).notNull().default('standard'),
  item: varchar('item', { length: 500 }).notNull(),
  checked: boolean('checked').notNull().default(false),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
