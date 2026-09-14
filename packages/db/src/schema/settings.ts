import {
  pgTable, varchar, jsonb, text, timestamp, uuid
} from 'drizzle-orm/pg-core'
import { users } from './auth'

export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').$type<Record<string, any>>().notNull().default({}),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
