import { eq, and } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { issueConfirmations, issues } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const issueId = getRouterParam(event, 'id')
  if (!issueId) {
    throw createError({ statusCode: 400, message: 'Issue ID is required' })
  }

  const db = getDb()

  // Check if issue exists
  const [issue] = await db
    .select()
    .from(issues)
    .where(eq(issues.id, issueId))
    .limit(1)

  if (!issue) {
    throw createError({ statusCode: 404, message: 'Issue not found' })
  }

  // Check if user already confirmed
  const existing = await db
    .select()
    .from(issueConfirmations)
    .where(and(
      eq(issueConfirmations.issueId, issueId),
      eq(issueConfirmations.userId, session.user.id)
    ))
    .limit(1)

  if (existing.length > 0) {
    // Remove confirmation (toggle off)
    await db
      .delete(issueConfirmations)
      .where(and(
        eq(issueConfirmations.issueId, issueId),
        eq(issueConfirmations.userId, session.user.id)
      ))

    return { confirmed: false }
  }

  // Add confirmation
  await db.insert(issueConfirmations).values({
    issueId,
    userId: session.user.id
  })

  return { confirmed: true }
})
