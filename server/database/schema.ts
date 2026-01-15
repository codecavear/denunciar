import { pgTable, uuid, text, timestamp, boolean, decimal, pgEnum, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const issueStatusEnum = pgEnum('issue_status', ['pending', 'in_progress', 'resolved', 'closed'])
export const issueCategoryEnum = pgEnum('issue_category', ['pothole', 'trash', 'lighting', 'security', 'trees', 'water', 'infrastructure', 'other'])
export const moderationStatusEnum = pgEnum('moderation_status', ['pending', 'approved', 'rejected'])
export const resolutionStatusEnum = pgEnum('resolution_status', ['pending', 'accepted', 'rejected'])

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
  category: issueCategoryEnum('category').default('other').notNull(),
  moderationStatus: moderationStatusEnum('moderation_status').default('approved').notNull(),
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

// Resolutions table (Proposals to fix an issue)
export const resolutions = pgTable('resolutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  issueId: uuid('issue_id').references(() => issues.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: text('image_url').notNull(),
  status: resolutionStatusEnum('status').default('pending').notNull(),
  reasoning: text('reasoning'),
  votesFor: decimal('votes_for').default('0').notNull(), // Using decimal/int pattern or just integer? Schema uses decimal for numbers usually but counts generally fit in integer. Postgres has integer. Let's use integer for counts.
  votesAgainst: decimal('votes_against').default('0').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(), // JSONB emulation/typing if jsonb not imported or just use jsonb type
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export type Resolution = typeof resolutions.$inferSelect
export type NewResolution = typeof resolutions.$inferInsert

// User Stats table (Gamification)
export const userStats = pgTable('user_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  reputationScore: decimal('reputation_score').default('0').notNull(),
  reportsCreated: decimal('reports_created').default('0').notNull(),
  reportsVerified: decimal('reports_verified').default('0').notNull(),
  categoryScores: jsonb('category_scores').$type<Record<string, number>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export type UserStat = typeof userStats.$inferSelect
export type NewUserStat = typeof userStats.$inferInsert

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  issues: many(issues),
  confirmations: many(issueConfirmations),
  resolutions: many(resolutions),
  stats: one(userStats)
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
  confirmations: many(issueConfirmations),
  resolutions: many(resolutions)
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

export const resolutionsRelations = relations(resolutions, ({ one }) => ({
  issue: one(issues, {
    fields: [resolutions.issueId],
    references: [issues.id]
  }),
  user: one(users, {
    fields: [resolutions.userId],
    references: [users.id]
  })
}))

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id]
  })
}))
