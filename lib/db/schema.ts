import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
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
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }), // Override client rate
  deadline: timestamp('deadline'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Invoices - billing documents sent to clients
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'restrict' }),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, sent, paid, overdue, cancelled
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Invoice Line Items - individual billable items on an invoice
export const invoiceLineItems = pgTable('invoice_line_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  timeEntryId: integer('time_entry_id').references(() => timeEntries.id, {
    onDelete: 'set null',
  }),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Time Entries - actual time tracking records
export const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  invoiceId: integer('invoice_id').references(() => invoices.id, {
    onDelete: 'set null',
  }),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  billable: boolean('billable').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Relations
export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(user, {
    fields: [clients.userId],
    references: [user.id],
  }),
  areas: many(areas),
  invoices: many(invoices),
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

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  lineItems: many(invoiceLineItems),
  timeEntries: many(timeEntries),
}))

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
    timeEntry: one(timeEntries, {
      fields: [invoiceLineItems.timeEntryId],
      references: [timeEntries.id],
    }),
  }),
)

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  invoice: one(invoices, {
    fields: [timeEntries.invoiceId],
    references: [invoices.id],
  }),
}))

// Types
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type Area = typeof areas.$inferSelect
export type NewArea = typeof areas.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert
export type TimeEntry = typeof timeEntries.$inferSelect
export type NewTimeEntry = typeof timeEntries.$inferInsert
