import { relations } from 'drizzle-orm'
import {
  boolean,
  decimal,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { user } from '@/lib/auth/schema'

// Clients - customers/companies you work with
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  notes: text('notes'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Areas - broad contexts like "Fractional CTO", "Mentorship", "Solo Product Building"
export const areas = pgTable('areas', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').references(() => clients.id, {
    onDelete: 'set null',
  }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).notNull().default('#6366f1'), // hex color
  expectedHoursPerWeek: integer('expected_hours_per_week').notNull().default(0),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Projects - specific endeavors within areas
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  areaId: integer('area_id')
    .notNull()
    .references(() => areas.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, completed, on-hold
  expectedHours: integer('expected_hours').notNull().default(0),
  recurring: boolean('recurring').notNull().default(false),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }), // Override client rate
  deadline: timestamp('deadline'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Time Entries - actual time tracking records
export const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  billable: boolean('billable').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// User Settings - user preferences and company information
export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }),
  companyEmail: varchar('company_email', { length: 255 }),
  companyPhone: varchar('company_phone', { length: 50 }),
  companyAddress: text('company_address'),
  dateFormat: varchar('date_format', { length: 20 })
    .notNull()
    .default('MMM d, yyyy'),
  timeFormat: varchar('time_format', { length: 2 }).notNull().default('12'),
  weekStartsOn: varchar('week_starts_on', { length: 1 }).notNull().default('1'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Relations
export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(user, {
    fields: [clients.userId],
    references: [user.id],
  }),
  areas: many(areas),
}))

export const areasRelations = relations(areas, ({ one, many }) => ({
  user: one(user, {
    fields: [areas.userId],
    references: [user.id],
  }),
  client: one(clients, {
    fields: [areas.clientId],
    references: [clients.id],
  }),
  projects: many(projects),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  area: one(areas, {
    fields: [projects.areaId],
    references: [areas.id],
  }),
  timeEntries: many(timeEntries),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
}))

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}))

// Types
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type Area = typeof areas.$inferSelect
export type NewArea = typeof areas.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type TimeEntry = typeof timeEntries.$inferSelect
export type NewTimeEntry = typeof timeEntries.$inferInsert
export type UserSettings = typeof userSettings.$inferSelect
export type NewUserSettings = typeof userSettings.$inferInsert
