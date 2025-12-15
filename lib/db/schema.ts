import { pgTable, serial, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Areas - broad contexts like "Fractional CTO", "Mentorship", "Solo Product Building"
export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull().default("#6366f1"), // hex color
  expectedHoursPerWeek: integer("expected_hours_per_week").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Projects - specific endeavors within areas
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  areaId: integer("area_id")
    .notNull()
    .references(() => areas.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, completed, on-hold
  expectedHours: integer("expected_hours").notNull().default(0),
  deadline: timestamp("deadline"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Time Entries - actual time tracking records
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Relations
export const areasRelations = relations(areas, ({ many }) => ({
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

// Types
export type Area = typeof areas.$inferSelect
export type NewArea = typeof areas.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type TimeEntry = typeof timeEntries.$inferSelect
export type NewTimeEntry = typeof timeEntries.$inferInsert
