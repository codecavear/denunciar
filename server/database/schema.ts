import { pgTable, uuid, text, timestamp, boolean, decimal, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const issueStatusEnum = pgEnum('issue_status', ['pending', 'in_progress', 'resolved', 'closed'])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleId: text('google_id').unique().notNull(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// Entities (Government Departments) table
export const entities = pgTable('entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  keywords: text('keywords').array(),
  icon: text('icon').default('i-lucide-alert-circle'),
  contactEmail: text('contact_email'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export type Entity = typeof entities.$inferSelect
export type NewEntity = typeof entities.$inferInsert

// Issues table
export const issues = pgTable('issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  entityId: uuid('entity_id').references(() => entities.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  address: text('address'),
  status: issueStatusEnum('status').default('pending').notNull(),
  aiConfidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export type Issue = typeof issues.$inferSelect
export type NewIssue = typeof issues.$inferInsert

// Issue Confirmations table (users confirming they see the same issue)
export const issueConfirmations = pgTable('issue_confirmations', {
  id: uuid('id').primaryKey().defaultRandom(),
  issueId: uuid('issue_id').references(() => issues.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export type IssueConfirmation = typeof issueConfirmations.$inferSelect
export type NewIssueConfirmation = typeof issueConfirmations.$inferInsert

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  issues: many(issues),
  confirmations: many(issueConfirmations)
}))

export const entitiesRelations = relations(entities, ({ many }) => ({
  issues: many(issues)
}))

export const issuesRelations = relations(issues, ({ one, many }) => ({
  user: one(users, {
    fields: [issues.userId],
    references: [users.id]
  }),
  entity: one(entities, {
    fields: [issues.entityId],
    references: [entities.id]
  }),
  confirmations: many(issueConfirmations)
}))

export const issueConfirmationsRelations = relations(issueConfirmations, ({ one }) => ({
  issue: one(issues, {
    fields: [issueConfirmations.issueId],
    references: [issues.id]
  }),
  user: one(users, {
    fields: [issueConfirmations.userId],
    references: [users.id]
  })
}))
