import { eq, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { issues } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Issue ID is required' })
  }

  const db = getDb()

  const [deletedIssue] = await db
    .delete(issues)
    .where(and(
      eq(issues.id, id),
      eq(issues.userId, session.user.id)
    ))
    .returning()

  if (!deletedIssue) {
    throw createError({ statusCode: 404, message: 'Issue not found' })
  }

  return { success: true }
})
